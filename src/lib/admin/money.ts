/** Parses a human money string ("249", "249.5", "249.50") into integer cents. */
export function parseMoneyToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, frac = ''] = trimmed.split('.');
  return Number.parseInt(whole, 10) * 100 + Number.parseInt((frac + '00').slice(0, 2), 10);
}

export function centsToInput(cents: number | null | undefined): string {
  const value = Math.max(0, Math.trunc(cents ?? 0));
  const whole = Math.floor(value / 100);
  const frac = value % 100;
  return frac === 0 ? String(whole) : `${whole}.${String(frac).padStart(2, '0')}`;
}
