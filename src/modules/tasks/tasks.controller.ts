import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentFamilyMember } from '../../common/decorators/current-family-member.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { FamilyMemberGuard } from '../../common/guards/family-member.guard';
import { FamilyMember } from '../../generated/prisma/client';
import { ERole } from '../../types/user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload';

import { CreateTaskDto } from './dto/create-task.dto';
import {
  ListTasksQueryDto,
  UpdateTaskDto,
} from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('families/:familyId/tasks')
@UseGuards(JwtAuthGuard, FamilyMemberGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
  ) {}

  /**
   * GET /families/:familyId/tasks
   */
  @Get()
  listTasks(
    @Param('familyId') familyId: string,
    @Query() query: ListTasksQueryDto,
  ) {
    return this.tasksService.listTasks(
      familyId,
      query,
    );
  }

  /**
   * GET /families/:familyId/tasks/:taskId
   */
  @Get(':taskId')
  getTask(
    @Param('familyId') familyId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.getTask(
      familyId,
      taskId,
    );
  }

  /**
   * POST /families/:familyId/tasks
   */
  @Post()
  @RequireRole(ERole.parent)
  createTask(
    @CurrentUser() user: JwtPayload,
    @Param('familyId') familyId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.createTask(
      familyId,
      user.sub,
      dto,
    );
  }

  /**
   * PATCH /families/:familyId/tasks/:taskId
   */
  @Patch(':taskId')
  @RequireRole(ERole.parent)
  updateTask(
    @Param('familyId') familyId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(
      familyId,
      taskId,
      dto,
    );
  }

  /**
   * DELETE /families/:familyId/tasks/:taskId
   */
  @Delete(':taskId')
  @RequireRole(ERole.parent)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTask(
    @Param('familyId') familyId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.deleteTask(
      familyId,
      taskId,
    );
  }

  /**
   * POST /families/:familyId/tasks/:taskId/complete
   */
  @Post(':taskId/complete')
  completeTask(
    @CurrentUser() user: JwtPayload,
    @CurrentFamilyMember()
    member: FamilyMember,
    @Param('familyId') familyId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.completeTask(
      familyId,
      taskId,
      user.sub,
      member.role as ERole,
    );
  }

  /**
   * POST /families/:familyId/tasks/:taskId/approve
   */
  @Post(':taskId/approve')
  @RequireRole(ERole.parent)
  approveTask(
    @Param('familyId') familyId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.approveTask(
      familyId,
      taskId,
    );
  }

  /**
   * POST /families/:familyId/tasks/:taskId/reject
   */
  @Post(':taskId/reject')
  @RequireRole(ERole.parent)
  rejectTask(
    @Param('familyId') familyId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.rejectTask(
      familyId,
      taskId,
    );
  }
}
