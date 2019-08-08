const PrinterType = `
  enum PrinterType {
    epson
    star
  }
`

const Printer = `
  type Printer {
    name: String!
    ip: String!
    port: String!
    type: PrinterType!
  }
`

export default () => [Printer, PrinterType];