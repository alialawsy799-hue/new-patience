import { ar } from './dictionaries/ar';
import { en, type Dictionary } from './dictionaries/en';
import { defaultLocale, type Locale } from './config';

const dictionaries: Record<Locale, Dictionary> = { ar, en };

/**
 * Dictionaries are plain objects imported statically, so they are available in
 * both server and client components without an extra request or bundle split.
 */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

/** Replaces `{placeholders}` — used for greetings, counts and order numbers. */
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export type { Dictionary };
export * from './config';
