export const Refund = `
  type Refund {
    # null for refunds on pending tip orders
    stripeRefundId: ID
    # if this is tied to an item, then must be full price of item
    amount: Float!
  }
`
