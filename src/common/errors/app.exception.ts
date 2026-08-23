import { HttpException, HttpStatus } from '@nestjs/common';

import { ErrorCode } from './error-code';

export class AppException extends HttpException {
  constructor(
    errorCode: ErrorCode,
    statusCode: HttpStatus,
  ) {
    super(
      {
        errorCode,
      },
      statusCode,
    );
  }
}