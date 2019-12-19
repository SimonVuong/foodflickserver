import {NEEDS_MANAGER_SIGN_IN_ERROR, NEEDS_SIGN_IN_ERROR, getCannotBeEmptyError } from '../utils/errors';
import { getBankingService } from './bankingService';
import { getUserService } from './userService';
import { getTagService } from './tagService';
import { getGeoService } from './geoService';
import { MANAGER_PERM, throwIfNotRestOwnerOrManager } from '../utils/auth';
import {
  getRestUpdateOptions,
  getUpdatedRestWithId,
  REST_INDEX,
  REST_TYPE,
  cleanCustomerRest,
  injectFindUserOrderedIndexMethod,
  callElasticWithErrorHandler,
  getRestReadOptions,
  QUERY_SIZE,
  URLCharacters
} from './utils';
import { throwIfInvalidPrinter } from '../schema/rest/printer';
import nanoid from 'nanoid/generate';
import { getPrinterService } from './printerService';
import { getPlanService } from './planService';
import { getCardService } from './cardService';

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

  getServerFromTable(rest, tableId) {
    if (!tableId) {
      return null;
    }
    const servers = rest.servers;
    const tables = rest.tables;
    const targetTable = tables.find(table => table._id === tableId);
    return servers.find(server => server.userId === targetTable.userId);
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

  async addUserRef(signedInUser, restId, newEmail, refs) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    if (!newEmail) throw new Error(getCannotBeEmptyError(`Email`));
    let users;

    try {
      users = await getUserService().getUsersByEmail(newEmail);
    } catch (e) {
      console.error(e);
      throw new Error(`Internal server error. Could not verify if email already exists in FoodFlick.`);
    }

    if (users.length === 0) throw new Error(`Could not add '${newEmail}'. Please make sure the email is signed up with FoodFlick and try again`);

    if (users.length > 1) throw new Error(`Multiple users have this email. Cannot add an email with multiple users 
     please add another user and file a issue since multiple users should not have the same email in the database.`);

    const user = users[0];
    const newUser = {
      userId: user.user_id,
      email: newEmail,
      firstName: user.user_metadata.firstName,
      lastName: user.user_metadata.lastName,
    }

    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        for (user in ctx._source.${refs}) {
          if (user.email.equals(params.newUser.email)) {
            throw new Exception("'" + params.newUser.email + "' already exists. Please try again with a different email");
          }
        }
        ctx._source.${refs}.add(params.newUser);
      `,
      { newUser }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  async deleteUserRef(signedInUser, restId, userId, refs) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    
    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        boolean foundUser = false;
        for (int i = 0; i < ctx._source.${refs}.length; i++) { 
          if (ctx._source.${refs}[i].userId.equals(params.userId)) {
            foundUser = true;
            ctx._source.${refs}.remove(i);
          }
        }

        if (foundUser) {
          for (int i = 0; i < ctx._source.tables.length; i++) { 
            if (ctx._source.tables[i].userId.equals(params.userId)) {
              ctx._source.tables[i].userId = ctx._source.owner.userId;
            }
          }
        } else {
          throw new Exception ("Could not find user '" + params.userId + "'. Please try again with an existing user");
        }
      `,
      { userId }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  async getRestByUrl(signedInUser, url) {
    const res = await callElasticWithErrorHandler(options => this.elastic.search(options), {
      index: 'rests',
      size: QUERY_SIZE,
      body: {
        query: {
          bool: {
            filter: {
              term: {
                url,
              }
            }
          }
        }
      }
    });
    if (res.hits.total === 0) return null;
    const dbRest = res.hits.hits[0];
    const rest = dbRest._source;
    rest._id = dbRest._id;
    cleanCustomerRest(signedInUser, rest);
    return rest;
  }

  async getRestByRecieverId(receiverId) {
    const res = await callElasticWithErrorHandler(options => this.elastic.search(options), {
      index: 'rests',
      size: QUERY_SIZE,
      body: {
        query: {
          bool: {
            filter: {
              term: {
                'receiver.receiverId.keyword': receiverId
              }
            }
          }
        }
      }
    });
    if (res.hits.total === 0) return null;
    const dbRest = res.hits.hits[0];
    const rest = dbRest._source;
    rest._id = dbRest._id;
    return rest;
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
      size: QUERY_SIZE,
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
                  { term: { 'managers.userId.keyword': signedInUser._id } },
                  { term: { 'servers.userId': signedInUser._id } }
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

    let sub;
    try {
      sub = await getPlanService().addDefaultPlan(signedInUser);
    } catch (e) {
      console.error(`[Rest service] Failed to add default subscription for new rest '${newRest.profile.name}'`, e);
      throw 'Failed to add rest';
    }

    getTagService().incramentAndAddTags(newRest.profile.tags).catch(e => console.error('failed to incramentAndAddTags tags', e));

    const { address1, city, state, zip } = address;
    const { geo, timezone } = await getGeoService().getGeocode(address1, city, state, zip);
    newRest.location.geo = geo;
    newRest.location.timezone = timezone;

    newRest.createdDate = Date.now();
    newRest.menu = [];
    newRest.managers = [];
    newRest.feedback = [];
    newRest.receiver = {
      printers: [], 
    }
    newRest.favorites = {
      count: 0,
      users: [],
    };
    newRest.banking = {
      stripeId: stripeRes.id,
    };
    signedInUser._id || owner.email !== signedInUser.email
    newRest.owner = {
      userId: signedInUser._id,
      email: signedInUser.email,
      firstName: signedInUser.firstName,
      lastName: signedInUser.lastName,
    }
    newRest.url = nanoid(URLCharacters, 10);
    newRest.minsToUpdateCart = 15;
    newRest.servers = [];
    newRest.tables = [];
    newRest.subscription = {};
    newRest.subscription.plan = sub;
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
    throwIfInvalidPrinter(newPrinter);
    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        def printers = ctx._source.receiver.printers;
        throwIfPrinterNameOrIpIsDuplicate(params.newPrinter, printers, -1);
        printers.add(params.newPrinter);
      `,
      { newPrinter }
    ));
    return getUpdatedRestWithId(res, restId);
  }

  async deleteRestPrinter(signedInUser, restId, printerName) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    if (!printerName) throw new Error(getCannotBeEmptyError(`Printer name`));
    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        def printers = ctx._source.receiver.printers;
        boolean foundPrinter = false;
        for (int i = 0; i < printers.length; i++) { 
          if (printers[i].name.equals(params.printerName)) {
            foundPrinter = true;
            printers.remove(i);
            for (category in ctx._source.menu) {
              for (item in category.items) {
                item.printers.removeIf(printer -> printer.name.equals(params.printerName))
              }
            }
            break;
          }
        }
        
        if (!foundPrinter) {
          throw new Exception ("Could not find printer '" + params.printerName + "'. Please try again with an existing printer");
        }
      `,
      { printerName }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  async deleteRestTable(signedInUser, restId, tableId) {
    try {
      if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
      if (!tableId) throw new Error(getCannotBeEmptyError(`Table #`));
      const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
        restId,
        signedInUser,
        `
          def tables = ctx._source.tables;
          boolean foundTable = false;
          for (int i = 0; i < tables.length; i++) { 
            if (tables[i]._id.equals(params.tableId)) {
              foundTable = true;
              tables.remove(i);
              break;
            }
          }
          if (!foundTable) {
            throw new Exception ("Could not find table '" + params.tableId + "'. Please try again with an existing table");
          }
        `,
        { tableId }
      ));
      return getUpdatedRestWithId(res, restId);
    } catch (e) {
      console.error(`[Rest service] could not delete table '${tableId}'. '${e.stack}'`);
      throw e;
    }
  }

  async updateRestPrinter(signedInUser, restId, newPrinter) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    throwIfInvalidPrinter(newPrinter.printer);
    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        def targetPrinterIndex = params.newPrinter.index;
        def restPrinters = ctx._source.receiver.printers;
        throwIfPrinterNameOrIpIsDuplicate(params.newPrinter.printer, restPrinters, targetPrinterIndex);
        def originalPrinter = restPrinters[targetPrinterIndex];
        restPrinters[targetPrinterIndex] = params.newPrinter.printer;
        for (category in ctx._source.menu) {
          for (item in category.items) {
            for (int i = 0; i < item.printers.length; i++) {
              if (item.printers[i].name.equals(originalPrinter.name)) {
                item.printers[i] = params.newPrinter.printer;
              }
            }
          }
        }
      `,
      { newPrinter }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  async addRestReceiver(signedInUser, restId, receiverId) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    if (!receiverId) throw new Error(getCannotBeEmptyError(`Receiver id`));
    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        ctx._source.receiver.receiverId = params.receiverId;
      `,
      { receiverId }
    ));
    return getUpdatedRestWithId(res, restId);
  }

  async addRestTaxRate(signedInUser, restId, taxRate) {
    try {
      if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
      if (!taxRate) throw new Error(getCannotBeEmptyError(`Sales tax`));
      if (taxRate < 0) throw new Error(`Sales tax cannot be less than 0`);
      const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
        restId,
        signedInUser,
        `
          ctx._source.taxRate = params.taxRate;
        `,
        { taxRate }
      ));
      return getUpdatedRestWithId(res, restId);
    } catch (e) {
      console.error(`[Rest service] could not add tax rate '${taxRate}', rest '${restId}'. '${e.stack}'`);
      throw e;
    }
  }

  async addRestTable(signedInUser, restId, tableId) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    if (!tableId) throw new Error(getCannotBeEmptyError(`Table #`));
    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        for (table in ctx._source.tables) {
          if (table._id.equals(params.table._id)) {
            throw new Exception("'" + params.table._id + "' already exists. Please try again with a different #");
          }
        }
        def table = params.table;
        table.userId = ctx._source.owner.userId;
        ctx._source.tables.add(params.table);
      `,
      { 
        table: { _id: tableId }
      }
    ));
    return getUpdatedRestWithId(res, restId);
  }

  async updateRestReceiver(signedInUser, restId, receiverId) {
    return await this.addRestReceiver(signedInUser, restId, receiverId);
  }

  async updateRestSubscription(signedInUser, restId, newPlanId) {
    const rest = await this.getRest(restId, ['owner.userId', 'subscription.card', 'subscription.plan.stripeSubscriptionId']);

    if (!rest.subscription.card) {
      throw new Error('Only with a card setup can update subscriptions');
    }
    
    if (rest.owner.userId !== signedInUser._id) {
      throw new Error('Only restaurant owners can change subscription plans');
    }

    try {
      const sub = await getPlanService().updateSubscription(rest.subscription.plan.stripeSubscriptionId, newPlanId);
      const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
        restId,
        null,
        `ctx._source.subscription.plan = params.sub;`,
        { 
          sub
        }
      ));
      return getUpdatedRestWithId(res, restId);
    } catch (e) {
      console.error(`[Rest service] could not update rest '${restId}' with plan '${planId}' because '${e.message}'`);
      throw e;
    }
  }

  async updateRestSubscriptionCard(signedInUser, restId, cardTok) {
    try {
      const rest = await this.getRest(restId, ['owner.userId', 'subscription.card']);
      if (rest.owner.userId !== signedInUser._id) {
        throw new Error('Only restaurant owners can change subscription plans');
      }

      if (rest.subscription && rest.subscription.card) {
        getCardService().removeUserCard(signedInUser.stripeId, rest.subscription.card.cardTok);
      }

      const card = await getCardService().addUserCard(signedInUser.stripeId, cardTok, { restId })
      const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
        restId,
        null,
        `ctx._source.subscription.card = params.card;`,
        { card }
      ));
      return getUpdatedRestWithId(res, restId);
    } catch (e) {
      console.error(`[Rest service] could not add payment card for customer '${signedInUser.stripeId}', rest '${restId}', and cardTok '${cardTok}' because '${e.message}'`);
      throw e;
    }
  }

  async updateRestTaxRate(signedInUser, restId, taxRate) {
    try {
      return await this.addRestTaxRate(signedInUser, restId, taxRate);
    } catch (e) {
      console.error(`[Rest service] could not update tax rate '${taxRate}', rest '${restId}'. '${e.stack}'`);
      throw e;
    }
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
      console.error(`[Rest service] failed to get rest for '${restId}'`, e);
      throw e;
    }
  }

  async getRestPrinters(signedInUser, restId) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    const res = await this.elastic.get({
      index: REST_INDEX,
      type: REST_TYPE,
      id: restId,
      _sourceInclude: [ 'owner', 'managers', 'menu', 'profile', 'printers']
    });
    const rest = res._source;
    throwIfNotRestOwnerOrManager(signedInUser, rest.owner, rest.managers, rest.profile.name);
    return rest.printers;
  }

  async getRestBanking (signedInUser, restId) {
    const rest = await this.getRest(restId);
    if (!rest.owner.userId === signedInUser._id) {
      throw new Exception("Only the restaurant owner can see banking info. Please try again as the owner.")
    }
    const stripeAccount = await getBankingService().getStripeRestAccount(rest.banking.stripeId);
    const externalAccounts = stripeAccount.external_accounts;
    const totalCount = externalAccounts.total_count;
    if (totalCount === 0) {
      return null;
    }
    if (totalCount > 1) {
      throw new Exception(`Found stripe account ${stripeAccount.id} for rest ${restId} with ${totalCount} external accounts. Expected 1`);
    }
    return {
      routingNumber: externalAccounts.data[0].routing_number,
      accountNumberLast4: externalAccounts.data[0].last4,
      stripeId: rest.banking.stripeId,
    }
  }
  
  async updateRestBanking(signedInUser, restId, newBanking) {
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
    const { geo, timezone } = await getGeoService().getGeocode(address1, city, state, zip);
    newLocation.geo = geo;
    newLocation.timezone = timezone;
    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      'ctx._source.location.address = params.newLocation.address;',
      { newLocation }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  async updateRestMinsToUpdateCart(signedInUser, restId, mins) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    if (mins <= 0) throw new Error('Minutes must be greater than 0');
    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      'ctx._source.minsToUpdateCart = params.mins;',
      { mins }
    ));
    return getUpdatedRestWithId(res, restId);
  }

  async updateRestTableCheckIn(signedInUser, restId, tableId) {
    try {
      if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
      const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
        restId,
        null,
        `
          def managers = ctx._source.managers;
          def servers = ctx._source.servers;
          def owner = ctx._source.owner;
          def signedInUserId = params.signedInUserId;
          throwIfNotOwnerManagerServer(owner, managers, servers, signedInUserId);
          boolean foundTable = false;
          def tables = ctx._source.tables;
          for (int i = 0; i < tables.length; i++) {
            if (tables[i]._id.equals(params.tableId)) {
              foundTable = true;
              tables[i].userId = signedInUserId;
            }
          }
          if (!foundTable) {
            throwTableNotFoundException(params.tableId); 
          }
        `,
        {
          tableId,
          signedInUserId: signedInUser._id
        }
      ));
      return getUpdatedRestWithId(res, restId);
    } catch (e) {
      console.error(`[Rest service] could not updateRestTableCheckIn. '${e.stack}'`);
      throw e;
    }
  }

  async updateRestTable(signedInUser, restId, prevId, newId) {
    try {
      if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
      const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
        restId,
        signedInUser,
        `
          boolean foundTable = false;
          def tables = ctx._source.tables;
          for (int i = 0; i < tables.length; i++) {
            if (tables[i]._id.equals(params.prevId)) {
              foundTable = true;
              tables[i]._id = params.newId;
            }
          }
          if (!foundTable) {
            throwTableNotFoundException(params.prevId); 
          }
        `,
        {
          prevId,
          newId,
          signedInUserId: signedInUser._id
        }
      ));
      return getUpdatedRestWithId(res, restId);
    } catch (e) {
      console.error(`[Rest service] could not updateRestTable. '${e.stack}'`);
      throw e;
    }
  }

  async addRestManager(signedInUser, restId, managerEmail) {
    try {
      return await this.addUserRef(signedInUser, restId, managerEmail, 'managers');
    } catch (e) {
      console.error(`[Rest service] could not add manager '${managerEmail}'. '${e.stack}'`);
      throw e;
    }
  }


  async deleteRestManager(signedInUser, restId, userId) {
    try {
      return await this.deleteUserRef(signedInUser, restId, userId, 'managers');
    } catch (e) {
      console.error(`[Rest service] could not delete manager. '${e.stack}'`);
      throw e;
    }
  }

  async addRestServer(signedInUser, restId, serverEmail) {
    try {
      return await this.addUserRef(signedInUser, restId, serverEmail, 'servers');
    } catch (e) {
      console.error(`[Rest service] could not add server '${serverEmail}'. '${e.stack}'`);
      throw e;
    }
  }

  async deleteRestServer(signedInUser, restId, userId) {
    try {
      console.log(userId);
      return await this.deleteUserRef(signedInUser, restId, userId, 'servers');
    } catch (e) {
      console.error(`[Rest service] could not delete server. '${e.stack}'`);
      throw e;
    }
  }

  async testPrinter (signedInUser, restId, printer) {
    if (!signedInUser) throw new Error(NEEDS_SIGN_IN_ERROR);
    const rest = await getRestService().getRest(restId, ['owner', 'managers', 'receiver', 'profile']);
    throwIfNotRestOwnerOrManager(signedInUser, rest.owner, rest.managers, rest.profile.name);
    await getPrinterService().testPrinter(rest.receiver, printer);
    return true;
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

  async updateRestUrl(signedInUser, restId, url) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    if (!url) throw new getCannotBeEmptyError('URL');
    const rest = await this.getRestByUrl(signedInUser, url);
    console.log(rest);
    if (rest) throw new Error('URL already exists. Please try another URL');
    const regex = /^[a-zA-Z0-9_-]*$/
    if(!regex.test(url)) throw new Error('Invalid URL. Please use only letters, numbers, -, _, or ~');
    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      'ctx._source.url = params.url;',
      { url }
    ));
    return getUpdatedRestWithId(res, restId);
  }
}

let restService;

export const getRestService = elastic => {
  if (restService) return restService;
  restService = new RestService(elastic);
  return restService;
};