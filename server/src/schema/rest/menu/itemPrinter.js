const ItemPrinter = `
  type ItemPrinter {
    name: String!
    itemName: String!
    ip: String!
    port: String!
    type: PrinterType!
  }
`

export default () => [ItemPrinter];