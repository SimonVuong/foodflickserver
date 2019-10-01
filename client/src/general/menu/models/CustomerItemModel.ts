import { Price, cloneAddon, Addon } from 'general/menu/models/BaseItemModel';
import { IBaseCategory } from 'general/menu/models/BaseCategoryModel';
import { IBaseLikes, IBaseItem, clonePrice, cloneOptionGroups, OptionGroup } from "./BaseItemModel";

interface ICustomerLikes extends IBaseLikes {
  hasLiked: boolean;
}

class CustomerLikes implements ICustomerLikes {
  readonly hasLiked: boolean;
  readonly count: number;

  constructor(likes: ICustomerLikes) {
    this.hasLiked = likes.hasLiked;
    this.count = likes.count;
  }

  public get Count() { return this.count }
  public get HasLiked() { return this.hasLiked }
}

export interface ICustomerItem extends IBaseItem {
  likes: ICustomerLikes
}

const cloneLike = (like: ICustomerLikes): CustomerLikes => new CustomerLikes(like)

export class CustomerItem implements ICustomerItem {
  readonly _id: string;
  readonly name: string;
  readonly prices: Price[];
  readonly addons: Addon[];
  readonly description?: string;
  readonly flick?: string;
  readonly likes: CustomerLikes;
  readonly optionGroups: OptionGroup[];

  constructor(item: ICustomerItem) {
    this._id = item._id;
    this.name = item.name;
    this.description = item.description;
    this.flick = item.flick;
    this.prices = item.prices.map(clonePrice);
    this.addons = item.addons.map(cloneAddon);
    this.likes = cloneLike(item.likes);
    this.optionGroups = cloneOptionGroups(item.optionGroups);
  }

  public get _Id() { return this._id }
  public get Name() { return this.name }
  public get Addons() { return this.addons }
  public get Prices() { return this.prices }
  public get Description() { return this.description }
  public get Flick() { return this.flick }
  public get Likes() { return this.likes }
  public get OptionGroups() { return this.optionGroups }
}

export const cloneCustomerItem = (item: ICustomerItem): CustomerItem => new CustomerItem(item);

export interface ICustomerCategory extends IBaseCategory {
  items: ICustomerItem[];
}

export class CustomerCategory implements ICustomerCategory {
  readonly name: string;
  readonly description: string;
  readonly items: CustomerItem[];

  constructor(category: ICustomerCategory) {
    this.name = category.name;
    this.description = category.description;
    this.items = category.items.map(cloneCustomerItem);
  }

  public get Name() { return this.name }
  public get Description() { return this.description }
  public get Items() { return this.items }
}