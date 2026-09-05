import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { fontVariables } from '@/app/fonts';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { ThemeScript } from '@/components/theme/theme-script';
import { publicEnv } from '@/lib/public-env';
import {
  THEME_COOKIE,
  getDictionary,
  getDirection,
  isLocale,
  locales,
  localeMeta,
  type Locale,
} from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dict = getDictionary(locale);
  const title = `${dict.brand.name} — ${dict.brand.tagline}`;

  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: {
      default: title,
      template: `%s · ${dict.brand.name}`,
    },
    description: dict.brand.tagline,
    applicationName: dict.brand.name,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ar: '/ar',
        en: '/en',
        'x-default': '/ar',
      },
    },
    openGraph: {
      type: 'website',
      siteName: dict.brand.name,
      title,
      description: dict.brand.tagline,
      locale: locale === 'ar' ? 'ar_AR' : 'en_US',
      alternateLocale: locale === 'ar' ? 'en_US' : 'ar_AR',
      url: `/${locale}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: dict.brand.tagline,
    },
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/icon.svg', type: 'image/svg+xml' },
      ],
      apple: '/apple-icon.png',
    },
    robots: { index: true, follow: true },
  };
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#070708' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const direction = getDirection(locale);

  // The theme is resolved on the server from the cookie so the very first
  // painted frame is already correct; ThemeScript only covers first visits.
  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_COOKIE)?.value === 'dark' ? 'dark' : 'light';

  return (
    <html
      lang={localeMeta[locale].htmlLang}
      dir={direction}
      className={`${fontVariables} no-js ${theme === 'dark' ? 'dark' : ''}`}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-[var(--background)] antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-100 focus:rounded-full focus:bg-[var(--accent)] focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-[var(--accent-foreground)]"
        >
          {dict.a11y.skipToContent}
        </a>

        <div className="flex min-h-dvh flex-col">
          <SiteHeader locale={locale} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter locale={locale} />
        </div>
      </body>
    </html>
  );
}
