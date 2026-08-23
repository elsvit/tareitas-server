import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsUUID()
  assignedToUserId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  points?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
