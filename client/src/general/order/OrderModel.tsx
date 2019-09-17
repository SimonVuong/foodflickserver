import { Card, ICard } from "general/card/CardModel";
import { ICartItem, CartItem } from "./CartItemModel";
import { round2 } from "general/utils/math";

export enum OrderType {
  CARRY_OUT = 'CARRY_OUT',
  SIT_DOWN = 'SIT_DOWN',
}

export enum OrderStatus {
  COMPLETED = 'COMPLETED',
  OPEN = 'OPEN',
  RETURNED = 'RETURNED',
}

export interface IOrderCosts {
  readonly itemTotal: number;
  readonly tax: number;
  readonly tip: number;
  readonly percentFee: number; // ex: 2.9 = 2.9 percent
  readonly flatRateFee: number; // ex: 0.30 = 30 cents
}

export class OrderCosts implements IOrderCosts {
  readonly itemTotal: number;
  readonly tax: number;
  readonly tip: number;
  readonly percentFee: number;
  readonly flatRateFee: number;

  constructor({
    itemTotal,
    tax,
    tip,
    percentFee,
    flatRateFee
  }: IOrderCosts) {
    this.itemTotal = itemTotal;
    this.tax = tax;
    this.tip = tip;
    this.percentFee = percentFee;
    this.flatRateFee = flatRateFee;
  }

  public get ItemTotal() { return this.itemTotal }
  public get Tax() { return this.tax }
  public get Tip() { return this.tip }
  public get PercentFee() { return this.percentFee }
  public get FlatRateFee() { return this.flatRateFee }
  public get Total() { return round2(this.itemTotal + this.tax + this.tip) }
}

export interface IRefund {
  readonly stripeRefundId: string,
  readonly amount: number,
}

export class Refund implements IRefund {
  readonly stripeRefundId: string
  readonly amount: number

  constructor({ stripeRefundId, amount }: IRefund) {
    this.stripeRefundId = stripeRefundId;
    this.amount = amount;
  }

  public get StripeRefundId() { return this.stripeRefundId }
  public get Amount() { return this.amount }
}

export interface IOrder {
  readonly _id: string
  readonly restId: string
  readonly restName: string
  readonly status: OrderStatus
  readonly orderType: OrderType
  readonly stripeChargeId: string
  readonly tableNumber?: string
  readonly phone: string
  readonly card: ICard
  readonly cartUpdatedDate: number
  readonly items: ICartItem[]
  readonly costs: IOrderCosts
  readonly customRefunds: IRefund[]
}

export class Order implements IOrder {
  readonly _id: string
  readonly restId: string
  readonly restName: string
  readonly status: OrderStatus
  readonly orderType: OrderType
  readonly stripeChargeId: string
  readonly tableNumber?: string
  readonly phone: string
  readonly card: Card
  readonly cartUpdatedDate: number
  readonly items: CartItem[]
  readonly costs: OrderCosts
  readonly customRefunds: Refund[]
  
  constructor({
    _id,
    restId,
    restName,
    status,
    stripeChargeId,
    tableNumber,
    phone,
    card,
    cartUpdatedDate,
    items,
    costs,
    customRefunds,
    orderType
  }: IOrder) {
    this._id = _id;
    this.restId = restId;
    this.restName = restName
    this.status = status
    this.stripeChargeId = stripeChargeId
    this.tableNumber = tableNumber
    this.phone = phone
    this.card = new Card(card)
    this.cartUpdatedDate = cartUpdatedDate
    this.items = items.map(item => new CartItem(item));
    this.costs = new OrderCosts(costs);
    this.customRefunds = customRefunds.map(refund => new Refund(refund));
    this.orderType = orderType;
  }

  public get _Id() { return this._id }
  public get RestId() { return this.restId }
  public get RestName() { return this.restName }
  public get Status() { return this.status }
  public get StripeChargeId() { return this.stripeChargeId }
  public get TableNumber() { return this.tableNumber }
  public get Phone() { return this.phone }
  public get Card() { return this.card }
  public get CartUpdatedDate() { return this.cartUpdatedDate }
  public get Items() { return this.items }
  public get Costs() { return this.costs }
  public get CustomRefunds() { return this.customRefunds }
  public get OrderType() { return this.orderType }
}