import {
  IsString,
  Matches,
} from 'class-validator';

export class LoginDto {
  @IsString()
  username!: string;

  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'PIN must be exactly 4 digits',
  })
  pin!: string;
}