import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class SubtaskDto {
  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsOptional()
  @IsBoolean()
  isPhoto?: boolean;

  @IsOptional()
  @IsBoolean()
  isAudio?: boolean;
}
