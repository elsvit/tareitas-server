import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { AccountDeletionService } from './account-deletion.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthService } from './auth.service';
import { ConfirmAccountDeletionDto } from './dto/confirm-account-deletion.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RequestAccountDeletionDto } from './dto/request-account-deletion.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupFamilyDto } from './dto/signup-family.dto';
import { VerifyAccountDeletionDto } from './dto/verify-account-deletion.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountDeletionService: AccountDeletionService,
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

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('delete-account/request')
  requestAccountDeletion(
    @Body() dto: RequestAccountDeletionDto,
  ) {
    return this.accountDeletionService.requestDeletion(dto);
  }

  @Post('delete-account/verify')
  verifyAccountDeletion(
    @Body() dto: VerifyAccountDeletionDto,
  ) {
    return this.accountDeletionService.verifyDeletion(dto);
  }

  @Post('delete-account/confirm')
  confirmAccountDeletion(
    @Body() dto: ConfirmAccountDeletionDto,
  ) {
    return this.accountDeletionService.confirmDeletion(dto);
  }
}