import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export function Spinner({ size = 'md', className, label, showLabel = false }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="inline-flex items-center gap-2">
      <Loader2 className={cn('animate-spin text-brand', sizeClasses[size], className)} />
      {showLabel && label && (
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</span>
      )}
    </div>
  );
}
