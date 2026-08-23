import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class FamiliesRepository {
  constructor(
    private readonly prisma: PrismaService,
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
   * Creates a family and makes the current user
   * its owner.
   */
  createFamily(
    userId: string,
    name: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const family = await tx.family.create({
          data: {
            name,
          },
        });

        await tx.familyMember.create({
          data: {
            familyId: family.id,
            userId,
            role: 'parent',
            familyRole: 'owner',
          },
        });

        return family;
      },
    );
  }

  /**
   * Updates a family.
   */
  updateFamily(
    familyId: string,
    name: string,
  ) {
    return this.prisma.family.update({
      where: { id: familyId },
      data: { name },
    });
  }
}