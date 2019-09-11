
export const OrderMutationResolvers = {

  completeOrder: async (root, { orderId }, { signedInUser, OrderService }) => {
    return await OrderService.completeOrder(signedInUser, orderId);
  },

  placeOrder: async (root, { cart }, { signedInUser, OrderService }) => {
    return await OrderService.placeOrder(signedInUser, cart);
  },

  refundOrder: async (root, { restId, orderId, stripeChargeId, amount }, { signedInUser, OrderService }) => {
    return await OrderService.refundOrder(signedInUser, restId, orderId, stripeChargeId, amount);
  },

  returnOrder: async (root, { restId, orderId, reason }, { signedInUser, OrderService }) => {
    return await OrderService.returnOrder(signedInUser, restId, orderId, reason);
  },
};

export const OrderQueryResolvers = {
  cartFromOrder: async(root, { orderId }, { OrderService }) => {
    return await OrderService.getCartFromOrder(orderId);
  },

  openOrders: async(root, { restId }, { signedInUser, OrderService }) => {
    return await OrderService.getOpenOrders(signedInUser, restId)
  },

  completedOrders: async(root, { restId }, { signedInUser, OrderService }) => {
    return await OrderService.getCompletedOrders(signedInUser, restId)
  },
}