import { merge } from 'lodash';
import { makeExecutableSchema } from 'graphql-tools';
// import Tags from './connectors';
// import { PubSub, withFilter } from 'graphql-subscriptions';

import User from './user/user';
import Card from './user/card';
import Flick from './user/flick';
import Rest from './rest/rest';
import Tag from './tag/tag';
import { RestMutationResolvers, RestQueryResolvers } from './rest/restResolvers';
import { MenuMutationResolvers } from './rest/menu/menuResolvers';
import { UserMutationResolvers, UserQueryResolvers } from './user/userResolvers';
import { NewRestInput, ManagerInput, PrinterInput, UpdatePrinterInput } from './rest/restInputs';
import { NewCategoryInput, NewItemInput, UpdateItemInput } from './rest/menu/menuInputs';
import { TagQueryResolvers } from './tag/tagResolvers';
import { OrderMutationResolvers } from './order/orderResolver';
import { CartInput } from './cart/cartInput';

//todo 1: add mongo validation

// const pubsub = new PubSub();
// const TAGS_CHANGED_TOPIC = 'tags_changed'

const mutation = `
  type Mutation {
    addCategory(restId: ID!, newCategory: NewCategoryInput!): Rest!
    addItems(restId: ID!, categoryName: String!, items: [NewItemInput!]!): Rest!
    addRest(newRest: NewRestInput!): Rest!
    addRestManager(restId: ID!, managerEmail: String!): Rest!
    addRestPrinter(restId: ID!, newPrinter: PrinterInput!): Rest!
    addUserFlicks(urls: [String!]!): Boolean!
    deleteCategory(restId: ID!, categoryName: String!): Rest!
    deleteItem(restId: ID!, categoryName: String!, itemName: String!): Rest!
    deleteRestManager(restId: ID!, managerEmail: String!): Rest!
    deleteRestPrinter(restId: ID!, printerName: String!): Rest!
    getRest(restId: ID!): Rest!
    giveRestFeedback(restId: ID!, feedback: String!): Boolean!
    placeOrder(cart: CartInput!): Boolean!
    toggleItemLike(restId: ID!, categoryName: String!, itemName: String!): Rest!
    toggleRestFavorite(restId: ID!): Rest!
    updateCategory(restId: ID!, categoryName: String!, newCategory: NewCategoryInput!): Rest!
    updateCategoryOrder(restId: ID!, newOrder: [Int!]!): Rest!
    updateItems(restId: ID!, categoryName: String!, items: [UpdateItemInput!]!): Rest!
    updateItemOrder(restId: ID!, categoryName: String!, newOrder: [Int!]!): Rest!
    updateRestBanking(restId: ID!, newBanking: BankingInput!): Rest!
    updateRestLocation(restId: ID!, newLocation: LocationInput!): Rest!
    updateRestPrinter(restId: ID!, newPrinter: UpdatePrinterInput!): Rest!
    updateRestProfile(restId: ID!, newProfile: ProfileInput!): Rest!
    updateUserCard(cardToken: ID!): Card!
    updateUserEmail(newEmail: String!): Boolean!
  }
`

// const sub = `
//   type Subscription {
//     tagAdded(type: String!): Tag
//   }
// `

const query = `
  type Query {
    doesUserExist(email: String!): Boolean!
    myCard: Card
    myRests: [Rest!]!
    restWithBanking(restId: String!): Rest!
    restSearchSuggestions(query: String!, location: String): [Rest!]
    tagSearchSuggestions(query: String!): [Tag!]
    myFavoriteRests: [Rest!]!
    myFlicks: [Flick!]
  }
`

const schema = `
  schema {
    query: Query
    mutation: Mutation
    #subscription: Subscription
  }
`
const typeDefs = [
  Card,
  User,
  Tag,
  Flick,
  Rest,
  NewRestInput,
  NewCategoryInput,
  NewItemInput,
  UpdateItemInput,
  ManagerInput,
  CartInput,
  UpdatePrinterInput,
  PrinterInput,
  query,
  mutation,
  schema
];

const resolvers = {
  Query: merge(RestQueryResolvers, UserQueryResolvers, TagQueryResolvers),
  Mutation: merge(RestMutationResolvers, MenuMutationResolvers, UserMutationResolvers, OrderMutationResolvers)
  // Subscription: {
  //   tagAdded: {
  //     subscribe: withFilter(
  //       () => pubsub.asyncIterator(TAGS_CHANGED_TOPIC),
  //       (payload, variables) => payload.tagAdded.type === variables.type,
  //     ),
  //   }
  // },
};

export default makeExecutableSchema({
  typeDefs,
  resolvers,
});
