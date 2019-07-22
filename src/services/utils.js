import { getRestNotFoundError } from "../utils/errors";

export const REST_INDEX = 'rests';
export const REST_TYPE = 'rest';

export const TAG_INDEX = 'tags';
export const TAG_TYPE = 'tag';

export const getUpdatedRestWithId = (res, restId) => {
  const rest = res.get._source;
  rest._id = restId;
  return rest;
}

const binarySearch = (users, userId) => {
  let left = 0;
  let right = users.length - 1;
  while (left <= right) {
    const mid = Math.floor((right + left)/2);
    if (userId === users[mid].userId) {
      return mid;
    } else if (userId > users[mid].userId) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}

/**
 * Cleans up a rest for customer.
 * Adds isFavorite and hasLiked fields to the rest. Removes owner, manager, and feedback. Removes items without flicks.
 * Removes optionGroups without options. Removes banking acc + routing numbers
 * @param  {} signedInUser pass in if need to filter based on rest management
 * @param  {} rest
 */
export const cleanCustomerRest = (signedInUser, rest) => {
  rest.owner = null;
  rest.managers = null;
  rest.feedback = null;
  rest.createdDate = null;
  rest.favorites.isFavorite = Boolean(signedInUser) && binarySearch(rest.favorites.users, signedInUser._id) !== -1;
  rest.menu = rest.menu.map(category => {
    category.items = category.items.filter(({ flick }) => flick).map(item => {
      item.likes.hasLiked = Boolean(signedInUser) && (binarySearch(item.likes.users, signedInUser._id) !== -1);
      item.optionGroups = item.optionGroups.filter(({ options }) => options.length > 0);
      // no need to remove internal item fields items because graphql will scrap these non-schema fields
      // delete item.likes.users;
      return item;
    });
    return category;
  });
}

/**
 * @param  {} restId
 * @param  {} signedInUser pass in if need to filter based on rest management
 * @param  {} script
 * @param  {} params
 */
export const getRestUpdateOptions = (restId, signedInUser, script, params) => {
  const unauthorizedMsg = `"Unauthorized. '" + params.signedInUserId + "' is not an owner or manager of this restaurant.`
                          + ` Add '"+ params.signedInUserId + "' as a manager and try again."`
  const doScriptIfAllowed = signedInUser ?
  `if (ctx._source.owner.userId.equals(params.signedInUserId) || containsManager(ctx._source.managers, params.signedInUserId)) {
    ${script}
  } else {
    throw new Exception(${unauthorizedMsg});
  }`
  :
  script;
  
  return {
    index: REST_INDEX,
    type: REST_TYPE,
    id: restId,
    // _sourceExclude: [ 'menu.items.likes.users' ], // unfortunately, this also removes menu/items if they're empty
    _source: true,
    body: {
      script: {
        source: `
          void throwCategoryNotFoundException(def categoryName) {
            throw new Exception("Could not find original category '" + categoryName + "'. Please try again with an existing category.")
          }
          void throwItemNotFoundException(def itemName) {
            throw new Exception("Could not find original item '" + itemName + "'. Please try again with an existing item.")
          }
          void throwIfItemNameIsDuplicate(def newName, def itemIndex, def currItems) {
            for (int i = 0; i < currItems.length; i++) {
              if (itemIndex != i && currItems[i].name.equals(newName)) {
                throw new Exception("'" + newName + "' already exists. Please try again with a different name.");
              }
            }
          }
          void throwIfCategoryNameIsDuplicate(def newCategoryName, def oldCategoryName, def currCategories) {
            for (int i = 0; i < currCategories.length; i++) {
              if (currCategories[i].name.equals(newCategoryName) && !currCategories[i].name.equals(oldCategoryName)) {
                throw new Exception("'" + newCategoryName + "' already exists. Please try again with a different name.");
              }
            }   
          }
          boolean containsManager(def managers, def id) {
            for (manager in managers) {
              if (manager.userId.equals(id)) {
                return true;
              }
            }
            return false;
          }
          ${doScriptIfAllowed}
      `,
        params: {
          signedInUserId: (signedInUser || {})._id,
          ...params
        }
      },
    }
  }
}

/**
 * @param  {} restId
 * @param  {} fields
 */
export const getRestReadOptions = (restId, fields) => {
  const options = {
    index: REST_INDEX,
    type: REST_TYPE,
    id: restId,
  };
  if (fields) options._source = fields;
  return options;
}

export const injectFindUserOrderedIndexMethod = script => `
  int findUserOrderedIndex(def users, def user) {
    int left = 0, right = users.size() - 1, mid = 0;
    while (left <= right) {
      mid = (right + left)/2;
    int comparison = user.userId.compareTo(users.get(mid).userId);
      if (comparison == 0) {
        return mid;
      } else if (comparison > 0) {
        left = mid + 1;
        mid = left;
      } else {
        mid = right;
        right = mid - 1;
      }
    }

    return mid;
  }
  ${script}
`

export const callElasticWithErrorHandler = async (elasticFn, options) => {
  try {
    return await elasticFn(options);
  } catch (e) {
    console.error('ERROR', e);
    if (e.status === 404) throw new Error(getRestNotFoundError(options.id));
    if (e.status === 400) throw new Error(e.body.error.caused_by.caused_by.reason);
    throw new Error('Internal error');
  }
}