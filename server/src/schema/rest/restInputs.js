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

const PrinterTypeInput = `
  enum PrinterTypeInput {
    epson
    star
  }
`

const _PrinterInput = `
  input PrinterInput {
    name: String!
    ip: String!
    port: String!
    type: PrinterTypeInput!
    isReceipt: Boolean!
  }
`

const TestPrinterInput = `
  input TestPrinterInput {
    name: String!
    ip: String!
    port: String!
    type: PrinterTypeInput!
  }
`

const UpdatePrinterInput = `
  input UpdatePrinterInput {
    index: Int!
    printer: PrinterInput!
  }
`

const ReceiverInput = `
  input ReceiverInput {
    receiverId: String!
  }
`

//export a function to prevent top level schema from including a type (ex: user) mulitple times.
//including all of rest dependencies in the return so that the toplevel schema, doesnt have to know about internal
//rest details.
const NewRestInput = () => [_NewRestInput, ProfileInput, LocationInput, AddressInput, _BankingInput];

const ManagerInput = () => [_ManagerInput];

const PrinterInput = () => [_PrinterInput, PrinterTypeInput, TestPrinterInput]

export {
  NewRestInput,
  ManagerInput,
  PrinterInput,
  PrinterTypeInput,
  UpdatePrinterInput,
  ReceiverInput,
}