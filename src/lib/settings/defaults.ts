export const SETTINGS_KEY = 'site';

export type SiteSettings = {
  general: {
    siteName: string;
    taglineAr: string;
    taglineEn: string;
  };
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    addressAr: string;
    addressEn: string;
    hoursAr: string;
    hoursEn: string;
  };
  social: {
    instagram: string;
    facebook: string;
    youtube: string;
    telegram: string;
    x: string;
    linkedin: string;
  };
  hero: {
    titleAr: string;
    titleEn: string;
    subtitleAr: string;
    subtitleEn: string;
  };
  course: {
    /** Playback percentage at which a lesson auto-completes (0 disables it). */
    autoCompleteThreshold: number;
    /** Whether students may tick a lesson complete themselves. */
    allowManualCompletion: boolean;
    /** Whether students may un-tick a completed lesson. */
    allowUncompletion: boolean;
  };
  store: {
    enabled: boolean;
    currency: string;
    shippingFlatCents: number;
    freeShippingOverCents: number;
  };
  /** Bot that receives new store orders. Token stays server-side. */
  telegramOrders: {
    botToken: string;
    chatId: string;
  };
};

/**
 * Every value an administrator can reasonably change lives here rather than in
 * the markup. Contact details are intentionally blank: the UI shows a
 * "not configured yet" state instead of inventing a phone number.
 */
export const defaultSettings: SiteSettings = {
  general: {
    siteName: 'PATIENCE',
    taglineAr: 'تعليم منظَّم ومتميّز.',
    taglineEn: 'Premium structured education.',
  },
  contact: {
    email: '',
    phone: '',
    whatsapp: '',
    addressAr: '',
    addressEn: '',
    hoursAr: '',
    hoursEn: '',
  },
  social: {
    instagram: '',
    facebook: '',
    youtube: '',
    telegram: '',
    x: '',
    linkedin: '',
  },
  hero: {
    titleAr: '',
    titleEn: '',
    subtitleAr: '',
    subtitleEn: '',
  },
  course: {
    autoCompleteThreshold: 92,
    allowManualCompletion: true,
    allowUncompletion: true,
  },
  store: {
    enabled: false,
    currency: 'IQD',
    shippingFlatCents: 0,
    freeShippingOverCents: 0,
  },
  telegramOrders: {
    botToken: '',
    chatId: '',
  },
};

export function mergeSettings(stored: unknown): SiteSettings {
  if (!stored || typeof stored !== 'object') return defaultSettings;
  const value = stored as Partial<SiteSettings>;
  return {
    general: { ...defaultSettings.general, ...value.general },
    contact: { ...defaultSettings.contact, ...value.contact },
    social: { ...defaultSettings.social, ...value.social },
    hero: { ...defaultSettings.hero, ...value.hero },
    course: { ...defaultSettings.course, ...value.course },
    store: { ...defaultSettings.store, ...value.store },
    telegramOrders: { ...defaultSettings.telegramOrders, ...value.telegramOrders },
  };
}

/** Filters out the blank placeholders so the UI can hide empty social links. */
export function activeSocialLinks(settings: SiteSettings): { key: string; url: string }[] {
  return Object.entries(settings.social)
    .filter(([, url]) => url.trim().length > 0)
    .map(([key, url]) => ({ key, url }));
}
