import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import { ParentProfileInputDto } from '../parent-profiles/dto/parent-profile-input.dto';
import { toFamilyResponse } from './family.mapper';
import { FamiliesRepository } from './families.repository';
import { parseEarnedRewardPeriods } from './earned-reward-period.mapper';
import { findNewlyApprovedPeriods } from './earned-reward-period.utils';
import { PutEarnedRewardPeriodsDto } from './dto/earned-reward-periods.dto';
import { PeriodMediaCleanupService } from './period-media-cleanup.service';

@Injectable()
export class FamiliesService {
  constructor(
    private readonly familiesRepository: FamiliesRepository,
    private readonly periodMediaCleanupService: PeriodMediaCleanupService,
  ) {}

  /**
   * Get all families the current user belongs to.
   */
  getMyFamilies(userId: string) {
    return this.familiesRepository.findMyFamilies(userId);
  }

  /**
   * Get one family by id.
   *
   * Caller must verify family membership first.
   */
  async getFamily(familyId: string) {
    const family =
      await this.familiesRepository.findFamilyById(
        familyId,
      );

    if (!family) {
      throw new AppException(
        ErrorCode.FAMILY_NOT_FOUND,
        'Family not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return toFamilyResponse(family);
  }

  /**
   * Create a new family.
   *
   * The current user automatically becomes:
   * - role: parent
   * - isOwner: true
   */
  createFamily(
    userId: string,
    name: string,
    parentProfile?: ParentProfileInputDto,
  ) {
    return this.familiesRepository.createFamily(
      userId,
      name,
      parentProfile,
    );
  }

  /**
   * Update a family.
   *
   * Caller must verify family ownership first.
   */
  updateFamily(
    familyId: string,
    name: string,
  ) {
    return this.familiesRepository.updateFamily(
      familyId,
      name,
    );
  }

  async getEarnedRewardPeriods(familyId: string) {
    const family =
      await this.familiesRepository.getEarnedRewardPeriods(
        familyId,
      );

    if (!family) {
      throw new AppException(
        ErrorCode.FAMILY_NOT_FOUND,
        'Family not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      periods: parseEarnedRewardPeriods(
        family.earnedRewardPeriods,
      ),
    };
  }

  async putEarnedRewardPeriods(
    familyId: string,
    dto: PutEarnedRewardPeriodsDto,
  ) {
    const existingFamily =
      await this.familiesRepository.getEarnedRewardPeriods(
        familyId,
      );

    if (!existingFamily) {
      throw new AppException(
        ErrorCode.FAMILY_NOT_FOUND,
        'Family not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const previousPeriods = parseEarnedRewardPeriods(
      existingFamily.earnedRewardPeriods,
    );
    const nextPeriods = parseEarnedRewardPeriods(
      dto.periods,
    );
    const newlyApproved = findNewlyApprovedPeriods(
      previousPeriods,
      nextPeriods,
    );

    const family =
      await this.familiesRepository.updateEarnedRewardPeriods(
        familyId,
        dto.periods,
      );

    if (newlyApproved.length > 0) {
      await this.periodMediaCleanupService.cleanupForNewlyApprovedPeriods(
        familyId,
        newlyApproved,
      );
    }

    return {
      periods: parseEarnedRewardPeriods(
        family.earnedRewardPeriods,
      ),
    };
  }
}