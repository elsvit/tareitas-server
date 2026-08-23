import { Injectable } from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../db/prisma.service';
import { ParentProfileInputDto } from './dto/parent-profile-input.dto';

type DbClient =
  | PrismaService
  | Prisma.TransactionClient;

@Injectable()
export class ParentProfilesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async ensureParentProfile(
    userId: string,
    input?: ParentProfileInputDto,
    tx?: Prisma.TransactionClient,
  ) {
    const db: DbClient = tx ?? this.prisma;

    const existing =
      await db.parentProfile.findUnique({
        where: { userId },
      });

    if (existing) {
      return existing;
    }

    const name =
      input?.name ??
      (await this.resolveDefaultName(
        userId,
        db,
      ));

    return db.parentProfile.create({
      data: {
        userId,
        name,
        color: input?.color,
        avatar: input?.avatar,
      },
    });
  }

  private async resolveDefaultName(
    userId: string,
    db: DbClient,
  ) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
      },
    });

    return (
      user?.username ??
      user?.email ??
      'Parent'
    );
  }
}
