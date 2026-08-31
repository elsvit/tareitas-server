import { ERole } from './user';

export interface IParent {
  userId: string;
  name: string;
  username: string;
  color?: string;
  avatar?: string;
  familyRole?: string;
  role: ERole.admin | ERole.parent;
}
