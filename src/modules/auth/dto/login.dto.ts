import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

import { RequestLangDto } from '../../../common/dto/request-lang.dto';

export class LoginDto extends RequestLangDto {
  @ValidateIf(dto => !dto.email)
  @IsString()
  username?: string;

  @ValidateIf(dto => !dto.username)
  @IsEmail()
  email?: string;

  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'PIN must be exactly 4 digits',
  })
  pin!: string;
}