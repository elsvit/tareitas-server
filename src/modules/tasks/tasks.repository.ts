import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../db/prisma.service';
import { ETaskStatus } from '../../types/task';
import { ERole } from '../../types/user';

@Injectable()
export class TasksRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findChildInFamily(
    familyId: string,
    userId: string,
  ) {
    return this.prisma.familyMember.findFirst({
      where: {
        familyId,
        userId,
        role: ERole.child,
      },
    });
  }

  findByIdInFamily(
    familyId: string,
    taskId: string,
  ) {
    return this.prisma.task.findFirst({
      where: {
        id: taskId,
        familyId,
      },
    });
  }

  findManyInFamily(
    familyId: string,
    filters?: {
      assignedToUserId?: string;
      status?: ETaskStatus;
    },
  ) {
    return this.prisma.task.findMany({
      where: {
        familyId,
        assignedToUserId:
          filters?.assignedToUserId,
        status: filters?.status,
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  createTask(data: {
    familyId: string;
    title: string;
    description?: string;
    assignedToUserId: string;
    createdByUserId: string;
    points?: number;
    dueDate?: Date;
  }) {
    return this.prisma.task.create({
      data: {
        familyId: data.familyId,
        title: data.title,
        description: data.description,
        assignedToUserId:
          data.assignedToUserId,
        createdByUserId:
          data.createdByUserId,
        points: data.points ?? 0,
        dueDate: data.dueDate,
        status: ETaskStatus.pending,
      },
    });
  }

  updateTask(
    taskId: string,
    data: {
      title?: string;
      description?: string;
      assignedToUserId?: string;
      points?: number;
      dueDate?: Date | null;
    },
  ) {
    return this.prisma.task.update({
      where: { id: taskId },
      data,
    });
  }

  deleteTask(taskId: string) {
    return this.prisma.task.delete({
      where: { id: taskId },
    });
  }

  completeTask(taskId: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: ETaskStatus.completed,
        completedAt: new Date(),
      },
    });
  }

  approveTask(taskId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const task = await tx.task.update({
          where: { id: taskId },
          data: {
            status: ETaskStatus.approved,
          },
        });

        await tx.childProfile.update({
          where: {
            userId: task.assignedToUserId,
          },
          data: {
            reward: {
              increment: task.points,
            },
          },
        });

        return task;
      },
    );
  }

  rejectTask(taskId: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: ETaskStatus.pending,
        completedAt: null,
      },
    });
  }
}
