import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

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
    return this.familiesRepository.findMyFamilies(
      userId,
    );
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
      throw new NotFoundException(
        'Family not found',
      );
    }

    return family;
  }

  /**
   * Create a new family.
   *
   * The current user automatically becomes:
   * - role: parent
   * - familyRole: owner
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
      throw new NotFoundException(
        'Family not found',
      );
    }
  
    const membership = family.members.find(
      (member) => member.userId === userId,
    );
  
    if (membership?.familyRole !== 'owner') {
      throw new ForbiddenException(
        'Only the family owner can update the family',
      );
    }
  
    return this.familiesRepository.updateFamily(
      familyId,
      name,
    );
  }
}