import { getCardService } from "./cardService";
import { getRestService } from "./restService";
import { getPrinterService } from './printerService';
import { getCannotBeEmptyError } from '../utils/errors';

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
    const { restId, items, tableNumber } = cart;
    if (!tableNumber) throw new Error(getCannotBeEmptyError(`Printer name`));
    const rest = await getRestService().getRest(restId);
    this.validatePrices(items, rest);

    const itemTotal = round(cart.items.reduce((sum, item) => sum + item.selectedPrice.value * item.quantity, 0)); 
    const tax = round(itemTotal * 0.0625);
    const tip = round(itemTotal * 0.15);
    const total = round(itemTotal + tax + tip);
    const centsTotal = Math.round(total * 100);

    // todo 0: do something with failed paid
    // const paid = await this.makePayment(signedInUser, rest.banking.stripeId, rest.profile.name, centsTotal);

    getPrinterService().printOrder(
      signedInUser.name,
      tableNumber,
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
  }

  async makePayment (signedInUser, restStripeId, restName, cents) {
    try {
      const cardTok = await getCardService().getCardId(signedInUser.stripeId);
      if (!cardTok) throw new Error('No payment card found. Please add a card in settings');
      const charge = await this.stripe.charges.create({
        amount: cents,
        currency: 'usd',
        customer: signedInUser.stripeId,
        source: cardTok, // signedInUser.source
        receipt_email: signedInUser.email,
        statement_descriptor: restName,
        transfer_data: {
          destination: restStripeId, //rest stripe id
        },
      });
      return charge.paid;
    } catch (e) {
      throw new Error(`Failed to make payment. ${e.message}`);
    }
  }
}

let orderService;

export const getOrderService = stripe => {
  if (orderService) return orderService;
  orderService = new OrderService(stripe);
  return orderService;
};
