const _OrderItem = `
  type OrderItem {
    name: String!
    quantity: Int!
    selectedPrice: Price!
    flick: String
    selectedAddons: [Price!]!
    selectedOptions: [Option!]!
    specialRequests: String
    #refund: Refund
  }
`
export const OrderItem = () => [_OrderItem]
