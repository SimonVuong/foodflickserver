export const PlanQueryResolvers = {
  activePlans: async (root, { subscriptionId }, { signedInUser, PlanService }) => {
    return await PlanService.getActivePlans(signedInUser, subscriptionId);
  },
}