import gql from 'graphql-tag';

const cartFragment = gql`
  fragment cartFragment on Cart {
    restId
    restName,
    restUrl,
    restMenu {
      name
      description
      items {
        _id
        name
        addons {
          value
          label
        }
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
      selectedAddons {
        value
        label
      }
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