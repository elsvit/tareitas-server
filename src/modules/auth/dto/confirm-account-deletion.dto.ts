import { IsNotEmpty, IsString } from 'class-validator';

import { RequestLangDto } from '../../../common/dto/request-lang.dto';

export class ConfirmAccountDeletionDto extends RequestLangDto {
  @IsString()
  @IsNotEmpty()
  deletionToken!: string;
}
