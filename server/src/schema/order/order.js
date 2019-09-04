import { Customer } from './customer';
import { OrderItem } from './orderItem';
import { OrderCosts } from './orderCosts';
import { Refund } from './refund';

export const OrderStatus = {
  OPEN: 'OPEN',
  RETURNED: 'RETURNED',
  COMPLETED: 'COMPLETED',
}

const _OrderStatus = `
  enum OrderStatus {
    OPEN
    RETURNED
    COMPLETED
  }
`

const _Order = `
  type Order {
    _id: ID!
    restId: ID!
    stripeChargeId: ID!
    status: OrderStatus!
    customer: Customer!
    createdDate: Float!
    items: [OrderItem]!
    costs: OrderCosts!
    customRefunds: [Refund!]!
  }
`

export const Order = () => [_Order, _OrderStatus, Customer, OrderItem, OrderCosts, Refund];