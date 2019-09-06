import { CustomerCategory, ICustomerCategory } from 'general/menu/models/CustomerItemModel';
import { CartItem, ICartItem } from "./CartItemModel";

export enum OrderType {
  CARRY_OUT = 'CARRY_OUT',
  SIT_DOWN = 'SIT_DOWN',
}

export interface ICart {
  readonly restId: string,
  readonly restMenu: ICustomerCategory[];
  readonly restName: string;
  readonly items: ICartItem[],
  readonly tableNumber?: string,
  readonly orderType: OrderType;
}

export interface IAllCartFields extends ICart {
  // following are optional because when the cart is first created, there is no phone and cardTok if the user is not
  // signed in. Tip optional since there's no tip for carry-out
  readonly phone?: string;
  readonly cardTok?: string;
  readonly tip?: number;
}

export class Cart implements ICart {
  readonly restId: string;
  readonly restMenu: CustomerCategory[];
  readonly restName: string;
  readonly items: CartItem[];
  readonly tableNumber?: string;
  readonly phone?: string;
  readonly cardTok?: string;
  readonly orderType: OrderType;
  readonly tip?: number;

  constructor(cart: IAllCartFields) {
    this.restId = cart.restId;
    this.restMenu = cart.restMenu.map(category => new CustomerCategory(category));
    this.restName = cart.restName;
    this.items = cart.items.map(item => new CartItem(item));
    this.tableNumber = cart.tableNumber;
    this.phone = cart.phone;
    this.cardTok = cart.cardTok;
    this.orderType = cart.orderType;
    this.tip = cart.tip;
  }

  addItem(item: CartItem) {
    this.Items.push(item);
  }

  removeItem(cartIndex: number) {
    this.Items.splice(cartIndex, 1);
  }

  updateItem(index: number, newItem: CartItem) {
    this.Items[index] = newItem;
  }

  public get RestId() { return this.restId }
  public get RestMenu() { return this.restMenu }
  public get RestName() { return this.restName }
  public get Items() { return this.items }
  public get ItemTotal() { return this.items.reduce((sum, item) => (sum + item.SelectedPrice.Value * item.Quantity), 0) }
  public get TableNumber() { return this.tableNumber }
  public get Phone() { return this.phone }
  public get CardTok() { return this.cardTok }
  public get OrderType() { return this.orderType }
  public get Tip() { return this.tip }
}
