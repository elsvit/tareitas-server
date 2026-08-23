import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../db/prisma.service';
import { ERole } from '../../types/user';

@Injectable()
export class ChildrenRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findChildInFamily(
    familyId: string,
    childUserId: string,
  ) {
    return this.prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: childUserId,
        role: ERole.child,
      },
      include: {
        user: {
          include: {
            childProfile: true,
          },
        },
      },
    });
  }

  findChildrenInFamily(familyId: string) {
    return this.prisma.familyMember.findMany({
      where: {
        familyId,
        role: ERole.child,
      },
      include: {
        user: {
          include: {
            childProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  createChild(
    familyId: string,
    data: {
      username?: string;
      passwordHash?: string;
      name: string;
      color?: string;
      avatar?: string;
      birthday?: Date;
      reward?: number;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          passwordHash: data.passwordHash,
        },
      });

      const childProfile =
        await tx.childProfile.create({
          data: {
            userId: user.id,
            name: data.name,
            color: data.color,
            avatar: data.avatar,
            birthday: data.birthday,
            reward: data.reward ?? 0,
          },
        });

      await tx.familyMember.create({
        data: {
          familyId,
          userId: user.id,
          role: ERole.child,
        },
      });

      return childProfile;
    });
  }

  updateChildProfile(
    userId: string,
    data: {
      name?: string;
      color?: string;
      avatar?: string;
      birthday?: Date | null;
      reward?: number;
    },
  ) {
    return this.prisma.childProfile.update({
      where: { userId },
      data,
    });
  }

  updateChildUser(
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
}
