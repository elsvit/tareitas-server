import {
  IsEmail,
  IsString,
  Matches,
} from 'class-validator';

import { RequestLangDto } from '../../../common/dto/request-lang.dto';

export class ResetPasswordDto extends RequestLangDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'Code must be exactly 6 digits',
  })
  code!: string;

  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'PIN must be exactly 4 digits',
  })
  newPin!: string;
}
