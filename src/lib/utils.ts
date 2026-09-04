import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Locale } from '@/lib/i18n/config';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Money is stored in minor units (fils-scale cents: IQD dinars × 100). */
export function formatPrice(cents: number, currency: string, locale: Locale): string {
  const code = currency.toUpperCase();
  const isIqd = code === 'IQD';
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-IQ-u-nu-latn' : 'en-IQ-u-nu-latn', {
    style: 'currency',
    currency: code,
    numberingSystem: 'latn',
    minimumFractionDigits: isIqd || cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: isIqd || cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Always Latin digits (0–9), including on the Arabic site. */
export function formatNumber(value: number, _locale: Locale): string {
  return new Intl.NumberFormat('en-US', { numberingSystem: 'latn' }).format(value);
}

export function formatDate(value: Date | string | null | undefined, locale: Locale): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-IQ-u-nu-latn' : 'en-GB', {
    dateStyle: 'medium',
  }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined, locale: Locale): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-IQ-u-nu-latn' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/** `1h 04m` / `12:35` style duration used by the lesson list and player. */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '00:00';
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function percentage(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** First name only — greetings read better as "مرحباً دكتور علي". */
export function firstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[0] ?? fullName;
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0)).join('').toUpperCase();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
