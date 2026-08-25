import { ValidationError } from 'class-validator';

import { ErrorCode } from './error-code';
import {
  extractConstraintParams,
  mapConstraintToErrorCode,
} from './validation-constraint-map';

export type FieldError = {
  field?: string;
  errorCode: ErrorCode;
  params?: Record<string, string | number>;
};

export type ApiFieldError = {
  field?: string;
  errorCode: ErrorCode;
  errorMessage: string;
};

export function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): FieldError[] {
  const result: FieldError[] = [];

  for (const error of errors) {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      for (const [
        constraintKey,
        message,
      ] of Object.entries(error.constraints)) {
        const errorCode = mapConstraintToErrorCode(
          field,
          constraintKey,
        );
        const params = extractConstraintParams(
          field,
          constraintKey,
          message,
          error.contexts,
        );

        result.push({
          field,
          errorCode,
          ...(params ? { params } : {}),
        });
      }
    }

    if (error.children?.length) {
      result.push(
        ...flattenValidationErrors(
          error.children,
          field,
        ),
      );
    }
  }

  return result;
}
