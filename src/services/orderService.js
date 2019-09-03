import { getCardService } from "./cardService";
import { getRestService } from "./restService";
import { getPrinterService } from './printerService';
import { getCannotBeEmptyError, NEEDS_MANAGER_SIGN_IN_ERROR } from '../utils/errors';
import { OrderStatus } from '../schema/order/order';
import { MANAGER_PERM, throwIfNotRestOwnerOrManager } from '../utils/auth';
import { QUERY_SIZE, callElasticWithErrorHandler } from './utils';

const ORDERS_INDEX = 'orders';
const ORDER_TYPE = 'order';

const PERCENT_FEE = 2.9
const FLAT_RATE_FEE = .30;

const containsPrice = ({ label, value }, prices) => {
  for (let i = 0; i < prices.length; i++) {
    const dbValue = prices[i].value;
    const dbLabel = prices[i].label;
    if ((!dbLabel || label === dbLabel) && value === dbValue) return true;
  }
  return false;
}

const throwIfInvalidPhone = phone => {
  if (!phone) throw new Error(getCannotBeEmptyError(`Phone Number`));
};

//https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
const round2 = num => +(Math.round(num + "e+2") + "e-2");
const round3 = num => +(Math.round(num + "e+3") + "e-3");

class OrderService {
  constructor(stripe, elastic) {
    this.stripe = stripe;
    this.elastic = elastic;
  }

  validatePrices(items, rest) {
    for (let i = 0; i < items.length; i++) {
      const orderItem = items[i];
      const { itemIndex, categoryIndex, selectedPrice } = orderItem;
      try {
        const dbItem = rest.menu[categoryIndex].items[itemIndex];
        if (dbItem.name !== orderItem.name) throw new Error(`Item name and indicies mismatch ${JSON.stringify(orderItem)}`)
        if (!containsPrice(selectedPrice, dbItem.prices)) throw new Error(`Invalid price ${JSON.stringify(orderItem.selectedPrice)}`);
      } catch (e) {
        console.error(e, JSON.stringify(orderItem));
        throw e;
        // throw new Error(`Invalid items in order ${JSON.stringify(orderItem)}`);
      }
    }
  }

  async placeOrder(signedInUser, cart) {
    const { restId, items, tableNumber, phone } = cart;
    if (!tableNumber) throw new Error(getCannotBeEmptyError(`Printer name`));
    throwIfInvalidPhone(phone);
    const rest = await getRestService().getRest(restId);
    this.validatePrices(items, rest);
    const itemTotal = round2(items.reduce((sum, item) => sum + item.selectedPrice.value * item.quantity, 0));
    const tax = round2(itemTotal * 0.0625);
    const tip = round2(itemTotal * 0.15);
    const total = round2(itemTotal + tax + tip);
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
      items.map(({ categoryIndex, itemIndex, ...others }) => ({
        ...others,
        printers: rest.menu[categoryIndex].items[itemIndex].printers,
      })),
      { ...costs, total }
    );

