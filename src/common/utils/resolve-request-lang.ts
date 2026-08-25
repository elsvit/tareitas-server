import { Request } from 'express';

import {
  DEFAULT_LANG,
  SupportedLang,
  normalizeLang,
} from '../../i18n/supported-langs';

function readBodyLang(
  body: unknown,
): SupportedLang | undefined {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('lang' in body)
  ) {
    return undefined;
  }

  return normalizeLang(
    (body as { lang: unknown }).lang,
  );
}

function readAcceptLanguage(
  headerValue: string | undefined,
): SupportedLang | undefined {
  if (!headerValue) {
    return undefined;
  }

  for (const part of headerValue.split(',')) {
    const lang = normalizeLang(
      part.trim().split(';')[0],
    );

    if (lang) {
      return lang;
    }
  }

  return undefined;
}

export function resolveRequestLang(
  request: Request,
): SupportedLang {
  return (
    readBodyLang(request.body) ??
    normalizeLang(request.query.lang) ??
    normalizeLang(request.headers.lang) ??
    readAcceptLanguage(
      request.headers['accept-language'],
    ) ??
    request.lang ??
    DEFAULT_LANG
  );
}
