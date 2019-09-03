const OrderTypeInput = `
  enum OrderTypeInput {
    CARRY_OUT
    SIT_DOWN
  }
`

const CartItemInput = `
  input CartItemInput {
    name: String!
    categoryIndex: Int!
    itemIndex: Int!
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
    tableNumber: String!
    cardTok: String!
    phone: String!
    orderType: OrderTypeInput!
  }
`;

export const CartInput = () => [_CartInput, CartItemInput, OrderTypeInput];
