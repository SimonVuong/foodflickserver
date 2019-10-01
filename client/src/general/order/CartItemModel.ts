import { Cart } from 'general/order/CartModel';
import { CustomerItem } from 'general/menu/models/CustomerItemModel';
import { ICustomerItem, cloneCustomerItem } from 'general/menu/models/CustomerItemModel';
import { Price, Option, IPrice, IOption, clonePrice, cloneOption, IAddon, Addon, cloneAddon } from "general/menu/models/BaseItemModel";

export interface ICartItem {
  readonly name: string;
  readonly flick?: string;
  readonly itemId: string;
  readonly selectedPrice: IPrice;
  readonly selectedOptions: IOption[];
  readonly selectedAddons: IAddon[];
  readonly quantity: number;
  readonly specialRequests?: string;
}

export const getNewCartItem = (
  customerItem: ICustomerItem,
  selectedPrice: Price,
  selectedOptions: IOption[],
  selectedAddons: Addon[],
  quantity: number,
  specialRequests?: string): CartItem => {
  const item  = cloneCustomerItem(customerItem);
  return new CartItem({
    name: item.Name,
    flick: item.Flick,
    itemId: item._Id,
    selectedPrice: selectedPrice || item.Prices[0],
    selectedOptions: selectedOptions || [],
    selectedAddons: selectedAddons || [],
    quantity: quantity,
    specialRequests: specialRequests,
  })
}

export const cloneCartItem = (item: ICartItem): CartItem => {
  const newSelectedPrice = clonePrice(item.selectedPrice);
  const newSelectedAddons = item.selectedAddons.map(cloneAddon);
  // or should this be null?
  const newSelectedOptions = item.selectedOptions.map(cloneOption);
  return new CartItem({
    name: item.name, 
    flick: item.flick,
    itemId: item.itemId,
    selectedPrice: newSelectedPrice,
    selectedOptions: newSelectedOptions,
    selectedAddons: newSelectedAddons,
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
  readonly selectedAddons: Addon[];
  readonly quantity: number;
  readonly specialRequests?: string;

  constructor(cartItem: ICartItem) {
    this.name = cartItem.name;
    this.flick = cartItem.flick;
    this.itemId = cartItem.itemId;
    this.selectedPrice = new Price(cartItem.selectedPrice);
    this.selectedOptions = cartItem.selectedOptions.map(cloneOption);
    this.selectedAddons = cartItem.selectedAddons.map(cloneAddon)
    this.quantity = cartItem.quantity;
    this.specialRequests = cartItem.specialRequests;
  }

  public get Name() { return this.name }

  public get Flick() { return this.flick }

  public get ItemId() { return this.itemId }

  public get SelectedAddons() { return this.selectedAddons }

  public get SelectedAddonsTotal() {
    return this.selectedAddons.reduce((sum, addon) => (sum + addon.Value), 0);
  }

  public get SelectedPrice () { return this.selectedPrice }

  public get SelectedOptions () { return this.selectedOptions }

  public get Quantity () { return this.quantity }

  public get SpecialRequests () { return this.specialRequests }
}
