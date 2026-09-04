import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { fontVariables } from '@/app/fonts';
import { ThemeScript } from '@/components/theme/theme-script';
import { getAdminLocaleContext } from '@/lib/admin/context';
import { THEME_COOKIE } from '@/lib/i18n';

export const metadata = {
  title: { default: 'PATIENCE Admin', template: '%s · PATIENCE Admin' },
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#070708' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default async function AdminRootLayout({ children }: { children: ReactNode }) {
  const { locale, direction } = await getAdminLocaleContext();
  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_COOKIE)?.value === 'dark' ? 'dark' : 'light';

  return (
    <html
      lang={locale === 'ar' ? 'ar' : 'en'}
      dir={direction}
      className={`${fontVariables} no-js ${theme === 'dark' ? 'dark' : ''}`}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-[var(--background)] antialiased">{children}</body>
    </html>
  );
}
