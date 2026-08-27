import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import { ENotificationType } from '../../types/notification';
import { ERewardRedemptionStatus } from '../../types/reward';
import { ERole } from '../../types/user';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateRewardDto,
  ListRedemptionsQueryDto,
  UpdateRewardDto,
} from './dto/reward.dto';
import {
  toReward,
  toRewardRedemption,
} from './reward.mapper';
import { RewardsRepository } from './rewards.repository';

@Injectable()
export class RewardsService {
  constructor(
    private readonly rewardsRepository: RewardsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  listRewards(
    familyId: string,
    includeInactive: boolean,
    memberRole: ERole,
    memberUserId: string,
  ) {
    return this.rewardsRepository
      .findRewardsInFamily(
        familyId,
        !includeInactive,
      )
      .then(rewards =>
        rewards
          .filter(reward =>
            memberRole !== ERole.child
              ? true
              : reward.childUserIds.length === 0 ||
                reward.childUserIds.includes(memberUserId),
          )
          .map(toReward),
      );
  }

  async getReward(
    familyId: string,
    rewardId: string,
  ) {
    const reward =
      await this.getRewardEntity(
        familyId,
        rewardId,
      );

    return toReward(reward);
  }

  createReward(
    familyId: string,
    createdByUserId: string,
    dto: CreateRewardDto,
  ) {
    return this.validateChildUserIds(
      familyId,
      dto.childUserIds,
    ).then(() =>
      this.rewardsRepository.createReward({
        familyId,
        title: dto.title,
        description: dto.description,
        picture: dto.picture,
        cost: dto.cost,
        createdByUserId,
        childUserIds: dto.childUserIds,
      }),
    ).then(toReward);
  }

  async updateReward(
    familyId: string,
    rewardId: string,
    dto: UpdateRewardDto,
  ) {
    const reward =
      await this.getRewardEntity(
        familyId,
        rewardId,
      );

    if (dto.childUserIds !== undefined) {
      await this.validateChildUserIds(
        familyId,
        dto.childUserIds,
      );
    }

    const updateData: {
      title?: string;
      description?: string;
      picture?: string;
      cost?: number;
      isActive?: boolean;
      childUserIds?: string[];
    } = {};

    if (dto.title !== undefined) {
      updateData.title = dto.title;
    }

    if (dto.description !== undefined) {
      updateData.description =
        dto.description;
    }

    if (dto.picture !== undefined) {
      updateData.picture = dto.picture;
    }

    if (dto.cost !== undefined) {
      updateData.cost = dto.cost;
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    if (dto.childUserIds !== undefined) {
      updateData.childUserIds = dto.childUserIds;
    }

    const updated =
      await this.rewardsRepository.updateReward(
        reward.id,
        updateData,
      );

    return toReward(updated);
  }

  async deleteReward(
    familyId: string,
    rewardId: string,
  ) {
    const reward =
      await this.getRewardEntity(
        familyId,
        rewardId,
      );

    await this.rewardsRepository.deleteReward(
      reward.id,
    );
  }

  listRedemptions(
    familyId: string,
    query: ListRedemptionsQueryDto,
  ) {
    return this.rewardsRepository
      .findRedemptionsInFamily(
        familyId,
        query.childUserId,
      )
      .then((redemptions) =>
        redemptions.map(toRewardRedemption),
      );
  }

  async redeemReward(
    familyId: string,
    rewardId: string,
    childUserId: string,
    userRole: ERole,
  ) {
    if (userRole !== ERole.child) {
      throw new AppException(
        ErrorCode.REWARD_NOT_ALLOWED,
        'Only children can redeem rewards',
        HttpStatus.FORBIDDEN,
      );
    }

    const reward =
      await this.getRewardEntity(
        familyId,
        rewardId,
      );

    if (!reward.isActive) {
      throw new AppException(
        ErrorCode.REWARD_INACTIVE,
        'This reward is no longer available',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      reward.childUserIds.length > 0 &&
      !reward.childUserIds.includes(childUserId)
    ) {
      throw new AppException(
        ErrorCode.REWARD_NOT_ALLOWED,
        'This reward is not assigned to this child',
        HttpStatus.FORBIDDEN,
      );
    }

    const member =
      await this.rewardsRepository.findChildInFamily(
        familyId,
        childUserId,
      );

    if (!member?.user.childProfile) {
      throw new AppException(
        ErrorCode.CHILD_NOT_FOUND,
        'Child not found in this family',
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      member.user.childProfile.reward.lessThan(
        reward.cost,
      )
    ) {
      throw new AppException(
        ErrorCode.REWARD_INSUFFICIENT_BALANCE,
        'Insufficient reward balance',
        HttpStatus.BAD_REQUEST,
      );
    }

    const redemption =
      await this.rewardsRepository.createRedemption(
        {
          familyId,
          rewardId: reward.id,
          childUserId,
          cost: reward.cost.toNumber(),
        },
      );

    await this.notificationsService.notifyParentsSafely(
      familyId,
      {
        type: ENotificationType.reward_redemption_requested,
        title: 'Reward redemption requested',
        body: `"${reward.title}" (${reward.cost.toNumber()} points)`,
        data: {
          redemptionId: redemption.id,
          rewardId: reward.id,
          familyId,
          childUserId,
        },
      },
      childUserId,
    );

    return toRewardRedemption(redemption);
  }

  async approveRedemption(
    familyId: string,
    redemptionId: string,
  ) {
    const redemption =
      await this.getRedemptionEntity(
        familyId,
        redemptionId,
      );

    if (
      redemption.status !==
      ERewardRedemptionStatus.pending
    ) {
      throw new AppException(
        ErrorCode.REWARD_REDEMPTION_INVALID_STATUS,
        'Only pending redemptions can be approved',
        HttpStatus.CONFLICT,
      );
    }

    try {
      const updated =
        await this.rewardsRepository.approveRedemption(
          redemption.id,
        );

      if (!updated) {
        throw new AppException(
          ErrorCode.REWARD_REDEMPTION_NOT_FOUND,
          'Redemption not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const reward =
        await this.getRewardEntity(
          familyId,
          redemption.rewardId,
        );

      await this.notificationsService.notifySafely({
        userId: redemption.childUserId,
        familyId,
        type: ENotificationType.reward_redemption_approved,
        title: 'Reward approved',
        body: `"${reward.title}" was approved`,
        data: {
          redemptionId: redemption.id,
          rewardId: reward.id,
          familyId,
        },
      });

      return toRewardRedemption(updated);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          'INSUFFICIENT_BALANCE'
      ) {
        throw new AppException(
          ErrorCode.REWARD_INSUFFICIENT_BALANCE,
          'Insufficient reward balance',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw error;
    }
  }

  async rejectRedemption(
    familyId: string,
    redemptionId: string,
  ) {
    const redemption =
      await this.getRedemptionEntity(
        familyId,
        redemptionId,
      );

    if (
      redemption.status !==
      ERewardRedemptionStatus.pending
    ) {
      throw new AppException(
        ErrorCode.REWARD_REDEMPTION_INVALID_STATUS,
        'Only pending redemptions can be rejected',
        HttpStatus.CONFLICT,
      );
    }

    const updated =
      await this.rewardsRepository.rejectRedemption(
        redemption.id,
      );

    const reward =
      await this.getRewardEntity(
        familyId,
        redemption.rewardId,
      );

    await this.notificationsService.notifySafely({
      userId: redemption.childUserId,
      familyId,
      type: ENotificationType.reward_redemption_rejected,
      title: 'Reward rejected',
      body: `"${reward.title}" redemption was rejected`,
      data: {
        redemptionId: redemption.id,
        rewardId: reward.id,
        familyId,
      },
    });

    return toRewardRedemption(updated);
  }

  async completeRedemption(
    familyId: string,
    redemptionId: string,
  ) {
    const redemption =
      await this.getRedemptionEntity(
        familyId,
        redemptionId,
      );

    if (
      redemption.status !==
      ERewardRedemptionStatus.approved
    ) {
      throw new AppException(
        ErrorCode.REWARD_REDEMPTION_INVALID_STATUS,
        'Only approved redemptions can be completed',
        HttpStatus.CONFLICT,
      );
    }

    if (redemption.completedAt) {
      return toRewardRedemption(redemption);
    }

    const updated =
      await this.rewardsRepository.completeRedemption(
        redemption.id,
      );

    return toRewardRedemption(updated);
  }

  async getChildBalance(
    familyId: string,
    childUserId: string,
  ) {
    const member =
      await this.rewardsRepository.findChildInFamily(
        familyId,
        childUserId,
      );

    if (!member?.user.childProfile) {
      throw new AppException(
        ErrorCode.CHILD_NOT_FOUND,
        'Child not found in this family',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      childUserId,
      balance:
        member.user.childProfile.reward.toNumber(),
    };
  }

  private async validateChildUserIds(
    familyId: string,
    childUserIds?: string[],
  ) {
    if (!childUserIds?.length) {
      return;
    }

    for (const childUserId of childUserIds) {
      const member =
        await this.rewardsRepository.findChildInFamily(
          familyId,
          childUserId,
        );

      if (!member?.user.childProfile) {
        throw new AppException(
          ErrorCode.CHILD_NOT_FOUND,
          'Child not found in this family',
          HttpStatus.NOT_FOUND,
        );
      }
    }
  }

  private async getRewardEntity(
    familyId: string,
    rewardId: string,
  ) {
    const reward =
      await this.rewardsRepository.findRewardInFamily(
        familyId,
        rewardId,
      );

    if (!reward) {
      throw new AppException(
        ErrorCode.REWARD_NOT_FOUND,
        'Reward not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return reward;
  }

  private async getRedemptionEntity(
    familyId: string,
    redemptionId: string,
  ) {
    const redemption =
      await this.rewardsRepository.findRedemptionInFamily(
        familyId,
        redemptionId,
      );

    if (!redemption) {
      throw new AppException(
        ErrorCode.REWARD_REDEMPTION_NOT_FOUND,
        'Redemption not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return redemption;
  }
}
