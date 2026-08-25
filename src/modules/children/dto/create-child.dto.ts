import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { RequestLangDto } from '../../../common/dto/request-lang.dto';

export class CreateChildDto extends RequestLangDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username!: string;

  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'pin must be exactly 4 digits',
  })
  pin!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reward?: number;
}
