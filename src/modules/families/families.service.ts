import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class FamiliesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}
  async getMyFamilies(userId: string) {
    return this.prisma.family.findMany({
      where: {
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
        },
      },
    });
  }

  async getMyFamiliesShortData(userId: string) {
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
}