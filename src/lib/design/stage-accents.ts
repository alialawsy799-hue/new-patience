/**
 * Stage accents.
 *
 * The brand's secondary palette is organised into three moods — PASSION,
 * CALM and ELEGANT. Each stage borrows one of them so the five courses are
 * instantly distinguishable, while orange stays the platform-level accent.
 */
export type AccentKey = 'orange' | 'elegant' | 'calm' | 'passion' | 'sky';

type Accent = {
  /** Solid brand colour, used for rules, dots and icon fills. */
  color: string;
  /** Tint used behind icons and badges in light mode. */
  soft: string;
  /** Deep tone used for the card's dark-mode wash and for the number plate. */
  deep: string;
  /** Foreground that is legible on `deep`. */
  onDeep: string;
  /** Tailwind classes for the card's ambient gradient wash. */
  wash: string;
  /** Ring/glow colour used on hover. */
  glow: string;
};

export const accents: Record<AccentKey, Accent> = {
  orange: {
    color: '#fe6b05',
    soft: '#fedecb',
    deep: '#5e2117',
    onDeep: '#fedecb',
    wash: 'from-[#fe6b05]/18 via-[#fe6b05]/6 to-transparent',
    glow: 'rgb(254 107 5 / 0.45)',
  },
  elegant: {
    color: '#1b276e',
    soft: '#e0effa',
    deep: '#141c50',
    onDeep: '#e0effa',
    wash: 'from-[#1b276e]/22 via-[#1b276e]/7 to-transparent',
    glow: 'rgb(27 39 110 / 0.45)',
  },
  calm: {
    color: '#195844',
    soft: '#defaee',
    deep: '#123f31',
    onDeep: '#defaee',
    wash: 'from-[#195844]/22 via-[#195844]/7 to-transparent',
    glow: 'rgb(25 88 68 / 0.45)',
  },
  passion: {
    color: '#5e2117',
    soft: '#fedecb',
    deep: '#42170f',
    onDeep: '#fedecb',
    wash: 'from-[#5e2117]/24 via-[#5e2117]/8 to-transparent',
    glow: 'rgb(94 33 23 / 0.45)',
  },
  sky: {
    color: '#3d80c9',
    soft: '#e0effa',
    deep: '#1b3d63',
    onDeep: '#e0effa',
    wash: 'from-[#7dbdfd]/26 via-[#7dbdfd]/8 to-transparent',
    glow: 'rgb(125 189 253 / 0.45)',
  },
};

export function getAccent(key: string | null | undefined): Accent {
  return accents[(key ?? 'orange') as AccentKey] ?? accents.orange;
}

/** Default accent for each stage number, used by the seed data. */
export const stageAccentOrder: AccentKey[] = ['orange', 'elegant', 'calm', 'passion', 'sky'];
