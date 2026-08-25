import { Injectable } from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../db/prisma.service';
import { ECatalogItemSource } from '../../types/catalog';

import {
  RewardBaseItemDto,
  TaskBaseItemDto,
} from './dto/catalog.dto';

@Injectable()
export class CatalogRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findFamilyCatalogMeta(familyId: string) {
    return this.prisma.family.findUnique({
      where: { id: familyId },
      select: {
        taskBaseRevision: true,
        rewardBaseRevision: true,
        bundledTaskCatalogVersion: true,
        bundledRewardCatalogVersion: true,
      },
    });
  }

  findCatalogItems(familyId: string) {
    return this.prisma.family.findUnique({
      where: { id: familyId },
      select: {
        taskBaseRevision: true,
        rewardBaseRevision: true,
        bundledTaskCatalogVersion: true,
        bundledRewardCatalogVersion: true,
        taskBaseItems: {
          orderBy: { id: 'asc' },
        },
        rewardBaseItems: {
          orderBy: { id: 'asc' },
        },
      },
    });
  }

  syncCatalog(
    familyId: string,
    input: {
      taskBase?: TaskBaseItemDto[];
      rewardBase?: RewardBaseItemDto[];
      removedTaskBaseIds?: string[];
      removedRewardBaseIds?: string[];
      bundledTaskCatalogVersion?: number;
      bundledRewardCatalogVersion?: number;
      bumpTaskRevision: boolean;
      bumpRewardRevision: boolean;
    },
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        if (input.taskBase?.length) {
          for (const item of input.taskBase) {
            await tx.taskBaseItem.upsert({
              where: {
                familyId_id: {
                  familyId,
                  id: item.id,
                },
              },
              create: {
                familyId,
                id: item.id,
                name: item.name,
                description: item.description,
                reward: item.reward,
                picture: item.picture,
                time: item.time,
                color: item.color,
                subtasks:
                  item.subtasks as unknown as
                    | Prisma.InputJsonValue
                    | undefined,
                isHidden: item.isHidden ?? false,
                source:
                  item.source ??
                  ECatalogItemSource.custom,
              },
              update: {
                name: item.name,
                description: item.description,
                reward: item.reward,
                picture: item.picture,
                time: item.time,
                color: item.color,
                subtasks:
                  item.subtasks as unknown as
                    | Prisma.InputJsonValue
                    | undefined,
                isHidden: item.isHidden ?? false,
                source:
                  item.source ??
                  ECatalogItemSource.custom,
              },
            });
          }
        }

        if (input.removedTaskBaseIds?.length) {
          await tx.taskBaseItem.deleteMany({
            where: {
              familyId,
              id: {
                in: input.removedTaskBaseIds,
              },
            },
          });
        }

        if (input.rewardBase?.length) {
          for (const item of input.rewardBase) {
            await tx.rewardBaseItem.upsert({
              where: {
                familyId_id: {
                  familyId,
                  id: item.id,
                },
              },
              create: {
                familyId,
                id: item.id,
                title: item.title,
                reward: item.reward,
                picture: item.picture,
                isHidden: item.isHidden ?? false,
                source:
                  item.source ??
                  ECatalogItemSource.custom,
              },
              update: {
                title: item.title,
                reward: item.reward,
                picture: item.picture,
                isHidden: item.isHidden ?? false,
                source:
                  item.source ??
                  ECatalogItemSource.custom,
              },
            });
          }
        }

        if (input.removedRewardBaseIds?.length) {
          await tx.rewardBaseItem.deleteMany({
            where: {
              familyId,
              id: {
                in: input.removedRewardBaseIds,
              },
            },
          });
        }

        const familyUpdate: Prisma.FamilyUpdateInput =
          {};

        if (input.bumpTaskRevision) {
          familyUpdate.taskBaseRevision = {
            increment: 1,
          };
        }

        if (input.bumpRewardRevision) {
          familyUpdate.rewardBaseRevision = {
            increment: 1,
          };
        }

        if (
          input.bundledTaskCatalogVersion !==
          undefined
        ) {
          familyUpdate.bundledTaskCatalogVersion =
            input.bundledTaskCatalogVersion;
        }

        if (
          input.bundledRewardCatalogVersion !==
          undefined
        ) {
          familyUpdate.bundledRewardCatalogVersion =
            input.bundledRewardCatalogVersion;
        }

        if (
          Object.keys(familyUpdate).length > 0
        ) {
          await tx.family.update({
            where: { id: familyId },
            data: familyUpdate,
          });
        }

        return tx.family.findUnique({
          where: { id: familyId },
          select: {
            taskBaseRevision: true,
            rewardBaseRevision: true,
            bundledTaskCatalogVersion: true,
            bundledRewardCatalogVersion: true,
            taskBaseItems: {
              orderBy: { id: 'asc' },
            },
            rewardBaseItems: {
              orderBy: { id: 'asc' },
            },
          },
        });
      },
    );
  }
}
