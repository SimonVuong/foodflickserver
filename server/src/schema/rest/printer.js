import { getCannotBeEmptyError } from '../../utils/errors';

export const PrinterType = `
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
    isReceipt: Boolean!
  }
`

export const throwIfInvalidPrinter = printer => {
  if (!printer.name) throw new Error(getCannotBeEmptyError(`Printer name`));
  if (!printer.ip) throw new Error(getCannotBeEmptyError(`Printer ip`));
  if (!printer.port) throw new Error(getCannotBeEmptyError(`Printer port`));
}

export default () => [Printer, PrinterType];