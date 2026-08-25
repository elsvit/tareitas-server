import {
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

import { SUPPORTED_LANGS } from '../../i18n/supported-langs';

export class RequestLangDto {
  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_LANGS)
  lang?: string;
}
