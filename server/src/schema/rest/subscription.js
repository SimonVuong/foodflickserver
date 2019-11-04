const _Subscription = `
  type Subscription {
    stripeSubscriptionId: ID!
    stripePlanId: ID!
    name: PlanName!
    monthlyOrders: Int!
    monthlyRate: Float!
    overagePercentageFee: Float!
  }
`

export const Subscription = () => [_Subscription, ];