import { HttpStatus } from '@nestjs/common';

import { AppException } from '../errors/app.exception';
import { ErrorCode } from '../errors/error-code';
import { ERole } from '../../types/user';

export type UserCredentials = {
  email?: string | null;
  username?: string | null;
};

function normalizeCredential(
  value?: string | null,
): string | undefined {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

export function validateUserCredentials(
  role: ERole.admin | ERole.parent | ERole.child,
  credentials: UserCredentials,
): {
  email?: string;
  username?: string;
} {
  const email = normalizeCredential(
    credentials.email,
  );
  const username = normalizeCredential(
    credentials.username,
  );

  if (role === ERole.admin) {
    if (!email) {
      throw new AppException(
        ErrorCode.VALIDATION_EMAIL_REQUIRED,
        '',
        HttpStatus.BAD_REQUEST,
        [
          {
            field: 'email',
            errorCode:
              ErrorCode.VALIDATION_EMAIL_REQUIRED,
          },
        ],
      );
    }

    if (username) {
      throw new AppException(
        ErrorCode.VALIDATION_ADMIN_EMAIL_ONLY,
        '',
        HttpStatus.BAD_REQUEST,
        [
          {
            field: 'username',
            errorCode:
              ErrorCode.VALIDATION_ADMIN_EMAIL_ONLY,
          },
        ],
      );
    }

    return { email };
  }

  if (!username) {
    throw new AppException(
      ErrorCode.VALIDATION_USERNAME_REQUIRED,
      '',
      HttpStatus.BAD_REQUEST,
      [
        {
          field: 'username',
          errorCode:
            ErrorCode.VALIDATION_USERNAME_REQUIRED,
        },
      ],
    );
  }

  if (email) {
    throw new AppException(
      ErrorCode.VALIDATION_USERNAME_ONLY,
      '',
      HttpStatus.BAD_REQUEST,
      [
        {
          field: 'email',
          errorCode:
            ErrorCode.VALIDATION_USERNAME_ONLY,
        },
      ],
    );
  }

  return { username };
}

export function requireUsername(
  username: string | null | undefined,
): string {
  const normalized = normalizeCredential(username);

  if (!normalized) {
    throw new AppException(
      ErrorCode.VALIDATION_USERNAME_REQUIRED,
      '',
      HttpStatus.BAD_REQUEST,
      [
        {
          field: 'username',
          errorCode:
            ErrorCode.VALIDATION_USERNAME_REQUIRED,
        },
      ],
    );
  }

  return normalized;
}

export function requireAdminEmail(
  email: string | null | undefined,
): string {
  const normalized = normalizeCredential(email);

  if (!normalized) {
    throw new AppException(
      ErrorCode.VALIDATION_EMAIL_REQUIRED,
      '',
      HttpStatus.BAD_REQUEST,
      [
        {
          field: 'email',
          errorCode:
            ErrorCode.VALIDATION_EMAIL_REQUIRED,
        },
      ],
    );
  }

  return normalized;
}
