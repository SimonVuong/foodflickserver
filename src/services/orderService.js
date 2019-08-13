import { getCardService } from "./cardService";
import { getRestService } from "./restService";
import { getPrinterService } from './printerService';

const containsPrice = ({ label, value }, prices) => {
  for (let i = 0; i < prices.length; i++) {
  const dbValue = prices[i].value;
    const dbLabel = prices[i].label;
    if ((!dbLabel || label === dbLabel) && value === dbValue) return true;
  }
  return false;
}

//https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
const round = num => +(Math.round(num + "e+2")  + "e-2");

class OrderService {
  constructor(stripe) {
    this.stripe = stripe;
  }

  validatePrices (items, rest) {
    for (let i = 0; i < items.length; i++) {
      const orderItem = items[i];
      const { itemIndex, categoryIndex, selectedPrice } = orderItem;
      try {
        const dbItem = rest.menu[categoryIndex].items[itemIndex];
        if (dbItem.name !== orderItem.name) throw new Error(`Item name and indicies mismatch ${JSON.stringify(orderItem)}`)
        if (!containsPrice(selectedPrice, dbItem.prices)) throw new Error(`Invalid price ${JSON.stringify(orderItem.selectedPrice)}`);
      } catch (e) {
        console.error(e);
        throw new Error(`Invalid items in order ${JSON.stringify(orderItem)}`);
      }
    }
  }

  async placeOrder (signedInUser, cart) {
    const { restId, items } = cart;
    const rest = await getRestService().getRest(restId);
    this.validatePrices(items, rest);

    const itemTotal = round(cart.items.reduce((sum, item) => sum + item.selectedPrice.value * item.quantity, 0)); 
    const tax = round(itemTotal * 0.0625);
    const tip = round(itemTotal * 0.15);
    const total = itemTotal + tax + tip;
    const centsTotal = total / 100;

    getPrinterService().printOrder(
      signedInUser,
      rest.receiver,
      cart.items.map(({ categoryIndex, itemIndex, ...others }) => ({
        ...others,
        printers: rest.menu[categoryIndex].items[itemIndex].printers,
      })),
      {
        itemTotal,
        tax,
        tip,
        total,
      }
    );
    return true;   
    // return await this.makePayment(signedInUser, rest.banking.stripeId, centsTotal);
  }

  async makePayment (signedInUser, restStripeId, cents) {
    try {
      const cardTok = await getCardService().getCardId(signedInUser.stripeId);
      const charge = await this.stripe.charges.create({
        amount: cents,
        currency: 'usd',
        customer: signedInUser.stripeId,
        source: cardTok, // signedInUser.source
        receipt_email: signedInUser.email,
        transfer_data: {
          destination: restStripeId, //rest stripe id
        },
      });
      return charge.paid;
    } catch (e) {
      console.error(e);
      throw new Error('Could not make payment');
    }
  }
}

let orderService;

export const getOrderService = stripe => {
  if (orderService) return orderService;
  orderService = new OrderService(stripe);
  return orderService;
};
