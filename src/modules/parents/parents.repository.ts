import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../db/prisma.service';
import { ERole } from '../../types/user';

@Injectable()
export class ParentsRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findParentInFamily(
    familyId: string,
    parentUserId: string,
  ) {
    return this.prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: parentUserId,
        role: {
          in: [ERole.admin, ERole.parent],
        },
      },
      include: {
        user: {
          include: {
            parentProfile: true,
          },
        },
      },
    });
  }

  findParentsInFamily(familyId: string) {
    return this.prisma.familyMember.findMany({
      where: {
        familyId,
        role: {
          in: [ERole.admin, ERole.parent],
        },
      },
      include: {
        user: {
          include: {
            parentProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  createParent(
    familyId: string,
    data: {
      username: string;
      passwordHash: string;
      name: string;
      familyRole?: string;
      color?: string;
      avatar?: string;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          passwordHash: data.passwordHash,
        },
      });

      const parentProfile =
        await tx.parentProfile.create({
          data: {
            userId: user.id,
            name: data.name,
            color: data.color,
            avatar: data.avatar,
          },
        });

      await tx.familyMember.create({
        data: {
          familyId,
          userId: user.id,
          role: ERole.parent,
          familyRole: data.familyRole,
        },
      });

      return {
        user,
        parentProfile,
        member: {
          role: ERole.parent,
          familyRole: data.familyRole ?? null,
          isOwner: false,
        },
      };
    });
  }

  updateParentProfile(
    userId: string,
    data: {
      name?: string;
      color?: string;
      avatar?: string;
    },
  ) {
    return this.prisma.parentProfile.update({
      where: { userId },
      data,
    });
  }

  updateParentMember(
    familyId: string,
    userId: string,
    data: {
      familyRole?: string;
    },
  ) {
    return this.prisma.familyMember.update({
      where: {
        familyId_userId: {
          familyId,
          userId,
        },
      },
      data,
    });
  }

  updateParentUser(
    userId: string,
    data: {
      username?: string;
      passwordHash?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  deleteParent(familyId: string, parentUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.familyMember.delete({
        where: {
          familyId_userId: {
            familyId,
            userId: parentUserId,
          },
        },
      });

      await tx.parentProfile.deleteMany({
        where: { userId: parentUserId },
      });

      await tx.user.delete({
        where: { id: parentUserId },
      });
    });
  }
}
