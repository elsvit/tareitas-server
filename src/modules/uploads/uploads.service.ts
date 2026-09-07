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

import {
  assertObjectStoragePathForFamily,
  buildObjectStorageKey,
  extensionForContentType,
  isFamilyMediaPath,
  isLegacyUploadPath,
  isObjectStoragePath,
} from './media-path.utils';
import { ObjectStorageService } from './object-storage.service';
import { UploadedImageFile } from './uploads.types';
import { isProduction } from '../../config/object-storage.config';

const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;
const MAX_AUDIO_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/m4a',
  'audio/mp4',
  'audio/aac',
  'audio/x-m4a',
  'audio/3gpp',
  'audio/amr',
  'audio/mpeg',
]);

const IMAGE_MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const AUDIO_MIME_EXTENSION: Record<string, string> = {
  'audio/m4a': '.m4a',
  'audio/mp4': '.m4a',
  'audio/aac': '.aac',
  'audio/x-m4a': '.m4a',
  'audio/3gpp': '.3gp',
  'audio/amr': '.amr',
  'audio/mpeg': '.mp3',
};

@Injectable()
export class UploadsService {
  private readonly uploadsRoot = join(
    process.cwd(),
    'uploads',
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly objectStorage: ObjectStorageService,
  ) {}

  isObjectStorageEnabled(): boolean {
    return this.objectStorage.isEnabled();
  }

  private assertDiskUploadAllowed(): void {
    if (isProduction()) {
      throw new AppException(
        ErrorCode.NOT_FOUND,
        'Disk uploads are disabled in production; configure object storage',
        HttpStatus.NOT_IMPLEMENTED,
      );
    }
  }

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

