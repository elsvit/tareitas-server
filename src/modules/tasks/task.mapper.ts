import { Task } from '../../generated/prisma/client';
import {
  ETaskStatus,
  ISubtaskCompletionMedia,
  ITask,
} from '../../types/task';

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function parseCompletionMedia(
  value: unknown,
): ISubtaskCompletionMedia[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is ISubtaskCompletionMedia =>
      !!item &&
      typeof item === 'object' &&
      typeof (item as ISubtaskCompletionMedia).url === 'string' &&
      typeof (item as ISubtaskCompletionMedia).subtaskId === 'string',
  );
}

export function toTask(task: Task): ITask {
  const completedSubtasks = parseStringArray(task.completedSubtasks);
  const completedAudioRecords = parseCompletionMedia(
    task.completedAudioRecords,
  );
  const completedPhotos = parseCompletionMedia(task.completedPhotos);

  return {
    id: task.id,
    familyId: task.familyId,
    assignmentId: task.assignmentId,
    date: task.date.toISOString().slice(0, 10),
    status: task.status as ETaskStatus,
    completedSubtasks:
      completedSubtasks.length > 0
        ? completedSubtasks
        : undefined,
    completedAudioRecords:
      completedAudioRecords.length > 0
        ? completedAudioRecords
        : undefined,
    completedPhotos:
      completedPhotos.length > 0
        ? completedPhotos
        : undefined,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function formatTaskDate(
  date: string | Date,
): string {
  if (typeof date === 'string') {
    return date.slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}
