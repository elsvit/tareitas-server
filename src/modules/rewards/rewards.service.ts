import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import { ERewardRedemptionStatus } from '../../types/reward';
import { ERole } from '../../types/user';
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
  ) {}

  listRewards(
    familyId: string,
    includeInactive: boolean,
  ) {
    return this.rewardsRepository
      .findRewardsInFamily(
        familyId,
        !includeInactive,
      )
      .then((rewards) =>
        rewards.map(toReward),
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
    return this.rewardsRepository
      .createReward({
        familyId,
        title: dto.title,
        description: dto.description,
        cost: dto.cost,
        createdByUserId,
      })
      .then(toReward);
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

    const updateData: {
      title?: string;
      description?: string;
      cost?: number;
      isActive?: boolean;
    } = {};

    if (dto.title !== undefined) {
      updateData.title = dto.title;
    }

    if (dto.description !== undefined) {
      updateData.description =
        dto.description;
    }

    if (dto.cost !== undefined) {
      updateData.cost = dto.cost;
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
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