    this.validateMimeAndSize(
      file.mimetype,
      file.size,
    );
  }

  validatePresignRequest(
    kind: EFamilyImageKind,
    contentType: string,
    contentLength: number,
  ) {
    this.validateMimeAndSize(
      contentType,
      contentLength,
      kind,
    );
  }

  async createPresignedUpload(
    familyId: string,
    kind: EFamilyImageKind,
    contentType: string,
    contentLength: number,
  ) {
    if (!this.objectStorage.isEnabled()) {
      throw new AppException(
        ErrorCode.NOT_FOUND,
        'Object storage is not configured',
        HttpStatus.NOT_IMPLEMENTED,
      );
    }

    this.validatePresignRequest(
      kind,
      contentType,
      contentLength,
    );

    const extension =
      extensionForContentType(contentType, kind) ??
      '.bin';
    const path = buildObjectStorageKey(
      familyId,
      kind,
      extension,
    );
    const uploadUrl =
      await this.objectStorage.createPresignedUploadUrl(
        path,
        contentType,
        contentLength,
      );

    return {
      uploadUrl,
      path,
      expiresIn:
        this.objectStorage.getPresignExpirySeconds(),
    };
  }

  async confirmObjectStorageUpload(
    familyId: string,
    path: string,
    kind: EFamilyImageKind,
    uploadedByUserId: string,
  ) {
    if (!this.objectStorage.isEnabled()) {
      throw new AppException(
        ErrorCode.NOT_FOUND,
        'Object storage is not configured',
        HttpStatus.NOT_IMPLEMENTED,
      );
    }

    try {
      assertObjectStoragePathForFamily(
        familyId,
        path,
        kind,
      );
    } catch {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID,
        'Invalid upload path',
        HttpStatus.BAD_REQUEST,
      );
    }

    const exists =
      await this.objectStorage.objectExists(path);

    if (!exists) {
      throw new AppException(
        ErrorCode.FAMILY_IMAGE_NOT_FOUND,
        'Uploaded file not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.registerFamilyImage(
      familyId,
      path,
      kind,
      uploadedByUserId,
    );

    const url = await this.resolveMediaUrl(path);

    return { path, url };
  }

  async getMediaAccessUrl(
    familyId: string,
    path: string,
  ) {
    if (!isFamilyMediaPath(familyId, path)) {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID,
        'Invalid media path',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (isLegacyUploadPath(path)) {
      return {
        url: path,
        expiresIn: null,
        legacy: true,
      };
    }

    if (!this.objectStorage.isEnabled()) {
      throw new AppException(
        ErrorCode.NOT_FOUND,
        'Object storage is not configured',
        HttpStatus.NOT_FOUND,
      );
    }

    const url =
      await this.objectStorage.createPresignedReadUrl(
        path,
      );

    return {
      url,
      expiresIn:
        this.objectStorage.getPresignExpirySeconds(),
      legacy: false,
    };
  }

  async resolveMediaUrl(
    path: string,
  ): Promise<string | null> {
    if (isObjectStoragePath(path)) {
      if (!this.objectStorage.isEnabled()) {
        return null;
      }

      return this.objectStorage.createPresignedReadUrl(
        path,
      );
    }

    return null;
  }

  async saveFamilyImage(
    familyId: string,
    file: UploadedImageFile,
    uploadedByUserId: string,
    kind?: string,
  ) {
    this.validateFile(file);

    const extension =
      IMAGE_MIME_EXTENSION[file.mimetype] ??
      AUDIO_MIME_EXTENSION[file.mimetype] ??
      (extname(file.originalname).toLowerCase() ||
        '.bin');

    if (
      kind &&
      isFamilyImageKind(kind) &&
      this.objectStorage.isEnabled()
    ) {
      const path = buildObjectStorageKey(
        familyId,
        kind,
        extension,
      );

      await this.objectStorage.putObject(
        path,
        file.buffer,
        file.mimetype,
      );

      await this.registerFamilyImage(
        familyId,
        path,
        kind,
        uploadedByUserId,
      );

      return {
        path,
        filename: path.split('/').pop() ?? path,
      };
    }

    this.assertDiskUploadAllowed();

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
  ): Promise<{
    images: Array<IFamilyImage & { url?: string }>;
  }> {
    const images =
      await this.prisma.familyImage.findMany({
        where: { familyId },
        orderBy: { createdAt: 'desc' },
      });

    const mapped = await Promise.all(
      images.map(async image => {
        const url =
          (await this.resolveMediaUrl(image.path)) ??
          undefined;

        return {
          id: image.id,
          familyId: image.familyId,
          path: image.path,
          kind: image.kind as EFamilyImageKind,
          uploadedByUserId:
            image.uploadedByUserId,
          createdAt:
            image.createdAt.toISOString(),
          url,
        };
      }),
    );

    return { images: mapped };
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

    const inUse = await this.isMediaPathInUse(
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

    await this.deleteStoredFile(familyId, path);

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

  async deleteMediaFileIfExists(
    familyId: string,
    path: string,
  ) {
    if (!isFamilyMediaPath(familyId, path)) {
      return;
    }

    const inUse = await this.isMediaPathInUse(
      familyId,
      path,
    );

    if (inUse) {
      return;
    }

    await this.deleteStoredFile(familyId, path);

    await this.prisma.familyImage.deleteMany({
      where: { familyId, path },
    });
  }

  private validateMimeAndSize(
    mimeType: string,
    size: number,
    kind?: EFamilyImageKind,
  ) {
    const isAudioRequest = kind === 'task_record';
    const isImage = ALLOWED_IMAGE_MIME_TYPES.has(
      mimeType,
    );
    const isAudio = ALLOWED_AUDIO_MIME_TYPES.has(
      mimeType,
    );

    if (isAudioRequest && !isAudio) {
      throw new AppException(
        ErrorCode.VALIDATION_FILE_TYPE_NOT_ALLOWED,
        '',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      !isAudioRequest &&
      kind &&
      !isImage
    ) {
      throw new AppException(
        ErrorCode.VALIDATION_FILE_TYPE_NOT_ALLOWED,
        '',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!isImage && !isAudio) {
      throw new AppException(
        ErrorCode.VALIDATION_FILE_TYPE_NOT_ALLOWED,
        '',
        HttpStatus.BAD_REQUEST,
      );
    }

    const maxSize = isAudio
      ? MAX_AUDIO_FILE_SIZE
      : MAX_IMAGE_FILE_SIZE;

    if (size > maxSize) {
      throw new AppException(
        ErrorCode.VALIDATION_FILE_TOO_LARGE,
        '',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async deleteStoredFile(
    familyId: string,
    path: string,
  ) {
    if (isObjectStoragePath(path)) {
      if (this.objectStorage.isEnabled()) {
        await this.objectStorage
          .deleteObject(path)
          .catch(() => undefined);
      }

      return;
    }

    if (!path.startsWith(`/uploads/${familyId}/`)) {
      return;
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
  }

  private assignmentChangesContainPath(
    changes: unknown,
    path: string,
  ): boolean {
    if (
      !changes ||
      typeof changes !== 'object' ||
      Array.isArray(changes)
    ) {
      return false;
    }

    for (const change of Object.values(changes)) {
      if (
        !change ||
        typeof change !== 'object' ||
        Array.isArray(change)
      ) {
        continue;
      }

      const record = change as Record<string, unknown>;

      if (
        record.picture === path ||
        record.audioRecord === path
      ) {
        return true;
      }
    }

    return false;
  }

  private async isMediaPathInUse(
    familyId: string,
    path: string,
  ): Promise<boolean> {
    const assignments =
      await this.prisma.taskAssignment.findMany({
        where: { familyId },
        select: {
          picture: true,
          changes: true,
        },
      });

    for (const assignment of assignments) {
      if (assignment.picture === path) {
        return true;
      }

      if (
        this.assignmentChangesContainPath(
          assignment.changes,
          path,
        )
      ) {
        return true;
      }
    }

    return this.isImagePathInUse(familyId, path);
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
