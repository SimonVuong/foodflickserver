export const MenuMutationResolvers = {
  addCategory: async (root, { restId, newCategory }, { signedInUser, MenuService }) => {
    return await MenuService.addCategory(signedInUser, restId, newCategory);
  },

  updateCategory: async (root, { restId, categoryName, newCategory }, { signedInUser, MenuService }) => {
    return await MenuService.updateCategory(signedInUser, restId, categoryName, newCategory);
  },

  /**
   * @param {array} newOrder a list of categories in the new desired order, where each element is the category index
   * in the ORIGINAL order. ex: [5,2,3,1,0] means the category originally at 5 is now at 0, 2 is now at 1 etc
   */
  updateCategoryOrder: async (root, { restId, newOrder }, { signedInUser, MenuService }) => {
    return await MenuService.updateCategoryOrder(signedInUser, restId, newOrder);
  },

  deleteCategory: async (root, { restId, categoryName }, { signedInUser, MenuService }) => {
    return await MenuService.deleteCategory(signedInUser, restId, categoryName);
  },

  addItems: async (root, { restId, categoryName, items }, { signedInUser, MenuService }) => {
    return await MenuService.addItems(signedInUser, restId, categoryName, items);
  },

  deleteItem: async (root, { restId, categoryName, itemName }, { signedInUser, MenuService }) => {
    return await MenuService.deleteItem(signedInUser, restId, categoryName, itemName);
  },

  toggleItemLike: async (root, { restId, categoryName, itemName }, { signedInUser, MenuService }) => {
    return await MenuService.toggleItemLike(signedInUser, restId, categoryName, itemName);
  },

  updateItems: async (root, { restId, categoryName, items }, { signedInUser, MenuService }) => {
    return await MenuService.updateItems(signedInUser, restId, categoryName, items);
  },

  /**
   * @param {array} newOrder a list of items in the new desired order, where each element is the items index
   * in the ORIGINAL order. ex: [5,2,3,1,0] means the items originally at 5 is now at 0, 2 is now at 1 etc
   */
  updateItemOrder: async (root, {restId, categoryName, newOrder}, { signedInUser, MenuService }) => {
    return await MenuService.updateItemOrder(signedInUser, restId, categoryName, newOrder);
  },
};

export const MenuQueryResolvers = {
  itemsWithPrinter: async (root, { restId, printerName }, { signedInUser, MenuService }) => {
    return await MenuService.getItemsWithPrinter(signedInUser, restId, printerName);
  },
}