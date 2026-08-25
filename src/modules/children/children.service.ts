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
import { toChild } from './child.mapper';
import { ChildrenRepository } from './children.repository';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { ERole } from '../../types/user';

type ChildMember = NonNullable<
  Awaited<
    ReturnType<ChildrenRepository['findChildInFamily']>
  >
>;

@Injectable()
export class ChildrenService {
  constructor(
    private readonly childrenRepository: ChildrenRepository,
  ) {}

  async listChildren(familyId: string) {
    const members =
      await this.childrenRepository.findChildrenInFamily(
        familyId,
      );

    return members
      .map((member) => this.mapChildMember(member))
      .filter(
        (child): child is NonNullable<typeof child> =>
          child !== null,
      );
  }

  async getChild(
    familyId: string,
    childUserId: string,
  ) {
    const member =
      await this.childrenRepository.findChildInFamily(
        familyId,
        childUserId,
      );

    if (!member?.user.childProfile) {
      throw new AppException(
        ErrorCode.CHILD_NOT_FOUND,
        'Child not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.mapChildMember(member)!;
  }

  async createChild(
    familyId: string,
    dto: CreateChildDto,
  ) {
    const credentials = validateUserCredentials(
      ERole.child,
      { username: dto.username },
    );
    const passwordHash = await argon2.hash(dto.pin);

    try {
      const profile =
        await this.childrenRepository.createChild(
          familyId,
          {
            username: credentials.username!,
            passwordHash,
            name: dto.name,
            color: dto.color,
            avatar: dto.avatar,
            birthday: dto.birthday
              ? new Date(dto.birthday)
              : undefined,
            reward: dto.reward,
          },
        );

      return toChild(
        profile,
        credentials.username,
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

  async updateChild(
    familyId: string,
    childUserId: string,
    dto: UpdateChildDto,
  ) {
    const member =
      await this.childrenRepository.findChildInFamily(
        familyId,
        childUserId,
      );

    if (!member?.user.childProfile) {
      throw new AppException(
        ErrorCode.CHILD_NOT_FOUND,
        'Child not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.username !== undefined || dto.pin !== undefined) {
      const nextUsername =
        dto.username ?? member.user.username ?? undefined;

      validateUserCredentials(ERole.child, {
        username: nextUsername,
      });

      this.validateLoginCredentials(
        nextUsername,
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
        userUpdate.username = dto.username;
      }

      if (dto.pin) {
        userUpdate.passwordHash =
          await argon2.hash(dto.pin);
      }

      try {
        await this.childrenRepository.updateChildUser(
          childUserId,
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

    const profileUpdate: {
      name?: string;
      color?: string;
      avatar?: string;
      birthday?: Date | null;
      reward?: number;
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

    if (dto.birthday !== undefined) {
      profileUpdate.birthday = dto.birthday
        ? new Date(dto.birthday)
        : null;
    }

    if (dto.reward !== undefined) {
      profileUpdate.reward = dto.reward;
    }

    const hasProfileUpdate =
      Object.keys(profileUpdate).length > 0;

    const nextUsername =
      dto.username ?? member.user.username;

    if (!hasProfileUpdate) {
      return toChild(
        member.user.childProfile,
        nextUsername,
      );
    }

    const profile =
      await this.childrenRepository.updateChildProfile(
        childUserId,
        profileUpdate,
      );

    return toChild(profile, nextUsername);
  }

  async deleteChild(
    familyId: string,
    childUserId: string,
  ) {
    const member =
      await this.childrenRepository.findChildInFamily(
        familyId,
        childUserId,
      );

    if (!member?.user.childProfile) {
      throw new AppException(
        ErrorCode.CHILD_NOT_FOUND,
        'Child not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.childrenRepository.deleteChild(
      familyId,
      childUserId,
    );

    return { success: true };
  }

  private mapChildMember(member: ChildMember) {
    if (!member.user.childProfile) {
      return null;
    }

    return toChild(
      member.user.childProfile,
      member.user.username,
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
