import Item from './item';

const Category = `
  type Category {
    name: String!
    description: String
    items: [Item!]!
  }
`

export default () => [Category, Item];