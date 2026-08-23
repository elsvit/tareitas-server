import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../db/prisma.service';
import { ERewardRedemptionStatus } from '../../types/reward';
import { ERole } from '../../types/user';

@Injectable()
export class RewardsRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findChildInFamily(
    familyId: string,
    userId: string,
  ) {
    return this.prisma.familyMember.findFirst({
      where: {
        familyId,
        userId,
        role: ERole.child,
      },
      include: {
        user: {
          include: {
            childProfile: true,
          },
        },
      },
    });
  }

  findRewardInFamily(
    familyId: string,
    rewardId: string,
  ) {
    return this.prisma.reward.findFirst({
      where: {
        id: rewardId,
        familyId,
      },
    });
  }

  findRewardsInFamily(
    familyId: string,
    activeOnly: boolean,
  ) {
    return this.prisma.reward.findMany({
      where: {
        familyId,
        ...(activeOnly
          ? { isActive: true }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  createReward(data: {
    familyId: string;
    title: string;
    description?: string;
    cost: number;
    createdByUserId: string;
  }) {
    return this.prisma.reward.create({
      data: {
        familyId: data.familyId,
        title: data.title,
        description: data.description,
        cost: data.cost,
        createdByUserId:
          data.createdByUserId,
      },
    });
  }

  updateReward(
    rewardId: string,
    data: {
      title?: string;
      description?: string;
      cost?: number;
      isActive?: boolean;
    },
  ) {
    return this.prisma.reward.update({
      where: { id: rewardId },
      data,
    });
  }

  deleteReward(rewardId: string) {
    return this.prisma.reward.delete({
      where: { id: rewardId },
    });
  }

  findRedemptionInFamily(
    familyId: string,
    redemptionId: string,
  ) {
    return this.prisma.rewardRedemption.findFirst({
      where: {
        id: redemptionId,
        familyId,
      },
    });
  }

  findRedemptionsInFamily(
    familyId: string,
    childUserId?: string,
  ) {
    return this.prisma.rewardRedemption.findMany({
      where: {
        familyId,
        childUserId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  createRedemption(data: {
    familyId: string;
    rewardId: string;
    childUserId: string;
    cost: number;
  }) {
    return this.prisma.rewardRedemption.create({
      data: {
        familyId: data.familyId,
        rewardId: data.rewardId,
        childUserId: data.childUserId,
        cost: data.cost,
        status: ERewardRedemptionStatus.pending,
      },
    });
  }

  approveRedemption(redemptionId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const redemption =
          await tx.rewardRedemption.findUnique({
            where: { id: redemptionId },
          });

        if (!redemption) {
          return null;
        }

        const childProfile =
          await tx.childProfile.findUnique({
            where: {
              userId:
                redemption.childUserId,
            },
          });

        if (!childProfile) {
          return null;
        }

        if (
          childProfile.reward.lessThan(
            redemption.cost,
          )
        ) {
          throw new Error(
            'INSUFFICIENT_BALANCE',
          );
        }

        await tx.childProfile.update({
          where: {
            userId:
              redemption.childUserId,
          },
          data: {
            reward: {
              decrement: redemption.cost,
            },
          },
        });

        return tx.rewardRedemption.update({
          where: { id: redemptionId },
          data: {
            status:
              ERewardRedemptionStatus.approved,
            approvedAt: new Date(),
          },
        });
      },
    );
  }

  rejectRedemption(redemptionId: string) {
    return this.prisma.rewardRedemption.update({
      where: { id: redemptionId },
      data: {
        status:
          ERewardRedemptionStatus.rejected,
        rejectedAt: new Date(),
      },
    });
  }

  getChildBalance(childUserId: string) {
    return this.prisma.childProfile.findUnique({
      where: { userId: childUserId },
      select: { reward: true },
    });
  }
}
