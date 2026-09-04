'use client';

import { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button, ButtonLink } from '@/components/ui/button';
import { getDictionary, interpolate, localePath, type Locale } from '@/lib/i18n';
import { formatDate, formatNumber } from '@/lib/utils';

type CompletionCelebrationProps = {
  locale: Locale;
  open: boolean;
  onClose: () => void;
  studentName: string;
  stageTitle: string;
  lessonsCompleted: number;
};

/**
 * Shown the first time a stage reaches 100%. The stage-completion record is
 * written server-side, so this fires once per stage rather than on every visit.
 */
export function CompletionCelebration({
  locale,
  open,
  onClose,
  studentName,
  stageTitle,
  lessonsCompleted,
}: CompletionCelebrationProps) {
  const dict = getDictionary(locale);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  return (
    <Modal open={open} onClose={onClose} closeLabel={dict.common.close} className="sm:max-w-md">
      <div className="flex flex-col items-center gap-6 pb-2 text-center">
        <div
          className="relative grid size-24 place-items-center rounded-full bg-[var(--accent-muted)]"
          style={reduceMotion ? undefined : { animation: 'pop 0.6s var(--ease-out-quint) both' }}
        >
          <GraduationCap className="size-11 text-[var(--accent)]" aria-hidden />
          {!reduceMotion ? (
            <span className="absolute inset-0 rounded-full border-2 border-[var(--accent)]/40 animate-[unlock_1.2s_var(--ease-out-quint)_both]" />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-display text-2xl font-bold tracking-tight">
            {interpolate(dict.completion.title, { name: studentName })}
          </h3>
          <p className="text-[var(--foreground-muted)]">
            {interpolate(dict.completion.body, { stage: stageTitle })}
          </p>
        </div>

        <dl className="grid w-full grid-cols-3 gap-px overflow-hidden rounded-2xl bg-[var(--border)] text-center">
          <Stat label={dict.completion.percent} value="100%" />
          <Stat
            label={dict.completion.lessonsCompleted}
            value={formatNumber(lessonsCompleted, locale)}
          />
          <Stat label={dict.completion.completedOn} value={formatDate(new Date(), locale)} small />
        </dl>

        <p className="text-xs text-[var(--foreground-subtle)]">{dict.completion.certificateSoon}</p>

        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Button onClick={onClose} className="flex-1">
            {dict.completion.reviewLessons}
          </Button>
          <ButtonLink href={localePath(locale, '/courses')} variant="secondary" className="flex-1">
            {dict.completion.backToCourses}
          </ButtonLink>
        </div>
      </div>
    </Modal>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex flex-col gap-1 bg-[var(--surface)] px-2 py-4">
      <dd
        className={
          small
            ? 'latin text-xs font-bold tracking-tight'
            : 'latin tabular text-lg font-bold tracking-tight text-[var(--accent)]'
        }
      >
        {value}
      </dd>
      <dt className="text-[0.6875rem] leading-tight text-[var(--foreground-subtle)]">{label}</dt>
    </div>
  );
}
