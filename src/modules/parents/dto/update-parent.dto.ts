import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { RequestLangDto } from '../../../common/dto/request-lang.dto';

export class UpdateParentDto extends RequestLangDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @Matches(/^\d{4}$/, {
    message: 'pin must be exactly 4 digits',
  })
  pin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  familyRole?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
