export interface ICard {
  readonly cardTok: string,
  readonly last4: string,
  readonly expMonth: number
  readonly expYear: number,
}

export class Card implements ICard {
  readonly cardTok: string;
  readonly last4: string;
  readonly expMonth: number;
  readonly expYear: number;

  public constructor({
    cardTok,
    last4,
    expMonth,
    expYear,
  }: ICard) {
    this.cardTok = cardTok;
    this.last4 = last4;
    this.expMonth = expMonth;
    this.expYear = expYear;
  }

  public get CardTok() { return this.cardTok };
  public get HiddenString() { return `**** ${this.Last4}`}
  public get Last4() { return this.last4 };
  public get ExpMonth() { return this.expMonth };
  public get ExpYear() { return this.expYear };
}
