import { HttpException, HttpStatus } from '@nestjs/common';

import { FieldError } from './field-error';
import { ErrorCode } from './error-code';

export class AppException extends HttpException {
  constructor(
    errorCode: ErrorCode,
    message: string,
    status: HttpStatus,
    errors?: FieldError[],
  ) {
    super(
      {
        errorCode,
        message,
        ...(errors?.length ? { errors } : {}),
      },
      status,
    );
  }
}