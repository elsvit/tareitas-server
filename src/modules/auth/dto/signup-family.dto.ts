import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { RequestLangDto } from '../../../common/dto/request-lang.dto';

export class SignupAdminDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'PIN must be exactly 4 digits',
  })
  pin!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class SignupChildDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username!: string;

  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'PIN must be exactly 4 digits',
  })
  pin!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class SignupFamilyDto extends RequestLangDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  familyName!: string;

  @ValidateNested()
  @Type(() => SignupAdminDto)
  admin!: SignupAdminDto;

  @ValidateNested()
  @Type(() => SignupChildDto)
  child!: SignupChildDto;
}
