import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { locales } from '@/lib/i18n';

const pages = ['', '/courses', '/store', '/contact', '/about', '/privacy', '/terms'];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return locales.flatMap((locale) =>
    pages.map((path) => ({
      url: `${env.siteUrl}/${locale}${path}`,
      lastModified,
      changeFrequency: path === '' ? 'weekly' : 'monthly',
      priority: path === '' ? 1 : 0.7,
      alternates: {
        languages: {
          ar: `${env.siteUrl}/ar${path}`,
          en: `${env.siteUrl}/en${path}`,
        },
      },
    })),
  );
}
