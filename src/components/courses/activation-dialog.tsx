'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChoiceField, TextField } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/states';
import { getDictionary, interpolate, localePath, type Locale } from '@/lib/i18n';

type ActivationDialogProps = {
  locale: Locale;
  open: boolean;
  onClose: () => void;
  /** Restricts the code to one stage; omit to accept a code for any stage. */
  stageId?: string;
  stageTitle: string;
};

type ApiFailure = {
  error: string;
  details?: { reason?: string; retryAfterSeconds?: number };
};

export function ActivationDialog({
  locale,
  open,
  onClose,
  stageId,
  stageTitle,
}: ActivationDialogProps) {
  const dict = getDictionary(locale);
  const router = useRouter();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('doctor_male');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ code?: string; name?: string }>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [successName, setSuccessName] = useState('');

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFieldErrors({});
    setStatus('idle');
  }, [open]);

  /** Maps a server error code onto a translated, human message. */
  function messageFor(failure: ApiFailure): string {
    switch (failure.error) {
      case 'invalid_format':
      case 'invalid_code':
        return dict.errors.invalidCode;
      case 'already_used':
        return dict.errors.usedCode;
      case 'revoked':
        return dict.errors.revokedCode;
      case 'stage_mismatch':
        return dict.errors.codeWrongStage;
      case 'stage_unavailable':
        return dict.errors.notFound;
      case 'rate_limited': {
        const minutes = Math.max(1, Math.ceil((failure.details?.retryAfterSeconds ?? 60) / 60));
        return interpolate(dict.errors.rateLimited, { minutes });
      }
      case 'invalid_origin':
      case 'forbidden':
        return dict.errors.forbidden;
      default:
        return dict.errors.generic;
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextFieldErrors: { code?: string; name?: string } = {};
    if (!code.trim()) nextFieldErrors.code = dict.errors.codeRequired;
    if (!name.trim()) nextFieldErrors.name = dict.errors.nameRequired;
    else if (name.trim().length < 2) nextFieldErrors.name = dict.errors.nameTooShort;

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    setError(null);
    setStatus('submitting');

    try {
      const response = await fetch('/api/activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, title, locale, stageId }),
      });

      const payload = (await response.json()) as ApiFailure & {
        ok?: boolean;
        student?: { displayName: string };
        stageSlug?: string;
      };

      if (!response.ok || !payload.ok) {
        setStatus('idle');
        setError(messageFor(payload));
        return;
      }

      setSuccessName(payload.student?.displayName ?? name.trim());
      setStatus('success');

      // Give the success state a beat to land before navigating.
      const destination = localePath(locale, `/student/course/${payload.stageSlug}`);
      setTimeout(() => {
        router.push(destination);
        router.refresh();
      }, 1100);
    } catch {
      setStatus('idle');
      setError(dict.errors.network);
    }
  }

  return (
    <Modal
      open={open}
      onClose={status === 'submitting' ? () => {} : onClose}
      closeLabel={dict.common.close}
      title={status === 'success' ? undefined : dict.activation.title}
      description={
        status === 'success'
          ? undefined
          : interpolate(dict.activation.subtitle, { stage: stageTitle })
      }
    >
      {status === 'success' ? (
        <div className="flex animate-[pop_0.4s_var(--ease-out-quint)_both] flex-col items-center gap-4 py-6 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-[var(--success-muted)] text-[var(--success)]">
            <CheckCircle2 className="size-8" aria-hidden />
          </div>
          <h2 className="text-xl font-bold">{dict.activation.successTitle}</h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            {interpolate(dict.activation.successBody, { name: successName })}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {error ? <Alert tone="danger">{error}</Alert> : null}

          <TextField
            label={dict.activation.codeLabel}
            placeholder={dict.activation.codePlaceholder}
            hint={dict.activation.codeHelp}
            error={fieldErrors.code}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
            dir="ltr"
            className="latin text-center text-base font-bold tracking-[0.14em]"
            required
          />

          <TextField
            label={dict.activation.nameLabel}
            placeholder={dict.activation.namePlaceholder}
            error={fieldErrors.name}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />

          <ChoiceField
            label={dict.activation.titleLabel}
            name="student-title"
            value={title}
            onChange={setTitle}
            options={[
              { value: 'doctor_male', label: dict.activation.titleDoctorMale },
              { value: 'doctor_female', label: dict.activation.titleDoctorFemale },
              { value: 'none', label: dict.activation.titleNone },
            ]}
          />

          <Button
            type="submit"
            size="lg"
            loading={status === 'submitting'}
            icon={status === 'submitting' ? undefined : <KeyRound className="size-4.5" aria-hidden />}
          >
            {status === 'submitting' ? dict.activation.submitting : dict.activation.submit}
          </Button>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-[var(--foreground-subtle)]">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {dict.activation.privacyNote}
          </p>
        </form>
      )}
    </Modal>
  );
}
