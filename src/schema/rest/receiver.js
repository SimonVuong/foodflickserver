import Printer from './printer';

// receiverId is nullable because rests should be able to add their restaurant without the receiver device on
// on hand
const Receiver = `
  type Receiver {
    receiverId: ID
    printers: [Printer!]!
  }
`

export default () => [Receiver, Printer];