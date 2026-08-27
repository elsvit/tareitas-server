import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import { PrismaService } from '../../db/prisma.service';
import {
  EFamilyImageKind,
  IFamilyImage,
  isFamilyImageKind,
} from '../../types/family-image';

import { UploadedImageFile } from './uploads.types';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Injectable()
export class UploadsService {
  private readonly uploadsRoot = join(
    process.cwd(),
    'uploads',
  );

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  validateFile(
    file: UploadedImageFile | undefined,
  ) {
    if (!file) {
      throw new AppException(
        ErrorCode.VALIDATION_FILE_REQUIRED,
        '',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new AppException(
        ErrorCode.VALIDATION_FILE_TOO_LARGE,
        '',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      !ALLOWED_MIME_TYPES.has(file.mimetype)
    ) {
      throw new AppException(
        ErrorCode.VALIDATION_FILE_TYPE_NOT_ALLOWED,
        '',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async saveFamilyImage(
    familyId: string,
    file: UploadedImageFile,
    uploadedByUserId: string,
    kind?: string,
  ) {
    this.validateFile(file);

    const extension =
      MIME_EXTENSION[file.mimetype] ??
      (extname(file.originalname).toLowerCase() ||
        '.jpg');

    const filename = `${randomUUID()}${extension}`;
    const familyDir = join(
      this.uploadsRoot,
      familyId,
    );
    const absolutePath = join(
      familyDir,
      filename,
    );

    await mkdir(familyDir, { recursive: true });
    await writeFile(absolutePath, file.buffer);

    const path = `/uploads/${familyId}/${filename}`;

    if (kind && isFamilyImageKind(kind)) {
      await this.registerFamilyImage(
        familyId,
        path,
        kind,
        uploadedByUserId,
      );
    }

    return { path, filename };
  }

  async listFamilyImages(
    familyId: string,
  ): Promise<{ images: IFamilyImage[] }> {
    const images =
      await this.prisma.familyImage.findMany({
        where: { familyId },
        orderBy: { createdAt: 'desc' },
      });

    return {
      images: images.map(image => ({
        id: image.id,
        familyId: image.familyId,
        path: image.path,
        kind: image.kind as EFamilyImageKind,
        uploadedByUserId:
          image.uploadedByUserId,
        createdAt:
          image.createdAt.toISOString(),
      })),
    };
  }

  async deleteFamilyImage(
    familyId: string,
    path: string,
  ) {
    const image =
      await this.prisma.familyImage.findFirst({
        where: { familyId, path },
      });

    if (!image) {
      throw new AppException(
        ErrorCode.FAMILY_IMAGE_NOT_FOUND,
        'Image not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const inUse = await this.isImagePathInUse(
      familyId,
      path,
    );

    if (inUse) {
      throw new AppException(
        ErrorCode.FAMILY_IMAGE_IN_USE,
        'Image is in use',
        HttpStatus.CONFLICT,
      );
    }

    const relativePath = path.replace(
      /^\/uploads\//,
      '',
    );
    const absolutePath = join(
      this.uploadsRoot,
      relativePath,
    );

    await unlink(absolutePath).catch(() => undefined);

    await this.prisma.familyImage.delete({
      where: { id: image.id },
    });
  }

  async registerFamilyImage(
    familyId: string,
    path: string,
    kind: EFamilyImageKind,
    uploadedByUserId: string,
  ) {
    await this.prisma.familyImage.upsert({
      where: {
        familyId_path: {
          familyId,
          path,
        },
      },
      create: {
        familyId,
        path,
        kind,
        uploadedByUserId,
      },
      update: {},
    });
  }

  private async isImagePathInUse(
    familyId: string,
    path: string,
  ): Promise<boolean> {
    const familyMemberFilter = {
      user: {
        familyMembers: {
          some: { familyId },
        },
      },
    };

    const [
      taskAssignment,
      reward,
      taskBaseItem,
      rewardBaseItem,
      parentProfile,
      childProfile,
    ] = await Promise.all([
      this.prisma.taskAssignment.findFirst({
        where: { familyId, picture: path },
        select: { id: true },
      }),
      this.prisma.reward.findFirst({
        where: { familyId, picture: path },
        select: { id: true },
      }),
      this.prisma.taskBaseItem.findFirst({
        where: { familyId, picture: path },
        select: { id: true },
      }),
      this.prisma.rewardBaseItem.findFirst({
        where: { familyId, picture: path },
        select: { id: true },
      }),
      this.prisma.parentProfile.findFirst({
        where: {
          avatar: path,
          ...familyMemberFilter,
        },
        select: { userId: true },
      }),
      this.prisma.childProfile.findFirst({
        where: {
          avatar: path,
          ...familyMemberFilter,
        },
        select: { userId: true },
      }),
    ]);

    return !!(
      taskAssignment ||
      reward ||
      taskBaseItem ||
      rewardBaseItem ||
      parentProfile ||
      childProfile
    );
  }
}
