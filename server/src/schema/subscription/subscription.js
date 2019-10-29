export const SubscriptionNames = `
  enum SubscriptionName {
    Free
    Standard
    Unlimited
    Custom
  }
`

const _Subscription = `
  type Subscription {
    _id: ID!
    name: SubscriptionName!
    # following are unsepcified for custom plan
    monthlyOrders: Int
    monthlyRate: Float
    overagePercentageFee: Float
  }
`

export const Subscription = () => [_Subscription, SubscriptionNames];