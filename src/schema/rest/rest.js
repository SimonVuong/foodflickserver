import Location from './location';
import Profile from './profile';
import Manager from './manager';
import Category from './menu/category';
import State from './state';
import Favorites from './favorites';
import Feedback from './feedback';
import Banking from './banking';
import Receiver from './receiver';

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
    owner: Manager
    #manager is a list of PRIMARY user accounts. #emails go to these users. can only managers can add new managers.
    #if i put in secondary account, then reject and ask if meant to do primary. restaurant references user and not the
    #otherway arround because a restarunt MUST HAVE a manager while user does NOT NEED a restaruant. keeps data cleaner.   
    managers: [Manager!]
    menu: [Category!]!
  }
`;

//export a function to prevent top level schema from including a type (ex: user) mulitple times.
//including all of rest dependencies in the return so that the toplevel schema, doesnt have to know about internal
//rest details.
export default () => [Rest, Banking, Category, Manager, State, Profile, Location, Favorites, Feedback, Receiver];