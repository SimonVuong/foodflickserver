import { IFavoritesBase, IBaseRest, Profile, Location } from "./BaseRestModel";
import { ICustomerCategory, CustomerCategory } from "general/menu/models/CustomerItemModel";

export interface ICustomerFavorite extends IFavoritesBase {
  readonly isFavorite: boolean;
  readonly count: number;
}

export class CustomerFavorite implements ICustomerFavorite {
  readonly isFavorite: boolean;
  readonly count: number;

  constructor(customerFavorite: ICustomerFavorite) {
    this.isFavorite = customerFavorite.isFavorite;
    this.count = customerFavorite.count;
  }

  public get IsFavorite() { return this.isFavorite }
  public get Count() { return this.count }
}

export interface ICustomerRest extends IBaseRest {
  readonly favorites: ICustomerFavorite;
  readonly menu: ICustomerCategory[];
}

export class CustomerRest implements ICustomerRest {
  readonly _id: string;
  readonly profile: Profile;
  readonly location: Location;
  readonly favorites: CustomerFavorite;
  readonly menu: CustomerCategory[];
  readonly url: string;

  constructor(rest: ICustomerRest) {
    this._id = rest._id;
    this.favorites = new CustomerFavorite(rest.favorites);
    this.menu = rest.menu.map(category => new CustomerCategory(category));
    this.profile = new Profile(rest.profile);
    this.location = new Location(rest.location);
    this.url = rest.url;
  }
  public get Address() { return this.location.address }

  public get AddressString() { return `${this.Address.Address1} ${this.Address.City}, ${this.Address.State} ${this.Address.Zip}`}

  public get Description() { return this.Profile.Description }

  public get _Id() { return this._id }

  public get Favorites() { return this.favorites }

  public get Location() { return this.location }

  public get Menu() { return this.menu }
  
  public get Name() { return this.Profile.Name }

  public get Phone() { return this.Profile.Phone }

  public get Profile() { return this.profile }

  public get TagsString() { return this.Profile.Tags.map((tag, index) => `${index === 0 ? '' : ', '}${tag}`) }

  public get Tags() { return this.Profile.Tags }

  public get Url() { return this.url }
}