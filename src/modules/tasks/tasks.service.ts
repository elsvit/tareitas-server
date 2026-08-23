import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import { ENotificationType } from '../../types/notification';
import { ETaskStatus } from '../../types/task';
import { ERole } from '../../types/user';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTaskDto } from './dto/create-task.dto';
import {
  ListTasksQueryDto,
  UpdateTaskDto,
} from './dto/update-task.dto';
import { toTask } from './task.mapper';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listTasks(
    familyId: string,
    query: ListTasksQueryDto,
  ) {
    const tasks =
      await this.tasksRepository.findManyInFamily(
        familyId,
        query,
      );

    return tasks.map(toTask);
  }

  async getTask(
    familyId: string,
    taskId: string,
  ) {
    const task =
      await this.tasksRepository.findByIdInFamily(
        familyId,
        taskId,
      );

    if (!task) {
      throw new AppException(
        ErrorCode.TASK_NOT_FOUND,
        'Task not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return toTask(task);
  }

  async createTask(
    familyId: string,
    createdByUserId: string,
    dto: CreateTaskDto,
  ) {
    await this.ensureAssigneeIsChild(
      familyId,
      dto.assignedToUserId,
    );

    const task =
      await this.tasksRepository.createTask({
        familyId,
        title: dto.title,
        description: dto.description,
        assignedToUserId:
          dto.assignedToUserId,
        createdByUserId,
        points: dto.points,
        dueDate: dto.dueDate
          ? new Date(dto.dueDate)
          : undefined,
      });

    await this.notificationsService.notifySafely({
      userId: task.assignedToUserId,
      familyId,
      type: ENotificationType.task_assigned,
      title: 'New task assigned',
      body: task.title,
      data: {
        taskId: task.id,
        familyId,
      },
    });

    return toTask(task);
  }

  async updateTask(
    familyId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ) {
    const task = await this.getTaskEntity(
      familyId,
      taskId,
    );

    if (
      task.status === ETaskStatus.approved
    ) {
      throw new AppException(
        ErrorCode.TASK_NOT_ALLOWED,
        'Approved tasks cannot be updated',
        HttpStatus.FORBIDDEN,
      );
    }

    if (dto.assignedToUserId) {
      await this.ensureAssigneeIsChild(
        familyId,
        dto.assignedToUserId,
      );
    }

    const updateData: {
      title?: string;
      description?: string;
      assignedToUserId?: string;
      points?: number;
      dueDate?: Date | null;
    } = {};

    if (dto.title !== undefined) {
      updateData.title = dto.title;
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    if (dto.assignedToUserId !== undefined) {
      updateData.assignedToUserId =
        dto.assignedToUserId;
    }

    if (dto.points !== undefined) {
      updateData.points = dto.points;
    }

    if (dto.dueDate !== undefined) {
      updateData.dueDate = dto.dueDate
        ? new Date(dto.dueDate)
        : null;
    }

    const updated =
      await this.tasksRepository.updateTask(
        task.id,
        updateData,
      );

    return toTask(updated);
  }

  async deleteTask(
    familyId: string,
    taskId: string,
  ) {
    const task = await this.getTaskEntity(
      familyId,
      taskId,
    );

    await this.tasksRepository.deleteTask(
      task.id,
    );
  }

  async completeTask(
    familyId: string,
    taskId: string,
    userId: string,
    userRole: ERole,
  ) {
    if (userRole !== ERole.child) {
      throw new AppException(
        ErrorCode.TASK_NOT_ALLOWED,
        'Only children can complete tasks',
        HttpStatus.FORBIDDEN,
      );
    }

    const task = await this.getTaskEntity(
      familyId,
      taskId,
    );

    if (task.assignedToUserId !== userId) {
      throw new AppException(
        ErrorCode.TASK_NOT_ALLOWED,
        'This task is not assigned to you',
        HttpStatus.FORBIDDEN,
      );
    }

    if (task.status !== ETaskStatus.pending) {
      throw new AppException(
        ErrorCode.TASK_INVALID_STATUS,
        'Only pending tasks can be completed',
        HttpStatus.CONFLICT,
      );
    }

    const updated =
      await this.tasksRepository.completeTask(
        task.id,
      );

    await this.notificationsService.notifyParentsSafely(
      familyId,
      {
        type: ENotificationType.task_completed,
        title: 'Task completed',
        body: task.title,
        data: {
          taskId: task.id,
          familyId,
          childUserId: userId,
        },
      },
      userId,
    );

    return toTask(updated);
  }

  async approveTask(
    familyId: string,
    taskId: string,
  ) {
    const task = await this.getTaskEntity(
      familyId,
      taskId,
    );

    if (task.status !== ETaskStatus.completed) {
      throw new AppException(
        ErrorCode.TASK_INVALID_STATUS,
        'Only completed tasks can be approved',
        HttpStatus.CONFLICT,
      );
    }

    await this.ensureAssigneeIsChild(
      familyId,
      task.assignedToUserId,
    );

    const updated =
      await this.tasksRepository.approveTask(
        task.id,
      );

    await this.notificationsService.notifySafely({
      userId: task.assignedToUserId,
      familyId,
      type: ENotificationType.task_approved,
      title: 'Task approved',
      body: `"${task.title}" was approved (+${task.points.toNumber()} points)`,
      data: {
        taskId: task.id,
        familyId,
        points: task.points.toNumber(),
      },
    });

    return toTask(updated);
  }

  async rejectTask(
    familyId: string,
    taskId: string,
  ) {
    const task = await this.getTaskEntity(
      familyId,
      taskId,
    );

    if (task.status !== ETaskStatus.completed) {
      throw new AppException(
        ErrorCode.TASK_INVALID_STATUS,
        'Only completed tasks can be rejected',
        HttpStatus.CONFLICT,
      );
    }

    const updated =
      await this.tasksRepository.rejectTask(
        task.id,
      );

    await this.notificationsService.notifySafely({
      userId: task.assignedToUserId,
      familyId,
      type: ENotificationType.task_rejected,
      title: 'Task rejected',
      body: `"${task.title}" needs to be done again`,
      data: {
        taskId: task.id,
        familyId,
      },
    });

    return toTask(updated);
  }

  private async getTaskEntity(
    familyId: string,
    taskId: string,
  ) {
    const task =
      await this.tasksRepository.findByIdInFamily(
        familyId,
        taskId,
      );

    if (!task) {
      throw new AppException(
        ErrorCode.TASK_NOT_FOUND,
        'Task not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return task;
  }

  private async ensureAssigneeIsChild(
    familyId: string,
    userId: string,
  ) {
    const member =
      await this.tasksRepository.findChildInFamily(
        familyId,
        userId,
      );

    if (!member) {
      throw new AppException(
        ErrorCode.CHILD_NOT_FOUND,
        'Assigned child not found in this family',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
