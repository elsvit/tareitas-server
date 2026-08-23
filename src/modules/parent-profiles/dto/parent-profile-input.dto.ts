import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ParentProfileInputDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
