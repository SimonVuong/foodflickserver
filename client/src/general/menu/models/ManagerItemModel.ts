import { ItemPrinter, IBaseItem } from './BaseItemModel';

export interface ICustomerItem extends IBaseItem {
  // todo: foodflickexpo missing this. but this is necessary. premptively put this here so we dont forget. still need
  // to fill the rest of this ou
  printers: ItemPrinter[] 
}