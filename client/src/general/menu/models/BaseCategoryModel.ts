import { IBaseItem } from './BaseItemModel';

export interface IBaseCategory {
  name: string;
  description: string;
  items: IBaseItem[];
}

