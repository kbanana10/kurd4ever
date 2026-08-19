import React from 'react';
import { cn } from '../../utils/cn';

type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

const TONES = {
  primary: 'bg-[#FFF3D6] text-[#8A6100] border-transparent dark:bg-[#3A2F14] dark:text-[#FFCE6B]',
  success: 'bg-emerald-100 text-emerald-700 border-transparent dark:bg-emerald-950/50 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 border-transparent dark:bg-amber-950/50 dark:text-amber-300',
  danger: 'bg-rose-100 text-rose-700 border-transparent dark:bg-rose-950/50 dark:text-rose-300',
  neutral: 'bg-surface-2 text-muted border-transparent',
} satisfies Record<BadgeTone, string>;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'primary', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider',
        TONES[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
