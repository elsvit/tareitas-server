import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupFamilyDto } from './dto/signup-family.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @Post('signup')
  signup(@Body() dto: SignupFamilyDto) {
    return this.authService.signupFamily(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }
}