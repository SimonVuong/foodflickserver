import { Price, Option } from 'general/menu/models/BaseItemModel';
import { createStore, applyMiddleware, Store } from 'redux';
import ReduxThunk, { ThunkAction } from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { getRootReducer, RootState, RootActions } from './rootReducer';
import { selectOrderingRestAction } from 'general/rest/redux/restActions';
import { ICustomerRest, CustomerRest } from 'general/rest/models/CustomerRestModel';
import { addCartItemAction } from 'general/order/redux/cartActions';

export type AsyncAction<T = void> = ThunkAction<T, RootState, null, RootActions>;

const testRest = {"_id":"D71rFmwB0QaGhfaOS2Jp","profile":{"name":"Horizon Simon","phone":"609513","description":"Simon's hand pulled noods.","tags":["Asian fusion","Casual"]},"location":{"address":{"address1":"139 Tremont St","address2":null,"city":"Boston","state":"MA","zip":"02111"}},"favorites":{"isFavorite":false,"count":1},"menu":[{"name":"Appetizers","description":"Small portions of food before the main course","items":[]},{"name":"Noodles","description":"all noodles are hand pulled","items":[{"_id":"aFZpsdnPLP","name":"Garlic noodles","prices":[{"value":8,"label":null}],"description":"spicy garlic noodles with fresh mushrooms. a vegetarian dish.","flick":"https://firebasestorage.googleapis.com/v0/b/food-flick.appspot.com/o/D71rFmwB0QaGhfaOS2Jp%2FNoodles%2FGarlic%20noodles?alt=media&token=96add06e-368b-4ff8-929e-b37a839d0b0f","likes":{"hasLiked":false,"count":0},"optionGroups":[{"options":[{"name":"light spicy","price":null},{"name":"medium spicy","price":null},{"name":"extra spicy","price":null}]}]},{"_id":"bFZpsdnPLP","name":"Green noodles and ham","prices":[{"value":10,"label":"regular"},{"value":12,"label":"extra meat"}],"description":"Bok choy noodles with chinese roast pork","flick":"https://firebasestorage.googleapis.com/v0/b/food-flick.appspot.com/o/D71rFmwB0QaGhfaOS2Jp%2FNoodles%2FGreen%20noodles%20and%20ham?alt=media&token=0ba3768a-3256-45aa-b4c8-0e70da1ee7d7","likes":{"hasLiked":false,"count":0},"optionGroups":[{"options":[{"name":"chicken","price":null},{"name":"beef","price":null},{"name":"pork","price":null}]}]},{"_id":"cFZpsdnPLP","name":"Flat noodles","prices":[{"value":9,"label":null}],"description":"tangy rice noodles with roasted peppers and tomatoes.","flick":"https://firebasestorage.googleapis.com/v0/b/food-flick.appspot.com/o/D71rFmwB0QaGhfaOS2Jp%2FNoodles%2FFlat%20noodles?alt=media&token=7736245e-3cdc-4912-9dec-df289893680d","likes":{"hasLiked":false,"count":0},"optionGroups":[]},{"_id":"dFZpsdnPLP","name":"spicy seafood noodle soup","prices":[{"value":12,"label":null}],"description":"Egg noodles with a seafood broth. Includes shrimp and squid.","flick":"https://firebasestorage.googleapis.com/v0/b/food-flick.appspot.com/o/D71rFmwB0QaGhfaOS2Jp%2FNoodles%2Fspicy%20seafood%20noodle%20soup?alt=media&token=74e21636-cc7c-47bc-a617-c5cc4929d649","likes":{"hasLiked":false,"count":0},"optionGroups":[]}]}],"url":"horizon-simon3"} as unknown as ICustomerRest

let store: Store;

const initStore = (rootReducer = getRootReducer()) => {
  const logger = createLogger({
    collapsed: true,
    diff: true,
  });

  // A middleware is needed so that any events that mutate the navigation state properly trigger the event listeners.
  const enhancer = process.env.NODE_ENV === 'development'
  ? applyMiddleware(ReduxThunk, logger)
  : applyMiddleware(ReduxThunk);

  store = createStore<RootState, RootActions, any, any>(rootReducer, enhancer);

  // turn on for dev for convenience
  // store.dispatch(selectOrderingRestAction(new CustomerRest(testRest)));
  // // @ts-ignore
  // store.dispatch(addCartItemAction(1, 1, new Price({ value: 12, label: 'extra meat' }), [new Option({ name: 'pork' })], 1, 'special request1' ));
  // // @ts-ignore
  // store.dispatch(addCartItemAction(1, 0, new Price({ value: 8, label: null }), [new Option({ name: 'medium spicy' })], 1, 'special request2' ));
  // // @ts-ignore
  // store.dispatch(addCartItemAction(1, 2, new Price({ value: 9, label: null }), [], 3, 'special request3' ));
  // // @ts-ignore
  // store.dispatch(addCartItemAction(1, 2, new Price({ value: 9, label: null }), [], 3, 'special request3' ));
  // // @ts-ignore
  // store.dispatch(addCartItemAction(1, 2, new Price({ value: 9, label: null }), [], 3, 'special request3' ));
  // // @ts-ignore
  // store.dispatch(addCartItemAction(1, 2, new Price({ value: 9, label: null }), [], 3, 'special request3' ));
  // // @ts-ignore
  // store.dispatch(addCartItemAction(1, 2, new Price({ value: 9, label: null }), [], 3, 'special request3' ));

  return store;
};

const getStore = () => store;

export { initStore, getStore };
