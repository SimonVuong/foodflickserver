export const PlanQueryResolvers = {
  activePlans: async (root, variables, { PlanService }) => {
    return await PlanService.getActivePlans();
  },
}