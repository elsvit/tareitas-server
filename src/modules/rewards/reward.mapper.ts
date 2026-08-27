import {
  Reward,
  RewardRedemption,
} from '../../generated/prisma/client';
import {
  ERewardRedemptionStatus,
  IReward,
  IRewardRedemption,
} from '../../types/reward';

export function toReward(
  reward: Reward,
): IReward {
  return {
    id: reward.id,
    familyId: reward.familyId,
    title: reward.title,
    description:
      reward.description ?? undefined,
    picture: reward.picture ?? undefined,
    cost: reward.cost.toNumber(),
    isActive: reward.isActive,
    childUserIds: reward.childUserIds,
    createdByUserId:
      reward.createdByUserId,
    createdAt:
      reward.createdAt.toISOString(),
    updatedAt:
      reward.updatedAt.toISOString(),
  };
}

export function toRewardRedemption(
  redemption: RewardRedemption,
): IRewardRedemption {
  return {
    id: redemption.id,
    familyId: redemption.familyId,
    rewardId: redemption.rewardId,
    childUserId: redemption.childUserId,
    cost: redemption.cost.toNumber(),
    status:
      redemption.status as ERewardRedemptionStatus,
    createdAt:
      redemption.createdAt.toISOString(),
    approvedAt:
      redemption.approvedAt?.toISOString(),
    rejectedAt:
      redemption.rejectedAt?.toISOString(),
    completedAt:
      redemption.completedAt?.toISOString(),
  };
}
