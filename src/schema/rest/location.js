import Address from './address';

const Location = `
  type Location {
    address: Address!
    geo: String
  }
`

export default () => [Location, Address];