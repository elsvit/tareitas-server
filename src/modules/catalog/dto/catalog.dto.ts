import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { ECatalogItemSource } from '../../../types/catalog';

export class SubtaskDto {
  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;
}

export class TaskBaseItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

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
  @MaxLength(5)
  time?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubtaskDto)
  subtasks?: SubtaskDto[];

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @IsOptional()
  @IsEnum(ECatalogItemSource)
  source?: ECatalogItemSource;
}

export class RewardBaseItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reward!: number;

  @IsOptional()
  @IsString()
  picture?: string;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @IsOptional()
  @IsEnum(ECatalogItemSource)
  source?: ECatalogItemSource;
}

export class SyncCatalogDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bundledTaskCatalogVersion?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bundledRewardCatalogVersion?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  clientTaskRevision?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  clientRewardRevision?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskBaseItemDto)
  taskBase?: TaskBaseItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RewardBaseItemDto)
  rewardBase?: RewardBaseItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removedTaskBaseIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removedRewardBaseIds?: string[];
}

export class GetCatalogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  taskRevision?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rewardRevision?: number;
}
