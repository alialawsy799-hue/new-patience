import { getDictionary, interpolate, type Locale } from '@/lib/i18n';
import type { StudentTitle } from '@/lib/db/schema';
import { firstName } from '@/lib/utils';

/**
 * Builds "مرحباً دكتور علي" / "Welcome Dr. Ali".
 *
 * The honorific comes from an explicit choice the student made during
 * activation rather than from guessing gender out of the name — guessing is
 * unreliable in Arabic and getting it wrong is a poor first impression.
 */
export function studentGreeting(
  locale: Locale,
  name: string,
  title: StudentTitle,
): string {
  const dict = getDictionary(locale);
  const template =
    title === 'doctor_male'
      ? dict.student.greetingDoctorMale
      : title === 'doctor_female'
        ? dict.student.greetingDoctorFemale
        : dict.student.greetingPlain;

  return interpolate(template, { name: firstName(name) });
}

/** "دكتور علي" / "Dr. Ali" — for the completion screen and admin lists. */
export function studentDisplayName(
  locale: Locale,
  name: string,
  title: StudentTitle,
): string {
  const dict = getDictionary(locale);
  if (title === 'none') return firstName(name);

  const honorific =
    title === 'doctor_female' ? dict.activation.titleDoctorFemale : dict.activation.titleDoctorMale;

  return locale === 'ar' ? `${honorific} ${firstName(name)}` : `Dr. ${firstName(name)}`;
}
