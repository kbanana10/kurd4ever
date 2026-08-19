import React from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (checked: boolean | any) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
  tone?: string;
}

export function Switch({ checked, onCheckedChange, onChange, disabled = false, className, id, label }: SwitchProps) {
  const handleChange = () => {
    const nextVal = !checked;
    if (onCheckedChange) onCheckedChange(nextVal);
    if (onChange) onChange(nextVal);
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={handleChange}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2',
        // R-09: pseudo-element hit-area expansion — the visual switch stays
        // 44x24 but the tappable region becomes >=44px tall on touch.
        "after:absolute after:content-[''] after:-inset-y-2.5 after:-inset-x-1",
        checked ? 'bg-brand' : 'bg-surface-3',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}
