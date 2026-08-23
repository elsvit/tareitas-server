import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import { ParentProfileInputDto } from '../parent-profiles/dto/parent-profile-input.dto';
import { FamiliesRepository } from './families.repository';

@Injectable()
export class FamiliesService {
  constructor(
    private readonly familiesRepository: FamiliesRepository,
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

    return family;
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
}