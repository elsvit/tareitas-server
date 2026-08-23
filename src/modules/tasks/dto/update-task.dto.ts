import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

import { ETaskStatus } from '../../../types/task';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  points?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class ListTasksQueryDto {
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @IsOptional()
  @IsEnum(ETaskStatus)
  status?: ETaskStatus;
}
