import { getCardService } from "./cardService";
import { getRestService } from "./restService";
import { getPrinterService } from './printerService';
import { getCannotBeEmptyError, NEEDS_MANAGER_SIGN_IN_ERROR } from '../utils/errors';
import { OrderStatus } from '../schema/order/order';
import { MANAGER_PERM } from '../utils/auth';
import { QUERY_SIZE, callElasticWithErrorHandler } from './utils';

const ORDERS_INDEX = 'orders';
const ORDER_TYPE = 'order';

const containsPrice = ({ label, value }, prices) => {
  for (let i = 0; i < prices.length; i++) {
  const dbValue = prices[i].value;
    const dbLabel = prices[i].label;
    if ((!dbLabel || label === dbLabel) && value === dbValue) return true;
  }
  return false;
}

//https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
const round2 = num => +(Math.round(num + "e+2")  + "e-2");
const round3 = num => +(Math.round(num + "e+3")  + "e-3");

class OrderService {
  constructor(stripe, elastic) {
    this.stripe = stripe;
    this.elastic = elastic;
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

    const itemTotal = round2(cart.items.reduce((sum, item) => sum + item.selectedPrice.value * item.quantity, 0)); 
    const tax = round2(itemTotal * 0.0625);
    const tip = round2(itemTotal * 0.15);
    const total = round2(itemTotal + tax + tip);
    const percentFee = 2.9
    const flatRateFee = .30;
    const centsTotal = Math.round(total * 100);
    const costs = {
      itemTotal,
      tax,
      tip,
    };

    getPrinterService().printOrder(
      signedInUser.name,
      tableNumber,
      rest.receiver,
      cart.items.map(({ categoryIndex, itemIndex, ...others }) => ({
        ...others,
        printers: rest.menu[categoryIndex].items[itemIndex].printers,
      })),
      { ...costs, total }
    );

    const foodflickFee = Math.round(centsTotal * round3(percentFee) + flatRateFee * 100);
    // todo 0: do something with failed paid
    const charge = await this.makePayment(signedInUser, rest.banking.stripeId, rest.profile.name, centsTotal, foodflickFee);
    if (charge.paid) {
      // * 1000 because stripe stores in seconds past epoch, but elastic does milliseconds since epoch
      const createdDate = charge.created * 1000
      // although items contains fields we don't want (categoryIndex, etc), that's okay since elastic will ignore them
      this.saveOrder(
        signedInUser,
        restId,
        charge.id,
        createdDate,
        items,
        { ...costs, percentFee, flatRateFee }
      )
      return true;
    }

    return false;
  }

  async makePayment (signedInUser, restStripeId, restName, cents, foodflickFee) {
    try {
      const cardTok = await getCardService().getCardId(signedInUser.stripeId);
      if (!cardTok) throw new Error('No payment card found. Please add a card in settings');
      return await this.stripe.charges.create({
        amount: cents,
        currency: 'usd',
        customer: signedInUser.stripeId,
        source: cardTok, // signedInUser.source
        receipt_email: signedInUser.email,
        statement_descriptor_suffix: restName,
        application_fee_amount: foodflickFee,
        transfer_data: {
          destination: restStripeId, //rest stripe id
        },
      });
    } catch (e) {
      throw new Error(`Failed to make payment. ${e.message}`);
    }
  }

  // // left off here doe sthis work. also check if getCompletedOrders works
  saveOrder = async (signedInUser, restId, stripeChargeId, createdDate, items, costs) => {
    const customer = {
      userId: signedInUser._id,
      nameDuring: signedInUser.name, 
    };
    const customRefunds = [];
    const order = {
      restId,
      status: OrderStatus.COMPLETED,
      customer,
      stripeChargeId,
      createdDate,
      items,
      costs,
      customRefunds
    };
    try {
      // not specifying an id makes elastic add the doc
      const res = await callElasticWithErrorHandler(options => this.elastic.index(options), {
        index: ORDERS_INDEX,
        type: ORDER_TYPE,
        body: order,
      });
      order._id = res._id;
      return order;
    } catch (e) {
      throw e;
    }
  }

  getCompletedOrders = async (signedInUser, restId) => {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    const res = await callElasticWithErrorHandler(options => this.elastic.search(options), {
      index: ORDERS_INDEX,
      size: QUERY_SIZE,
      body: {
        query: {
          bool: {
            filter: {
              bool: {
                must: [
                  { term: { restId } },
                  { term: { status: OrderStatus.COMPLETED } }
                ]
              }
            }
          }
        },
      }
    });

    return res.hits.hits.map(({ _source, _id }) => {
      _source._id = _id;
      return _source;
    });
  }
}

let orderService;

export const getOrderService = (stripe, elastic) => {
  if (orderService) return orderService;
  orderService = new OrderService(stripe, elastic);
  return orderService;
};
