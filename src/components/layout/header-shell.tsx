'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Adds the elevated/blurred treatment only once the page has scrolled, so the
 * hero meets the header edge-to-edge on load.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-80 w-full transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled
          ? 'border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      {children}
    </header>
  );
}
