import { getCannotBeEmptyError } from '../../utils/errors';

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

export const throwIfInvalidPrinter = printer => {
  if (!printer.name) throw new Error(getCannotBeEmptyError(`Printer name`));
  if (!printer.ip) throw new Error(getCannotBeEmptyError(`Printer ip`));
  if (!printer.port) throw new Error(getCannotBeEmptyError(`Printer port`));
  // shouldn't happen since it's an graphql enum
  if (!printer.type) throw new Error(getCannotBeEmptyError(`Printer type`));
}

export default () => [Printer, PrinterType];