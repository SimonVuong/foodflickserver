import gql from 'graphql-tag';

export const tagFragment = gql`
  fragment tagFragment on Tag {
    _id
    name
    count
  }
`