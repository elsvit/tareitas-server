import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import * as argon2 from 'argon2';

import { Prisma } from '../../generated/prisma/client';

import { PrismaService } from '../../db/prisma.service';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';

import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateUserDto) {
    if (!dto.username && !dto.email) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Username or email is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const passwordHash = await argon2.hash(dto.pin);

    try {
      const user = await this.prisma.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          passwordHash,
        },
      });

      return this.toPublicUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppException(
          ErrorCode.USER_ALREADY_EXISTS,
          'User already exists',
          HttpStatus.CONFLICT,
        );
      }

      throw error;
    }
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppException(
        ErrorCode.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toPublicUser(user);
  }

  private toPublicUser(user: {
    id: string;
    username: string | null;
    email: string | null;
    passwordHash: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}