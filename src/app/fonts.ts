import { Archivo, Cairo, Inter, Playfair_Display } from 'next/font/google';

/**
 * Typography, mapped to the brand guidelines' TYPE page.
 *
 * - Arabic headings there are set in EskanderW05-Heavy, a heavy modern Arabic
 *   face. Cairo at weight 900 is the closest widely-available match; if you
 *   license Eskander, add it as a `next/font/local` here and swap the variable.
 * - Latin product titles use Trust 1A xBlack — a very heavy grotesque. Archivo
 *   at 800/900 carries the same weight and width.
 * - The wordmark is a high-contrast serif; Playfair Display matches its
 *   thick/thin modulation.
 *
 * All four are self-hosted by next/font, so there is no third-party request and
 * no layout shift.
 */

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

export const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
  weight: ['600', '700', '800', '900'],
});

export const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['600', '700'],
});

export const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-cairo',
  weight: ['400', '500', '600', '700', '900'],
});

export const fontVariables = [
  inter.variable,
  archivo.variable,
  playfair.variable,
  cairo.variable,
].join(' ');
