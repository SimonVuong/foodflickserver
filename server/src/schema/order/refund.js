export const Refund = `
  type Refund {
    stripeRefundId: ID!
    # if this is tied to an item, then must be full price of item
    amount: Float!
  }
`
