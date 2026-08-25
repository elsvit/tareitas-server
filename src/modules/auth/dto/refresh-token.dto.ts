import { IsNotEmpty, IsString } from 'class-validator';

import { RequestLangDto } from '../../../common/dto/request-lang.dto';

export class RefreshTokenDto extends RequestLangDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}