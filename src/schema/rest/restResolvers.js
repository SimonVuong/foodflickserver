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
  
  deleteRestManager: async (root, { restId, managerEmail }, { signedInUser, RestService }) => {
    return await RestService.deleteRestManager(signedInUser, restId, managerEmail);  
  },

  deleteRestPrinter: async (root, { restId, printerName }, { signedInUser, RestService }) => {
    return await RestService.deleteRestManager(signedInUser, restId, printerName);  
  },

  giveRestFeedback: async (root, { restId, feedback }, { signedInUser, RestService }) => {
    await RestService.giveRestFeedback(signedInUser, restId, feedback);  
    return true;
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

  updateRestPrinter: async (root, { restId, newPrinter }, { signedInUser, RestService }) => {
    return await RestService.updateRestPrinter(signedInUser, restId, newPrinter);  
  },

  updateRestProfile: async (root, { restId, newProfile }, { signedInUser, RestService }) => {
    return await RestService.updateRestProfile(signedInUser, restId, newProfile);  
  },
};

export const RestQueryResolvers = {
  myFavoriteRests: async (root, args, { signedInUser, RestService }) => {
    return await RestService.getMyFavoriteRests(signedInUser);
  },

  myRests: async (root, args, { signedInUser, RestService }) => {
    return await RestService.getMyRests(signedInUser);
  },

  restSearchSuggestions: async (root, { query, location }, { signedInUser, RestService }) => {
    return await RestService.getRestSearchSuggestions(signedInUser, query, location);
  },

  restWithBanking: async (root, { restId }, { signedInUser, RestService }) => {
    return await RestService.getRestWithBanking(signedInUser, restId);
  }
}