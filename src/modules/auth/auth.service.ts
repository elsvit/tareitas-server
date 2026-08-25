import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';

import { JwtService } from '@nestjs/jwt';

import { Prisma } from '../../generated/prisma/client';

import { PrismaService } from '../../db/prisma.service';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import {
  validateUserCredentials,
} from '../../common/utils/user-credentials';
import { toFamilyResponse } from '../families/family.mapper';
import { ERole } from '../../types/user';

import {
  REFRESH_TOKEN_BYTES,
  REFRESH_TOKEN_EXPIRES_IN_DAYS,
} from './auth.constants';

import { LoginDto } from './dto/login.dto';
import { SignupFamilyDto } from './dto/signup-family.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    if (!dto.username && !dto.email) {
      throw new AppException(
        ErrorCode.VALIDATION_LOGIN_IDENTIFIER_REQUIRED,
        '',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.email && dto.username) {
      throw new AppException(
        ErrorCode.VALIDATION_LOGIN_IDENTIFIER_EXCLUSIVE,
        '',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = dto.username
      ? await this.prisma.user.findUnique({
          where: { username: dto.username },
        })
      : await this.prisma.user.findUnique({
          where: { email: dto.email! },
        });

    if (!user || !user.passwordHash) {
      throw new AppException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (dto.email && !user.email) {
      throw new AppException(
        ErrorCode.INVALID_CREDENTIALS,
        'Use username to sign in for this account',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (dto.username && !user.username) {
      throw new AppException(
        ErrorCode.INVALID_CREDENTIALS,
        'Use email to sign in for this account',
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

    const membership =
      await this.prisma.familyMember.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      });

    const role = membership
      ? membership.isOwner &&
        membership.role === ERole.admin
        ? ERole.admin
        : (membership.role as ERole)
      : user.email
        ? ERole.admin
        : ERole.parent;

    const accessToken = await this.createAccessToken(
      user.id,
      user.username,
      user.email,
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
        role,
        familyId: membership?.familyId ?? null,
      },
    };
  }

  async signupFamily(dto: SignupFamilyDto) {
    const adminCredentials = validateUserCredentials(
      ERole.admin,
      { email: dto.admin.email },
    );
    const childCredentials = validateUserCredentials(
      ERole.child,
      { username: dto.child.username },
    );

    const adminPasswordHash = await argon2.hash(
      dto.admin.pin,
    );
    const childPasswordHash = await argon2.hash(
      dto.child.pin,
    );

    try {
      const family = await this.prisma.$transaction(
        async tx => {
          const adminUser = await tx.user.create({
            data: {
              email: adminCredentials.email,
              passwordHash: adminPasswordHash,
            },
          });

          const createdFamily = await tx.family.create({
            data: {
              name: dto.familyName,
            },
          });

          await tx.familyMember.create({
            data: {
              familyId: createdFamily.id,
              userId: adminUser.id,
              role: ERole.admin,
              isOwner: true,
            },
          });

          await tx.parentProfile.create({
            data: {
              userId: adminUser.id,
              name: dto.admin.name,
              color: dto.admin.color,
              avatar: dto.admin.avatar,
            },
          });

          const childUser = await tx.user.create({
            data: {
              username: childCredentials.username,
              passwordHash: childPasswordHash,
            },
          });

          await tx.childProfile.create({
            data: {
              userId: childUser.id,
              name: dto.child.name,
              color: dto.child.color,
              avatar: dto.child.avatar,
            },
          });

          await tx.familyMember.create({
            data: {
              familyId: createdFamily.id,
              userId: childUser.id,
              role: ERole.child,
            },
          });

          return tx.family.findUnique({
            where: { id: createdFamily.id },
            include: {
              members: {
                include: {
                  user: {
                    include: {
                      parentProfile: true,
                      childProfile: true,
                    },
                  },
                },
                orderBy: { createdAt: 'asc' },
              },
            },
          });
        },
      );

      if (!family) {
        throw new AppException(
          ErrorCode.INTERNAL_ERROR,
          'Family creation failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const adminMember = family.members.find(
        member => member.isOwner,
      );

      if (!adminMember) {
        throw new AppException(
          ErrorCode.INTERNAL_ERROR,
          'Admin user not found after signup',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const accessToken = await this.createAccessToken(
        adminMember.userId,
        adminMember.user.username,
        adminMember.user.email,
      );

      const refreshToken =
        this.generateRefreshToken();

      await this.storeRefreshToken(
        adminMember.userId,
        refreshToken,
      );

      return {
        accessToken,
        refreshToken,
        user: {
          id: adminMember.userId,
          username: adminMember.user.username,
          email: adminMember.user.email,
          role: ERole.admin,
          familyId: family.id,
        },
        family: toFamilyResponse(family),
      };
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppException(
          ErrorCode.USER_ALREADY_EXISTS,
          'Email or username already exists',
          HttpStatus.CONFLICT,
        );
      }

      throw error;
    }
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
        storedToken.user.email,
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
    email: string | null,
  ) {
    return this.jwtService.signAsync({
      sub: userId,
      username,
      email,
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
