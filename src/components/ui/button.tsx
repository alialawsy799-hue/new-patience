import Link from 'next/link';
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'contrast' | 'danger' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'relative inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none ' +
  'transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-[var(--ease-out-quint)] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] ' +
  'disabled:pointer-events-none disabled:opacity-55 active:scale-[0.98]';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[var(--shadow-subtle)] ' +
    'hover:brightness-[1.06] hover:shadow-[var(--shadow-glow)]',
  secondary:
    'border border-[var(--border-strong)] bg-transparent text-[var(--foreground)] ' +
    'hover:border-[var(--accent)] hover:text-[var(--accent)]',
  ghost: 'bg-transparent text-[var(--foreground-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--foreground)]',
  contrast:
    'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 shadow-[var(--shadow-subtle)]',
  danger: 'bg-[var(--danger)] text-white hover:brightness-110',
  subtle:
    'bg-[var(--surface-sunken)] text-[var(--foreground)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent)]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[0.8125rem]',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-base',
};

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading = false, icon, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

export function ButtonLink({
  className,
  variant = 'primary',
  size = 'md',
  icon,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}
