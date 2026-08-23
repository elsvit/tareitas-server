import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-code';

export class AppException extends HttpException {
  constructor(
    errorCode: ErrorCode,
    message: string,
    status: HttpStatus,
  ) {
    super(
      {
        errorCode,
        message,
      },
      status,
    );
  }
}