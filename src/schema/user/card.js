const Card = `
  type Card {
    cardTok: ID!
    last4: String!
    expMonth: Int!
    expYear: Int!
  }
`;

export default () => [Card];