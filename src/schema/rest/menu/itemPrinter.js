const ItemPrinter = `
  type ItemPrinter {
    name: String!
    ip: String!
    port: String!
    type: PrinterType!
  }
`

export default () => [ItemPrinter];