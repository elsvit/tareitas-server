import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { ETaskStatus } from '../../../types/task';
import { CreateTaskAssignmentDto } from '../../task-assignments/dto/task-assignment.dto';

export class CreateTaskDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  assignmentId!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsEnum(ETaskStatus)
  status?: ETaskStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  completedSubtasks?: string[];
}

export class UpdateTaskDto {
  @IsOptional()
  @IsEnum(ETaskStatus)
  status?: ETaskStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  completedSubtasks?: string[];
}

export class ListTasksQueryDto {
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @IsOptional()
  @IsUUID()
  childId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(ETaskStatus)
  status?: ETaskStatus;
}

export class CreateTaskAssignmentSyncDto extends CreateTaskAssignmentDto {}

export class SyncTasksDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskAssignmentSyncDto)
  assignments?: CreateTaskAssignmentSyncDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskDto)
  tasks?: CreateTaskDto[];
}
