import type { ReactNode } from 'react';
import './globals.css';

/**
 * Next.js requires a root layout, but `lang` and `dir` depend on the locale
 * segment, so the real `<html>` element is rendered by `app/[locale]/layout.tsx`
 * (and by `app/admin/layout.tsx` for the dashboard).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
