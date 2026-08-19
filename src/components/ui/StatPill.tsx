import React from 'react';
import { cn } from '../../utils/cn';

export interface StatPillProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

export function StatPill({ icon, label, value, className, ...rest }: StatPillProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-900 border border-line px-3.5 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.03)]',
        className
      )}
      {...rest}
    >
      {icon && <span className="shrink-0 text-[#FFB300]">{icon}</span>}
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</span>
      <span className="font-extrabold text-ink">{value}</span>
    </div>
  );
}
