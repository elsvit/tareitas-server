import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { RequestLangDto } from '../../../common/dto/request-lang.dto';

export class UpdateMemberProfileDto extends RequestLangDto {
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

  @IsOptional()
  @IsString()
  @MaxLength(30)
  familyRole?: string;
}
