import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { ETaskRepeatType } from '../../../types/task';

export class SubtaskDto {
  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;
}

export class TaskAssignmentRepeatDto {
  @IsEnum(ETaskRepeatType)
  type!: ETaskRepeatType;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  weekDays?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  count?: number;
}

export class TaskAssignmentChangeDto {
  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reward?: number;

  @IsOptional()
  @IsString()
  picture?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  newTaskBonus?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  newTaskDuration?: number;
}

export class CreateTaskAssignmentDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  childId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reward?: number;

  @IsOptional()
  @IsString()
  picture?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  time?: string;

  @IsOptional()
  @IsBoolean()
  isHabit?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => TaskAssignmentRepeatDto)
  repeat?: TaskAssignmentRepeatDto;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  newTaskBonus?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  newTaskDuration?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubtaskDto)
  subtasks?: SubtaskDto[];

  @IsOptional()
  changes?: Record<
    string,
    TaskAssignmentChangeDto
  >;
}

export class UpdateTaskAssignmentDto {
  @IsOptional()
  @IsUUID()
  childId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reward?: number;

  @IsOptional()
  @IsString()
  picture?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  time?: string;

  @IsOptional()
  @IsBoolean()
  isHabit?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => TaskAssignmentRepeatDto)
  repeat?: TaskAssignmentRepeatDto;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  newTaskBonus?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  newTaskDuration?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubtaskDto)
  subtasks?: SubtaskDto[];

  @IsOptional()
  changes?: Record<
    string,
    TaskAssignmentChangeDto
  >;
}
