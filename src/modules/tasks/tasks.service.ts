import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import { ENotificationType } from '../../types/notification';
import { ETaskStatus } from '../../types/task';
import { ERole } from '../../types/user';
import { getEffectiveReward } from '../task-assignments/task-assignment.mapper';
import { TaskAssignmentsService } from '../task-assignments/task-assignments.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateTaskDto,
  ListTasksQueryDto,
  SyncTasksDto,
  UpdateTaskDto,
} from './dto/task.dto';
import {
  formatTaskDate,
  toTask,
} from './task.mapper';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly taskAssignmentsService: TaskAssignmentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listTasks(
    familyId: string,
    query: ListTasksQueryDto,
  ) {
    const tasks =
      await this.tasksRepository.findManyInFamily(
        familyId,
        {
          assignmentId: query.assignmentId,
          childId: query.childId,
          from: query.from
            ? new Date(query.from)
            : undefined,
          to: query.to
            ? new Date(query.to)
            : undefined,
          status: query.status,
        },
      );

    return tasks.map(toTask);
  }

  async getTask(
    familyId: string,
    taskId: string,
  ) {
    const task = await this.getTaskEntity(
      familyId,
      taskId,
    );

    return toTask(task);
  }

  async createTask(
    familyId: string,
    dto: CreateTaskDto,
  ) {
    const assignment =
      await this.taskAssignmentsService.getAssignmentEntity(
        familyId,
        dto.assignmentId,
      );

    const date = new Date(dto.date);

    const existing =
      await this.tasksRepository.findByAssignmentAndDate(
        dto.assignmentId,
        date,
      );

    if (existing) {
      throw new AppException(
        ErrorCode.TASK_ALREADY_EXISTS,
        'Task already exists for this assignment and date',
        HttpStatus.CONFLICT,
      );
    }

    try {
      const task =
        await this.tasksRepository.create({
          id: dto.id,
          familyId,
          assignmentId: dto.assignmentId,
          date,
          status: dto.status,
          completedSubtasks:
            dto.completedSubtasks,
        });

      return toTask(task);
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppException(
          ErrorCode.TASK_ALREADY_EXISTS,
          'Task already exists',
          HttpStatus.CONFLICT,
        );
      }

      throw error;
    }
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

    if (task.status === ETaskStatus.approved) {
      throw new AppException(
        ErrorCode.TASK_NOT_ALLOWED,
        'Approved tasks cannot be updated',
        HttpStatus.FORBIDDEN,
      );
    }

    const updated =
      await this.tasksRepository.update(
        task.id,
        {
          status: dto.status,
          completedSubtasks:
            dto.completedSubtasks,
        },
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

    await this.tasksRepository.delete(task.id);
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

    if (task.assignment.childId !== userId) {
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
      await this.tasksRepository.update(
        task.id,
        {
          status: ETaskStatus.completed,
        },
      );

    await this.notificationsService.notifyParentsSafely(
      familyId,
      {
        type: ENotificationType.task_completed,
        title: 'Task completed',
        body: task.assignment.title,
        data: {
          taskId: task.id,
          assignmentId: task.assignmentId,
          familyId,
          childUserId: userId,
          date: formatTaskDate(task.date),
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

    const dateKey = formatTaskDate(task.date);
    const reward = getEffectiveReward(
      task.assignment,
      dateKey,
    );

    const updated =
      await this.tasksRepository.approveTask(
        task.id,
        task.assignment.childId,
        reward,
      );

    await this.notificationsService.notifySafely({
      userId: task.assignment.childId,
      familyId,
      type: ENotificationType.task_approved,
      title: 'Task approved',
      body: `"${task.assignment.title}" was approved (+${reward} points)`,
      data: {
        taskId: task.id,
        assignmentId: task.assignmentId,
        familyId,
        reward,
        date: dateKey,
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
      await this.tasksRepository.update(
        task.id,
        {
          status: ETaskStatus.rejected,
        },
      );

    await this.notificationsService.notifySafely({
      userId: task.assignment.childId,
      familyId,
      type: ENotificationType.task_rejected,
      title: 'Task rejected',
      body: `"${task.assignment.title}" needs to be done again`,
      data: {
        taskId: task.id,
        assignmentId: task.assignmentId,
        familyId,
        date: formatTaskDate(task.date),
      },
    });

    return toTask(updated);
  }

  async syncTasks(
    familyId: string,
    userId: string,
    dto: SyncTasksDto,
  ) {
    const assignments = [];

    for (const assignmentDto of dto.assignments ??
      []) {
      try {
        const created =
          await this.taskAssignmentsService.createTaskAssignment(
            familyId,
            userId,
            assignmentDto,
          );
        assignments.push(created);
      } catch (error) {
        if (
          error instanceof AppException &&
          (error.getResponse() as { errorCode: string })
            .errorCode ===
            ErrorCode.TASK_ALREADY_EXISTS &&
          assignmentDto.id
        ) {
          const updated =
            await this.taskAssignmentsService.updateTaskAssignment(
              familyId,
              assignmentDto.id,
              assignmentDto,
            );
          assignments.push(updated);
        } else {
          throw error;
        }
      }
    }

    const tasks = [];

    for (const taskDto of dto.tasks ?? []) {
      try {
        const created = await this.createTask(
          familyId,
          taskDto,
        );
        tasks.push(created);
      } catch (error) {
        if (
          error instanceof AppException &&
          (error.getResponse() as { errorCode: string })
            .errorCode ===
            ErrorCode.TASK_ALREADY_EXISTS
        ) {
          const existing =
            await this.tasksRepository.findByAssignmentAndDate(
              taskDto.assignmentId,
              new Date(taskDto.date),
            );

          if (existing) {
            const updated =
              await this.tasksRepository.update(
                existing.id,
                {
                  status: taskDto.status,
                  completedSubtasks:
                    taskDto.completedSubtasks,
                },
              );
            tasks.push(toTask(updated));
          }
        } else {
          throw error;
        }
      }
    }

    return { assignments, tasks };
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
}
