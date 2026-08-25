import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../db/prisma.service';
import { createTaskId } from '../../common/utils/task-id';
import { ETaskStatus } from '../../types/task';

@Injectable()
export class TasksRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findByIdInFamily(
    familyId: string,
    taskId: string,
  ) {
    return this.prisma.task.findFirst({
      where: {
        id: taskId,
        familyId,
      },
      include: {
        assignment: true,
      },
    });
  }

  findManyInFamily(
    familyId: string,
    filters?: {
      assignmentId?: string;
      childId?: string;
      from?: Date;
      to?: Date;
      status?: ETaskStatus;
    },
  ) {
    return this.prisma.task.findMany({
      where: {
        familyId,
        assignmentId: filters?.assignmentId,
        status: filters?.status,
        date: {
          gte: filters?.from,
          lte: filters?.to,
        },
        ...(filters?.childId
          ? {
              assignment: {
                childId: filters.childId,
              },
            }
          : {}),
      },
      orderBy: [
        { date: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  findByAssignmentAndDate(
    assignmentId: string,
    date: Date,
  ) {
    return this.prisma.task.findUnique({
      where: {
        assignmentId_date: {
          assignmentId,
          date,
        },
      },
    });
  }

  create(data: {
    id?: string;
    familyId: string;
    assignmentId: string;
    date: Date;
    status?: ETaskStatus;
    completedSubtasks?: string[];
  }) {
    return this.prisma.task.create({
      data: {
        id:
          data.id ??
          createTaskId(
            data.assignmentId,
            data.date,
          ),
        familyId: data.familyId,
        assignmentId: data.assignmentId,
        date: data.date,
        status:
          data.status ?? ETaskStatus.pending,
        completedSubtasks:
          data.completedSubtasks ?? [],
      },
    });
  }

  update(
    taskId: string,
    data: {
      status?: ETaskStatus;
      completedSubtasks?: string[];
    },
  ) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: data.status,
        completedSubtasks:
          data.completedSubtasks,
      },
    });
  }

  delete(taskId: string) {
    return this.prisma.task.delete({
      where: { id: taskId },
    });
  }

  approveTask(
    taskId: string,
    childId: string,
    reward: number,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const task = await tx.task.update({
          where: { id: taskId },
          data: {
            status: ETaskStatus.approved,
          },
        });

        await tx.childProfile.update({
          where: { userId: childId },
          data: {
            reward: {
              increment: reward,
            },
          },
        });

        return task;
      },
    );
  }
}
