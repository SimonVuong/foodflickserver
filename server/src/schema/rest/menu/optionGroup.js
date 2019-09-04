import Option from './option';

const OptionGroup = `
  type OptionGroup {
    options: [Option!]!
  }
`

export default () => [OptionGroup, Option];