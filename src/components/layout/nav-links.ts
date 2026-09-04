import type { Dictionary } from '@/lib/i18n';

export type NavLink = { href: string; label: string };

export function mainNavLinks(dict: Dictionary): NavLink[] {
  return [
    { href: '/', label: dict.nav.home },
    { href: '/courses', label: dict.nav.courses },
    { href: '/store', label: dict.nav.store },
    { href: '/contact', label: dict.nav.contact },
  ];
}
