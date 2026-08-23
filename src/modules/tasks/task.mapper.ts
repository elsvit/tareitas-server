import { Task } from '../../generated/prisma/client';
import { ETaskStatus, ITask } from '../../types/task';

export function toTask(task: Task): ITask {
  return {
    id: task.id,
    familyId: task.familyId,
    title: task.title,
    description: task.description ?? undefined,
    assignedToUserId: task.assignedToUserId,
    createdByUserId: task.createdByUserId,
    points: task.points.toNumber(),
    status: task.status as ETaskStatus,
    dueDate: task.dueDate
      ? task.dueDate.toISOString().slice(0, 10)
      : undefined,
    completedAt: task.completedAt?.toISOString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
