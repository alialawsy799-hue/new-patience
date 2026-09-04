'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { THEME_COOKIE } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark';

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeToggle({ label, className }: { label: string; className?: string }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.style.colorScheme = next;
    // Persisted in a cookie (not localStorage) so the server renders the right
    // theme on the very first response and there is no flash.
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={mounted ? theme === 'dark' : undefined}
      className={cn(
        'relative grid size-9 place-items-center rounded-full text-[var(--foreground-muted)]',
        'transition-colors duration-200 hover:bg-[var(--surface-sunken)] hover:text-[var(--foreground)]',
        className,
      )}
    >
      <Sun
        className={cn(
          'absolute size-[1.05rem] transition-all duration-300 ease-[var(--ease-out-quint)]',
          theme === 'dark' ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
        )}
        aria-hidden
      />
      <Moon
        className={cn(
          'absolute size-[1.05rem] transition-all duration-300 ease-[var(--ease-out-quint)]',
          theme === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0',
        )}
        aria-hidden
      />
    </button>
  );
}
