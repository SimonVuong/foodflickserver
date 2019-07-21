import {
  NEEDS_MANAGER_SIGN_IN_ERROR,
  NEEDS_SIGN_IN_ERROR,
  getCannotBeEmptyError,
} from '../utils/errors';
import { MANAGER_PERM } from '../utils/auth';
import {
  getRestUpdateOptions,
  getUpdatedRestWithId,
  cleanCustomerRest,
  injectFindUserOrderedIndexMethod,
  callElasticWithErrorHandler
} from './utils';

const throwIfInvalidReorder = newOrder => {
  for (let i = 0; i < newOrder.length; i++) {
    if (!newOrder.includes(i)) throw new Error(`newOrder missing value ${i}. Every index in newOrder must be included`
                                              + ' in the newOrder. EX: if newOrder is size 5, then newOrder must'
                                              + ' contain values 0 through 5 inclusive.');
  }
}

class MenuService {
  constructor(elastic) {
    this.elastic = elastic;
  }

  async addCategory(signedInUser, restId, newCategory) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    if (!newCategory.name) throw new Error(getCannotBeEmptyError('Category name'));

    newCategory.items = [];

    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        def menu = ctx._source.menu;
        throwIfCategoryNameIsDuplicate(params.newCategory.name, menu);
        menu.add(params.newCategory);
      `,
      { newCategory }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  async updateCategory(signedInUser, restId, categoryName, newCategory) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    if (!newCategory.name) throw new Error(getCannotBeEmptyError('New category name'));

    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        def menu = ctx._source.menu;
        throwIfCategoryNameIsDuplicate(params.newCategory.name, menu);
        boolean updated = false;
        for (int i = 0; i < menu.length; i++) {
          if (menu[i].name.equals(params.categoryName)) {
            def items = menu[i].items;
            params.newCategory.items = items;
            menu[i] = params.newCategory;
            updated = true;
          }
        }
        if (!updated) {
          throwCategoryNotFoundException(params.categoryName);
        }
      `,
      { categoryName, newCategory }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  /**
   * @param {array} newOrder a list of categories in the new desired order, where each element is the category index
   * in the ORIGINAL order. ex: [5,2,3,1,0] means the category originally at 5 is now at 0, 2 is now at 1 etc
   */
  async updateCategoryOrder(signedInUser, restId, newOrder) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);

    throwIfInvalidReorder(newOrder);

    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        if (ctx._source.menu.length !== params.newOrder.length) {
          throw new Exception("Length of newOrder needs to match existing menu length " + ctx._source.menu.length + ".");
        }

        List reorderedCategories = new ArrayList();
        for (oldPosition in params.newOrder) {
          reorderedCategories.add(ctx._source.menu[oldPosition]);
        }
        ctx._source.menu = reorderedCategories;
      `,
      { newOrder }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  async deleteCategory(signedInUser, restId, categoryName) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);

    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        def menu = ctx._source.menu;
        boolean deleted = false;
        for (int i = 0; i < menu.length; i++) { 
          if (menu[i].name.equals(params.categoryName)) {
            menu.remove(i);
            deleted = true;
            break;
          }
        }

        if (!deleted) {
          throwCategoryNotFoundException(params.categoryName);
        }
      `,
      { categoryName }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  async addItems(signedInUser, restId, categoryName, items) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);

    items = items.map((item, index) => {
      if (!item.name) throw new Error(getCannotBeEmptyError(`Item name for index ${index}`));

      return {
        ...item,
        likes: { count: 0, users: [] },
      }
    });

    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        boolean added = false;
        def menu = ctx._source.menu;
        for (int i = 0; i < menu.length; i++) {
          if (menu[i].name.equals(params.categoryName)) {
            for (def item : params.items) { 
              throwIfItemNameIsDuplicate(item.name, -1, menu[i].items);
            }
            menu[i].items.addAll(params.items);
            added = true;
            break;
          }
        }

        if (!added) {
          throwCategoryNotFoundException(params.categoryName);
        }
      `,
      { categoryName, items }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  async deleteItem(signedInUser, restId, categoryName, itemName) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);

    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        def menu = ctx._source.menu;
        boolean foundCategory = false;
        for (int i = 0; i < menu.length; i++) {
          if (menu[i].name.equals(params.categoryName)) {
            foundCategory = true;
            List items = menu[i].items;
            int originalLength = items.length;
            items.removeIf(item -> item.name.equals(params.itemName));
            if (originalLength == items.length) {
              throwItemNotFoundException(params.itemName);
            }
            break;
          }
        }
        if (!foundCategory) {
          throwCategoryNotFoundException(params.categoryName); 
        }
      `,
      { categoryName, itemName }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  //todo 1: surround item details in details object for graphql and elastic
  async updateItems(signedInUser, restId, categoryName, items) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);

    items.forEach(item => {
      if (!item.item.name) throw new Error(getCannotBeEmptyError(`Item name for index ${item.index}`));
      if (!item.item.flick) throw new Error(getCannotBeEmptyError(`Item flick for index ${item.index}`));
    });

    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        def menu = ctx._source.menu;
        boolean foundCategory = false;
        for (int i = 0; i < menu.length; i++) {
          if (menu[i].name.equals(params.categoryName)) {
            foundCategory = true;
            for (def updatedItem : params.items) { 
              if (updatedItem.index < 0 || updatedItem.index >= menu[i].items.length) {
                throw new Exception("Can't update index " + updatedItem.index + " for category of length " + menu[i].items.length);
              }
              throwIfItemNameIsDuplicate(updatedItem.item.name, updatedItem.index, menu[i].items);
              def dbItem = menu[i].items[updatedItem.index];
              dbItem.prices = updatedItem.item.prices;
              dbItem.name = updatedItem.item.name;
              dbItem.description = updatedItem.item.description;
              dbItem.flick = updatedItem.item.flick;
              dbItem.optionGroups = updatedItem.item.optionGroups;
            }
            break;
          }
        }

        if (!foundCategory) {
          throwCategoryNotFoundException(params.categoryName); 
        }
      `,
      { categoryName, items }
    ));

    return getUpdatedRestWithId(res, restId);
  }

  /**
   * @param {array} newOrder a list of items in the new desired order, where each element is the items index
   * in the ORIGINAL order. ex: [5,2,3,1,0] means the items originally at 5 is now at 0, 2 is now at 1 etc
   */
  async updateItemOrder(signedInUser, restId, categoryName, newOrder) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);

    throwIfInvalidReorder(newOrder);

    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      signedInUser,
      `
        boolean foundCategory = false;
        List reorderedItems = new ArrayList();
        def menu = ctx._source.menu;
        for (int i = 0; i < menu.length; i++) {
          if (menu[i].name.equals(params.categoryName)) {
            if (menu[i].items.length !== params.newOrder.length) {
              throw new Exception("Length of newOrder needs to match existing items length " + menu[i].items.length + ".");
            }
            foundCategory = true;

            for (oldPosition in params.newOrder) {
              reorderedItems.add(menu[i].items[oldPosition]);
            }
            menu[i].items = reorderedItems;
            break;
          }
        }

        if (!foundCategory) {
          throwCategoryNotFoundException(params.categoryName); 
        }
      `,
      { categoryName, newOrder }
    ));
    console.log('updated item order', getUpdatedRestWithId(res, restId));
    return getUpdatedRestWithId(res, restId);
  }

  async toggleItemLike(signedInUser, restId, categoryName, itemName) {
    if (!signedInUser) throw new Error(NEEDS_SIGN_IN_ERROR);

    const res = await callElasticWithErrorHandler(options => this.elastic.update(options), getRestUpdateOptions(
      restId,
      null,
      injectFindUserOrderedIndexMethod(`
        boolean foundCategory = false;
        boolean foundItem = false;
        def menu = ctx._source.menu;
        for (int i = 0; i < menu.length; i++) {
          if (menu[i].name.equals(params.categoryName)) {
            foundCategory = true;
            List items = menu[i].items;
            for (int j = 0; j < items.length; j++) {
              if (items[j].name.equals(params.itemName)) {
                foundItem = true;
                def likes = items[j].likes;
                def index = findUserOrderedIndex(likes.users, params.user);
                int size = likes.users.size();

                if (size == 0 || index == size) {
                  likes.users.add(params.user);
                  likes.count++;
                } else if (!params.user.userId.equals(likes.users.get(index).userId)) {
                  likes.users.add(index, params.user);
                  likes.count++;
                } else {
                  likes.users.remove(index);
                  likes.count--;
                }
                break;
              }
            }
            break;
          }
        }

        if (!foundCategory) {
          throwCategoryNotFoundException(params.categoryName); 
        }

        if (!foundItem) {
          throw new Exception("Could not find item '" + params.itemName + "'. Please try again with an existing item."); 
        }
      `),
      {
        categoryName,
        itemName,
        user: {
          createdDate: Date.now(),
          userId: signedInUser._id
        }
      }
    ));

    const rest = getUpdatedRestWithId(res, restId);
    cleanCustomerRest(signedInUser, rest);
    return rest;
  }
}

let menuService;

export const getMenuService = elastic => {
  if (menuService) return menuService;
  menuService = new MenuService(elastic);
  return menuService;
};