import { IsEmail, IsOptional, IsString, MaxLength, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsString()
  // @MinLength(8)
  @Matches(/^\d{4}$/, {
    message: 'pin must be exactly 4 digits',
  })
  pin!: string;
  // password!: string;
}