import { ERole } from "./user";

export interface IFamilyMember {
  userId: string;
  familyId: string;
  role: ERole;
  familyRole?: string;
}