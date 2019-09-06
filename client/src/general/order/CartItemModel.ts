import { Cart } from 'general/order/CartModel';
import { CustomerItem } from 'general/menu/models/CustomerItemModel';
import { ICustomerItem, cloneCustomerItem } from 'general/menu/models/CustomerItemModel';
import { Price, Option, IPrice, IOption, clonePrice, cloneOption } from "general/menu/models/BaseItemModel";

export interface ICartItem {
  readonly name: string;
  readonly flick?: string;
  readonly itemId: string;
  readonly selectedPrice: IPrice;
  readonly selectedOptions: IOption[];
  readonly quantity: number;
  readonly specialRequests?: string;
}

export const getNewCartItem = (
  customerItem: ICustomerItem,
  selectedPrice: Price,
  selectedOptions: IOption[],
  quantity: number,
  specialRequests?: string): CartItem => {
  const item  = cloneCustomerItem(customerItem);
  return new CartItem({
    name: item.Name,
    flick: item.Flick,
    itemId: item._Id,
    selectedPrice: selectedPrice || item.Prices[0],
    selectedOptions: selectedOptions || [],
    quantity: quantity,
    specialRequests: specialRequests,
  })
}

export const cloneCartItem = (item: ICartItem): CartItem => {
  const newSelectedPrice = clonePrice(item.selectedPrice);
  // or should this be null?
  const newSelectedOptions = item.selectedOptions.map(cloneOption);
  return new CartItem({
    name: item.name, 
    flick: item.flick,
    itemId: item.itemId,
    selectedPrice: newSelectedPrice,
    selectedOptions: newSelectedOptions,
    quantity: item.quantity,
    specialRequests: item.specialRequests,
  });
}

export const getCustomerItemFromCartItem = (cart: Cart, cartItem: CartItem): CustomerItem => {
  for (const category of cart.RestMenu) {
    for (const item of category.Items) {
      if (cartItem.ItemId === item._Id) return item;
    }
  }
  return null as never;
}

export class CartItem implements ICartItem {
  readonly name: string;
  readonly flick?: string;
  readonly itemId: string;
  readonly selectedPrice: Price;
  readonly selectedOptions: Option[];
  readonly quantity: number;
  readonly specialRequests?: string;

  constructor(cartItem: ICartItem) {
    this.name = cartItem.name;
    this.flick = cartItem.flick;
    this.itemId = cartItem.itemId;
    this.selectedPrice = new Price(cartItem.selectedPrice);
    this.selectedOptions = cartItem.selectedOptions.map(cloneOption);
    this.quantity = cartItem.quantity;
    this.specialRequests = cartItem.specialRequests;
  }

  public get Name() { return this.name }

  public get Flick() { return this.flick }

  public get ItemId() { return this.itemId }

  public get SelectedPrice () { return this.selectedPrice }

  public get SelectedOptions () { return this.selectedOptions }

  public get Quantity () { return this.quantity }

  public get SpecialRequests () { return this.specialRequests }
}
