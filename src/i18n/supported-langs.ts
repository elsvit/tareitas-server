export const SUPPORTED_LANGS = [
  'bg',
  'cs',
  'da',
  'de',
  'el',
  'en',
  'es',
  'et',
  'fi',
  'fr',
  'hr',
  'hu',
  'it',
  'lt',
  'lv',
  'nl',
  'pl',
  'pt',
  'ro',
  'sk',
  'sl',
  'sv',
  'uk',
] as const;

export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: SupportedLang = 'en';
export const FALLBACK_LANG: SupportedLang = 'en';

export function isSupportedLang(
  value: unknown,
): value is SupportedLang {
  return (
    typeof value === 'string' &&
    SUPPORTED_LANGS.includes(value as SupportedLang)
  );
}

export function normalizeLang(
  value: unknown,
): SupportedLang | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (isSupportedLang(normalized)) {
    return normalized;
  }

  const primary = normalized.split('-')[0];

  if (isSupportedLang(primary)) {
    return primary;
  }

  return undefined;
}
