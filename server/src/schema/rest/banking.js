// todo 0 validation routing number must be at least 9 digis
// account + routing numbers are null for customers
const Banking = `
  type Banking {
    accountNumberLast4: String
    routingNumber: String
    stripeId: String!
  }
`

export default Banking;