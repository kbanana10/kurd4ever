import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface ErrorStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void | Promise<void>;
  className?: string;
}

export function ErrorState({
  icon,
  title = 'Something went wrong',
  description,
  retryLabel = 'Try again',
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center space-y-4 rounded-3xl bg-surface border-2 border-line', className)}>
      <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center">
        {icon || <AlertCircle className="w-6 h-6" />}
      </div>
      <div className="space-y-1 max-w-md">
        <h3 className="text-base font-black text-ink">{title}</h3>
        {description && <p className="text-xs text-muted font-medium">{description}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
