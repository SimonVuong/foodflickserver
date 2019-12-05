export const _PriceInput = `
  input PriceInput {
    value: Float!
    label: String
  }
`

export const ItemPrinterInput = `
  input ItemPrinterInput {
    name: String!
    itemName: String!
    ip: String!
    port: String!
    type: PrinterTypeInput!
  }
`

export const OptionInput = `
  input OptionInput {
    name: String!
    price: Float
  }
`

const OptionGroupInput = `
  input OptionGroupInput {
    options: [OptionInput!]!
  }
`

const _NewItemInput = `
  input NewItemInput {
    name: String!
    privateNames: [String!]!
    prices: [PriceInput!]!
    addons: [PriceInput!]!
    printers: [ItemPrinterInput!]!
    description: String
    #todo 1: not actually sure what type to make this yet...
    flick: String
    optionGroups: [OptionGroupInput!]!
  }
`

const _UpdateItemInput = `
  input UpdateItemInput {
    index: Int!
    item: NewItemInput!
  }
`

const _NewCategoryInput = `
  input NewCategoryInput {
    name: String!
    description: String
  }
`;

export const NewCategoryInput = () => [_NewCategoryInput];

export const NewItemInput = () => [_NewItemInput, _PriceInput, OptionInput, OptionGroupInput, ItemPrinterInput];

export const UpdateItemInput = () => [_UpdateItemInput];