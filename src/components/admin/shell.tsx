'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  BookOpen,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  PackagePlus,
  ScrollText,
  Settings,
  ShoppingBag,
  Tags,
  Users,
  X,
} from 'lucide-react';
import { PatienceLogo } from '@/components/brand/logo';
import { AdminLanguageToggle } from '@/components/admin/language-toggle';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { cn } from '@/lib/utils';
import type { AdminDictionary } from '@/lib/i18n/admin';
import type { AdminUser } from '@/lib/db/schema';
import type { Locale } from '@/lib/i18n';

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

export function AdminShell({
  admin,
  locale,
  dict,
  children,
}: {
  admin: AdminUser;
  locale: Locale;
  dict: AdminDictionary;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const storeItems: NavItem[] = [
    { href: '/admin/products', label: dict.nav.products, icon: Package },
    { href: '/admin/products/add', label: dict.nav.addProducts, icon: PackagePlus },
    { href: '/admin/categories', label: dict.nav.categories, icon: Tags },
    { href: '/admin/orders', label: dict.nav.orders, icon: ShoppingBag },
  ];

  const groups: { title: string; items: NavItem[] }[] =
    admin.role === 'staff'
      ? [
          {
            title: dict.nav.content,
            items: [{ href: '/admin/codes', label: dict.nav.codes, icon: KeyRound }],
          },
          { title: dict.nav.store, items: storeItems },
        ]
      : [
          {
            title: dict.nav.dashboard,
            items: [{ href: '/admin', label: dict.nav.overview, icon: LayoutDashboard }],
          },
          {
            title: dict.nav.content,
            items: [
              { href: '/admin/codes', label: dict.nav.codes, icon: KeyRound },
              { href: '/admin/students', label: dict.nav.students, icon: Users },
              { href: '/admin/courses', label: dict.nav.courses, icon: BookOpen },
            ],
          },
          { title: dict.nav.store, items: storeItems },
          {
            title: dict.nav.system,
            items: [
              { href: '/admin/messages', label: dict.nav.messages, icon: MessageSquare },
              { href: '/admin/settings', label: dict.nav.settings, icon: Settings },
              { href: '/admin/audit', label: dict.nav.audit, icon: ScrollText },
            ],
          },
        ];

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    if (href === '/admin/products') {
      return (
        pathname === '/admin/products' ||
        (pathname.startsWith('/admin/products/') && !pathname.startsWith('/admin/products/add'))
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function signOut() {
    setSigningOut(true);
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    router.push('/admin/login');
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
            {group.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                        : 'text-[var(--foreground-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--foreground)]',
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const roleLabel =
    admin.role === 'owner'
      ? dict.nav.roleOwner
      : admin.role === 'editor'
        ? dict.nav.roleEditor
        : admin.role === 'staff'
          ? dict.nav.roleStaff
          : dict.nav.roleAdmin;

  const homeHref = admin.role === 'staff' ? '/admin/codes' : '/admin';

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-[var(--border)] bg-[var(--surface)] lg:flex">
        <div className="border-b border-[var(--border)] px-5 py-5">
          <Link href={homeHref} aria-label={dict.nav.dashboard}>
            <PatienceLogo size="sm" />
          </Link>
        </div>
        {nav}
        <div className="border-t border-[var(--border)] p-4 text-xs text-[var(--foreground-subtle)]">
          <p className="font-semibold text-[var(--foreground)]">{admin.name}</p>
          <p className="latin mt-0.5">{admin.email}</p>
          <p className="mt-1">{roleLabel}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--background)]/90 px-4 backdrop-blur-xl">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full lg:hidden"
            aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Link href={`/${locale}`} className="hidden text-sm font-semibold text-[var(--foreground-muted)] hover:text-[var(--accent)] sm:inline">
            {dict.nav.backToSite}
          </Link>
          <div className="ms-auto flex items-center gap-1">
            <AdminLanguageToggle locale={locale} label={dict.nav.toggleLanguage} />
            <ThemeToggle label={dict.nav.toggleTheme} />
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={signingOut}
              className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--foreground)]"
            >
              <LogOut className="size-4" aria-hidden />
              {signingOut ? dict.nav.signingOut : dict.nav.signOut}
            </button>
          </div>
        </header>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-[var(--overlay)]" aria-label={dict.nav.closeMenu} onClick={() => setOpen(false)} />
            <aside className="relative flex h-full w-72 flex-col bg-[var(--surface)] shadow-[var(--shadow-lifted)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                <PatienceLogo size="sm" />
                <button type="button" onClick={() => setOpen(false)} aria-label={dict.nav.closeMenu}>
                  <X className="size-5" />
                </button>
              </div>
              {nav}
            </aside>
          </div>
        ) : null}

        <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
