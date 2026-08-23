import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';

import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../../db/prisma.service';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';

import {
  REFRESH_TOKEN_BYTES,
  REFRESH_TOKEN_EXPIRES_IN_DAYS,
} from './auth.constants';

import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: dto.username,
      },
    });

    if (!user || !user.passwordHash) {
      throw new AppException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const validPin = await argon2.verify(
      user.passwordHash,
      dto.pin,
    );

    if (!validPin) {
      throw new AppException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const accessToken = await this.createAccessToken(
      user.id,
      user.username,
    );

    const refreshToken =
      this.generateRefreshToken();

    await this.storeRefreshToken(
      user.id,
      refreshToken,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash =
      this.hashRefreshToken(refreshToken);

    const storedToken =
      await this.prisma.refreshToken.findUnique({
        where: {
          tokenHash,
        },
        include: {
          user: true,
        },
      });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date()
    ) {
      throw new AppException(
        ErrorCode.UNAUTHORIZED,
        'Invalid or expired refresh token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Rotate refresh token.
    await this.prisma.refreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    const newAccessToken =
      await this.createAccessToken(
        storedToken.user.id,
        storedToken.user.username,
      );

    const newRefreshToken =
      this.generateRefreshToken();

    await this.storeRefreshToken(
      storedToken.user.id,
      newRefreshToken,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    const tokenHash =
      this.hashRefreshToken(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      success: true,
    };
  }

  private async createAccessToken(
    userId: string,
    username: string | null,
  ) {
    return this.jwtService.signAsync({
      sub: userId,
      username,
    });
  }

  private generateRefreshToken(): string {
    return crypto
      .randomBytes(REFRESH_TOKEN_BYTES)
      .toString('base64url');
  }

  private hashRefreshToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ) {
    const tokenHash =
      this.hashRefreshToken(refreshToken);

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() +
        REFRESH_TOKEN_EXPIRES_IN_DAYS,
    );

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });
  }
}