import {
  ChildProfile,
  Family,
  FamilyMember,
  ParentProfile,
  User,
} from '../../generated/prisma/client';
import { ERole } from '../../types/user';
import {
  requireAdminEmail,
  requireUsername,
} from '../../common/utils/user-credentials';

type FamilyMemberWithUser = FamilyMember & {
  user: User & {
    parentProfile: ParentProfile | null;
    childProfile: ChildProfile | null;
  };
};

type FamilyWithMembers = Family & {
  members: FamilyMemberWithUser[];
};

export function toFamilyResponse(
  family: FamilyWithMembers,
) {
  const parents = family.members
    .filter(
      member =>
        member.role === ERole.admin ||
        member.role === ERole.parent,
    )
    .map(toParentMember);

  const children = family.members
    .filter(member => member.role === ERole.child)
    .map(toChildMember);

  return {
    id: family.id,
    name: family.name,
    parents,
    children,
  };
}

function toParentMember(member: FamilyMemberWithUser) {
  const profile = member.user.parentProfile;
  const isAdmin =
    member.isOwner && member.role === ERole.admin;

  return {
    userId: member.userId,
    name: profile?.name ?? member.user.username ?? member.user.email ?? '',
    color: profile?.color ?? undefined,
    avatar: profile?.avatar ?? undefined,
    role: isAdmin ? ERole.admin : member.role,
    familyRole: member.familyRole ?? undefined,
    isOwner: member.isOwner,
    ...(isAdmin
      ? { email: requireAdminEmail(member.user.email) }
      : { username: requireUsername(member.user.username) }),
  };
}

function toChildMember(member: FamilyMemberWithUser) {
  const profile = member.user.childProfile;

  return {
    userId: member.userId,
    name: profile?.name ?? member.user.username ?? '',
    color: profile?.color ?? undefined,
    avatar: profile?.avatar ?? undefined,
    reward: profile?.reward.toNumber(),
    birthday: profile?.birthday
      ? profile.birthday.toISOString().slice(0, 10)
      : undefined,
    username: requireUsername(member.user.username),
  };
}
