import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { PatienceLogo } from '@/components/brand/logo';
import { HeaderShell } from '@/components/layout/header-shell';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { MobileNav } from '@/components/layout/mobile-nav';
import { NavItem } from '@/components/layout/nav-link';
import { mainNavLinks } from '@/components/layout/nav-links';
import { CartViewToast } from '@/components/store/cart-view-toast';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { getStudentSession } from '@/lib/auth/student';
import { getDictionary, localePath, type Locale } from '@/lib/i18n';
import { getCartItemCount } from '@/lib/store/cart';
import { getSiteSettings } from '@/lib/settings';

export async function SiteHeader({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [student, cartCount, settings] = await Promise.all([
    getStudentSession(),
    getCartItemCount(),
    getSiteSettings(),
  ]);
  const links = mainNavLinks(dict);

  const ctaHref = student ? localePath(locale, '/student') : localePath(locale, '/courses');
  const ctaLabel = student ? dict.nav.myCourses : dict.nav.accessCourse;

  return (
    <HeaderShell>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link
          href={localePath(locale, '/')}
          className="shrink-0 rounded-md transition-opacity hover:opacity-80"
          aria-label={dict.brand.name}
        >
          <PatienceLogo size="md" />
        </Link>

        <nav aria-label={dict.a11y.mainNavigation} className="hidden xl:block">
          <ul className="flex items-center gap-8">
            {links.map((link) => (
              <li key={link.href}>
                <NavItem href={localePath(locale, link.href)} label={link.label} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <LanguageSwitcher
            locale={locale}
            label={locale === 'ar' ? dict.a11y.switchToEnglish : dict.a11y.switchToArabic}
            className="hidden sm:grid"
          />
          <ThemeToggle label={dict.a11y.toggleTheme} className="hidden sm:grid" />

          <Link
            href={ctaHref}
            className="ms-1.5 hidden h-10 items-center gap-2 rounded-full bg-[var(--foreground)] px-5 text-[0.8125rem] font-semibold text-[var(--background)] transition-opacity hover:opacity-90 xl:inline-flex"
          >
            <GraduationCap className="size-4" aria-hidden />
            {ctaLabel}
          </Link>

          <MobileNav
            locale={locale}
            links={links}
            labels={{
              open: dict.nav.openMenu,
              close: dict.nav.closeMenu,
              language: dict.nav.language,
              theme: dict.nav.theme,
              cta: ctaLabel,
              ctaHref,
            }}
          />
        </div>
      </div>
      {settings.store.enabled ? (
        <CartViewToast locale={locale} label={dict.cart.viewCart} count={cartCount} />
      ) : null}
    </HeaderShell>
  );
}
