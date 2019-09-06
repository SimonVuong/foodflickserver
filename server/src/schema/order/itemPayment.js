import { Refund } from './refund';

const _ItemPayment = `
  type ItemPayment {
    customerPaid: Float!
    ffFee: Float!
    accountEarnings: Float!
    refund: Refund
  }
`

export const ItemPayment = () => [_ItemPayment, Refund]