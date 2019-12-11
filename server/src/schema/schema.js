import { merge } from 'lodash';
import { makeExecutableSchema } from 'apollo-server';
// import Tags from './connectors';
import User from './user/user';
import Card from './user/card';
import Flick from './user/flick';
import Rest from './rest/rest';
import { Plan } from './plan/plan';
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
import { PlanQueryResolvers } from './plan/planResolvers';


const mutation = `
  type Mutation {
    addCategory(restId: ID!, newCategory: NewCategoryInput!): Rest!
    addItems(restId: ID!, categoryName: String!, items: [NewItemInput!]!): Rest!
    addRest(newRest: NewRestInput!): Rest!
    addRestManager(restId: ID!, managerEmail: String!): Rest!
    addRestPrinter(restId: ID!, newPrinter: PrinterInput!): Rest!
    addRestReceiver(restId: ID!, receiverId: ID!): Rest!
    addRestServer(restId: ID!, serverEmail: String!): Rest!
    addRestTable(restId: ID!, tableId: ID!): Rest!
    addUserFlicks(urls: [String!]!): Boolean!
    completeOrder(orderId: ID!): Boolean!
    deleteCategory(restId: ID!, categoryName: String!): Rest!
    deleteItem(restId: ID!, categoryName: String!, itemName: String!): Rest!
    deleteRestManager(restId: ID!, managerEmail: String!): Rest!
    deleteRestPrinter(restId: ID!, printerName: String!): Rest!
    deleteRestServer(restId: ID!, serverEmail: String!): Rest!
    deleteRestTable(restId: ID!, tableId: ID!): Rest!
    giveRestFeedback(restId: ID!, feedback: String!): Boolean!
    placeOrder(cart: CartInput!): Boolean!
    refundCompletedOrder(restId: ID!, orderId: ID!, stripeChargeId: ID!, amount: Float!): Order!
    returnOrder(orderId: ID!, reason: String!): Boolean!
    refundPendingTipOrder(restId: ID!, orderId: ID!, amount: Float!): Order!
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
    updateRestSubscription(restId: ID!, planId: ID!): Rest!
    updateRestSubscriptionCard(restId: ID!, cardTok: ID!): Rest!
    updateRestUrl(restId: ID!, url: String!): Rest!
    updateTip(orderId: ID!, newTip: Float!): Boolean!
    updateRestTableCheckIn(restId: ID!, tableId: ID!): Rest!
    updateRestTable(restId: ID!, prevId: ID!, newId: ID!): Rest!
    updateUserCard(cardToken: ID!): Card!
    updateUserEmail(newEmail: String!): Boolean!
  }
`

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
    activePlans(subscriptionId: ID!): [Plan!]!
    openOrders(restId: ID!): [Order!]!
    ordersCountThisMonth(restId: ID!): Int!
    restPrinters: [Printer!]!
    restBanking(restId: String!): Banking
    restByUrl(url: String!): Rest
    restSearchSuggestions(query: String!, location: String): [Rest!]
    tagSearchSuggestions(query: String!): [Tag!]
  }
`

const schema = `
  schema {
    query: Query
    mutation: Mutation
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
  Plan,
  query,
  mutation,
  schema
];

const resolvers = {
  Query: merge(
    RestQueryResolvers,
    MenuQueryResolvers,
    UserQueryResolvers,
    TagQueryResolvers,
    OrderQueryResolvers,
    PlanQueryResolvers
  ),
  Mutation: merge(
    RestMutationResolvers,
    MenuMutationResolvers,
    UserMutationResolvers,
    OrderMutationResolvers
  ),
};

export default makeExecutableSchema({
  typeDefs,
  resolvers,
});
