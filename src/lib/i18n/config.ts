export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar';

export const LOCALE_COOKIE = 'pt_locale';
export const THEME_COOKIE = 'pt_theme';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export const localeMeta: Record<Locale, { label: string; nativeLabel: string; htmlLang: string }> = {
  ar: { label: 'Arabic', nativeLabel: 'العربية', htmlLang: 'ar' },
  en: { label: 'English', nativeLabel: 'English', htmlLang: 'en' },
};

/** Prefixes a path with the active locale, e.g. `/courses` → `/ar/courses`. */
export function localePath(locale: Locale, path: string): string {
  const normalized = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalized}`;
}

/** Swaps the locale segment of an existing pathname, preserving the rest. */
export function switchLocalePath(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    segments[0] = nextLocale;
    return `/${segments.join('/')}`;
  }
  return `/${nextLocale}${pathname === '/' ? '' : pathname}`;
}

/** Picks the best supported locale from an `Accept-Language` header. */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      const quality = q ? Number.parseFloat(q.split('=')[1] ?? '1') : 1;
      return { tag: tag.trim().toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}
