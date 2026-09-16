import { IsEmail, Matches } from 'class-validator';

import { RequestLangDto } from '../../../common/dto/request-lang.dto';

export class VerifyAccountDeletionDto extends RequestLangDto {
  @IsEmail()
  email!: string;

  @Matches(/^\d{6}$/)
  code!: string;
}
