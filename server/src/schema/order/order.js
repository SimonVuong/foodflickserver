import { OrderUserRef } from './orderUserRef';
import { OrderItem } from './orderItem';
import { OrderCosts } from './orderCosts';
import { Refund } from './refund';

export const OrderStatus = {
  OPEN: 'OPEN',
  COMPLETED: 'COMPLETED',
  PENDING_TIP_CHANGE: 'PENDING_TIP_CHANGE',
  RETURNED: 'RETURNED',
}

const _OrderStatus = `
  enum OrderStatus {
    OPEN
    COMPLETED
    PENDING_TIP_CHANGE
    RETURNED
  }
`

const _Order = `
  type Order {
    _id: ID!
    restId: ID!
    restName: String!
    orderType: OrderType!
    card: Card
    phone: String!
    tableNumber: String
    stripeChargeId: ID
    status: OrderStatus!
    customer: OrderUserRef!
    cartUpdatedDate: Float!
    items: [OrderItem]!
    costs: OrderCosts!
    customRefunds: [Refund!]!
  }
`

export const Order = () => [_Order, _OrderStatus, OrderUserRef, OrderItem, OrderCosts, Refund];
