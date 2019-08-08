import {NEEDS_MANAGER_SIGN_IN_ERROR, NEEDS_SIGN_IN_ERROR, getCannotBeEmptyError } from '../utils/errors';
import { getBankingService } from './bankingService';
import { getUserService } from './userService';
import { getTagService } from './tagService';
import { getGeoService } from './geoService';
import { MANAGER_PERM } from '../utils/auth';
import {
  getRestUpdateOptions,
  getUpdatedRestWithId,
  REST_INDEX,
  REST_TYPE,
  cleanCustomerRest,
  injectFindUserOrderedIndexMethod,
  callElasticWithErrorHandler,
  getRestReadOptions
} from './utils';

const QUERY_SIZE = 1000; //number of hits to include in query. arbutarialy large size to include all.

const findDuplicate = list => {
  const seen = new Set();
  for (let i = 0; i < list.length; i++) {
    if (seen.size === seen.add(list[i]).size) return list[i];
  }
  return null;
}

const throwIfInvalidProfile = profile => {
  if (!profile.name) throw new Error(getCannotBeEmptyError(`Profile name`));
  if (!profile.phone) throw new Error(getCannotBeEmptyError(`Profile phone`));
  if (profile.tags.includes('')) throw new Error(getCannotBeEmptyError(`Tag name`));
  const dupeTag = findDuplicate(profile.tags);
  if (dupeTag) throw new Error(`Found duplicate tag '${dupeTag}'. Please use all unique tags and try again`);
};

const throwIfInvalidBanking = banking => {
  if (!banking.accountNumber) throw new Error(getCannotBeEmptyError(`Account number`));
  if (!banking.routingNumber) throw new Error(getCannotBeEmptyError(`Routing number`));
  if (banking.routingNumber.length !== 9) throw new Error('Routing number must be 9 digits long');
};

const throwIfInvalidAddress = address => {
  Object.entries(address).forEach(([key, value]) => {
    if (key === 'address2') return;
    if (!value) throw new Error(getCannotBeEmptyError(key));
  });
};

class RestService {
  constructor(elastic) {
    this.elastic = elastic;
  }

  async getMyFavoriteRests(signedInUser) {
    if (!signedInUser) throw new Error(NEEDS_SIGN_IN_ERROR);

    const res = await callElasticWithErrorHandler(options => this.elastic.search(options), {
      index: 'rests',
      size: QUERY_SIZE,
      body: {
        query: {
          bool: {
            filter: {
              term: {
                'favorites.users.userId.keyword': signedInUser._id 
              }
            }
          }
        }
      }
    });

    return res.hits.hits.map(({ _source, _id }) => {
      _source._id = _id;
      cleanCustomerRest(signedInUser, _source);
      return _source;
    });    
  }

  /**
   * 
   * @param {*} signedInUser 
   * @param {*} prefix 
   * @param {*} location defaults to boston
   */
  async getRestSearchSuggestions(signedInUser, prefix, location = { lat: 42.360020, lon: -71.057705 }) {
    const suggestionName = 'rests';
    const res = await callElasticWithErrorHandler(options => this.elastic.search(options), {
      index: REST_INDEX,
      body: {
        // _source: { // _sourceExcludes doesn't actually work as api states. so use this instead.
        //   excludes: [ 'menu.items.likes.users' ] // unfortunately, this also removes menu if it's empty
        // },
        suggest: {
          [suggestionName]: {
            prefix, 
            completion: { 
              field: 'profile.name.suggest',
              contexts: {
                location: {
                  lat: location.lat,
                  lon: location.lon,
                  precision: 1, // todo 3: 1 for now to ensure all data retrieved. eventually use precision 5
                }
              }
            }
          }
        }
      }
    });

    // todo 1: improve this to not only return full rests but also suggest regular words. ex:
    // prefix = Italian, results = "Italian rest1", "Italian rest2", "Italian" (keyword), "Italian food" (keyword)
    // 0th index because we currently only support suggestion based on 1 word. indexes 0...n reflect the
    // number and order of the words in the query. i think...
    return res.suggest[suggestionName][0].options.map(({ _source, _id }) => {
      _source._id = _id;
      cleanCustomerRest(signedInUser, _source);
      return _source;
    });
  }

  async giveRestFeedback(signedInUser, restId, feedback) {
    const feed = {
      feedback,
      userId: signedInUser ? signedInUser._id : null,
      createdDate: Date.now(),
    }

    if (!feed.feedback) throw new Error(getCannotBeEmptyError(`Feedback`));

    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      null,
      `ctx._source.feedback.add(params.feed);`,
      { feed }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  async getMyRests(signedInUser) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);

