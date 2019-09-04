import gql from 'graphql-tag';

export const cardFragment = gql`
  fragment cardFragment on Card {
    cardTok,
    last4,
    expMonth,
    expYear
  }
`