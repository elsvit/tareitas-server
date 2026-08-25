import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../db/prisma.service';
import { ERole } from '../../types/user';

@Injectable()
export class TaskAssignmentsRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findChildInFamily(
    familyId: string,
    childId: string,
  ) {
    return this.prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: childId,
        role: ERole.child,
      },
    });
  }

  findByIdInFamily(
    familyId: string,
    assignmentId: string,
  ) {
    return this.prisma.taskAssignment.findFirst({
      where: {
        id: assignmentId,
        familyId,
      },
    });
  }

  findManyInFamily(
    familyId: string,
    childId?: string,
  ) {
    return this.prisma.taskAssignment.findMany({
      where: {
        familyId,
        childId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  create(data: {
    id?: string;
    familyId: string;
    childId: string;
    title: string;
    description?: string;
    reward?: number;
    picture?: string;
    color?: string;
    startDate: Date;
    endDate?: Date;
    time?: string;
    isHabit?: boolean;
    repeat?: Prisma.InputJsonValue;
    newTaskBonus?: number;
    newTaskDuration?: number;
    subtasks?: Prisma.InputJsonValue;
    changes?: Prisma.InputJsonValue;
    createdByUserId: string;
  }) {
    return this.prisma.taskAssignment.create({
      data: {
        id: data.id ?? randomUUID(),
        familyId: data.familyId,
        childId: data.childId,
        title: data.title,
        description: data.description,
        reward: data.reward ?? 0,
        picture: data.picture,
        color: data.color,
        startDate: data.startDate,
        endDate: data.endDate,
        time: data.time ?? '00:00',
        isHabit: data.isHabit ?? false,
        repeat: data.repeat,
        newTaskBonus: data.newTaskBonus,
        newTaskDuration: data.newTaskDuration,
        subtasks: data.subtasks,
        changes: data.changes ?? {},
        createdByUserId: data.createdByUserId,
      },
    });
  }

  update(
    assignmentId: string,
    data: Prisma.TaskAssignmentUpdateInput,
  ) {
    return this.prisma.taskAssignment.update({
      where: { id: assignmentId },
      data,
    });
  }

  delete(assignmentId: string) {
    return this.prisma.taskAssignment.delete({
      where: { id: assignmentId },
    });
  }
}
