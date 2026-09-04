import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Send, Twitter, Youtube } from 'lucide-react';
import { PatienceLogo } from '@/components/brand/logo';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { getDictionary, interpolate, localePath, type Locale } from '@/lib/i18n';
import { activeSocialLinks, getSiteSettings } from '@/lib/settings';

const socialIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  telegram: Send,
  x: Twitter,
  linkedin: Linkedin,
};

export async function SiteFooter({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();
  const socials = activeSocialLinks(settings);

  const explore = [
    { href: '/courses', label: dict.nav.courses },
    { href: '/store', label: dict.nav.store },
    { href: '/about', label: dict.nav.about },
  ];

  const support = [
    { href: '/contact', label: dict.nav.contact },
    { href: '/student', label: dict.nav.myCourses },
  ];

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background-muted)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-5">
            <Link href={localePath(locale, '/')} aria-label={dict.brand.name} className="w-fit">
              <PatienceLogo size="lg" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-[var(--foreground-muted)]">
              {locale === 'ar' ? settings.general.taglineAr : settings.general.taglineEn}
            </p>
            {socials.length > 0 ? (
              <div className="flex items-center gap-2">
                {socials.map(({ key, url }) => {
                  const Icon = socialIcons[key] ?? Send;
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      aria-label={key}
                      className="grid size-9 place-items-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      <Icon className="size-4" aria-hidden />
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>

          <nav aria-label={dict.footer.explore} className="flex flex-col gap-4">
            <h2 className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[var(--foreground-subtle)]">
              {dict.footer.explore}
            </h2>
            <ul className="flex flex-col gap-3">
              {explore.map((link) => (
                <li key={link.href}>
                  <Link
                    href={localePath(locale, link.href)}
                    className="text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--accent)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={dict.footer.support} className="flex flex-col gap-4">
            <h2 className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[var(--foreground-subtle)]">
              {dict.footer.support}
            </h2>
            <ul className="flex flex-col gap-3">
              {support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={localePath(locale, link.href)}
                    className="text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--accent)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {settings.contact.email ? (
                <li>
                  <a
                    href={`mailto:${settings.contact.email}`}
                    className="latin text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--accent)]"
                  >
                    {settings.contact.email}
                  </a>
                </li>
              ) : null}
              {settings.contact.phone ? (
                <li>
                  <a
                    href={`tel:${settings.contact.phone.replace(/\s/g, '')}`}
                    className="latin text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--accent)]"
                  >
                    {settings.contact.phone}
                  </a>
                </li>
              ) : null}
            </ul>
          </nav>

          <div className="flex flex-col gap-4">
            <h2 className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[var(--foreground-subtle)]">
              {dict.nav.language}
            </h2>
            <LanguageSwitcher
              locale={locale}
              label={locale === 'ar' ? dict.a11y.switchToEnglish : dict.a11y.switchToArabic}
              variant="full"
              className="-mx-4 w-auto justify-start bg-transparent px-4"
            />
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 sm:flex-row">
          <p className="text-xs text-[var(--foreground-subtle)]">
            {interpolate(dict.footer.rights, { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-4 text-xs text-[var(--foreground-subtle)]">
            <Link href={localePath(locale, '/privacy')} className="hover:text-[var(--accent)]">
              {dict.footer.privacy}
            </Link>
            <Link href={localePath(locale, '/terms')} className="hover:text-[var(--accent)]">
              {dict.footer.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
