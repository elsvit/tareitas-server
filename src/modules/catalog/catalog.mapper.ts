import {
  RewardBaseItem,
  TaskBaseItem,
} from '../../generated/prisma/client';
import {
  ECatalogItemSource,
  IFamilyCatalog,
  IRewardBase,
  ISubtask,
  ITaskBase,
} from '../../types/catalog';

function parseSubtasks(
  value: unknown,
): ISubtask[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value as ISubtask[];
}

export function toTaskBaseItem(
  item: TaskBaseItem,
): ITaskBase {
  return {
    id: item.id,
    name: item.name,
    description:
      item.description ?? undefined,
    reward: item.reward?.toNumber(),
    picture: item.picture ?? undefined,
    time: item.time ?? undefined,
    color: item.color ?? undefined,
    subtasks: parseSubtasks(item.subtasks),
    isHidden: item.isHidden,
    source: item.source as ECatalogItemSource,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function toRewardBaseItem(
  item: RewardBaseItem,
): IRewardBase {
  return {
    id: item.id,
    title: item.title,
    reward: item.reward.toNumber(),
    picture: item.picture ?? undefined,
    isHidden: item.isHidden,
    source: item.source as ECatalogItemSource,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function toFamilyCatalog(data: {
  taskBaseRevision: number;
  rewardBaseRevision: number;
  bundledTaskCatalogVersion: number;
  bundledRewardCatalogVersion: number;
  taskBaseItems: TaskBaseItem[];
  rewardBaseItems: RewardBaseItem[];
}): IFamilyCatalog {
  return {
    taskBaseRevision: data.taskBaseRevision,
    rewardBaseRevision: data.rewardBaseRevision,
    bundledTaskCatalogVersion:
      data.bundledTaskCatalogVersion,
    bundledRewardCatalogVersion:
      data.bundledRewardCatalogVersion,
    taskBase: data.taskBaseItems.map(
      toTaskBaseItem,
    ),
    rewardBase: data.rewardBaseItems.map(
      toRewardBaseItem,
    ),
  };
}
