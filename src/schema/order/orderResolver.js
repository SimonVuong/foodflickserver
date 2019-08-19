
export const OrderMutationResolvers = {
  placeOrder: async (root, { cart }, { signedInUser, OrderService }) => {
    return await OrderService.placeOrder(signedInUser, cart);
  },

  refundOrder: async (root, { restId, orderId, stripeChargeId, amount }, { signedInUser, OrderService }) => {
    return await OrderService.refundOrder(signedInUser, restId, orderId, stripeChargeId, amount);
  },
};

export const OrderQueryResolvers = {
  completedOrders: async( root, { restId }, { signedInUser, OrderService }) => {
    return await OrderService.getCompletedOrders(signedInUser, restId)
  },
}