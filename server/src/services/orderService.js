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
import { getCardService } from './cardService';
import moment from 'moment-timezone';

export const ORDERS_INDEX = 'orders';
export const ORDER_TYPE = 'order';
const MS_IN_MINUTE = 60000;
const SCHEDULING_BUFFER_MILLIS = MS_IN_MINUTE;
const PENDING_TIP_HOLDING_TIME = 10800000; // 3hr
// const PENDING_TIP_HOLDING_TIME = 120000; // 2min
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

const containsAddons = (selectedAddons, addons) => {
  for (let i = 0; i < selectedAddons.length; i++) {
    const selectedAddonLabel = selectedAddons[i].label;
    const selectedAddonValue = selectedAddons[i].value;
    for (let j = 0; j < addons.length; j++) {
      const dbValue = addons[j].value;
      const dbLabel = addons[j].label;
      if (selectedAddonLabel === dbLabel && selectedAddonValue === dbValue) return true;
    }
  }
  return false;
}

const getItemTotal = items => round2(
  items.reduce((sum, item) => {
    const itemTotal = item.selectedPrice.value + item.selectedAddons.reduce((addonsTotal, addon) => addonsTotal + addon.value, 0);
    return sum + itemTotal * item.quantity
  }, 0)
);

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

  validateAddons(items, rest) {
    for (let i = 0; i < items.length; i++) {
      const orderItem = items[i];
      const { itemId, selectedAddons } = orderItem;
      if (selectedAddons.length === 0) return;
      try {
        const dbItem = getMenuItemById(itemId, rest.menu);
        if (!dbItem) throw new Error(`Item ${itemId} not found`);
        if (!containsAddons(selectedAddons, dbItem.addons)) throw new Error(`Invalid addons ${JSON.stringify(orderItem.selectedAddons)}`);
      } catch (e) {
        console.error(e, JSON.stringify(orderItem));
        throw e;
      }
    }
  }

  async placeOrder(signedInUser, cart) {
    const { items, tableNumber, phone, orderType, cardTok, restId, tip } = cart;
    if (!tableNumber && orderType === OrderType.SIT_DOWN) throw new Error(getCannotBeEmptyError(`Table number`));
    if (!phone) throw new Error(getCannotBeEmptyError(`Phone Number`));
    const rest = await getRestService().getRest(restId);
    this.validatePrices(items, rest);
    this.validateAddons(items, rest);
  
    getPrinterService().printTickets(
      signedInUser.name,
      cart.tableNumber,
      rest.receiver,
      items.map(({ itemId, ...others }) => ({
        ...others,
        printers: getMenuItemById(itemId, rest.menu).printers,
      })),
    );

    // when the customer orders with a default card, cardTok is what we expect, namely a card id in the form of "card_<string>".
    // however if the customer is ordering with a new card, then cardTok is not a card id, but rather a token id of the form
    // tok_<string>. we always want to store card Ids in the db order as it is cardIds that are tied to a customer, not
    // token ids. in other words we need to store card ids in orders so we can view card data for historical orders.
    let finalCardTok = cardTok;
    // when finalCardTok is a token id, then getCustomerCardById will return null
    const storedCard = await getCardService().getCustomerCardById(signedInUser.stripeId, finalCardTok)
    if (!storedCard) {
      const newHiddenCard = await getCardService().addUserCard(signedInUser.stripeId, finalCardTok);
      finalCardTok = newHiddenCard.cardTok;
      cart.cardTok = finalCardTok;
    }
    const cartUpdateWindowMillis = rest.minsToUpdateCart * MS_IN_MINUTE;

    let upsertedOrder = await this.getMatchingOrder(
      restId,
      signedInUser._id,
      orderType,
      tableNumber,
      phone,
      finalCardTok,
      cartUpdateWindowMillis
    );
    const finalTip = round2(tip);
    if (!upsertedOrder) {
      const itemTotal = getItemTotal(items);
      const tax = round2(itemTotal * TAX_RATE);
      const costs = {
        itemTotal,
        tax,
        tip: finalTip,
      };
      upsertedOrder = await this.addOpenOrder(signedInUser, cart, costs);
      console.log(`[Order service] added new order '${upsertedOrder._id}'`);
    } else {
      upsertedOrder = await this.updateOrderCart(upsertedOrder._id, items, finalTip);
      console.log(`[Order service] updated order '${upsertedOrder._id}'`);
    }

    setTimeout(async () => {
      const success = await this.setOrderPendingTip(upsertedOrder._id);
      if (!success) return;
      const millisTillPayment = PENDING_TIP_HOLDING_TIME + SCHEDULING_BUFFER_MILLIS;
      setTimeout(() => {
        this.completeOrderAndPay(
          upsertedOrder._id,
          signedInUser,
          rest.banking.stripeId,
          rest.profile.name,
          rest.receiver,
        )
      // add 1 minute to the PENDING_TIP_HOLDING_TIME to avoid any issues with timing and async. for example, what
      // the user updated the tip at the last minute such that when we try to pay, elastic doesn't pick up the new tip.
      }, millisTillPayment);
      console.log(`[Order service] order '${upsertedOrder._id}' scheduled for payment '${millisTillPayment / MS_IN_MINUTE}' mins`);
    }, cartUpdateWindowMillis);
    console.log(`[Order service] order '${upsertedOrder._id}' scheduled for tip status update in '${cartUpdateWindowMillis / MS_IN_MINUTE}' mins`);
    return true;
  }

  async setOrderPendingTipNow(signedInUser, orderId) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    try {
      const order = await callElasticWithErrorHandler(options => this.elastic.getSource(options), {
        index: ORDERS_INDEX,
        type: ORDER_TYPE,
        id: orderId,
        refresh: 'wait_for',
        _source: ['customer', 'restId'],
      });
      const rest = await getRestService().getRest(order.restId, ['owner', 'managers', 'profile','banking', 'receiver']);
      throwIfNotRestOwnerOrManager(signedInUser, rest.owner, rest.managers, rest.profile.name);

      await this.setOrderPendingTip(orderId);
      const userRes = await getUserService().getUserById(order.customer.userId, 'email,app_metadata');
      const customer = {
        email: userRes.email,
        stripeId: userRes.app_metadata.stripeId,
      }

      setTimeout(() => {
        this.completeOrderAndPay(
          orderId,
          customer,
          rest.banking.stripeId,
          rest.profile.name,
          rest.receiver,
        )
      // add 1 minute to the PENDING_TIP_HOLDING_TIME to avoid any issues with timing and async. for example, what
      // the user updated the tip at the last minute such that when we try to pay, elastic doesn't pick up the new tip.
      }, PENDING_TIP_HOLDING_TIME + SCHEDULING_BUFFER_MILLIS);
      // console.log('payment scheduled');
      return true;
    } catch (e) {
      console.error(e);
      return false
    }
  }

  async setOrderPendingTip(orderId) {
    const ORDER_COMPLETED_MSG = 'Order is already completed';
    const ORDER_RETURNED_MSG = 'Order is already returned';
    const ORDER_PENDING_TIP_CHANGE_MSG = 'Order is already pending tip change'
    try {
      await callElasticWithErrorHandler(options => this.elastic.update(options), getOrderUpdateOptions(
        orderId,
        `
          if (ctx._source.status.equals("${OrderStatus.COMPLETED}")) {
            throw new Exception("${ORDER_COMPLETED_MSG}");
          }
          if (ctx._source.status.equals("${OrderStatus.RETURNED}")) {
            throw new Exception("${ORDER_RETURNED_MSG}");
          }
          if (ctx._source.status.equals("${OrderStatus.PENDING_TIP_CHANGE}")) {
            throw new Exception("${ORDER_PENDING_TIP_CHANGE_MSG}");
          }
          ctx._source.status=params.status;
        `,
        {
          status: OrderStatus.PENDING_TIP_CHANGE,
        }
      ));
      console.log(`[Order service] updated order '${orderId}' to status '${OrderStatus.PENDING_TIP_CHANGE}'`)
      return true;
    } catch(e) {
      const reason = e.message;
      const logMsg = `[Order service] setOrderPendingTip could not update order '${orderId}' to status '${OrderStatus.PENDING_TIP_CHANGE}'. '${reason}'`;
      // this is exected when a manager returns an order. or when a customer updates an order. or manager manually updates
      // tip status
      if (reason === ORDER_RETURNED_MSG || reason === ORDER_PENDING_TIP_CHANGE_MSG) {
        console.log(logMsg);
      } else {
        console.error(logMsg);
      }
      return false;
    }
  }

  async completeOrderNow(signedInUser, orderId) {
    try {
      const order = await callElasticWithErrorHandler(options => this.elastic.getSource(options), {
        index: ORDERS_INDEX,
        type: ORDER_TYPE,
        id: orderId,
        refresh: 'wait_for',
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

  async completeOrderAndPay(orderId, customer, restStripeId, restName, restReceiver) {
    let order;
    try {
      const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getOrderUpdateOptions(
        orderId,
        `
          if (ctx._source.status.equals("${OrderStatus.COMPLETED}")) {
            throw new Exception("Order is already completed");
          }
          if (ctx._source.status.equals("${OrderStatus.RETURNED}")) {
            throw new Exception("Order is already returned");
          }
          if (ctx._source.status.equals("${OrderStatus.OPEN}")) {
            throw new Exception("Order is still OPEN");
          }
          ctx._source.status=params.status;
        `,
        {
          status: OrderStatus.COMPLETED
        },
        true
      ));
      order = res.get._source;
      order._id = orderId;
    } catch (e) {
      console.error('skipping payment', e);
      throw e;
    };

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

  async getOrdersCountThisMonth(signedInUser, restId) {
    const rest = await getRestService().getRest(restId, ['location.timezone.name', 'banking', 'owner', 'managers', 'profile.name']);
    throwIfNotRestOwnerOrManager(signedInUser, rest.owner, rest.managers, rest.profile.name);
    const startOfMonth = moment().tz(rest.location.timezone.name).startOf('month').valueOf();
    return await this.elastic.count({
      index: ORDERS_INDEX,
      body: {
        query: {
          bool: {
            filter: {
              bool: {
                must: {
                  range: {
                    createdDate: {
                      gte: startOfMonth
                    }
                  }
                }
              }
            }
          }
        },
      }
    });
  }

  async getMyOrders(signedInUser, status) {
    try {
      const orders = await this.getOrders([
        { term: { 'customer.userId': signedInUser._id } },
        { term: { status } }
      ]);
      if (orders.length === 0) return [];
      const restId = orders[0].restId;
      const rest = await getRestService().getRest(restId, ['profile.name', 'menu']);
      return orders.map(async order => ({
        ...order,
        restName: rest.profile.name,
        card: await getCardService().getCustomerCardById(signedInUser.stripeId, order.cardTok),
        items: order.items.map(item => {
          const restItem = getMenuItemById(item.itemId, rest.menu);
          return {
            ...item,
            flick: restItem ? restItem.flick : null
          }
        })
      }));
    } catch (e) {
      throw new Error(`Failed to get your orders. ${e.message}`);
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
    const extraItemTotal = extraItems.reduce((sum, item) => {
      const itemTotal = item.selectedPrice.value + item.selectedAddons.reduce((addonsTotal, addon) => addonsTotal + addon.value, 0);
      return sum + itemTotal * item.quantity
    }, 0);
    const orderRes = await callElasticWithErrorHandler(options => this.elastic.update(options), {
      index: ORDERS_INDEX,
      type: ORDER_TYPE,
      id: orderId,
      _source: true,
      body: {
        script: {
          source: `
            ctx._source.costs.tip = ctx._source.costs.tip + params.extraTip;
            ctx._source.costs.itemTotal = ctx._source.costs.itemTotal + params.extraItemTotal;
            ctx._source.items.addAll(params.extraItems);
            ctx._source.cartUpdatedDate = params.now;
          `,
          params: {
            extraItems,
            extraTip,
            extraItemTotal,
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
      const rest = await getRestService().getRest(order.restId, ['menu', 'profile.name', 'url']);
      order.items.forEach(item => {
        const restItem = getMenuItemById(item.itemId, rest.menu);
        item.flick = restItem ? restItem.flick : null;
      })
      order.restName = rest.profile.name;
      order.restMenu = rest.menu;
      order.restUrl = rest.url;
      return order;
    } catch (e) {
      console.error(`failed to get order for order ${orderId}`, e);
      throw e;
    }
  }

  getMatchingOrder = async(restId, signedInUserId, orderType, tableNumber, phone, cardTok, cartUpdateWindowMillis) => {
    const fields = [
      { term: { status: OrderStatus.OPEN } },
      { term: { 'customer.userId': signedInUserId } },
      { term: { restId } },
      { term: { orderType } },
      { term: { cardTok } },
      { term: { 'phone.keyword': phone } },
      { range: { cartUpdatedDate: { gt: Date.now() - cartUpdateWindowMillis } } },
    ];

    if (tableNumber) fields.push({ term: { tableNumber } });

    const orders = await this.getOrders(fields);
  
    if (orders.length > 1) {
      console.error('Found multiple matching orders');
      return null;;
    }

    if (orders.length === 0) return null;

    return orders[0];
  }

  getOrders = async fields => {
    try {
      const res = await callElasticWithErrorHandler(options => this.elastic.search(options), {
        index: ORDERS_INDEX,
        size: QUERY_SIZE,
        body: {
          sort: [
            {
              cartUpdatedDate: {
                order: 'desc',
              }
            }
          ],
          query: {
            bool: {
              filter: {
                bool: {
                  must: fields
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
    } catch (e) {
      console.error(`[Order service] could not get orders. '${e.message}'`);
      throw e;
    }
  }

  getCompletedOrders = async (signedInUser, restId) => {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    const rest = await getRestService().getRest(restId, ['owner', 'managers', 'profile', 'menu']);
    throwIfNotRestOwnerOrManager(signedInUser, rest.owner, rest.managers, rest.profile.name);
    try {
      const orders = await this.getOrders([
        { term: { restId } },
        { term: { status: OrderStatus.COMPLETED } }
      ]);
      return orders.map(order => ({
        ...order,
        items: order.items.map(item => {
          const restItem = getMenuItemById(item.itemId, rest.menu);
          return {
            ...item,
            flick: restItem ? restItem.flick : null,
          }
        })
      }))
    } catch (e) {
      throw e;
    }
  }

  getOpenOrders = async (signedInUser, restId) => {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    const rest = await getRestService().getRest(restId, ['owner', 'managers', 'profile', 'menu']);
    throwIfNotRestOwnerOrManager(signedInUser, rest.owner, rest.managers, rest.profile.name);
    try {
      const orders = await this.getOrders([
        { term: { restId } },
        { term: { status: OrderStatus.OPEN } }
      ]);
      return orders.map(order => ({
        ...order,
        items: order.items.map(item => {
          const restItem = getMenuItemById(item.itemId, rest.menu);
          return {
            ...item,
            flick: restItem ? restItem.flick : null,
          }
        })
      }))
    } catch (e) {
      throw e;
    }
  }

  getPendingTipOrders = async (signedInUser, restId) => {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    const rest = await getRestService().getRest(restId, ['owner', 'managers', 'profile', 'menu']);
    throwIfNotRestOwnerOrManager(signedInUser, rest.owner, rest.managers, rest.profile.name);
    try {
      const orders = await this.getOrders([
        { term: { restId } },
        { term: { status: OrderStatus.PENDING_TIP_CHANGE } }
      ]);
      return orders.map(order => ({
        ...order,
        items: order.items.map(item => {
          const restItem = getMenuItemById(item.itemId, rest.menu);
          return {
            ...item,
            flick: restItem ? restItem.flick : null,
          }
        })
      }))
    } catch (e) {
      throw e;
    }
  }

  updateTip = async(signedInUser, orderId, newTip) => {
    try {
      await callElasticWithErrorHandler(options => this.elastic.update(options), {
        index: ORDERS_INDEX,
        type: ORDER_TYPE,
        id: orderId,
        _source: true,
        body: {
          script: {
            source: `
              if (!ctx._source.customer.userId.equals(params.customerUserId)) {
                throw new Exception('Only the user who placed order can update the tip')
              }
              ctx._source.costs.tip = params.newTip;
            `,
            params: {
              customerUserId: signedInUser._id,
              newTip,
            }
          }
        }
      });
      return true;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}

let orderService;

export const getOrderService = (stripe, elastic, textClient) => {
  if (orderService) return orderService;
  orderService = new OrderService(stripe, elastic, textClient);
  return orderService;
};
