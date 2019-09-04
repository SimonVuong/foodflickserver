import { ICard, Card } from "general/card/CardModel";

export interface IJwt {
  readonly token: string,
  readonly type: 'Bearer',
}

export class Jwt implements IJwt {
  readonly token: string;
  readonly type = 'Bearer';

  public constructor({
    token,
    type,
  }: IJwt) {
    this.token = token;
  }

  public get Token() { return this.token };
  public get Type() { return this.type };
  public get HeaderString() { return `${this.type} ${this.token}` }
}

export interface ISignedInUser {
  accessToken: IJwt,
  card?: ICard,
  email: string,
  firstName: string,
  lastName: string,
  perms: 'write:rests' | null,
  phone: string,
  _id: string,
}

export class SignedInUser implements ISignedInUser {
  readonly accessToken: Jwt;
  readonly card?: Card;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly perms: 'write:rests' | null;
  readonly phone: string;
  readonly _id: string;

  public constructor({
    accessToken,
    card,
    email,
    firstName,
    lastName,
    perms,
    phone,
    _id,
  }: ISignedInUser) {
    this.accessToken = new Jwt(accessToken);
    this.card = card ? new Card(card) : undefined;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.perms = perms;
    this._id = _id;
  }

  public get AccessToken() { return this.accessToken };
  public get Card() { return this.card };
  public get Email() { return this.email }
  public get FirstName() { return this.firstName };
  public get ListName() { return this.lastName };
  public get FullName() { return this.firstName + ' ' + this.lastName }
  public get Perms() { return this.perms };
  public get Phone() { return this.phone };
  public get _Id() { return this._id }
}