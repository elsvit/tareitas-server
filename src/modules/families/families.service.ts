import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
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
   * Get one family.
   *
   * The repository only returns the family if
   * the current user is a member of it.
   */
  async getFamily(
    userId: string,
    familyId: string,
  ) {
    const family =
      await this.familiesRepository.findFamilyForUser(
        userId,
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
  ) {
    return this.familiesRepository.createFamily(
      userId,
      name,
    );
  }

  /**
   * Update a family.
   *
   * Only the family owner can update it.
   */
  async updateFamily(
    userId: string,
    familyId: string,
    name: string,
  ) {
    const family =
      await this.familiesRepository.findFamilyForUser(
        userId,
        familyId,
      );

    if (!family) {
      throw new AppException(
        ErrorCode.FAMILY_NOT_FOUND,
        'Family not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const membership = family.members.find(
      (member) => member.userId === userId,
    );

    if (!membership?.isOwner) {
      throw new AppException(
        ErrorCode.FORBIDDEN,
        'Only the family owner can update the family',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.familiesRepository.updateFamily(
      familyId,
      name,
    );
  }
}