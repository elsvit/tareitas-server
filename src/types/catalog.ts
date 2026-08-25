export enum ECatalogItemSource {
  bundled = 'bundled',
  custom = 'custom',
}

export interface ISubtask {
  value: string;
  label: string;
}

export interface ITaskBase {
  id: string;
  name: string;
  description?: string;
  reward?: number;
  picture?: string;
  time?: string;
  color?: string;
  subtasks?: ISubtask[];
  isHidden?: boolean;
  source?: ECatalogItemSource;
  createdAt?: string;
  updatedAt?: string;
}

export interface IRewardBase {
  id: string;
  title: string;
  reward: number;
  picture?: string;
  isHidden?: boolean;
  source?: ECatalogItemSource;
  createdAt?: string;
  updatedAt?: string;
}

export interface IFamilyCatalogMeta {
  taskBaseRevision: number;
  rewardBaseRevision: number;
  bundledTaskCatalogVersion: number;
  bundledRewardCatalogVersion: number;
}

export interface IFamilyCatalog extends IFamilyCatalogMeta {
  taskBase: ITaskBase[];
  rewardBase: IRewardBase[];
}
