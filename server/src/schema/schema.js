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
import { MenuMutationResolvers, MenuQueryResolvers } from './rest/menu/menuResolvers';
import { UserMutationResolvers, UserQueryResolvers } from './user/userResolvers';
import { NewRestInput, ManagerInput, PrinterInput, UpdatePrinterInput, ReceiverInput } from './rest/restInputs';
import { NewCategoryInput, NewItemInput, UpdateItemInput } from './rest/menu/menuInputs';
import { TagQueryResolvers } from './tag/tagResolvers';
import { OrderMutationResolvers, OrderQueryResolvers } from './order/orderResolver';
import { Order } from './order/order';
import { CartInput } from './cart/cartInput';
import { Cart } from './cart/cart';

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
    addRestReceiver(restId: ID!, receiverId: ID!): Rest!
    addUserFlicks(urls: [String!]!): Boolean!
    completeOrder(orderId: ID!): Boolean!
    deleteCategory(restId: ID!, categoryName: String!): Rest!
    deleteItem(restId: ID!, categoryName: String!, itemName: String!): Rest!
    deleteRestManager(restId: ID!, managerEmail: String!): Rest!
    deleteRestPrinter(restId: ID!, printerName: String!): Rest!
    giveRestFeedback(restId: ID!, feedback: String!): Boolean!
    placeOrder(cart: CartInput!): Boolean!
    refundOrder(restId: ID!, orderId: ID!, stripeChargeId: ID!, amount: Float!): Order!
    returnOrder(orderId: ID!, reason: String!): Boolean!
    setOrderPendingTip(orderId: ID!): Boolean!
    testPrinter(restId: ID!, printer: TestPrinterInput!): Boolean!
    toggleItemLike(restId: ID!, categoryName: String!, itemName: String!): Rest!
    toggleRestFavorite(restId: ID!): Rest!
    updateCategory(restId: ID!, categoryName: String!, newCategory: NewCategoryInput!): Rest!
    updateCategoryOrder(restId: ID!, newOrder: [Int!]!): Rest!
    updateItems(restId: ID!, categoryName: String!, items: [UpdateItemInput!]!): Rest!
    updateItemOrder(restId: ID!, categoryName: String!, newOrder: [Int!]!): Rest!
    updateRestBanking(restId: ID!, newBanking: BankingInput!): Rest!
    updateRestLocation(restId: ID!, newLocation: LocationInput!): Rest!
    updateRestMinsToUpdateCart(restId: ID!, mins: Float!): Rest!
    updateRestPrinter(restId: ID!, newPrinter: UpdatePrinterInput!): Rest!
    updateRestProfile(restId: ID!, newProfile: ProfileInput!): Rest!
    updateRestReceiver(restId: ID!, receiverId: ID!): Rest!
    updateRestUrl(restId: ID!, url: String!): Rest!
    updateTip(orderId: ID!, newTip: Float!): Boolean!
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
    cartFromOrder(orderId: ID!): Cart!
    completedOrders(restId: ID!): [Order!]!
    doesUserExist(email: String!): Boolean!
    itemsWithPrinter(restId: ID!, printerName: String!): [String!]!
    myCard: Card
    myRests: [Rest!]!
    myFavoriteRests: [Rest!]!
    myFlicks: [Flick!]
    myOpenOrders: [Order!]!
    myCompletedOrders: [Order!]!
    myPendingTipOrders: [Order!]!
    pendingTipOrders(restId: ID!): [Order!]!
    openOrders(restId: ID!): [Order!]!
    restPrinters: [Printer!]!
    restWithBanking(restId: String!): Rest!
    restByUrl(url: String!): Rest
    restSearchSuggestions(query: String!, location: String): [Rest!]
    tagSearchSuggestions(query: String!): [Tag!]
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
  Cart,
  Card,
  Cart,
  User,
  Tag,
  Flick,
  Rest,
  Order,
  NewRestInput,
  NewCategoryInput,
  NewItemInput,
  UpdateItemInput,
  ManagerInput,
  CartInput,
  UpdatePrinterInput,
  PrinterInput,
  ReceiverInput,
  query,
  mutation,
  schema
];

const resolvers = {
  Query: merge(RestQueryResolvers, MenuQueryResolvers, UserQueryResolvers, TagQueryResolvers, OrderQueryResolvers),
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
