import { ParentProfile } from '../../generated/prisma/client';
import { requireUsername } from '../../common/utils/user-credentials';
import { IParent } from '../../types/parent';
import { ERole } from '../../types/user';

export function toParent(
  profile: ParentProfile,
  username: string | null | undefined,
  member: {
    role: string;
    familyRole: string | null;
    isOwner: boolean;
  },
): IParent {
  const role =
    member.isOwner && member.role === ERole.admin
      ? ERole.admin
      : ERole.parent;

  return {
    userId: profile.userId,
    name: profile.name,
    username: requireUsername(username),
    color: profile.color ?? undefined,
    avatar: profile.avatar ?? undefined,
    familyRole: member.familyRole ?? undefined,
    role,
  };
}
