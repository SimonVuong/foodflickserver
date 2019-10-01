import gql from 'graphql-tag';

const customerRestFragment = gql`
  fragment customerRestFragment on Rest {
    _id
    favorites {
      count
      isFavorite
    }
    profile {
      name
      phone
      description
      tags
    }
    location {
      address {
        address1
        address2
        city
        state
        zip
      }
    }
    menu {
      name
      description
      items {
        _id
        name
        prices {
          value
          label
        }
        addons {
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
    url
  }
`

export {
  customerRestFragment,
}