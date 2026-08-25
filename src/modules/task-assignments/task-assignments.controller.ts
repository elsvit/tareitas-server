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

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { FamilyMemberGuard } from '../../common/guards/family-member.guard';
import { ERole } from '../../types/user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload';

import {
  CreateTaskAssignmentDto,
  UpdateTaskAssignmentDto,
} from './dto/task-assignment.dto';
import { TaskAssignmentsService } from './task-assignments.service';

@Controller('families/:familyId/task-assignments')
@UseGuards(JwtAuthGuard, FamilyMemberGuard)
export class TaskAssignmentsController {
  constructor(
    private readonly taskAssignmentsService: TaskAssignmentsService,
  ) {}

  @Get()
  listTaskAssignments(
    @Param('familyId') familyId: string,
    @Query('childId') childId?: string,
  ) {
    return this.taskAssignmentsService.listTaskAssignments(
      familyId,
      childId,
    );
  }

  @Get(':assignmentId')
  getTaskAssignment(
    @Param('familyId') familyId: string,
    @Param('assignmentId')
    assignmentId: string,
  ) {
    return this.taskAssignmentsService.getTaskAssignment(
      familyId,
      assignmentId,
    );
  }

  @Post()
  @RequireRole(ERole.parent)
  createTaskAssignment(
    @CurrentUser() user: JwtPayload,
    @Param('familyId') familyId: string,
    @Body() dto: CreateTaskAssignmentDto,
  ) {
    return this.taskAssignmentsService.createTaskAssignment(
      familyId,
      user.sub,
      dto,
    );
  }

  @Patch(':assignmentId')
  @RequireRole(ERole.parent)
  updateTaskAssignment(
    @Param('familyId') familyId: string,
    @Param('assignmentId')
    assignmentId: string,
    @Body() dto: UpdateTaskAssignmentDto,
  ) {
    return this.taskAssignmentsService.updateTaskAssignment(
      familyId,
      assignmentId,
      dto,
    );
  }

  @Delete(':assignmentId')
  @RequireRole(ERole.parent)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTaskAssignment(
    @Param('familyId') familyId: string,
    @Param('assignmentId')
    assignmentId: string,
  ) {
    return this.taskAssignmentsService.deleteTaskAssignment(
      familyId,
      assignmentId,
    );
  }
}
