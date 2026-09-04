'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  closeLabel: string;
  className?: string;
  /** `side` slides in from the inline-end edge — used for the cart drawer. */
  layout?: 'center' | 'side';
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  closeLabel,
  className,
  layout = 'center',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  /** Keeps Tab cycling inside the dialog while it is open. */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null,
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    const timer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    }, 40);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(timer);
      restoreFocusTo.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-100 flex',
        layout === 'center' ? 'items-end justify-center sm:items-center' : 'items-stretch justify-end',
      )}
    >
      <div
        className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[2px] animate-[fade-in_0.25s_var(--ease-out-quint)_both]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden bg-[var(--surface)] shadow-[var(--shadow-lifted)]',
          layout === 'center'
            ? 'rounded-t-3xl sm:max-w-lg sm:rounded-3xl animate-[slide-up_0.35s_var(--ease-out-quint)_both]'
            : 'max-w-md animate-[fade-in_0.3s_var(--ease-out-quint)_both]',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-0">
          <div className="flex flex-col gap-1.5">
            {title ? <h2 className="text-xl font-bold tracking-tight">{title}</h2> : null}
            {description ? (
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="grid size-9 shrink-0 place-items-center rounded-full text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--foreground)]"
          >
            <X className="size-4.5" aria-hidden />
          </button>
        </div>
        <div className="scrollbar-slim overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
