//id is not required because we can add manager emails before the account exists and put in id on signup

const Manager = `
  type Manager {
    userId: ID
    email: String!
  }
`

export default () => [Manager];