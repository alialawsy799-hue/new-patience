import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_COOKIE, isLocale, locales, negotiateLocale } from '@/lib/i18n/config';

/**
 * Locale routing.
 *
 * Every public page lives under `/ar/...` or `/en/...` so the two languages get
 * distinct, indexable URLs. A request without a prefix is redirected using the
 * saved preference first, then `Accept-Language`.
 *
 * `/admin` and `/api` are intentionally excluded — they are not localised by URL.
 */
const PUBLIC_FILE = /\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|webmanifest|woff2?)$/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split('/')[1];
  if (isLocale(firstSegment)) {
    // Keep the cookie in step with the URL the visitor actually chose.
    const response = NextResponse.next();
    if (request.cookies.get(LOCALE_COOKIE)?.value !== firstSegment) {
      response.cookies.set(LOCALE_COOKIE, firstSegment, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
    }
    return response;
  }

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : negotiateLocale(request.headers.get('accept-language'));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Everything except Next internals and files with an extension.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
  runtime: 'nodejs',
};

export const supportedLocales = locales;
