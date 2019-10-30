const ActiveSubscription = `
  type ActiveSubscription {
    _id: ID!
    name: SubscriptionName!
    monthlyOrders: Int!
    monthlyRate: Float!
    overagePercentageFee: Float!
  }
`

export default ActiveSubscription;