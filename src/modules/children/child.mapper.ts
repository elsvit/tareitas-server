import { ChildProfile } from '../../generated/prisma/client';
import { requireUsername } from '../../common/utils/user-credentials';
import { IChild } from '../../types/child';

export function toChild(
  profile: ChildProfile,
  username: string | null | undefined,
): IChild {
  return {
    userId: profile.userId,
    name: profile.name,
    username: requireUsername(username),
    color: profile.color ?? undefined,
    avatar: profile.avatar ?? undefined,
    reward: profile.reward.toNumber(),
    birthday: profile.birthday
      ? profile.birthday
          .toISOString()
          .slice(0, 10)
      : undefined,
  };
}
