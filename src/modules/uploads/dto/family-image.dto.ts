import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { FAMILY_IMAGE_KINDS } from '../../types/family-image';

export class DeleteFamilyImageDto {
  @IsString()
  @IsNotEmpty()
  path!: string;
}

export class UploadFamilyImageDto {
  @IsOptional()
  @IsString()
  @IsIn(FAMILY_IMAGE_KINDS)
  kind?: string;
}
