const User = `
  type User {
    id: ID!
    #right now restManagers have no names since they can't be customers. we can easily make this customers too by giving
    #them names. dont worry about sharing accounts, then what name to give?, since restManagement accounts dont need to
    #be shared as restManagers can create other restManagers.
    firstName: String!
    lastName: String!
    primaryEmail: String!
    alternateEmails: [String!]!
    #once this is false or true, it can never be changed. decided on sign up.
    isRestManager: Boolean
  }
`;

export default () => [User];