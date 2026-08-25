import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

import {
  ApiFieldError,
  FieldError,
} from './field-error';
import { ErrorCode } from './error-code';
import { I18nService } from '../../i18n/i18n.service';
import { SupportedLang } from '../../i18n/supported-langs';

function readFieldErrors(
  exceptionResponse: unknown,
): FieldError[] | undefined {
  if (
    typeof exceptionResponse !== 'object' ||
    exceptionResponse === null
  ) {
    return undefined;
  }

  if (
    'errors' in exceptionResponse &&
    Array.isArray(exceptionResponse.errors)
  ) {
    const errors: FieldError[] = [];

    for (const item of exceptionResponse.errors) {
      if (
        typeof item !== 'object' ||
        item === null ||
        !('errorCode' in item) ||
        typeof item.errorCode !== 'string'
      ) {
        continue;
      }

      const field =
        'field' in item &&
        typeof item.field === 'string'
          ? item.field
          : undefined;
      const params =
        'params' in item &&
        typeof item.params === 'object' &&
        item.params !== null
          ? (item.params as Record<
              string,
              string | number
            >)
          : undefined;

      errors.push({
        field,
        errorCode: item.errorCode as ErrorCode,
        ...(params ? { params } : {}),
      });
    }

    if (errors.length) {
      return errors;
    }
  }

  if (
    'errorCode' in exceptionResponse &&
    typeof exceptionResponse.errorCode === 'string' &&
    exceptionResponse.errorCode.startsWith('VALIDATION_') &&
    exceptionResponse.errorCode !==
      ErrorCode.VALIDATION_ERROR
  ) {
    return [
      {
        errorCode:
          exceptionResponse.errorCode as ErrorCode,
      },
    ];
  }

  return undefined;
}

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(
    HttpExceptionFilter.name,
  );

  constructor(
    private readonly i18n: I18nService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = ErrorCode.INTERNAL_ERROR;
    let fieldErrors: FieldError[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        if ('errorCode' in exceptionResponse) {
          const value = exceptionResponse.errorCode;

          if (typeof value === 'string') {
            errorCode = value as ErrorCode;
          }
        } else if (
          status === HttpStatus.BAD_REQUEST
        ) {
          errorCode = ErrorCode.VALIDATION_ERROR;
        }

        fieldErrors = readFieldErrors(
          exceptionResponse,
        );
      } else if (
        status === HttpStatus.BAD_REQUEST
      ) {
        errorCode = ErrorCode.VALIDATION_ERROR;
      }
    }

    const lang = request.lang as
      | SupportedLang
      | undefined;

    if (status >= 500) {
      this.logger.error(exception);
    }

    const errors: ApiFieldError[] | undefined =
      fieldErrors?.length
        ? this.i18n.translateFieldErrors(
            fieldErrors,
            lang,
          )
        : undefined;

    response.status(status).json({
      errorCode,
      errorMessage: this.i18n.translateError(
        errorCode,
        lang,
      ),
      ...(errors?.length ? { errors } : {}),
    });
  }
}
