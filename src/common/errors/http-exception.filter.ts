import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { ErrorCode } from './error-code';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = ErrorCode.INTERNAL_ERROR;
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        if ('errorCode' in exceptionResponse) {
          errorCode = exceptionResponse.errorCode as ErrorCode;
        }

        if ('message' in exceptionResponse) {
          const message = exceptionResponse.message;

          if (Array.isArray(message)) {
            errorCode = ErrorCode.VALIDATION_ERROR;
            details = message;
          }
        }
      }
    }

    response.status(status).json({
      errorCode,
      ...(details !== undefined && { details }),
    });
  }
}