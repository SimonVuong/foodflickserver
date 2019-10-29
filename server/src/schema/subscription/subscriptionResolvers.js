export const SubscriptionQueryResolvers = {
  availableSubscriptions: async (root, variables, { SubscriptionService }) => {
    return await SubscriptionService.getAvailableSubscriptions();
  },
}