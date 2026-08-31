import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import { PrismaService } from '../../db/prisma.service';
import { ERole } from '../../types/user';

import { UpdateMemberProfileDto } from './dto/update-member-profile.dto';

@Injectable()
export class FamilyMembersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async updateMyProfile(
    familyId: string,
    userId: string,
    dto: UpdateMemberProfileDto,
  ) {
    const member =
      await this.prisma.familyMember.findFirst({
        where: {
          familyId,
          userId,
        },
        include: {
          user: {
            include: {
              parentProfile: true,
              childProfile: true,
            },
          },
        },
      });

    if (!member) {
      throw new AppException(
        ErrorCode.USER_NOT_FOUND,
        'Member not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (member.role === ERole.child) {
      if (!member.user.childProfile) {
        throw new AppException(
          ErrorCode.CHILD_NOT_FOUND,
          'Child not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const profile =
        await this.prisma.childProfile.update({
          where: { userId },
          data: {
            ...(dto.name !== undefined
              ? { name: dto.name }
              : {}),
            ...(dto.color !== undefined
              ? { color: dto.color }
              : {}),
            ...(dto.avatar !== undefined
              ? { avatar: dto.avatar }
              : {}),
          },
        });

      return {
        userId,
        role: ERole.child,
        name: profile.name,
        color: profile.color ?? undefined,
        avatar: profile.avatar ?? undefined,
      };
    }

    if (
      member.role === ERole.admin ||
      member.role === ERole.parent
    ) {
      if (!member.user.parentProfile) {
        throw new AppException(
          ErrorCode.USER_NOT_FOUND,
          'Parent not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const profile =
        await this.prisma.parentProfile.update({
          where: { userId },
          data: {
            ...(dto.name !== undefined
              ? { name: dto.name }
              : {}),
            ...(dto.color !== undefined
              ? { color: dto.color }
              : {}),
            ...(dto.avatar !== undefined
              ? { avatar: dto.avatar }
              : {}),
          },
        });

      if (dto.familyRole !== undefined) {
        await this.prisma.familyMember.update({
          where: {
            familyId_userId: {
              familyId,
              userId,
            },
          },
          data: {
            familyRole: dto.familyRole,
          },
        });
      }

      const isAdmin =
        member.isOwner &&
        member.role === ERole.admin;

      return {
        userId,
        role: isAdmin ? ERole.admin : member.role,
        name: profile.name,
        color: profile.color ?? undefined,
        avatar: profile.avatar ?? undefined,
        familyRole:
          dto.familyRole ??
          member.familyRole ??
          undefined,
      };
    }

    throw new AppException(
      ErrorCode.USER_NOT_FOUND,
      'Member not found',
      HttpStatus.NOT_FOUND,
    );
  }
}
