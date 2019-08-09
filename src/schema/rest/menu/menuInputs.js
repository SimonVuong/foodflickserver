import { PrinterInput } from '../restInputs';

export const _PriceInput = `
  input PriceInput {
    value: Float!
    label: String
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
    prices: [PriceInput!]!
    printers: [PrinterInput!]!
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

export const NewItemInput = () => [_NewItemInput, _PriceInput, OptionInput, OptionGroupInput, PrinterInput];

export const UpdateItemInput = () => [_UpdateItemInput];