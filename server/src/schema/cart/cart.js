export const OrderType = {
  CARRY_OUT: 'CARRY_OUT',
  SIT_DOWN: 'SIT_DOWN',
}

export const _OrderType = `
  enum OrderType {
    CARRY_OUT
    SIT_DOWN
  }
`

const CartItem = `
  type CartItem {
    name: String!
    itemId: ID!
    flick: String,
    selectedPrice: Price!
    selectedOptions: [Option!]!
    selectedAddons: [Price!]!
    quantity: Int!
    specialRequests: String
  }
`

const _Cart = `
  type Cart {
    restId: ID!
    restName: String!
    restMenu: [Category!]!
    restUrl: String!
    items: [CartItem!]!
    orderType: OrderType!
    tableNumber: String
  }
`;

export const Cart = () => [_Cart, CartItem, _OrderType];
