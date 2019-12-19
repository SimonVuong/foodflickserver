// none of these need to catch errors because RestService, upon erroring, will throw error all the way up imlicitly
export const RestMutationResolvers = {
  addRest: async (root, { newRest }, { signedInUser, RestService }) => {
    return await RestService.addRest(signedInUser, newRest);
  },

  addRestManager: async (root, { restId, managerEmail }, { signedInUser, RestService }) => {
    return await RestService.addRestManager(signedInUser, restId, managerEmail);  
  },

  addRestPrinter: async (root, { restId, newPrinter }, { signedInUser, RestService }) => {
    return await RestService.addRestPrinter(signedInUser, restId, newPrinter);  
  },

  addRestReceiver: async (root, { restId, receiverId }, { signedInUser, RestService }) => {
    return await RestService.addRestReceiver(signedInUser, restId, receiverId);  
  },

  addRestServer: async (root, { restId, serverEmail }, { signedInUser, RestService }) => {
    return await RestService.addRestServer(signedInUser, restId, serverEmail);  
  },
  
  addRestTable: async (root, { restId, tableId }, { signedInUser, RestService }) => {
    return await RestService.addRestTable(signedInUser, restId, tableId);  
  },

  addRestTaxRate: async (root, { restId, taxRate }, { signedInUser, RestService }) => {
    return await RestService.addRestTaxRate(signedInUser, restId, taxRate);  
  },

  deleteRestManager: async (root, { restId, userId }, { signedInUser, RestService }) => {
    return await RestService.deleteRestManager(signedInUser, restId, userId);  
  },

  deleteRestPrinter: async (root, { restId, printerName }, { signedInUser, RestService }) => {
    return await RestService.deleteRestPrinter(signedInUser, restId, printerName);  
  },

  deleteRestServer: async (root, { restId, userId }, { signedInUser, RestService }) => {
    return await RestService.deleteRestServer(signedInUser, restId, userId);  
  },

  deleteRestTable: async (root, { restId, tableId }, { signedInUser, RestService }) => {
    return await RestService.deleteRestTable(signedInUser, restId, tableId);  
  },

  giveRestFeedback: async (root, { restId, feedback }, { signedInUser, RestService }) => {
    await RestService.giveRestFeedback(signedInUser, restId, feedback);  
    return true;
  },

  testPrinter: async (root, { restId, printer }, { signedInUser, RestService }) => {
    return await RestService.testPrinter(signedInUser, restId, printer);
  },

  toggleRestFavorite: async (root, { restId }, { signedInUser, RestService }) => {
    return await RestService.toggleRestFavorite(signedInUser, restId);
  },

  updateRestBanking: async (root, { restId, newBanking }, { signedInUser, RestService }) => {
    return await RestService.updateRestBanking(signedInUser, restId, newBanking);  
  },

  updateRestLocation: async (root, { restId, newLocation }, { signedInUser, RestService }) => {
    return await RestService.updateRestLocation(signedInUser, restId, newLocation);  
  },

  updateRestMinsToUpdateCart: async (root, { restId, mins }, { signedInUser, RestService }) => {
    return await RestService.updateRestMinsToUpdateCart(signedInUser, restId, mins);  
  },

  updateRestPrinter: async (root, { restId, newPrinter }, { signedInUser, RestService }) => {
    return await RestService.updateRestPrinter(signedInUser, restId, newPrinter);  
  },

  updateRestProfile: async (root, { restId, newProfile }, { signedInUser, RestService }) => {
    return await RestService.updateRestProfile(signedInUser, restId, newProfile);  
  },

  updateRestReceiver: async (root, { restId, receiverId }, { signedInUser, RestService }) => {
    return await RestService.updateRestReceiver(signedInUser, restId, receiverId);  
  },

  updateRestSubscription: async (root, { restId, planId }, { signedInUser, RestService }) => {
    return await RestService.updateRestSubscription(signedInUser, restId, planId);  
  },

  updateRestSubscriptionCard: async (root, { restId, cardTok }, { signedInUser, RestService }) => {
    return await RestService.updateRestSubscriptionCard(signedInUser, restId, cardTok);  
  },

  updateRestTableCheckIn: async (root, { restId, tableId}, { signedInUser, RestService }) => {
    return await RestService.updateRestTableCheckIn(signedInUser, restId, tableId);  
  },

  updateRestTable: async (root, { restId, prevId, newId }, { signedInUser, RestService }) => {
    return await RestService.updateRestTable(signedInUser, restId, prevId, newId);  
  },

  updateRestTaxRate: async (root, { restId, taxRate }, { signedInUser, RestService }) => {
    return await RestService.updateRestTaxRate(signedInUser, restId, taxRate);  
  },

  updateRestUrl: async (root, { restId, url }, { signedInUser, RestService }) => {
    return await RestService.updateRestUrl(signedInUser, restId, url);  
  },
};

export const RestQueryResolvers = {
  myFavoriteRests: async (root, args, { signedInUser, RestService }) => {
    return await RestService.getMyFavoriteRests(signedInUser);
  },

  myRests: async (root, args, { signedInUser, RestService }) => {
    return await RestService.getMyRests(signedInUser);
  },

  restByUrl: async (root, { url }, { signedInUser, RestService }) => {
    return await RestService.getRestByUrl(signedInUser, url)
  },

  restPrinters: async(root, { restId }, { signedInUser, RestService }) => {
    return await RestService.getRestPrinters(signedInUser, restId);
  },

  restSearchSuggestions: async (root, { query, location }, { signedInUser, RestService }) => {
    return await RestService.getRestSearchSuggestions(signedInUser, query, location);
  },

  restBanking: async (root, { restId }, { signedInUser, RestService }) => {
    return await RestService.getRestBanking(signedInUser, restId);
  }
}