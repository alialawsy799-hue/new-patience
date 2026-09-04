'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SelectField, TextAreaField, TextField } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/states';
import { interpolate } from '@/lib/i18n';
import type { AdminDictionary } from '@/lib/i18n/admin';
import type { StageOption } from '@/lib/admin/content';

export function CodesToolbar({
  dict,
  stages,
}: {
  dict: AdminDictionary;
  stages: StageOption[];
}) {
  const router = useRouter();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ count: number; csv: string; codes: string[] } | null>(null);

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          stageId: String(form.get('stageId')),
          quantity: Number(form.get('quantity')),
          label: String(form.get('label') ?? ''),
        }),
      });
      const payload = (await response.json()) as {
        inserted?: number;
        csv?: string;
        codes?: string[];
        error?: string;
      };
      if (!response.ok) {
        setError(dict.codes.generateFailed);
        setPending(false);
        return;
      }
      setGenerated({
        count: payload.inserted ?? 0,
        csv: payload.csv ?? '',
        codes: payload.codes ?? [],
      });
      router.refresh();
    } catch {
      setError(dict.codes.generateFailed);
    }
    setPending(false);
  }

  function downloadCsv() {
    if (!generated?.csv) return;
    const blob = new Blob([generated.csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PATIENCE_COURSE_CODES_BATCH.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setGenerateOpen(true)}>
          {dict.codes.generate}
        </Button>
        <ButtonLinkish href="/api/admin/codes/export?format=csv" label={dict.codes.exportCsv} />
        <ButtonLinkish href="/api/admin/codes/export?format=xlsx" label={dict.codes.exportXlsx} />
        <ButtonLinkish href="/api/admin/codes/export?format=pdf" label={dict.codes.exportPdf} />
      </div>

      <Modal
        open={generateOpen}
        onClose={() => {
          setGenerateOpen(false);
          setGenerated(null);
          setError(null);
        }}
        title={generated ? dict.codes.generatedHeading : dict.codes.generateTitle}
        description={generated ? dict.codes.downloadWarning : dict.codes.generateBody}
        closeLabel={dict.common.close}
      >
        {generated ? (
          <div className="flex flex-col gap-4">
            <Alert tone="success">{interpolate(dict.codes.generated, { count: generated.count })}</Alert>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={downloadCsv}>
                {dict.codes.downloadNow}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void navigator.clipboard.writeText(generated.codes.join('\n'))}
              >
                {dict.codes.copyAll}
              </Button>
            </div>
            <pre className="latin scrollbar-slim max-h-48 overflow-auto rounded-xl bg-[var(--surface-sunken)] p-3 text-xs">
              {generated.codes.slice(0, 40).join('\n')}
              {generated.codes.length > 40 ? `\n… +${generated.codes.length - 40}` : ''}
            </pre>
          </div>
        ) : (
          <form onSubmit={generate} className="flex flex-col gap-4">
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <SelectField name="stageId" label={dict.codes.stage} required>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.number}. {stage.titleEn}
                </option>
              ))}
            </SelectField>
            <TextField
              name="quantity"
              type="number"
              min={1}
              max={10000}
              defaultValue={500}
              label={dict.codes.quantity}
              hint={dict.codes.quantityHint}
              required
            />
            <TextField name="label" label={dict.codes.batchLabel} hint={dict.codes.batchLabelHint} />
            <Button type="submit" loading={pending}>
              {pending ? dict.common.working : dict.codes.generate}
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}

export function CopyCodeButton({
  code,
  label,
  copiedLabel,
}: {
  code: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-[var(--border-strong)] px-2.5 text-[0.6875rem] font-semibold text-[var(--foreground-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? <Check className="size-3.5 text-[var(--accent)]" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? copiedLabel : label}
    </button>
  );
}

function ButtonLinkish({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex h-11 items-center rounded-full border border-[var(--border-strong)] px-6 text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      {label}
    </a>
  );
}

export function RevokeButton({
  codeId,
  dict,
}: {
  codeId: string;
  dict: AdminDictionary;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function revoke(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const reason = String(new FormData(event.currentTarget).get('reason') ?? '');
    const response = await fetch(`/api/admin/codes/${codeId}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ reason }),
    });
    setPending(false);
    if (!response.ok) {
      setError(dict.common.requestFailed);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-[var(--danger)] hover:underline"
      >
        {dict.codes.revoke}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={dict.codes.revokeTitle} description={dict.codes.revokeBody} closeLabel={dict.common.close}>
        <form onSubmit={revoke} className="flex flex-col gap-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <TextAreaField name="reason" label={dict.codes.revokeReason} required minLength={3} />
          <Button type="submit" variant="danger" loading={pending}>
            {dict.codes.revoke}
          </Button>
        </form>
      </Modal>
    </>
  );
}
