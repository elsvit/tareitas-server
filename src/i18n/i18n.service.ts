import { Injectable } from '@nestjs/common';

import { ErrorCode } from '../common/errors/error-code';
import {
  ApiFieldError,
  FieldError,
} from '../common/errors/field-error';

import en from './locales/en.json';
import es from './locales/es.json';
import bg from './locales/bg.json';
import cs from './locales/cs.json';
import da from './locales/da.json';
import de from './locales/de.json';
import el from './locales/el.json';
import et from './locales/et.json';
import fi from './locales/fi.json';
import fr from './locales/fr.json';
import hr from './locales/hr.json';
import hu from './locales/hu.json';
import it from './locales/it.json';
import lt from './locales/lt.json';
import lv from './locales/lv.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import pt from './locales/pt.json';
import ro from './locales/ro.json';
import sk from './locales/sk.json';
import sl from './locales/sl.json';
import sv from './locales/sv.json';
import uk from './locales/uk.json';

import {
  DEFAULT_LANG,
  FALLBACK_LANG,
  SupportedLang,
} from './supported-langs';

type ErrorMessages = Record<ErrorCode, string>;

const ERROR_MESSAGES: Record<
  SupportedLang,
  ErrorMessages
> = {
  en: en as ErrorMessages,
  es: es as ErrorMessages,
  bg: bg as ErrorMessages,
  cs: cs as ErrorMessages,
  da: da as ErrorMessages,
  de: de as ErrorMessages,
  el: el as ErrorMessages,
  et: et as ErrorMessages,
  fi: fi as ErrorMessages,
  fr: fr as ErrorMessages,
  hr: hr as ErrorMessages,
  hu: hu as ErrorMessages,
  it: it as ErrorMessages,
  lt: lt as ErrorMessages,
  lv: lv as ErrorMessages,
  nl: nl as ErrorMessages,
  pl: pl as ErrorMessages,
  pt: pt as ErrorMessages,
  ro: ro as ErrorMessages,
  sk: sk as ErrorMessages,
  sl: sl as ErrorMessages,
  sv: sv as ErrorMessages,
  uk: uk as ErrorMessages,
};

@Injectable()
export class I18nService {
  translateError(
    errorCode: ErrorCode,
    lang?: SupportedLang,
    params?: Record<string, string | number>,
  ): string {
    const locale = lang ?? DEFAULT_LANG;
    const messages =
      ERROR_MESSAGES[locale] ??
      ERROR_MESSAGES[FALLBACK_LANG];

    let message =
      messages[errorCode] ??
      ERROR_MESSAGES[FALLBACK_LANG][errorCode] ??
      ERROR_MESSAGES[FALLBACK_LANG].INTERNAL_ERROR;

    if (params) {
      for (const [key, value] of Object.entries(
        params,
      )) {
        message = message.replace(
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          String(value),
        );
      }
    }

    return message;
  }

  translateFieldErrors(
    errors: FieldError[],
    lang?: SupportedLang,
  ): ApiFieldError[] {
    return errors.map(error => ({
      field: error.field,
      errorCode: error.errorCode,
      errorMessage: this.translateError(
        error.errorCode,
        lang,
        error.params,
      ),
    }));
  }
}
