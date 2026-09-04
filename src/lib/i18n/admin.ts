import { adminAr } from './dictionaries/admin-ar';
import { adminEn, type AdminDictionary } from './dictionaries/admin-en';
import { defaultLocale, type Locale } from './config';

const adminDictionaries: Record<Locale, AdminDictionary> = { ar: adminAr, en: adminEn };

export function getAdminDictionary(locale: Locale): AdminDictionary {
  return adminDictionaries[locale] ?? adminDictionaries[defaultLocale];
}

export type { AdminDictionary };
