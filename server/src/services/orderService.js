import { getRestService } from "./restService";
import { getPrinterService } from './printerService';
import { getCannotBeEmptyError, NEEDS_MANAGER_SIGN_IN_ERROR } from '../utils/errors';
import { OrderStatus } from '../schema/order/order';
import { MANAGER_PERM, throwIfNotRestOwnerOrManager } from '../utils/auth';
import { QUERY_SIZE, callElasticWithErrorHandler, getOrderUpdateOptions } from './utils';
import { getMenuItemById } from './menuService';
import { activeConfig } from '../config';
import { OrderType } from '../schema/cart/cart';
import { getUserService } from './userService';

export const ORDERS_INDEX = 'orders';
export const ORDER_TYPE = 'order';
const ORDER_COMPLETION_BUFFER_MILLIS = 60000; // 1 min
const TAX_RATE = 0.0625;
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

const getItemTotal = items => round2(items.reduce((sum, item) => sum + item.selectedPrice.value * item.quantity, 0));

//https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
const round2 = num => +(Math.round(num + "e+2") + "e-2");
const round3 = num => +(Math.round(num + "e+3") + "e-3");

class OrderService {
  constructor(stripe, elastic, textClient) {
    this.stripe = stripe;
    this.elastic = elastic;
    this.textClient = textClient;
  }

  validatePrices(items, rest) {
    for (let i = 0; i < items.length; i++) {
      const orderItem = items[i];
      const { itemId, selectedPrice } = orderItem;
      try {
        const dbItem = getMenuItemById(itemId, rest.menu);
        if (!dbItem) throw new Error(`Item ${itemId} not found`);
        if (!containsPrice(selectedPrice, dbItem.prices)) throw new Error(`Invalid price ${JSON.stringify(orderItem.selectedPrice)}`);
      } catch (e) {
        console.error(e, JSON.stringify(orderItem));
        throw e;
      }
    }
  }

