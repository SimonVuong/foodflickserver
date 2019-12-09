import Location from './location';
import Profile from './profile';
import UserRef from './userRef';
import Category from './menu/category';
import State from './state';
import Favorites from './favorites';
import Feedback from './feedback';
import Banking from './banking';
import Receiver from './receiver';
import { Subscription } from './subscription';

// todo 1: add dates to rest, and menus and categories?

const Rest = `
  type Rest {
    _id: ID!
    banking: Banking!
    feedback: [Feedback!]
    favorites: Favorites!
    receiver: Receiver!
    profile: Profile!
    location: Location!
    owner: UserRef
    #manager is a list of PRIMARY user accounts. #emails go to these users. can only managers can add new managers.
    #if i put in secondary account, then reject and ask if meant to do primary. restaurant references user and not the
    #otherway arround because a restarunt MUST HAVE a manager while user does NOT NEED a restaruant. keeps data cleaner.   
    managers: [UserRef!]
    minsToUpdateCart: Float
    menu: [Category!]!
    subscription: Subscription!
    servers: [UserRef!]!
    url: String!
  }
`;

//export a function to prevent top level schema from including a type (ex: user) mulitple times.
//including all of rest dependencies in the return so that the toplevel schema, doesnt have to know about internal
//rest details.
export default () => [
  Rest,
  Banking,
  Category,
  UserRef,
  State,
  Profile,
  Location,
  Favorites,
  Feedback,
  Receiver,
  Subscription,
];