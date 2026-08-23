import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { ErrorCode } from './error-code';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(
    HttpExceptionFilter.name,
  );

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = ErrorCode.INTERNAL_ERROR;

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'errorCode' in exceptionResponse
      ) {
        const value = exceptionResponse.errorCode;

        if (typeof value === 'string') {
          errorCode = value as ErrorCode;
        }
      }
    }

    // Log the real exception on the server.
    // Do not expose internal details to the mobile app.
    if (status >= 500) {
      this.logger.error(exception);
    }

    response.status(status).json({
      errorCode,
    });
  }
}