import gql from 'graphql-tag';

const cartFragment = gql`
  fragment cartFragment on Cart {
    restId
    restName,
    restMenu {
      name
      description
      items {
        _id
        name
        prices {
          value
          label
        }
        description
        flick
        likes {
          count
          hasLiked
        }
        optionGroups {
          options {
            name
            price
          }
        }
      }
    }
    items {
      name
      itemId
      flick
      selectedPrice {
        value
        label
      }
      selectedOptions {
        name
        price
      }
      quantity
      specialRequests
    }
    orderType
    tableNumber
  }
`

export {
  cartFragment,
}