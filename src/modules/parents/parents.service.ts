import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import * as argon2 from 'argon2';

import { Prisma } from '../../generated/prisma/client';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import {
  validateUserCredentials,
} from '../../common/utils/user-credentials';
import { ERole } from '../../types/user';

import { toParent } from './parent.mapper';
import { ParentsRepository } from './parents.repository';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';

type ParentMember = NonNullable<
  Awaited<
    ReturnType<ParentsRepository['findParentInFamily']>
  >
>;

@Injectable()
export class ParentsService {
  constructor(
    private readonly parentsRepository: ParentsRepository,
  ) {}

  async listParents(familyId: string) {
    const members =
      await this.parentsRepository.findParentsInFamily(
        familyId,
      );

    return members
      .filter(
        member =>
          member.role === ERole.parent &&
          !member.isOwner,
      )
      .map(member => this.mapParentMember(member))
      .filter(
        (parent): parent is NonNullable<typeof parent> =>
          parent !== null,
      );
  }

  async getParent(
    familyId: string,
    parentUserId: string,
  ) {
    const member =
      await this.parentsRepository.findParentInFamily(
        familyId,
        parentUserId,
      );

    if (
      !member?.user.parentProfile ||
      member.isOwner ||
      member.role !== ERole.parent
    ) {
      throw new AppException(
        ErrorCode.USER_NOT_FOUND,
        'Parent not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.mapParentMember(member)!;
  }

  async createParent(
    familyId: string,
    dto: CreateParentDto,
  ) {
    validateUserCredentials(ERole.parent, {
      username: dto.username,
    });

    const passwordHash = await argon2.hash(dto.pin);

    try {
      const created =
        await this.parentsRepository.createParent(
          familyId,
          {
            username: dto.username.trim(),
            passwordHash,
            name: dto.name,
            familyRole: dto.familyRole,
            color: dto.color,
            avatar: dto.avatar,
          },
        );

      return toParent(
        created.parentProfile,
        created.user.username,
        created.member,
      );
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppException(
          ErrorCode.USER_ALREADY_EXISTS,
          'Username already exists',
          HttpStatus.CONFLICT,
        );
      }

      throw error;
    }
  }

  async updateParent(
    familyId: string,
    parentUserId: string,
    dto: UpdateParentDto,
  ) {
    const member =
      await this.parentsRepository.findParentInFamily(
        familyId,
        parentUserId,
      );

    if (
      !member?.user.parentProfile ||
      member.isOwner ||
      member.role !== ERole.parent
    ) {
      throw new AppException(
        ErrorCode.USER_NOT_FOUND,
        'Parent not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.username !== undefined || dto.pin !== undefined) {
      this.validateLoginCredentials(
        dto.username ??
          member.user.username ??
          undefined,
        dto.pin,
        dto.username === undefined,
      );
    }

    if (dto.username || dto.pin) {
      const userUpdate: {
        username?: string;
        passwordHash?: string;
      } = {};

      if (dto.username) {
        userUpdate.username = dto.username.trim();
      }

      if (dto.pin) {
        userUpdate.passwordHash =
          await argon2.hash(dto.pin);
      }

      try {
        await this.parentsRepository.updateParentUser(
          parentUserId,
          userUpdate,
        );
      } catch (error) {
        if (
          error instanceof
            Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new AppException(
            ErrorCode.USER_ALREADY_EXISTS,
            'Username already exists',
            HttpStatus.CONFLICT,
          );
        }

        throw error;
      }
    }

    if (dto.familyRole !== undefined) {
      await this.parentsRepository.updateParentMember(
        familyId,
        parentUserId,
        { familyRole: dto.familyRole },
      );
    }

    const profileUpdate: {
      name?: string;
      color?: string;
      avatar?: string;
    } = {};

    if (dto.name !== undefined) {
      profileUpdate.name = dto.name;
    }

    if (dto.color !== undefined) {
      profileUpdate.color = dto.color;
    }

    if (dto.avatar !== undefined) {
      profileUpdate.avatar = dto.avatar;
    }

    let profile = member.user.parentProfile;

    if (Object.keys(profileUpdate).length > 0) {
      profile =
        await this.parentsRepository.updateParentProfile(
          parentUserId,
          profileUpdate,
        );
    }

    const updatedMember =
      await this.parentsRepository.findParentInFamily(
        familyId,
        parentUserId,
      );

    return toParent(
      profile,
      dto.username ?? member.user.username,
      {
        role: updatedMember?.role ?? member.role,
        familyRole:
          updatedMember?.familyRole ??
          member.familyRole,
        isOwner: false,
      },
    );
  }

  async deleteParent(
    familyId: string,
    parentUserId: string,
  ) {
    const member =
      await this.parentsRepository.findParentInFamily(
        familyId,
        parentUserId,
      );

    if (
      !member ||
      member.isOwner ||
      member.role !== ERole.parent
    ) {
      throw new AppException(
        ErrorCode.USER_NOT_FOUND,
        'Parent not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.parentsRepository.deleteParent(
      familyId,
      parentUserId,
    );

    return { success: true };
  }

  private mapParentMember(member: ParentMember) {
    if (
      !member.user.parentProfile ||
      member.isOwner ||
      member.role !== ERole.parent
    ) {
      return null;
    }

    return toParent(
      member.user.parentProfile,
      member.user.username,
      member,
    );
  }

  private validateLoginCredentials(
    username?: string,
    pin?: string,
    pinOnlyUpdate = false,
  ) {
    if (pinOnlyUpdate && pin && !username) {
      return;
    }

    if (username && !pin) {
      throw new AppException(
        ErrorCode.VALIDATION_PIN_REQUIRED_WITH_USERNAME,
        '',
        HttpStatus.BAD_REQUEST,
        [
          {
            field: 'pin',
            errorCode:
              ErrorCode.VALIDATION_PIN_REQUIRED_WITH_USERNAME,
          },
        ],
      );
    }

    if (pin && !username) {
      throw new AppException(
        ErrorCode.VALIDATION_USERNAME_REQUIRED_WITH_PIN,
        '',
        HttpStatus.BAD_REQUEST,
        [
          {
            field: 'username',
            errorCode:
              ErrorCode.VALIDATION_USERNAME_REQUIRED_WITH_PIN,
          },
        ],
      );
    }
  }
}
