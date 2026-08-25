import { TaskAssignment } from '../../generated/prisma/client';
import {
  ETaskRepeatType,
  ISubtask,
  ITaskAssignment,
  ITaskAssignmentChange,
  ITaskAssignmentRepeat,
} from '../../types/task';

function parseJsonRecord<T>(
  value: unknown,
): Record<string, T> | undefined {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return undefined;
  }

  return value as Record<string, T>;
}

function parseJsonArray<T>(
  value: unknown,
): T[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value as T[];
}

export function toTaskAssignment(
  assignment: TaskAssignment,
): ITaskAssignment {
  const repeat = assignment.repeat as
    | ITaskAssignmentRepeat
    | null;

  return {
    id: assignment.id,
    familyId: assignment.familyId,
    childId: assignment.childId,
    title: assignment.title,
    description:
      assignment.description ?? undefined,
    reward: assignment.reward.toNumber(),
    picture: assignment.picture ?? undefined,
    color: assignment.color ?? undefined,
    startDate: assignment.startDate
      .toISOString()
      .slice(0, 10),
    endDate: assignment.endDate
      ? assignment.endDate
          .toISOString()
          .slice(0, 10)
      : undefined,
    time: assignment.time,
    isHabit: assignment.isHabit,
    repeat: repeat
      ? {
          type: repeat.type as ETaskRepeatType,
          weekDays: repeat.weekDays,
          count: repeat.count,
        }
      : undefined,
    newTaskBonus:
      assignment.newTaskBonus?.toNumber(),
    newTaskDuration:
      assignment.newTaskDuration ??
      undefined,
    subtasks: parseJsonArray<ISubtask>(
      assignment.subtasks,
    ),
    changes: parseJsonRecord<ITaskAssignmentChange>(
      assignment.changes,
    ),
    createdByUserId:
      assignment.createdByUserId,
    createdAt:
      assignment.createdAt.toISOString(),
    updatedAt:
      assignment.updatedAt.toISOString(),
  };
}

export function getEffectiveReward(
  assignment: TaskAssignment,
  date: string,
): number {
  const changes = parseJsonRecord<ITaskAssignmentChange>(
    assignment.changes,
  );
  const change = changes?.[date];

  if (change?.reward !== undefined) {
    return change.reward;
  }

  return assignment.reward.toNumber();
}
