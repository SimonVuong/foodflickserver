const _NewRestInput = `
  input NewRestInput {
    profile: ProfileInput!
    location: LocationInput!
    banking: BankingInput
    owner: ManagerInput!
  }
`;

const LocationInput = `
  input LocationInput {
    address: AddressInput!
    geo: String
  }
`

const AddressInput = `
  input AddressInput {
    address1: String!
    address2: String
    city: String!
    state: State!
    zip: String!
  }
`
const ProfileInput = `
  input ProfileInput {
    name: String!
    phone: String!
    description: String
    tags: [String!]!
  }
`

const _ManagerInput = `
  input ManagerInput {
    userId: ID!
    email: String!
  }
`;

const _BankingInput = `
  input BankingInput {
    accountNumber: String!
    routingNumber: String!
  }
`

//export a function to prevent top level schema from including a type (ex: user) mulitple times.
//including all of rest dependencies in the return so that the toplevel schema, doesnt have to know about internal
//rest details.
export const NewRestInput = () => [_NewRestInput, ProfileInput, LocationInput, AddressInput, _BankingInput];

export const ManagerInput = () => [_ManagerInput];