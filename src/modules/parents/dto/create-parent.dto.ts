import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { RequestLangDto } from '../../../common/dto/request-lang.dto';

export class CreateParentDto extends RequestLangDto {
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
