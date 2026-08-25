import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { ERole } from '../../../types/user';

export class CreateUserDto {
  @IsIn([ERole.admin, ERole.parent], {
    message: 'role must be admin or parent',
  })
  role!: ERole.admin | ERole.parent;

  @ValidateIf(dto => dto.role === ERole.admin)
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email?: string;

  @ValidateIf(dto => dto.role === ERole.parent)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'pin must be exactly 4 digits',
  })
  pin!: string;
}
