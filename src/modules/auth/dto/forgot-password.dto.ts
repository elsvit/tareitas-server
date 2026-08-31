import { IsEmail } from 'class-validator';

import { RequestLangDto } from '../../../common/dto/request-lang.dto';

export class ForgotPasswordDto extends RequestLangDto {
  @IsEmail()
  email!: string;
}
