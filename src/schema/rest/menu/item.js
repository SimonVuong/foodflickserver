import Likes from './likes';
import Price from './price';
import OptionGroup from './optionGroup';
import ItemPrinter from './itemPrinter';

const Item = `
  type Item {
    name: String!
    prices: [Price!]!
    description: String
    printers: [ItemPrinter!]!
    #todo 1: not actually sure what type to make this yet...
    flick: String
    likes: Likes!
    optionGroups: [OptionGroup!]!
  }
`

export default () => [Item, Likes, Price, OptionGroup, ItemPrinter];