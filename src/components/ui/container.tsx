import type { ElementType, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  as?: ElementType;
  size?: 'default' | 'narrow' | 'wide';
};

const sizes = {
  narrow: 'max-w-3xl',
  default: 'max-w-7xl',
  wide: 'max-w-[90rem]',
} as const;

export function Container({ className, as: Tag = 'div', size = 'default', ...props }: ContainerProps) {
  return <Tag className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', sizes[size], className)} {...props} />;
}

export function Section({
  className,
  as: Tag = 'section',
  ...props
}: HTMLAttributes<HTMLElement> & { as?: ElementType }) {
  return <Tag className={cn('py-20 sm:py-24 lg:py-32', className)} {...props} />;
}
