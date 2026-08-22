import { IBaseEntity } from "./common";

export enum ERole {
  admin = 'admin',
  parent = 'parent',
  child = 'child',
}

export enum EFamilyRole {
  aunt = 'aunt',
  brother = 'brother',
  father = 'father',
  grandfather = 'grandfather',
  grandmother = 'grandmother',
  mother = 'mother',
  nanny = 'nanny',
  reviewee = 'reviewee',
  reviewer = 'reviewer',
  sister = 'sister',
  uncle = 'uncle',
  other = 'other',
}

export interface IUser extends IBaseEntity {
  login?: string;
  email?: string;
  passwordHash: string;
}