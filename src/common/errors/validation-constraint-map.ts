import { ErrorCode } from './error-code';

const CONSTRAINT_ERROR_CODE: Record<
  string,
  ErrorCode
> = {
  isNotEmpty: ErrorCode.VALIDATION_REQUIRED,
  minLength: ErrorCode.VALIDATION_MIN_LENGTH,
  maxLength: ErrorCode.VALIDATION_MAX_LENGTH,
  isString: ErrorCode.VALIDATION_STRING,
  isEmail: ErrorCode.VALIDATION_EMAIL,
  matches: ErrorCode.VALIDATION_FORMAT,
  isEnum: ErrorCode.VALIDATION_ENUM,
  isNumber: ErrorCode.VALIDATION_NUMBER,
  isInt: ErrorCode.VALIDATION_INTEGER,
  min: ErrorCode.VALIDATION_MIN,
  max: ErrorCode.VALIDATION_MAX,
  isDateString: ErrorCode.VALIDATION_DATE,
  isBoolean: ErrorCode.VALIDATION_BOOLEAN,
  isArray: ErrorCode.VALIDATION_ARRAY,
  isUuid: ErrorCode.VALIDATION_UUID,
  isIn: ErrorCode.VALIDATION_IN,
  whitelistValidation:
    ErrorCode.VALIDATION_UNKNOWN_FIELD,
  nestedValidation: ErrorCode.VALIDATION_INVALID,
  validateNested: ErrorCode.VALIDATION_INVALID,
};

function readNumber(
  value: unknown,
): number | undefined {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : undefined;
  }

  return undefined;
}

function firstNumberInMessage(
  message: string,
): number | undefined {
  const match = message.match(/(\d+(?:\.\d+)?)/);

  if (!match) {
    return undefined;
  }

  return readNumber(match[1]);
}

export function mapConstraintToErrorCode(
  field: string,
  constraintKey: string,
): ErrorCode {
  if (
    constraintKey === 'matches' &&
    (field === 'pin' || field.endsWith('.pin'))
  ) {
    return ErrorCode.VALIDATION_PIN_FORMAT;
  }

  return (
    CONSTRAINT_ERROR_CODE[constraintKey] ??
    ErrorCode.VALIDATION_INVALID
  );
}

export function extractConstraintParams(
  field: string,
  constraintKey: string,
  message: string,
  contexts?: Record<string, unknown>,
): Record<string, string | number> | undefined {
  const context = contexts?.[constraintKey];

  switch (constraintKey) {
    case 'minLength': {
      const min =
        readNumber(
          (context as { min?: unknown })?.min,
        ) ?? firstNumberInMessage(message);

      return min !== undefined ? { min } : undefined;
    }
    case 'maxLength': {
      const max =
        readNumber(
          (context as { max?: unknown })?.max,
        ) ?? firstNumberInMessage(message);

      return max !== undefined ? { max } : undefined;
    }
    case 'min': {
      const min =
        readNumber(
          (context as { min?: unknown })?.min,
        ) ?? firstNumberInMessage(message);

      return min !== undefined ? { min } : undefined;
    }
    case 'max': {
      const max =
        readNumber(
          (context as { max?: unknown })?.max,
        ) ?? firstNumberInMessage(message);

      return max !== undefined ? { max } : undefined;
    }
    case 'whitelistValidation':
      return { field };
    default:
      return undefined;
  }
}
