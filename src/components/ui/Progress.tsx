import React from 'react';
import { cn } from '../../utils/cn';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Progress({ value, max = 100, label, size = 'md', className, ...rest }: ProgressProps) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  const heightClasses = {
    sm: 'h-2.5',
    md: 'h-4',
    lg: 'h-6'
  };

  return (
    <div className={cn('space-y-1.5', className)} {...rest}>
      {label && <div className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-100">{label}</div>}
      <div
        className={cn(
          'rounded-full bg-surface-2 border border-line overflow-hidden',
          heightClasses[size]
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#FFC541] to-[#FFA000] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