  /**
   * Open orders by the same customer within the rest's specified timeframe are grouped together. We identify an order by
   * the same customer comparing the customerId, orderType, tableNumber, phone, and cardTok. If any of these are different,
   * we add a new open order. Otherwise, we get the existing open order and add the new items and sum the tips.
   * 
   * So a customer places their first order and the rest has set the minsToAutoComplete (MAC) to 10 mins. Additional orders
   * from the same customer within 9 minutes are grouped together. We purposefully subtract 1 min from MAC to avoid any
   * timing async issues. One such issue, for example with a 10m MAC
   * 
   * - 10.00 am - add order
   * - 10.09.59 -> update order
   * - 10.10 - status -> complete
   * - 10.10.01 - updateOrder (how is this possible?, well you never know with async, latency, milliseocnds differences. point
   * is, somehow it didnt detect that 10.01 is 1 milisecond past the 10m mark)
   * - 10.10 - pay the for the 10.00 update
   * - 10:11.01 will try to pay for 10.10.01 update but, we already paid this order
   * 
   * Assuming the customer placed an order at 10.00am and at 10.09am we need to ensure that only the 10.09am update gets
   * c mpleted and paid. The tricky part is that the 10.00am order doesn't know about the 10.09m update so how do we
   * 'invalidate' the 10.00am order? Every order addition or update is followed by a payment ATTEMPT. Emphasis on attempt
   * because the payment may not occur. So with the 10.00 order, an attempt will be made at 10.10. The attempt will check
   * the cartUpdatedDate field and see if it is PAST the autoCompletion deadline, which in this case is 10.19am due
   * to the second order. This check will fail and payment will not occur.
   * 
   * What if the rest changes the MAC in the middle of this process? This is accounted for by always aligning the 
   * cartUpdate deadline with the payment deadline (9m vs 10m). See the example below with an initial 9m MAC
   * 
   * 10:00 am order added
   * 10:05 am order updated
   * 10:07 am MAC set to 5m
   * 10:08 am order updated
   * 10:10 am payment attempted and denied since 10:10 am is NOT 10m past 10:08. Note here we used the 10m MAC
   * 10:15 am payment attempted and deneid since 10:15 am is NOT 10m past 10:08. Note again, we used the 10m MAC
   * 10:13 am payment attempted and succeeded since 10:13 am IS 5m past 10:08.
   * 
   * test cases with 1.5min auto complete with 1 min order update buffer = 30 seconds update window
   * - place order then update within 30 seconds
   *   - should make 1 payment for the updated
   * - place order then update after 30 seconds
   *   - should make 2 payments
   * - place order, then manually complete right away
   *   - order should immediately pay and skip payment
   * - place order, then manually complete right away, then place order again
   *   - immediately pays due to manual. then skips first order. then ADDS new order
   * - place order, then manually return right away
   *     - order should skip
   * 
   * @param {*} signedInUser 
   * @param {*} cart 
   */
  async placeOrder(signedInUser, cart) {
    // todo 0: replace these console.logs with real logging
    const { items, tableNumber, phone, orderType, cardTok, restId, tip } = cart;
    if (!tableNumber && orderType === OrderType.SIT_DOWN) throw new Error(getCannotBeEmptyError(`Table number`));
    if (!phone) throw new Error(getCannotBeEmptyError(`Phone Number`));
    const rest = await getRestService().getRest(restId);
    this.validatePrices(items, rest);

    getPrinterService().printTickets(
      signedInUser.name,
      cart.tableNumber,
      rest.receiver,
      items.map(({ itemId, ...others }) => ({
        ...others,
        printers: getMenuItemById(itemId, rest.menu).printers,
      })),
    );

    const restMillis = rest.minsTillOrderCompletion * 60000; // 60000 ms in a min
    // subtract by some buffer to avoid updates that are too close to the payment deadline. simply for safety to avoid
    // any async or timing related bugs.
    const cartUpdateWindowMillis = restMillis - ORDER_COMPLETION_BUFFER_MILLIS;
    let upsertedOrder = await this.getMatchingOrder(restId, signedInUser._id, orderType, tableNumber, phone, cardTok);
    const finalTip = round2(tip);
    // add the order if it doesn't exist or if we are past the update window
    if (!upsertedOrder || Date.now() > upsertedOrder.cartUpdatedDate + cartUpdateWindowMillis) {
      const itemTotal = getItemTotal(items);
      const tax = round2(itemTotal * TAX_RATE);
      const costs = {
        itemTotal,
        tax,
        tip: finalTip,
      };
      upsertedOrder = await this.addOpenOrder(signedInUser, cart, costs);
      // console.log('ADDED NEW ORDER', upsertedOrder.cartUpdatedDate, new Date(upsertedOrder.cartUpdatedDate).toTimeString());
      // console.log('will update for orders before', new Date(upsertedOrder.cartUpdatedDate + cartUpdateWindowMillis).toTimeString())
    } else {
      upsertedOrder = await this.updateOrderCart(upsertedOrder._id, items, finalTip);
      // console.log('UPDATED ORDER', upsertedOrder.cartUpdatedDate);
      // console.log('will update for orders before', new Date(upsertedOrder.cartUpdatedDate + cartUpdateWindowMillis).toTimeString());
    }
    // console.log('set timeout for', restMillis / 60000)
    setTimeout(() => {
      this.completeOrderAndPay(
        upsertedOrder._id,
        signedInUser,
        rest.banking.stripeId,
        rest.profile.name,
        rest.receiver,
        // pass restMillis so that the updateDeadline + the paymentDeadline use the same schedule.
        // that way, if the schedule is changed, it wont affect orders already scheduled orders
        restMillis
      )
    }, restMillis);
    return true;
  }

  async completeOrder(signedInUser, orderId) {
    try {
      const order = await callElasticWithErrorHandler(options => this.elastic.getSource(options), {
        index: ORDERS_INDEX,
        type: ORDER_TYPE,
        id: orderId,
        _source: ['customer', 'restId'],
      });
      const rest = await getRestService().getRest(order.restId, ['owner', 'managers', 'banking', 'profile.name', 'receiver', 'menu']);
      throwIfNotRestOwnerOrManager(signedInUser, rest.owner, rest.managers, rest.profile.name);
      const userRes = await getUserService().getUserById(order.customer.userId, 'email,app_metadata');
      const customer = {
        email: userRes.email,
        stripeId: userRes.app_metadata.stripeId,
      }
      this.completeOrderAndPay(orderId, customer, rest.banking.stripeId, rest.profile.name, rest.receiver);
      return true;
    } catch (e) {
      throw new Error(`Could not complete order: ${e}`);
    }
  }

