//id is not required because we can add manager emails before the account exists and put in id on signup

const UserRef = `
  type UserRef {
    userId: ID
    email: String!
  }
`

export default () => [UserRef];