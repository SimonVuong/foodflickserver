import { getCardService } from "./cardService";
import { getRestService } from "./restService";
import { getPrinterService } from "./printerService";
import {
  getCannotBeEmptyError,
  NEEDS_MANAGER_SIGN_IN_ERROR
} from "../utils/errors";
import { OrderStatus } from "../schema/order/order";
import { MANAGER_PERM, throwIfNotRestOwnerOrManager } from "../utils/auth";
import { QUERY_SIZE, callElasticWithErrorHandler } from "./utils";
import { isCompositeType } from "graphql";

const ORDERS_INDEX = "orders";
const ORDER_TYPE = "order";

const containsPrice = ({ label, value }, prices) => {
  for (let i = 0; i < prices.length; i++) {
    const dbValue = prices[i].value;
    const dbLabel = prices[i].label;
    if ((!dbLabel || label === dbLabel) && value === dbValue) return true;
  }
  return false;
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
        if (dbItem.name !== orderItem.name)
          throw new Error(
            `Item name and indicies mismatch ${JSON.stringify(orderItem)}`
          );
        if (!containsPrice(selectedPrice, dbItem.prices))
          throw new Error(
            `Invalid price ${JSON.stringify(orderItem.selectedPrice)}`
          );
      } catch (e) {
        console.error(e);
        throw new Error(`Invalid items in order ${JSON.stringify(orderItem)}`);
      }
    }
  }

  async placeOrder(signedInUser, cart) {
    const { restId, items, tableNumber } = cart;
    if (!tableNumber) throw new Error(getCannotBeEmptyError(`Printer name`));
    const rest = await getRestService().getRest(restId);
    console.log(rest);
    this.validatePrices(items, rest);
    const itemTotal = round2(
      items.reduce(
        (sum, item) => sum + item.selectedPrice.value * item.quantity,
        0
      )
    );
    const tax = round2(itemTotal * 0.0625);
    const tip = round2(itemTotal * 0.15);
    const total = round2(itemTotal + tax + tip);
    const percentFee = 2.9;
    const flatRateFee = 0.3;
    const centsTotal = Math.round(total * 100);
    const costs = {
      itemTotal,
      tax,
      tip
    };

    getPrinterService().printOrder(
      signedInUser.name,
      tableNumber,
      rest.receiver,
      items.map(({ categoryIndex, itemIndex, ...others }) => ({
        ...others,
        printers: rest.menu[categoryIndex].items[itemIndex].printers
      })),
      { ...costs, total }
    );

    const foodflickFee = Math.round(
      centsTotal * round3(percentFee / 100) + flatRateFee * 100
    );

    // todo 0: do something with failed paid

    // remove indicies so we don't store them in elastic
    const itemsWithoutIndices = items.map(({ name, selectedPrice, selectedOptions, quantity, specialRequests }) => ({
      name,
      selectedPrice,
      selectedOptions,
      quantity,
      specialRequests
    })
    );
    const order = await this.saveOrder(
      signedInUser,
      restId,
      null, //charge.id
      Date.now(), //milliseconds
      itemsWithoutIndices,
      { ...costs, percentFee, flatRateFee }
    );
    //after 5 seconds set orderStatus to copmlete and charge account
    setTimeout(async (order) => {
      const orderId = order._id;
      console.log('orderID ' + orderId)
      const charge = await this.makePayment(signedInUser, rest.banking.stripeId, rest.profile.name, centsTotal, foodflickFee);
      await callElasticWithErrorHandler(options => this.elastic.update(options),
        {
          index: ORDERS_INDEX,
          type: ORDER_TYPE,
          id: orderId,
          _source: true,
          body: {
            script: {
              source: `ctx._source.OrderStatus=params.status;
                     ctx._source.stripeChargeId=params.chargeId;`,
              params: {
                status: "COMPLETED",
                chargeId: charge.id
              }
            }
          }
        }
      );
    }, 5000, order);
    return true;
  }

  async makePayment(signedInUser, restStripeId, restName, cents, foodflickFee) {
    try {
      const cardTok = await getCardService().getCardId(signedInUser.stripeId);
      if (!cardTok)
        throw new Error("No payment card found. Please add a card in settings");
      return await this.stripe.charges.create({
        amount: cents,
        currency: "usd",
        customer: signedInUser.stripeId,
        source: cardTok, // signedInUser.source
        receipt_email: signedInUser.email,
        statement_descriptor_suffix: restName,
        application_fee_amount: foodflickFee,
        transfer_data: {
          destination: restStripeId
        }
      });
    } catch (e) {
      throw new Error(`Failed to make payment. ${e.message}`);
    }
  }

  async refundOrder(signedInUser, restId, orderId, stripeChargeId, amount) {
    if (!signedInUser.perms.includes(MANAGER_PERM))
      throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    if (amount === 0)
      throw new Error("Refund amount cannot be 0. Please use a another amount");
    const rest = await getRestService().getRest(restId, ["owner", "managers"]);
    throwIfNotRestOwnerOrManager(signedInUser._id, rest.owner, rest.managers);

    const order = await callElasticWithErrorHandler(
      options => this.elastic.getSource(options),
      {
        index: ORDERS_INDEX,
        type: ORDER_TYPE,
        id: orderId,
        _source: ["restId", "stripeChargeId", "customRefunds", "costs"]
      }
    );
    if (order.restId !== restId)
      throw new Error(
        "The provided restId doesn't match the restId stored with the order. Please provide the correct restId"
      );
    if (order.stripeChargeId !== stripeChargeId)
      throw new Error(
        "The provided stripeChargeId doesn't match the stripeChargeId stored with the order. Please provide the correct stripeChargeId"
      );
    const currRefund = round2(
      order.customRefunds.reduce((sum, refund) => sum + refund.amount, 0)
    );
    const orderTotal = round2(
      order.costs.itemTotal + order.costs.tax + order.costs.tip
    );
    if (currRefund + amount > orderTotal)
      throw new Error(
        "The provided amount exceeds the allowed remaining refund of " +
        (orderTotal - currRefund) +
        ". Please reduce the amount"
      );

    const refundRes = await this.stripe.refunds.create({
      charge: stripeChargeId,
      amount: Math.round(amount * 100),
      reverse_transfer: true
    });

    const orderRes = await callElasticWithErrorHandler(
      options => this.elastic.update(options),
      {
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
                amount
              }
            }
          }
        }
      }
    );
    const newOrder = orderRes.get._source;
    newOrder._id = orderId;
    return newOrder;
  }

  saveOrder = async (
    signedInUser,
    restId,
    stripeChargeId,
    createdDate,
    items,
    costs
  ) => {
    const customer = {
      userId: signedInUser._id,
      nameDuring: signedInUser.name
    };
    const customRefunds = [];
    const order = {
      restId,
      status: OrderStatus.OPEN,
      customer,
      stripeChargeId,
      createdDate,
      items,
      costs,
      customRefunds
    };
    try {
      // not specifying an id makes elastic add the doc
      const res = await callElasticWithErrorHandler(
        options => this.elastic.index(options),
        {
          index: ORDERS_INDEX,
          type: ORDER_TYPE,
          body: order
        }
      );
      order._id = res._id;
      return order;
    } catch (e) {
      throw e;
    }
  };

  getCompletedOrders = async (signedInUser, restId) => {
    if (!signedInUser.perms.includes(MANAGER_PERM))
      throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    const rest = await getRestService().getRest(restId, ["owner", "managers"]);
    throwIfNotRestOwnerOrManager(signedInUser._id, rest.owner, rest.managers);
    const res = await callElasticWithErrorHandler(
      options => this.elastic.search(options),
      {
        index: ORDERS_INDEX,
        size: QUERY_SIZE,
        body: {
          sort: [
            {
              createdDate: {
                order: "desc"
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
          }
        }
      }
    );

    return res.hits.hits.map(({ _source, _id }) => {
      _source._id = _id;
      return _source;
    });
  };
}

let orderService;

export const getOrderService = (stripe, elastic) => {
  if (orderService) return orderService;
  orderService = new OrderService(stripe, elastic);
  return orderService;
};
