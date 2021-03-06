import { OrderStatus } from './order';

export const OrderMutationResolvers = {

  completeOrder: async (root, { orderId }, { signedInUser, OrderService }) => {
    return await OrderService.completeOrderNow(signedInUser, orderId);
  },

  placeOrder: async (root, { cart }, { signedInUser, OrderService }) => {
    return await OrderService.placeOrder(signedInUser, cart);
  },

  printReceipts: async (root, { orderId }, { signedInUser, OrderService }) => {
    return await OrderService.printReceipts(signedInUser, orderId);
  },

  refundCompletedOrder: async (root, { restId, orderId, stripeChargeId, amount }, { signedInUser, OrderService }) => {
    return await OrderService.refundCompletedOrder(signedInUser, restId, orderId, stripeChargeId, amount);
  },
  
  refundPendingTipOrder: async (root, { restId, orderId, amount }, { signedInUser, OrderService }) => {
    return await OrderService.refundPendingTipOrder(signedInUser, restId, orderId, amount);
  },

  returnOrder: async (root, { orderId, reason }, { signedInUser, OrderService }) => {
    return await OrderService.returnOrder(signedInUser, orderId, reason);
  },

  setOrderPendingTip: async(root, { orderId }, { signedInUser, OrderService }) => {
    return await OrderService.setOrderPendingTipNow(signedInUser, orderId);
  },

  updateTip: async(root, { orderId, newTip }, { signedInUser, OrderService }) => {
    return await OrderService.updateTip(signedInUser, orderId, newTip);
  }
};

export const OrderQueryResolvers = {
  cartFromOrder: async (root, { orderId }, { OrderService }) => {
    return await OrderService.getCartFromOrder(orderId);
  },

  myCompletedOrders: async(root, args, { signedInUser, OrderService }) => {
    return await OrderService.getMyOrders(signedInUser, OrderStatus.COMPLETED);
  },

  myOpenOrders: async(root, args, { signedInUser, OrderService }) => {
    return await OrderService.getMyOrders(signedInUser, OrderStatus.OPEN);
  },

  myPendingTipOrders: async(root, args, { signedInUser, OrderService }) => {
    return await OrderService.getMyOrders(signedInUser, OrderStatus.PENDING_TIP_CHANGE);
  },

  myTotalTips: async(root, { restId, since }, { signedInUser, OrderService }) => {
    return await OrderService.getMyTotalTips(signedInUser, restId, since);
  },

  pendingTipOrders: async (root, { restId }, { signedInUser, OrderService }) => {
    return await OrderService.getPendingTipOrders(signedInUser, restId)
  },

  ordersCountThisMonth: async (root, { restId }, { signedInUser, OrderService }) => {
    return await OrderService.getOrdersCountThisMonth(signedInUser, restId)
  },

  openOrders: async (root, { restId }, { signedInUser, OrderService }) => {
    return await OrderService.getOpenOrders(signedInUser, restId)
  },

  completedOrders: async (root, { restId }, { signedInUser, OrderService }) => {
    return await OrderService.getCompletedOrders(signedInUser, restId)
  },

  totalTips: async (root, { restId, since }, { signedInUser, OrderService }) => {
    return await OrderService.getTotalTips(signedInUser, restId, since)
  },
}