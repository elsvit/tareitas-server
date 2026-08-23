import { ChildProfile } from '../../generated/prisma/client';
import { IChild } from '../../types/child';

export function toChild(
  profile: ChildProfile,
): IChild {
  return {
    userId: profile.userId,
    name: profile.name,
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
