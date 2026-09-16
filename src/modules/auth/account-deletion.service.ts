import {
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import { PrismaService } from '../../db/prisma.service';
import { ERole } from '../../types/user';
import { EmailService } from '../email/email.service';
import { UploadsService } from '../uploads/uploads.service';

import {
  ACCOUNT_DELETION_TOKEN_EXPIRES_IN,
  PASSWORD_RESET_CODE_EXPIRES_IN_MINUTES,
  PASSWORD_RESET_CODE_LENGTH,
  PASSWORD_RESET_MAX_ATTEMPTS,
} from './auth.constants';
import { ConfirmAccountDeletionDto } from './dto/confirm-account-deletion.dto';
import { RequestAccountDeletionDto } from './dto/request-account-deletion.dto';
import { VerifyAccountDeletionDto } from './dto/verify-account-deletion.dto';

type AccountDeletionTokenPayload = {
  sub: string;
  familyId: string;
  purpose: 'account_deletion';
};

@Injectable()
export class AccountDeletionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => UploadsService))
    private readonly uploadsService: UploadsService,
  ) {}

  async requestDeletion(dto: RequestAccountDeletionDto) {
    const adminOwner = await this.findAdminOwnerByEmail(
      dto.email.trim().toLowerCase(),
    );

    if (!adminOwner) {
      throw new AppException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const validPin = await argon2.verify(
      adminOwner.user.passwordHash!,
      dto.pin,
    );

    if (!validPin) {
      throw new AppException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.prisma.accountDeletionCode.deleteMany({
      where: { userId: adminOwner.user.id },
    });

    const code = this.generateVerificationCode();
    const codeHash = await argon2.hash(code);
    const expiresAt = new Date();

    expiresAt.setMinutes(
      expiresAt.getMinutes() +
        PASSWORD_RESET_CODE_EXPIRES_IN_MINUTES,
    );

    await this.prisma.accountDeletionCode.create({
      data: {
        userId: adminOwner.user.id,
        familyId: adminOwner.family.id,
        codeHash,
        expiresAt,
      },
    });

    await this.emailService.sendAccountDeletionCode(
      adminOwner.user.email!,
      code,
    );

    return {
      success: true,
      familyName: adminOwner.family.name,
    };
  }

  async verifyDeletion(dto: VerifyAccountDeletionDto) {
    const email = dto.email.trim().toLowerCase();
    const adminOwner = await this.findAdminOwnerByEmail(email);

    if (!adminOwner) {
      throw new AppException(
        ErrorCode.PASSWORD_RESET_INVALID_CODE,
        'Invalid or expired verification code',
        HttpStatus.BAD_REQUEST,
      );
    }

    const deletionCode =
      await this.prisma.accountDeletionCode.findFirst({
        where: { userId: adminOwner.user.id },
        orderBy: { createdAt: 'desc' },
      });

    if (!deletionCode) {
      throw new AppException(
        ErrorCode.PASSWORD_RESET_INVALID_CODE,
        'Invalid or expired verification code',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (deletionCode.expiresAt <= new Date()) {
      await this.prisma.accountDeletionCode.delete({
        where: { id: deletionCode.id },
      });

      throw new AppException(
        ErrorCode.PASSWORD_RESET_CODE_EXPIRED,
        'Verification code has expired',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (deletionCode.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
      throw new AppException(
        ErrorCode.PASSWORD_RESET_TOO_MANY_ATTEMPTS,
        'Too many invalid attempts',
        HttpStatus.BAD_REQUEST,
      );
    }

    const validCode = await argon2.verify(
      deletionCode.codeHash,
      dto.code,
    );

    if (!validCode) {
      await this.prisma.accountDeletionCode.update({
        where: { id: deletionCode.id },
        data: {
          attempts: { increment: 1 },
        },
      });

      throw new AppException(
        ErrorCode.PASSWORD_RESET_INVALID_CODE,
        'Invalid or expired verification code',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.accountDeletionCode.delete({
      where: { id: deletionCode.id },
    });

    const deletionToken = await this.jwtService.signAsync(
      {
        sub: adminOwner.user.id,
        familyId: adminOwner.family.id,
        purpose: 'account_deletion',
      } satisfies AccountDeletionTokenPayload,
      {
        expiresIn: ACCOUNT_DELETION_TOKEN_EXPIRES_IN,
      },
    );

    return {
      success: true,
      deletionToken,
      familyName: adminOwner.family.name,
    };
  }

  async confirmDeletion(dto: ConfirmAccountDeletionDto) {
    const payload = await this.verifyDeletionToken(
      dto.deletionToken,
    );

    await this.deleteFamilyAndUsers(payload.familyId);

    return {
      success: true,
    };
  }

  private async verifyDeletionToken(
    deletionToken: string,
  ): Promise<AccountDeletionTokenPayload> {
    try {
      const payload =
        await this.jwtService.verifyAsync<AccountDeletionTokenPayload>(
          deletionToken,
        );

      if (
        payload.purpose !== 'account_deletion' ||
        !payload.sub ||
        !payload.familyId
      ) {
        throw new Error('Invalid token purpose');
      }

      return payload;
    } catch {
      throw new AppException(
        ErrorCode.ACCOUNT_DELETION_INVALID_TOKEN,
        'Invalid or expired deletion token',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async deleteFamilyAndUsers(familyId: string) {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      include: {
        members: true,
      },
    });

    if (!family) {
      return;
    }

    const userIds = [
      ...new Set([
        family.ownerUserId,
        ...family.members.map(member => member.userId),
      ]),
    ];

    await this.uploadsService.purgeFamilyStorage(familyId);

    await this.prisma.$transaction(async tx => {
      await tx.refreshToken.updateMany({
        where: {
          userId: { in: userIds },
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      await tx.family.delete({
        where: { id: familyId },
      });

      for (const userId of userIds) {
        await tx.user.delete({
          where: { id: userId },
        });
      }
    });
  }

  private async findAdminOwnerByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        familyMembers: {
          include: {
            family: true,
          },
        },
        ownedFamily: true,
      },
    });

    if (!user?.passwordHash || !user.email) {
      return null;
    }

    const ownerMembership = user.familyMembers.find(
      member =>
        member.isOwner && member.role === ERole.admin,
    );

    const family =
      user.ownedFamily ??
      ownerMembership?.family ??
      null;

    if (!family || !ownerMembership) {
      return null;
    }

    return {
      user,
      family,
    };
  }

  private generateVerificationCode(): string {
    const max = 10 ** PASSWORD_RESET_CODE_LENGTH;
    const code = crypto.randomInt(0, max);

    return code
      .toString()
      .padStart(PASSWORD_RESET_CODE_LENGTH, '0');
  }
}
