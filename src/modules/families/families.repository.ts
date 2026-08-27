import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../db/prisma.service';
import { ERole } from '../../types/user';
import { ParentProfileInputDto } from '../parent-profiles/dto/parent-profile-input.dto';
import { ParentProfilesService } from '../parent-profiles/parent-profiles.service';

@Injectable()
export class FamiliesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parentProfilesService: ParentProfilesService,
  ) {}

  /**
   * Returns all families where the user is a member.
   */
  findMyFamilies(userId: string) {
    return this.prisma.familyMember.findMany({
      where: {
        userId,
      },
      include: {
        family: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Returns a family by id with members and profiles.
   */
  findFamilyById(familyId: string) {
    return this.prisma.family.findUnique({
      where: {
        id: familyId,
      },
      include: {
        members: {
          include: {
            user: {
              include: {
                parentProfile: true,
                childProfile: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  /**
   * Returns a family only when the user belongs to it.
   */
  findFamilyForUser(
    userId: string,
    familyId: string,
  ) {
    return this.prisma.family.findFirst({
      where: {
        id: familyId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              include: {
                parentProfile: true,
                childProfile: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  /**
   * Creates a family and makes the current user its owner.
   */
  async createFamily(
    userId: string,
    name: string,
    parentProfile?: ParentProfileInputDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const family = await tx.family.create({
        data: {
          name,
        },
      });

      await tx.familyMember.create({
        data: {
          familyId: family.id,
          userId,
          role: ERole.admin,
          familyRole: null,
          isOwner: true,
        },
      });

      await this.parentProfilesService.ensureParentProfile(
        userId,
        parentProfile,
        tx,
      );

      return family;
    });
  }

  /**
   * Updates a family.
   */
  updateFamily(
    familyId: string,
    name: string,
  ) {
    return this.prisma.family.update({
      where: {
        id: familyId,
      },
      data: {
        name,
      },
    });
  }

  getEarnedRewardPeriods(familyId: string) {
    return this.prisma.family.findUnique({
      where: { id: familyId },
      select: { earnedRewardPeriods: true },
    });
  }

  updateEarnedRewardPeriods(
    familyId: string,
    periods: unknown,
  ) {
    return this.prisma.family.update({
      where: { id: familyId },
      data: {
        earnedRewardPeriods: periods as object,
      },
      select: { earnedRewardPeriods: true },
    });
  }
}