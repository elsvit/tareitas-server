import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

import { PrismaService } from '../../db/prisma.service';
import { ERole } from '../../types/user';

export type CreateNotificationInput = {
  userId: string;
  familyId?: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
};

@Injectable()
export class NotificationsRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        familyId: input.familyId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
  }

  createMany(inputs: CreateNotificationInput[]) {
    return this.prisma.notification.createMany({
      data: inputs.map((input) => ({
        userId: input.userId,
        familyId: input.familyId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data as
          | Prisma.InputJsonValue
          | undefined,
      })),
    });
  }

  findParentsInFamily(
    familyId: string,
    excludeUserId?: string,
  ) {
    return this.prisma.familyMember.findMany({
      where: {
        familyId,
        role: ERole.parent,
        ...(excludeUserId
          ? {
              userId: {
                not: excludeUserId,
              },
            }
          : {}),
      },
      select: {
        userId: true,
      },
    });
  }

  findForUser(
    userId: string,
    unreadOnly: boolean,
  ) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly
          ? { readAt: null }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  countUnread(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  findByIdForUser(
    userId: string,
    notificationId: string,
  ) {
    return this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  markAsRead(
    userId: string,
    notificationId: string,
  ) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }
}