  async completeOrderAndPay(orderId, customer, restStripeId, restName, restReceiver, restMillis) {
    // todo 0: replace these console.logs with real logging
    let order;
    try {
      // if (restMillis) console.log('attempting pay with deadline', Date.now() - restMillis, new Date(Date.now() - restMillis).toTimeString())
      const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getOrderUpdateOptions(
        orderId,
        `
          if (ctx._source.status.equals("${OrderStatus.COMPLETED}")) {
            throw new Exception("Order is already completed");
          }
          if (ctx._source.status.equals("${OrderStatus.RETURNED}")) {
            throw new Exception("Order is already returned");
          }
          if (params.threshold == null || ctx._source.cartUpdatedDate < params.threshold) {
            ctx._source.status=params.status;
          }
        `,
        {
          status: OrderStatus.COMPLETED,
          // now > updatedate + restMillis. am i currently after the deadline?
          // now - updadtedDate > restMillis
          // - updatedDate > restMillis - now
          // updatedDate < now - restMillis
          threshold: restMillis ? Date.now() - restMillis : null
        },
        true
      ));
      order = res.get._source;
      order._id = orderId;
    } catch (e) {
      if (e.message === 'Order is already completed' || e.message === 'Order is already returned') {
        console.log('skipping payment', e);
        return;
      }
      throw(e);
    };

    if (order.status !== OrderStatus.COMPLETED) {
      console.log('skipping payment');
      return;
    }

    // console.log('proceeding with payment');
    const { itemTotal, tax, tip } = order.costs;
    const total = round2(itemTotal + tax + tip);
    const centsTotal = Math.round(total * 100);
    let charge;
    try {
      charge = await this.makePayment(customer, restStripeId, restName, centsTotal, order.cardTok);
    } catch (e) {
      console.error(e)
      callElasticWithErrorHandler(options => this.elastic.update(options), getOrderUpdateOptions(
        orderId,
        `ctx._source.status=params.status;`,
        { status: OrderStatus.OPEN }
      ));
      throw(e);
    }

    getPrinterService().printReceipts(
      customer.name,
      order.tableNumber,
      restReceiver,
      order.items.map(({ itemId, ...others }) => ({
        ...others,
      })),
      {
        itemTotal,
        tax,
        tip,
        total,
      }
    );

