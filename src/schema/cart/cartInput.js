const CartItemInput = `
  input CartItemInput {
    name: String!
    itemId: ID!
    selectedPrice: PriceInput!
    selectedOptions: [OptionInput!]!
    quantity: Int!
    specialRequests: String
  }
`

const _CartInput = `
  input CartInput {
    restId: String!
    items: [CartItemInput!]!
    tableNumber: String
    tip: Float!
    cardTok: String!
    phone: String!
    orderType: OrderType!
  }
`;

export const CartInput = () => [_CartInput, CartItemInput];
