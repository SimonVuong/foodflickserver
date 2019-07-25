import { getCardService } from "./cardService";
import { getRestService } from "./restService";

const containsPrice = ({ label, value }, prices) => {
  for (let i = 0; i < prices.length; i++) {
  const dbValue = prices[i].value;
    const dbLabel = prices[i].label;
    if ((!dbLabel || label === dbLabel) && value === dbValue) return true;
  }
  return false;
}

class OrderService {
  constructor(stripe) {
    this.stripe = stripe;
  }

  async placeOrder (signedInUser, cart) {
    const { restId, items } = cart;
    const rest = await getRestService().getRest(restId);
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

    const itemTotal = cart.items.reduce((sum, item) => sum + item.selectedPrice.value * item.quantity, 0); 
    const tax = itemTotal * 0.0625;
    const tip = itemTotal * 0.15;
    const total = itemTotal + tax + tip;
    const centsTotal = (Math.round(total * 1e2 ) / 1e2) * 100;
    return await this.makePayment(signedInUser, rest.banking.stripeId, centsTotal);
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
