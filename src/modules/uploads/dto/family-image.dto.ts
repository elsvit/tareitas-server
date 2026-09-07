import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { FAMILY_IMAGE_KINDS } from '../../../types/family-image';

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

export class PresignUploadDto {
  @IsString()
  @IsIn(FAMILY_IMAGE_KINDS)
  kind!: string;

  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsInt()
  @Min(1)
  contentLength!: number;
}

export class ConfirmUploadDto {
  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsString()
  @IsIn(FAMILY_IMAGE_KINDS)
  kind!: string;
}
