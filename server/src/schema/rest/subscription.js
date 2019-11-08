const ActiveSubscription = `
  type ActiveSubscription {
    stripeSubscriptionId: ID!
    stripePlanId: ID!
    name: PlanName!
    monthlyOrders: Int!
    monthlyRate: Float!
    overagePercentageFee: Float!
  }
`

const _Subscription = `
  type Subscription {
    plan: ActiveSubscription!
    card: Card
  }
`

export const Subscription = () => [_Subscription, ActiveSubscription];