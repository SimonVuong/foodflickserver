
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
    restId: String
    tableNumber: String
    items: [CartItemInput!]!
  }
`;

export const CartInput = () => [_CartInput, CartItemInput];