    const res = await callElasticWithErrorHandler(options => this.elastic.search(options), {
      index: 'rests',
      body: {
        size: QUERY_SIZE,
        query: {
          bool: {
            filter: {
              bool: {
                should: [
                  // keyword is a 'field' added by elastic that during auto mapping on indexing a new document
                  // https://www.elastic.co/guide/en/elasticsearch/reference/6.2//multi-fields.html
                  { term: { 'owner.userId.keyword': signedInUser._id } },
                  { term: { 'managers.userId': signedInUser._id } }
                ]
              }
            }
          }
        },
      }
    });

    return res.hits.hits.map(({ _source, _id }) => {
      _source._id = _id;
      return _source;
    });
  }

  async addRest(signedInUser, newRest) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    throwIfInvalidProfile(newRest.profile);
    const address = newRest.location.address;
    throwIfInvalidAddress(address);

    const {owner = {}} = newRest;
    if (owner.userId !== signedInUser._id || owner.email !== signedInUser.email) {
      throw new Error('Unauthorized. The restaurant owner must be the signed in user when adding a restaurant. Signed '
                      + `in user: ${JSON.stringify(signedInUser, null, '  ')}. Owner: ${JSON.stringify(owner, null, '  ')}`);
    }

    let stripeRes;
    try {
      stripeRes = await getBankingService().signupRestBanking(
        newRest.profile.name,
        signedInUser.ip,
        newRest.banking ? newRest.banking.accountNumber : undefined,
        newRest.banking ? newRest.banking.routingNumber : undefined,
      )
    } catch (e) {
      console.error('failed to add stripe connected account', e);
      throw 'Failed to add rest';
    }

    getTagService().incramentAndAddTags(newRest.profile.tags).catch(e => console.error('failed to incramentAndAddTags tags', e));

    const { address1, city, state, zip } = address;
    newRest.location.geo = await getGeoService().getGeocode(address1, city, state, zip);
    newRest.createdDate = Date.now();
    newRest.menu = [];
    newRest.managers = [];
    newRest.feedback = [];
    newRest.printers = [];
    newRest.favorites = {
      count: 0,
      users: [],
    };
    newRest.banking = {
      stripeId: stripeRes.id,
    };
  
    try {
      // not specifying an id makes elastic add the doc
      const res = await callElasticWithErrorHandler(options => this.elastic.index(options), {
        index: REST_INDEX,
        type: REST_TYPE,
        body: newRest,
      });

      newRest._id = res._id;
      return newRest;
    } catch (e) {
      // todo 0: if rest fails to add, then decrament / remove the tag from tag index
      // getTagService().incramentAndAddTags(newRest.profile.tags).catch(e => console.error('failed to incramentAndAddTags tags', e));
      throw e;
    }
  }

  async addRestPrinter(signedInUser, restId, newPrinter) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    if (!newPrinter.name) throw new Error(getCannotBeEmptyError(`Printer name`));
    if (!newPrinter.ip) throw new Error(getCannotBeEmptyError(`Printer ip`));
    if (!newPrinter.port) throw new Error(getCannotBeEmptyError(`Printer port`));
    // shouldn't happen since it's an graphql enum
    if (!newPrinter.type) throw new Error(getCannotBeEmptyError(`Printer type`));

    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        for (printer in ctx._source.printers) {
          if (printer.name.equals(params.newPrinter.name)) {
            throw new Exception("'" + params.newPrinter.name + "' already exists. Please try again with a different name");
          }
          if (printer.ip.equals(params.newPrinter.ip)) {
            throw new Exception("'" + params.newPrinter.ip + "' already exists. Please try again with a different ip");
          }
        }
        ctx._source.printers.add(params.newPrinter);
      `,
      { newPrinter }
    ));
    return getUpdatedRestWithId(res, restId);
  }

  async deleteRestPrinter(signedInUser, restId, printerName) {
    
  }

  async updateRestPrinter(signedInUser, restId, newPrinter) {
    /** newPrinter
     *    index: Int!
          printer: {
            name: String!
            ip: String!
            port: String!
            type: String!
          }
     */
    // when you find the doc, use context.source to grab the existing printer with [index]. then loop through all
    // items and find the uses. and update them. then update the rest.printers[index].
  }

  async getRest(restId, fields) {
    try {
      const rest = await callElasticWithErrorHandler(options => this.elastic.getSource(options), getRestReadOptions(
        restId,
        fields,
      ));
      rest._id = restId;
      return rest;
    } catch (e) {
      console.error(`failed to get stripeId for rest ${restId}`, e);
      throw e;
    }
  }

  async getRestWithBanking (signedInUser, restId) {
    const rest = await this.getRest(restId);
    if (!rest.owner.userId === signedInUser._id) {
      throw new Exception("Only the restaurant owner can see banking info. Please try again as the owner.")
    }
    const stripeAccount = await getBankingService().getStripeRestAccount(rest.banking.stripeId);
    const externalAccounts = stripeAccount.external_accounts;
    const totalCount = externalAccounts.total_count;
    if (totalCount === 0) {
      return rest;
    }
    if (totalCount > 1) {
      throw new Exception(`Found stripe account ${stripeAccount.id} for rest ${restId} with ${totalCount} external accounts. Expected 1`);
    }
    rest.banking.routingNumber = externalAccounts.data[0].routing_number;
    rest.banking.accountNumberLast4 = externalAccounts.data[0].last4;
    return rest;
  }
  
  async updateRestBanking(signedInUser, restId, newBanking) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    throwIfInvalidBanking(newBanking);
    const rest = await this.getRest(restId);
    if (!rest.owner.userId === signedInUser._id) {
      throw new Exception("Only the restaurant owner can update banking info. Please try again as the owner.")
    }
    const { accountNumber, routingNumber } = newBanking;
    try {
      await getBankingService().updateRestBanking(rest.banking.stripeId, accountNumber, routingNumber);
      rest.banking.accountNumberLast4 = accountNumber.substr(accountNumber.length - 4);
      rest.banking.routingNumber = routingNumber;
      return rest;
    } catch (e) {
      console.error('failed to update rest stripe banking', e);
      throw e;
    }
  }

  async updateRestProfile(signedInUser, restId, newProfile) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    throwIfInvalidProfile(newProfile);

    getTagService().updateTags(restId, newProfile.tags).catch(e => console.error('failed to update tags', e));

    try {
      const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
        restId,
        signedInUser,
        'ctx._source.profile = params.newProfile;',
        { newProfile }
      ));

      return getUpdatedRestWithId(res, restId);
    } catch (e) {
      // todo 0: if rest fails to update, then decrament / remove the tag from tag index
      // getTagService().incramentAndAddTags(newRest.profile.tags).catch(e => console.error('failed to incramentAndAddTags tags', e));
      throw e;
    }
  }

  async updateRestLocation(signedInUser, restId, newLocation) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    const address = newLocation.address;
    throwIfInvalidAddress(address);
    const { address1, city, state, zip } = address;
    newLocation.geo = await getGeoService().getGeocode(address1, city, state, zip);

    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      'ctx._source.location.address = params.newLocation.address;',
      { newLocation }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  async addRestManager(signedInUser, restId, managerEmail) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    if (!managerEmail) throw new Error(getCannotBeEmptyError(`Manager email`));
    let managers;

    try {
      managers = await getUserService().getUsersByEmail(managerEmail);
    } catch (e) {
      console.error(e);
      throw new Error(`Internal server error. Could not verify if email already exists in FoodFlick.`);
    }

    if (managers.length === 0) throw new Error(`Could not add '${managerEmail}'. Please make sure the email is signed up with FoodFlick and try again`);

    if (managers.length > 1) throw new Error(`Multiple users have this email. Cannot add an email with multiple users 
     please add another user and file a issue since multiple users should not have the same email in the database.`);

    const newManager = {
      userId: managers.length === 1 ? managers[0].user_id : null,
      email: managerEmail
    }

    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        for (manager in ctx._source.managers) {
          if (manager.email.equals(params.newManager.email)) {
            throw new Exception("'" + params.newManager.email + "' already exists. Please try again with a different email");
          }
        }
        ctx._source.managers.add(params.newManager);
      `,
      { newManager }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  async deleteRestManager(signedInUser, restId, managerEmail) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    
    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        boolean foundManager = false;
        for (int i = 0; i < ctx._source.managers.length; i++) { 
          if (ctx._source.managers[i].email.equals(params.managerEmail)) {
            foundManager = true;
            ctx._source.managers.remove(i);
          }
        }
        
        if (!foundManager) {
          throw new Exception ("Could not find manager '" + params.managerEmail + "'. Please try again with an existing manager");
        }
      `,
      { managerEmail }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  
  async toggleRestFavorite (signedInUser, restId) {
    if (!signedInUser) throw new Error(NEEDS_SIGN_IN_ERROR);

    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      null,
      injectFindUserOrderedIndexMethod(`
        def favorites = ctx._source.favorites;
        int index = findUserOrderedIndex(favorites.users, params.user);
        int size = favorites.users.size();

        if (size == 0 || index == size) {
          favorites.users.add(params.user);
          favorites.count++;
        } else if (!params.user.userId.equals(favorites.users.get(index).userId)) {
          favorites.users.add(index, params.user);
          favorites.count++;
        } else {
          favorites.users.remove(index);
          favorites.count--;
        }
      `),
      { 
        user: {
          userId: signedInUser._id,
          createdDate: Date.now()
        }
      }
    ));

    const rest = getUpdatedRestWithId(res, restId);
    cleanCustomerRest(signedInUser, rest);
    return rest;
  }
}

let restService;

export const getRestService = elastic => {
  if (restService) return restService;
  restService = new RestService(elastic);
  return restService;
};