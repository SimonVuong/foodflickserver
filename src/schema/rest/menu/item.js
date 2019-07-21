import Likes from './likes';
import Price from './price';
import OptionGroup from './optionGroup';

const Item = `
  type Item {
    name: String!
    prices: [Price!]!
    description: String
    #todo 1: not actually sure what type to make this yet...
    flick: String
    likes: Likes!
    optionGroups: [OptionGroup!]!
  }
`

export default () => [Item, Likes, Price, OptionGroup];