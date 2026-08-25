import { Task } from '../../generated/prisma/client';
import { ETaskStatus, ITask } from '../../types/task';

export function toTask(task: Task): ITask {
  const completedSubtasks = Array.isArray(
    task.completedSubtasks,
  )
    ? (task.completedSubtasks as string[])
    : [];

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
