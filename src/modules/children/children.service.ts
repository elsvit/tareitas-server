import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import * as argon2 from 'argon2';

import { Prisma } from '../../generated/prisma/client';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import { toChild } from './child.mapper';
import { ChildrenRepository } from './children.repository';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

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
      .map((member) => member.user.childProfile)
      .filter(
        (profile): profile is NonNullable<typeof profile> =>
          profile !== null,
      )
      .map(toChild);
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

    return toChild(member.user.childProfile);
  }

  async createChild(
    familyId: string,
    dto: CreateChildDto,
  ) {
    this.validateLoginCredentials(
      dto.username,
      dto.pin,
    );

    let passwordHash: string | undefined;

    if (dto.pin) {
      passwordHash = await argon2.hash(dto.pin);
    }

    try {
      const profile =
        await this.childrenRepository.createChild(
          familyId,
          {
            username: dto.username,
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

      return toChild(profile);
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
      this.validateLoginCredentials(
        dto.username ?? member.user.username ?? undefined,
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

    if (!hasProfileUpdate) {
      return toChild(member.user.childProfile);
    }

    const profile =
      await this.childrenRepository.updateChildProfile(
        childUserId,
        profileUpdate,
      );

    return toChild(profile);
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
        ErrorCode.VALIDATION_ERROR,
        'Pin is required when username is provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (pin && !username) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Username is required when pin is provided',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
