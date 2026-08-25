import {
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';

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

    return { path, filename };
  }
}
