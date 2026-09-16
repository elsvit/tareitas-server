import { IsEmail, Matches } from 'class-validator';

import { RequestLangDto } from '../../../common/dto/request-lang.dto';

export class RequestAccountDeletionDto extends RequestLangDto {
  @IsEmail()
  email!: string;

  @Matches(/^\d{4}$/)
  pin!: string;
}
