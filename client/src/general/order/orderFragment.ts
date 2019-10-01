import gql from 'graphql-tag';

export const orderFragment = gql`
  fragment orderFragment on Order {
    _id
    restId
    restName
    status
    orderType
    cartUpdatedDate
    card {
      cardTok
      last4
      expMonth
      expYear
    }
    items {
      name
      quantity
      flick
      selectedAddons {
        label
        value
      }
      selectedPrice {
        label
        value
      }
      selectedOptions {
        name
        price
      }
      specialRequests
    }
    costs {
      itemTotal
      tip
      tax
    }
    customRefunds {
      stripeRefundId
      amount
    }
    phone
    stripeChargeId
    tableNumber
  }
`
