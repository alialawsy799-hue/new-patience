'use client';

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const controlClasses =
  'w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-sm ' +
  'text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] ' +
  'transition-[border-color,box-shadow] duration-200 ' +
  'focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/12 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 ' +
  'aria-[invalid=true]:border-[var(--danger)] aria-[invalid=true]:ring-[var(--danger)]/12';

type FieldShellProps = {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  optionalLabel?: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
};

export function FieldShell({
  label,
  hint,
  error,
  required,
  optionalLabel,
  htmlFor,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-semibold">
        {label}
        {!required && optionalLabel ? (
          <span className="text-xs font-normal text-[var(--foreground-subtle)]">
            ({optionalLabel})
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-[var(--danger)]"
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[0.8125rem] text-[var(--foreground-subtle)]">{hint}</p>
      ) : null}
    </div>
  );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string | null;
  optionalLabel?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, optionalLabel, className, id, required, ...props },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      optionalLabel={optionalLabel}
      htmlFor={fieldId}
    >
      <input
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(controlClasses, className)}
        {...props}
      />
    </FieldShell>
  );
});

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string | null;
  optionalLabel?: string;
};

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField({ label, hint, error, optionalLabel, className, id, required, ...props }, ref) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;

    return (
      <FieldShell
        label={label}
        hint={hint}
        error={error}
        required={required}
        optionalLabel={optionalLabel}
        htmlFor={fieldId}
      >
        <textarea
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          className={cn(controlClasses, 'min-h-32 resize-y leading-relaxed', className)}
          {...props}
        />
      </FieldShell>
    );
  },
);

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string | null;
  optionalLabel?: string;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, optionalLabel, className, id, required, children, ...props },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      optionalLabel={optionalLabel}
      htmlFor={fieldId}
    >
      <select
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(controlClasses, 'appearance-none bg-[var(--surface)] pe-10', className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
});

/**
 * Segmented radio group — used for the دكتور / دكتورة title choice, where an
 * explicit selection is far more reliable than inferring gender from a name.
 */
type ChoiceOption = { value: string; label: string };

export function ChoiceField({
  label,
  name,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  options: ChoiceOption[];
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div
        role="radiogroup"
        className="grid grid-cols-3 gap-2 rounded-xl bg-[var(--surface-sunken)] p-1"
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                'cursor-pointer rounded-lg px-3 py-2.5 text-center text-sm font-medium transition-all duration-200',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--ring)]',
                selected
                  ? 'bg-[var(--surface)] text-[var(--accent)] shadow-[var(--shadow-subtle)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {hint ? <p className="text-[0.8125rem] text-[var(--foreground-subtle)]">{hint}</p> : null}
    </fieldset>
  );
}
