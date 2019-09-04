import { Printer } from 'general/printer/BasePrinterModel';

export interface IBaseItem {
  _id: string;
  name: string;
  prices: IPrice[];
  description?: string;
  flick?: string;
  likes: IBaseLikes;
  optionGroups: IOptionGroup[];
}

export interface IBaseLikes {
  count: number;
}

export interface IPrice {
  value: number
  label?: string
};

export class Price implements IPrice{
  readonly value: number
  readonly label?: string

  constructor(price: IPrice) {
    this.value = price.value;
    this.label = price.label;
  }

  public get Label() { return this.label }
  public get Value() { return this.value }
  public get valueLabelString() {
    return `${this.Value}${this.Label ? ' ' + this.Label : ''}`;
  }

  public isEqual(price: Price) {
    if (this.value === price.Value && this.label === price.Label) return true;
    return false;
  }
}

export const clonePrice = (price: IPrice): Price => new Price(price);

export interface IOption {
  name: string
  price?: number
};

export class Option implements IOption {
  readonly name: string;
  readonly price?: number;

  constructor(option: IOption) {
    this.name = option.name;
    this.price = option.price;
  }

  public get Name() { return this.name }
  public get Price() { return this.price }
  public isEqual(option: Option) {
    if (this.name === option.Name && this.price === option.Price) return true;
    return false;
  }
}

export const cloneOption = (option: IOption): Option => new Option(option)

export interface IOptionGroup {
  options: IOption[],
}

export class OptionGroup implements IOptionGroup {
  readonly options: Option[];

  constructor(optionGroup: IOptionGroup) {
    this.options = optionGroup.options.map(option => new Option(option));
  }

  public get Options() { return this.options }
}

export const cloneOptionGroups = (optionGroups: IOptionGroup[]): OptionGroup[] =>
  optionGroups.map((optionGroup) => new OptionGroup(optionGroup));

export interface ItemPrinter extends Printer{
}