    callElasticWithErrorHandler(options => this.elastic.update(options), getOrderUpdateOptions(
      orderId,
      `ctx._source.stripeChargeId=params.chargeId;`,
      { chargeId: charge.id }
    ));
  }

  async makePayment(customer, restStripeId, restName, cents, cardTok) {
    try {
      const foodflickFee = Math.round(cents * round3(PERCENT_FEE / 100) + FLAT_RATE_FEE * 100);
      return await this.stripe.charges.create({
        amount: cents,
        currency: 'usd',
        customer: customer.stripeId,
        source: cardTok,
        receipt_email: customer.email,
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
    const rest = await getRestService().getRest(restId, ['owner', 'managers', 'profile']);
    throwIfNotRestOwnerOrManager(signedInUser, rest.owner, rest.managers, rest.profile.name);
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
      refresh: 'wait_for',
      body: {
        script: {
          source: `
            ctx._source.customRefunds.add(params.refund);
          `,
          params: {
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

  async returnOrder(signedInUser, orderId, reason) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    if (!reason) throw new Error(getCannotBeEmptyError('Reason'));

    try {
      const order = await callElasticWithErrorHandler(options => this.elastic.getSource(options), {
        index: ORDERS_INDEX,
        type: ORDER_TYPE,
        id: orderId,
        _source: ['restId', 'phone'],
      });
      const rest = await getRestService().getRest(order.restId, ['owner', 'managers', 'profile']);
      throwIfNotRestOwnerOrManager(signedInUser, rest.owner, rest.managers, rest.profile.name);
      await callElasticWithErrorHandler(options => this.elastic.update(options), {
        index: ORDERS_INDEX,
        type: ORDER_TYPE,
        id: orderId,
        _source: true,
        refresh: 'wait_for',
        body: {
          script: {
            source: `
              ctx._source.status = params.status;
              ctx._source.returnReason = params.reason;
            `,
            params: {
              status: OrderStatus.RETURNED,
              reason,
            }
          }
        }
      });
      this.sendReturnOrderText(order.phone, orderId, reason);
    } catch (e) {
      console.error(e);
      throw (e);
    }
    return true;
  }
  sendReturnOrderText = (orderPhone, orderId, reason) => {

    this.textClient.messages
      .create({
        body: 'Your order has been returned for the following reason: ' + reason + '.' + '\n' + 'Please redo order here: https://www.foodflick.co/cart/' + orderId,
        from: activeConfig.twilio.phone,
        to: `+1${orderPhone}`,
      })
      .then(message => console.log(message.sid))
      .catch((e) => { console.error(e) });
  }
  addOpenOrder = async (signedInUser, cart, costs) => {
    const customer = {
      userId: signedInUser._id,
      nameDuring: signedInUser.name,
    };
    const customRefunds = [];
    const now = Date.now();
    const {
      restId,
      items,
      phone,
      orderType,
      tableNumber,
      cardTok
    } = cart;
    const order = {
      restId,
      status: OrderStatus.OPEN,
      customer,
      cartUpdatedDate: now,
      createdDate: now,
      items,
      costs: { ...costs, percentFee: PERCENT_FEE, flatRateFee: FLAT_RATE_FEE },
      customRefunds,
      phone,
      orderType,
      tableNumber,
      cardTok,
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

  updateOrderCart = async(orderId, extraItems, extraTip) => {
    const orderRes = await callElasticWithErrorHandler(options => this.elastic.update(options), {
      index: ORDERS_INDEX,
      type: ORDER_TYPE,
      id: orderId,
      _source: true,
      body: {
        script: {
          source: `
            ctx._source.costs.tip = ctx._source.costs.tip + params.extraTip;
            ctx._source.items.addAll(params.extraItems);
            ctx._source.cartUpdatedDate = params.now;
          `,
          params: {
            extraItems,
            extraTip,
            now: Date.now(),
          }
        }
      }
    });
    const newOrder = orderRes.get._source;
    newOrder._id = orderId;
    return newOrder;
  }

  getCartFromOrder = async (orderId) => {
    try {
      const order = await callElasticWithErrorHandler(options => this.elastic.getSource(options), {
        index: ORDERS_INDEX,
        type: ORDER_TYPE,
        id: orderId,
        _source: ['items', 'restId', 'orderType', 'tableNumber'],
      });
      order._id = orderId;
      const rest = await getRestService().getRest(order.restId, ['menu', 'profile.name']);
      order.items.forEach(item => {
        item.flick = getMenuItemById(item.itemId, rest.menu).flick;
      })
      order.restName = rest.profile.name;
      order.restMenu = rest.menu;
      return order;
    } catch (e) {
      console.error(`failed to get order for order ${orderId}`, e);
      throw e;
    }
  }

  getMatchingOrder = async(restId, signedInUserId, orderType, tableNumber, phone, cardTok) => {
    const res = await callElasticWithErrorHandler(options => this.elastic.search(options), {
      index: ORDERS_INDEX,
      size: QUERY_SIZE,
      body: {
        query: {
          bool: {
            filter: {
              bool: {
                must: [
                  { term: { status: OrderStatus.OPEN } },
                  { term: { 'customer.userId': signedInUserId } },
                  { term: { restId } },
                  { term: { orderType } },
                  { term: { cardTok } },
                  { term: { tableNumber } },
                  { term: { 'phone.keyword': phone } },
                ]
              }
            }
          }
        },
      }
    });

    const orders = res.hits.hits.map(({ _source, _id }) => {
      _source._id = _id;
      return _source;
    });

    if (orders.length > 1) {
      console.error('Found multiple matching orders');
      return null;;
    }

    if (orders.length === 0) return null;

    return orders[0];
  }

  getOrders = async (signedInUser, restId, orderStatus) => {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    const rest = await getRestService().getRest(restId, ['owner', 'managers', 'profile']);
    throwIfNotRestOwnerOrManager(signedInUser, rest.owner, rest.managers, rest.profile.name);
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
                  { term: { status: orderStatus } }
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

  getCompletedOrders = async (signedInUser, restId) => await this.getOrders(signedInUser, restId, OrderStatus.COMPLETED);

  getOpenOrders = async (signedInUser, restId) => await this.getOrders(signedInUser, restId, OrderStatus.OPEN);

}

let orderService;

export const getOrderService = (stripe, elastic, textClient) => {
  if (orderService) return orderService;
  orderService = new OrderService(stripe, elastic, textClient);
  return orderService;
};
