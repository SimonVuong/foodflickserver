
export const UserMutationResolvers = {
  updateUserCard: async (root, { cardToken }, { signedInUser, UserService }) => {
    return await UserService.updateCard(signedInUser, cardToken);
  },
  
  updateUserEmail: async (root, { newEmail }, { signedInUser, UserService }) => {
    await UserService.updateEmail(signedInUser, newEmail);
    return true;
  },

  addUserFlicks: async (root, { urls }, { signedInUser, UserService }) => {
    return await UserService.addUserFlicks(signedInUser, urls);
  },
};

export const UserQueryResolvers = {
  doesUserExist: async (root, { email }, { UserService }) => {
    return await UserService.doesUserExist(email);
  },

  myCard: async (root, args, { signedInUser, UserService }) => {
    return await UserService.getMyCard(signedInUser);
  },

  myFlicks: async (root, args, { signedInUser, UserService }) => {
    return await UserService.getMyFlicks(signedInUser);
  },
}