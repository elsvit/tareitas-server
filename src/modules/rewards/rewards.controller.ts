import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentFamilyMember } from '../../common/decorators/current-family-member.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { FamilyMemberGuard } from '../../common/guards/family-member.guard';
import { FamilyMember } from '../../generated/prisma/client';
import { ERole } from '../../types/user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload';

import {
  CreateRewardDto,
  ListRedemptionsQueryDto,
  UpdateRewardDto,
} from './dto/reward.dto';
import { RewardsService } from './rewards.service';

@Controller('families/:familyId/rewards')
@UseGuards(JwtAuthGuard, FamilyMemberGuard)
export class RewardsController {
  constructor(
    private readonly rewardsService: RewardsService,
  ) {}

  /**
   * GET /families/:familyId/rewards
   */
  @Get()
  listRewards(
    @CurrentFamilyMember()
    member: FamilyMember,
    @Param('familyId') familyId: string,
  ) {
    const includeInactive =
      member.role === ERole.parent ||
      member.role === ERole.admin;

    return this.rewardsService.listRewards(
      familyId,
      includeInactive,
    );
  }

  /**
   * POST /families/:familyId/rewards
   */
  @Post()
  @RequireRole(ERole.admin, ERole.parent)
  createReward(
    @CurrentUser() user: JwtPayload,
    @Param('familyId') familyId: string,
    @Body() dto: CreateRewardDto,
  ) {
    return this.rewardsService.createReward(
      familyId,
      user.sub,
      dto,
    );
  }

  /**
   * GET /families/:familyId/rewards/redemptions
   */
  @Get('redemptions')
  listRedemptions(
    @Param('familyId') familyId: string,
    @Query() query: ListRedemptionsQueryDto,
  ) {
    return this.rewardsService.listRedemptions(
      familyId,
      query,
    );
  }

  /**
   * POST /families/:familyId/rewards/redemptions/:redemptionId/approve
   */
  @Post('redemptions/:redemptionId/approve')
  @RequireRole(ERole.admin, ERole.parent)
  approveRedemption(
    @Param('familyId') familyId: string,
    @Param('redemptionId')
    redemptionId: string,
  ) {
    return this.rewardsService.approveRedemption(
      familyId,
      redemptionId,
    );
  }

  /**
   * POST /families/:familyId/rewards/redemptions/:redemptionId/reject
   */
  @Post('redemptions/:redemptionId/reject')
  @RequireRole(ERole.admin, ERole.parent)
  rejectRedemption(
    @Param('familyId') familyId: string,
    @Param('redemptionId')
    redemptionId: string,
  ) {
    return this.rewardsService.rejectRedemption(
      familyId,
      redemptionId,
    );
  }

  /**
   * GET /families/:familyId/rewards/balance/:childUserId
   */
  @Get('balance/:childUserId')
  getChildBalance(
    @Param('familyId') familyId: string,
    @Param('childUserId') childUserId: string,
  ) {
    return this.rewardsService.getChildBalance(
      familyId,
      childUserId,
    );
  }

  /**
   * GET /families/:familyId/rewards/:rewardId
   */
  @Get(':rewardId')
  getReward(
    @Param('familyId') familyId: string,
    @Param('rewardId') rewardId: string,
  ) {
    return this.rewardsService.getReward(
      familyId,
      rewardId,
    );
  }

  /**
   * PATCH /families/:familyId/rewards/:rewardId
   */
  @Patch(':rewardId')
  @RequireRole(ERole.admin, ERole.parent)
  updateReward(
    @Param('familyId') familyId: string,
    @Param('rewardId') rewardId: string,
    @Body() dto: UpdateRewardDto,
  ) {
    return this.rewardsService.updateReward(
      familyId,
      rewardId,
      dto,
    );
  }

  /**
   * DELETE /families/:familyId/rewards/:rewardId
   */
  @Delete(':rewardId')
  @RequireRole(ERole.admin, ERole.parent)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteReward(
    @Param('familyId') familyId: string,
    @Param('rewardId') rewardId: string,
  ) {
    return this.rewardsService.deleteReward(
      familyId,
      rewardId,
    );
  }

  /**
   * POST /families/:familyId/rewards/:rewardId/redeem
   */
  @Post(':rewardId/redeem')
  redeemReward(
    @CurrentUser() user: JwtPayload,
    @CurrentFamilyMember()
    member: FamilyMember,
    @Param('familyId') familyId: string,
    @Param('rewardId') rewardId: string,
  ) {
    return this.rewardsService.redeemReward(
      familyId,
      rewardId,
      user.sub,
      member.role as ERole,
    );
  }
}