    // todo 0: do something with failed paid
    // remove indicies so we don't store them in elastic
    const itemsWithoutIndices = items.map(({ name, selectedPrice, selectedOptions, quantity, specialRequests }) => ({
      name,
      selectedPrice,
      selectedOptions,
      quantity,
      specialRequests
    }));
    const order = await this.addOpenOrder(
      signedInUser,
      restId,
      Date.now(), // milliseconds
      itemsWithoutIndices,
      costs,
      phone
    );
    setTimeout(() => {
      this.completeOrderAndPay(order._id, signedInUser, rest.banking.stripeId, rest.profile.name, centsTotal)
    }, 900000); // 1.5 minutes
    return true;
  }

  completeOrderAndPay(orderId, signedInUser, restStripeId, restName, centsTotal) {
    await callElasticWithErrorHandler(options => this.elastic.update(options), {
      index: ORDERS_INDEX,
      type: ORDER_TYPE,
      id: orderId,
      _source: true,
      body: {
        script: {
          source: `
            if (ctx._source.orderStatus)
            ctx._source.status=params.status;
            // ctx._source.stripeChargeId=params.chargeId;
          `,
          params: {
            status: OrderStatus.COMPLETED,
            // chargeId: charge.id
          }
        }
      }
    });
    const charge = await this.makePayment(signedInUser, restStripeId, restName, centsTotal);

  }

  async makePayment(signedInUser, restStripeId, restName, cents) {
    try {
      const foodflickFee = Math.round(cents * round3(PERCENT_FEE / 100) + FLAT_RATE_FEE * 100);
      const cardTok = await getCardService().getCardId(signedInUser.stripeId);
      if (!cardTok) throw new Error('No payment card found. Please add a card');
      return await this.stripe.charges.create({
        amount: cents,
        currency: 'usd',
        customer: signedInUser.stripeId,
        source: cardTok,
        receipt_email: signedInUser.email,
        statement_descriptor_suffix: restName,
        application_fee_amount: foodflickFee,
        transfer_data: {
          destination: restStripeId,
        },
      });
    } catch (e) {
      throw new Error(`Failed to make payment. ${e.message}`);
    }
  }

  async refundOrder(signedInUser, restId, orderId, stripeChargeId, amount) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    if (amount === 0) throw new Error('Refund amount cannot be 0. Please use a another amount');
    const rest = await getRestService().getRest(restId, ['owner', 'managers']);
    throwIfNotRestOwnerOrManager(signedInUser._id, rest.owner, rest.managers);

    const order = await callElasticWithErrorHandler(options => this.elastic.getSource(options), {
      index: ORDERS_INDEX,
      type: ORDER_TYPE,
      id: orderId,
      _source: ['restId', 'stripeChargeId', 'customRefunds', 'costs'],
    });
    if (order.restId !== restId) throw new Error("The provided restId doesn't match the restId stored with the order. Please provide the correct restId");
    if (order.stripeChargeId !== stripeChargeId) throw new Error("The provided stripeChargeId doesn't match the stripeChargeId stored with the order. Please provide the correct stripeChargeId");
    const currRefund = round2(order.customRefunds.reduce((sum, refund) => sum + refund.amount, 0));
    const orderTotal = round2(order.costs.itemTotal + order.costs.tax + order.costs.tip);
    if (currRefund + amount > orderTotal) throw new Error('The provided amount exceeds the allowed remaining refund of ' + (orderTotal - currRefund) + '. Please reduce the amount');

    const refundRes = await this.stripe.refunds.create({
      charge: stripeChargeId,
      amount: Math.round(amount * 100),
      reverse_transfer: true,
    });

    const orderRes = await callElasticWithErrorHandler(options => this.elastic.update(options), {
      index: ORDERS_INDEX,
      type: ORDER_TYPE,
      id: orderId,
      _source: true,
      body: {
        script: {
          source: `
            ctx._source.customRefunds.add(params.refund);
          `,
          params: {
            restId,
            refund: {
              stripeRefundId: refundRes.id,
              amount,
            },
          }
        }
      }
    });
    const newOrder = orderRes.get._source;
    newOrder._id = orderId;
    return newOrder;
  }

  addOpenOrder = async (signedInUser, restId, createdDate, items, costs, phone) => {
    const customer = {
      userId: signedInUser._id,
      nameDuring: signedInUser.name,
    };
    const customRefunds = [];
    const order = {
      restId,
      customer: phone,
      status: OrderStatus.OPEN,
      customer,
      createdDate,
      items,
      costs: { ...costs, percentFee: PERCENT_FEE, flatRateFee: FLAT_RATE_FEE },
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
    const rest = await getRestService().getRest(restId, ['owner', 'managers']);
    throwIfNotRestOwnerOrManager(signedInUser._id, rest.owner, rest.managers);
    const res = await callElasticWithErrorHandler(options => this.elastic.search(options), {
      index: ORDERS_INDEX,
      size: QUERY_SIZE,
      body: {
        sort: [
          {
            createdDate: {
              order: "desc",
            }
          }
        ],
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
