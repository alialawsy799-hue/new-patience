import 'server-only';
import { cookies } from 'next/headers';
import { getAdminDictionary, type AdminDictionary } from '@/lib/i18n/admin';
import {
  LOCALE_COOKIE,
  defaultLocale,
  getDirection,
  isLocale,
  type Locale,
} from '@/lib/i18n/config';

/**
 * The admin area is not locale-prefixed, so its language comes entirely from
 * the `pt_locale` cookie the site header (and the dashboard's own toggle) set.
 */
export async function getAdminLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export type AdminLocaleContext = {
  locale: Locale;
  direction: 'rtl' | 'ltr';
  dict: AdminDictionary;
};

export async function getAdminLocaleContext(): Promise<AdminLocaleContext> {
  const locale = await getAdminLocale();
  return { locale, direction: getDirection(locale), dict: getAdminDictionary(locale) };
}
