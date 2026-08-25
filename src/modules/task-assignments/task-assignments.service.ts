import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import {
  CreateTaskAssignmentDto,
  UpdateTaskAssignmentDto,
} from './dto/task-assignment.dto';
import { toTaskAssignment } from './task-assignment.mapper';
import { TaskAssignmentsRepository } from './task-assignments.repository';

@Injectable()
export class TaskAssignmentsService {
  constructor(
    private readonly taskAssignmentsRepository: TaskAssignmentsRepository,
  ) {}

  async listTaskAssignments(
    familyId: string,
    childId?: string,
  ) {
    const items =
      await this.taskAssignmentsRepository.findManyInFamily(
        familyId,
        childId,
      );

    return items.map(toTaskAssignment);
  }

  async getTaskAssignment(
    familyId: string,
    assignmentId: string,
  ) {
    const item =
      await this.getAssignmentEntity(
        familyId,
        assignmentId,
      );

    return toTaskAssignment(item);
  }

  async createTaskAssignment(
    familyId: string,
    createdByUserId: string,
    dto: CreateTaskAssignmentDto,
  ) {
    await this.ensureChildInFamily(
      familyId,
      dto.childId,
    );

    try {
      const assignment =
        await this.taskAssignmentsRepository.create(
          {
            id: dto.id,
            familyId,
            childId: dto.childId,
            title: dto.title,
            description: dto.description,
            reward: dto.reward,
            picture: dto.picture,
            color: dto.color,
            startDate: new Date(
              dto.startDate,
            ),
            endDate: dto.endDate
              ? new Date(dto.endDate)
              : undefined,
            time: dto.time,
            isHabit: dto.isHabit,
            repeat: dto.repeat as unknown as
              | Prisma.InputJsonValue
              | undefined,
            newTaskBonus: dto.newTaskBonus,
            newTaskDuration:
              dto.newTaskDuration,
            subtasks: dto.subtasks as unknown as
              | Prisma.InputJsonValue
              | undefined,
            changes: dto.changes as unknown as
              | Prisma.InputJsonValue
              | undefined,
            createdByUserId,
          },
        );

      return toTaskAssignment(assignment);
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppException(
          ErrorCode.TASK_ALREADY_EXISTS,
          'Task assignment already exists',
          HttpStatus.CONFLICT,
        );
      }

      throw error;
    }
  }

  async updateTaskAssignment(
    familyId: string,
    assignmentId: string,
    dto: UpdateTaskAssignmentDto,
  ) {
    const assignment =
      await this.getAssignmentEntity(
        familyId,
        assignmentId,
      );

    if (dto.childId) {
      await this.ensureChildInFamily(
        familyId,
        dto.childId,
      );
    }

    const updateData: Prisma.TaskAssignmentUpdateInput =
      {};

    if (dto.childId !== undefined) {
      updateData.child = {
        connect: { id: dto.childId },
      };
    }

    if (dto.title !== undefined) {
      updateData.title = dto.title;
    }

    if (dto.description !== undefined) {
      updateData.description =
        dto.description;
    }

    if (dto.reward !== undefined) {
      updateData.reward = dto.reward;
    }

    if (dto.picture !== undefined) {
      updateData.picture = dto.picture;
    }

    if (dto.color !== undefined) {
      updateData.color = dto.color;
    }

    if (dto.startDate !== undefined) {
      updateData.startDate = new Date(
        dto.startDate,
      );
    }

    if (dto.endDate !== undefined) {
      updateData.endDate = dto.endDate
        ? new Date(dto.endDate)
        : null;
    }

    if (dto.time !== undefined) {
      updateData.time = dto.time;
    }

    if (dto.isHabit !== undefined) {
      updateData.isHabit = dto.isHabit;
    }

    if (dto.repeat !== undefined) {
      updateData.repeat =
        dto.repeat as unknown as Prisma.InputJsonValue;
    }

    if (dto.newTaskBonus !== undefined) {
      updateData.newTaskBonus =
        dto.newTaskBonus;
    }

    if (dto.newTaskDuration !== undefined) {
      updateData.newTaskDuration =
        dto.newTaskDuration;
    }

    if (dto.subtasks !== undefined) {
      updateData.subtasks =
        dto.subtasks as unknown as Prisma.InputJsonValue;
    }

    if (dto.changes !== undefined) {
      updateData.changes =
        dto.changes as unknown as Prisma.InputJsonValue;
    }

    const updated =
      await this.taskAssignmentsRepository.update(
        assignment.id,
        updateData,
      );

    return toTaskAssignment(updated);
  }

  async deleteTaskAssignment(
    familyId: string,
    assignmentId: string,
  ) {
    const assignment =
      await this.getAssignmentEntity(
        familyId,
        assignmentId,
      );

    await this.taskAssignmentsRepository.delete(
      assignment.id,
    );
  }

  async getAssignmentEntity(
    familyId: string,
    assignmentId: string,
  ) {
    const assignment =
      await this.taskAssignmentsRepository.findByIdInFamily(
        familyId,
        assignmentId,
      );

    if (!assignment) {
      throw new AppException(
        ErrorCode.TASK_ASSIGNMENT_NOT_FOUND,
        'Task assignment not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return assignment;
  }

  private async ensureChildInFamily(
    familyId: string,
    childId: string,
  ) {
    const member =
      await this.taskAssignmentsRepository.findChildInFamily(
        familyId,
        childId,
      );

    if (!member) {
      throw new AppException(
        ErrorCode.CHILD_NOT_FOUND,
        'Child not found in this family',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
