import { IBaseEntity } from './common';
import { EFamilyRole, ERole } from './user';

export interface IInvitation extends IBaseEntity {
  familyId: string;
  invitedEmail: string;
  invitedByUserId: string;

  role: ERole;
  familyRole?: EFamilyRole;

  token: string;

  expiresAt: Date;
  acceptedAt?: Date;
}