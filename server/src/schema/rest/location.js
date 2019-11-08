import Address from './address';
import Timezone from './menu/timezone';

const Location = `
  type Location {
    address: Address!
    timezone: Timezone!
  }
`

export default () => [Location, Address, Timezone];