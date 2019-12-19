import { IAddress } from './BaseRestModel';
import { IBaseCategory } from 'general/menu/models/BaseCategoryModel';
import { Tag } from 'general/tag/TagModel';

export interface IFavoritesBase {
  count: number;
}

export interface IProfile {
  name: string;
  phone: string;
  description: string;
  tags: Tag['name'][];
}

export class Profile implements IProfile {
  readonly name: string;
  readonly phone: string;
  readonly description: string;
  readonly tags: Tag['name'][];

  constructor({
    name,
    phone,
    description,
    tags,
  }: IProfile) {
    this.name = name
    this.phone = phone
    this.description = description
    this.tags = tags.map(tag => tag);
  }
  public get Name() { return  this.name }
  public get Phone() { return this.phone }
  public get Description() { return this.description }
  public get Tags() { return this.tags }
}

export interface IAddress {
  readonly address1: string;
  readonly address2?: string;
  readonly city: string;
  readonly state: string; // todo 0: change to states enum
  readonly zip: string;
}

export class Address implements IAddress {
  readonly address1: string;
  readonly address2?: string;
  readonly city: string;
  readonly state: string;
  readonly zip: string;

  constructor({
    address1,
    city,
    state,
    zip,
    address2
  }: IAddress) {
    this.address1 = address1;
    this.city = city;
    this.state = state;
    this.zip = zip;
    this.address2 = address2;
  }

  public get Address1() { return this.address1 }
  public get City() { return this.city }
  public get State() { return this.state }
  public get Zip() { return this.zip }
  public get Address2() { return this.address2 }
}
export interface ILocation {
  address: IAddress;
}

export class Location implements ILocation {
  address: Address;

  constructor(location: ILocation) {
    this.address = new Address(location.address);
  }

  public get Address() { return this.address }
}

export interface ITable {
  _id: string;
}

export class Table implements ITable {
  _id: string

  constructor({
    _id,
  }: ITable) {
    this._id = _id;
  }

  public get _Id() { return this._id }
}

export interface IBaseRest {
  _id: string;
  favorites: IFavoritesBase;
  profile: IProfile;
  location: ILocation;
  menu: IBaseCategory[];
  tables: ITable[];
  taxRate: number;
  url: string;
};
