/**
 * Card.tsx
 *
 * AUDIT FIX — design system foundation.
 *
 * The audit counted 170 `rounded-2xl`, 128 `rounded-xl`, 87 `rounded-3xl`,
 * 21 `rounded-[2rem]` and 14 `rounded-[3rem]` usages, applied to what is
 * conceptually the same "surface" element. Card centralises the surface
 * treatment so radius, border and elevation are consistent everywhere.
 */
import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `flat` for list rows, `raised` for primary content, `outline` for empty states. */
  elevation?: 'flat' | 'raised' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article' | 'li';
}

const ELEVATION = {
  flat: 'bg-white dark:bg-slate-900 border border-line shadow-[0_2px_10px_rgba(0,0,0,0.02)]',
  raised:
    'bg-white dark:bg-slate-900 border border-line shadow-[0_4px_20px_rgba(0,0,0,0.03)]',
  outline: 'bg-transparent border border-dashed border-line-soft',
} as const;

const PADDING = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' } as const;

export function Card({
  elevation = 'raised',
  padding = 'md',
  as: Tag = 'div',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn('rounded-3xl transition-all duration-200', ELEVATION[elevation], PADDING[padding], className)}
      // SAFETY: polymorphic `as`-prop spread — the rendered element's own JSX typing validates these props at each call site.
      {...(rest as any)}
    >
      {children}
    </Tag>
  );
}
