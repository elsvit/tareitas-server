import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { PrismaService } from '../../db/prisma.service';
import { ERole } from '../../types/user';
import { AppException } from '../errors/app.exception';
import { ErrorCode } from '../errors/error-code';
import { REQUIRE_OWNER_KEY } from '../decorators/require-owner.decorator';
import { ROLES_KEY } from '../decorators/require-role.decorator';

@Injectable()
export class FamilyMemberGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<Request>();

    const familyIdParam = request.params.familyId;
    const familyId = Array.isArray(familyIdParam)
      ? familyIdParam[0]
      : familyIdParam;

    if (!familyId) {
      throw new AppException(
        ErrorCode.VALIDATION_FAMILY_ID_REQUIRED,
        '',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!request.user) {
      throw new AppException(
        ErrorCode.UNAUTHORIZED,
        'Authorization token is required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const member =
      await this.prisma.familyMember.findUnique({
        where: {
          familyId_userId: {
            familyId,
            userId: request.user.sub,
          },
        },
      });

    if (!member) {
      throw new AppException(
        ErrorCode.FAMILY_MEMBER_NOT_FOUND,
        'You are not a member of this family',
        HttpStatus.FORBIDDEN,
      );
    }

    request.familyMember = member;

    const requiredRoles =
      this.reflector.getAllAndOverride<ERole[]>(
        ROLES_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (
      requiredRoles?.length &&
      !requiredRoles.includes(
        member.role as ERole,
      )
    ) {
      throw new AppException(
        ErrorCode.FORBIDDEN,
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }

    const requireOwner =
      this.reflector.getAllAndOverride<boolean>(
        REQUIRE_OWNER_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (requireOwner && !member.isOwner) {
      throw new AppException(
        ErrorCode.FORBIDDEN,
        'Only the family owner can perform this action',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
