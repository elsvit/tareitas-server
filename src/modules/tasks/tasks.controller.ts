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

import {
  CreateTaskDto,
  ListTasksQueryDto,
  SyncTasksDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { TasksService } from './tasks.service';

@Controller('families/:familyId/tasks')
@UseGuards(JwtAuthGuard, FamilyMemberGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
  ) {}

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

  @Post('sync')
  @RequireRole(ERole.admin, ERole.parent)
  syncTasks(
    @CurrentUser() user: JwtPayload,
    @Param('familyId') familyId: string,
    @Body() dto: SyncTasksDto,
  ) {
    return this.tasksService.syncTasks(
      familyId,
      user.sub,
      dto,
    );
  }

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

  @Post()
  createTask(
    @Param('familyId') familyId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.createTask(
      familyId,
      dto,
    );
  }

  @Patch(':taskId')
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

  @Delete(':taskId')
  @RequireRole(ERole.admin, ERole.parent)
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

  @Post(':taskId/approve')
  @RequireRole(ERole.admin, ERole.parent)
  approveTask(
    @Param('familyId') familyId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.approveTask(
      familyId,
      taskId,
    );
  }

  @Post(':taskId/reject')
  @RequireRole(ERole.admin, ERole.parent)
  rejectTask(
    @Param('familyId') familyId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.rejectTask(
      familyId,
      taskId,
    );
  }

  @Post(':taskId/unapprove')
  @RequireRole(ERole.admin, ERole.parent)
  unapproveTask(
    @Param('familyId') familyId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.unapproveTask(
      familyId,
      taskId,
    );
  }
}
