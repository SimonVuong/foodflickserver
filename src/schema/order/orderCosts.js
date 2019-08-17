export const OrderCosts = `
  type OrderCosts {
    tax: Float!
    tip: Float!
    itemTotal: Float!
    # float between 0 and 100. representing ff's application fee percentage
    percentFee: Float!
    # ff's application flat rate
    flatRateFee: Float!
  }
`