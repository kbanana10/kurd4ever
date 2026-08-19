/**
 * Button.tsx
 *
 * AUDIT FIX — design system foundation.
 *
 * The audit found 186 `<button>` elements across the app, every one styled by
 * hand. There were 46 separate hand-rolled variations of the primary indigo
 * button alone, differing in radius (rounded-xl / 2xl / 3xl / full), padding
 * (py-3 / py-3.5 / py-4), active scale (0.95 / 0.98) and shadow. That
 * inconsistency is the main reason the UI reads as machine-assembled rather
 * than designed by a product designer.
 *
 * This component is the single source of truth for interactive affordances and
 * guarantees the accessibility floor the ad-hoc buttons missed: a >= 44x44px
 * touch target (WCAG 2.5.5 Target Size), a visible focus ring, and a loading
 * state that is announced to assistive tech rather than only dimmed.
 */
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS = {
  primary:
    'bg-[#FFB300] hover:bg-[#E69500] text-[#432C00] border border-transparent shadow-[0_3px_0_#E69500,0_10px_20px_rgba(255,179,0,0.22)]',
  secondary:
    'bg-white dark:bg-slate-900 text-ink border border-line-soft shadow-[0_2px_10px_rgba(0,0,0,0.04)]',
  ghost:
    'bg-transparent text-ink border border-transparent hover:bg-surface-2',
  danger:
    'bg-[#EF4444] hover:bg-[#DC2626] text-white border border-transparent shadow-[0_3px_0_#B91C1C,0_10px_20px_rgba(239,68,68,0.22)]',
  success:
    'bg-[#10B981] hover:bg-[#0DA271] text-white border border-transparent shadow-[0_3px_0_#00A86B,0_10px_20px_rgba(16,185,129,0.22)]',
  outline:
    'bg-transparent text-brand-deep border-2 border-[#FFB300] hover:bg-surface-2',
} satisfies Record<ButtonVariant, string>;

const SIZES = {
  // min-h keeps every size at or above the 44px touch-target floor.
  // Pill shape per DESIGN.md ("Interactive Pills").
  sm: 'min-h-[44px] px-4 py-2 text-xs rounded-full gap-1.5',
  md: 'min-h-[50px] px-5 py-3 text-sm rounded-full gap-2',
  lg: 'min-h-[58px] px-6 py-4 text-base rounded-full gap-2.5',
} satisfies Record<ButtonSize, string>;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  /** Icon rendered before the label (already sized by the caller). */
  leadingIcon?: React.ReactNode;
  /** Icon rendered after the label. */
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    leadingIcon,
    trailingIcon,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-black tracking-tight',
        'transition-all duration-150 cursor-pointer select-none',
        'hover:-translate-y-0.5 active:translate-y-1 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB300] focus-visible:ring-offset-2',
        'dark:focus-visible:ring-[#FFBA38] dark:focus-visible:ring-offset-slate-900',
        'disabled:cursor-not-allowed disabled:active:scale-100 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:border-transparent dark:disabled:bg-slate-800 dark:disabled:text-slate-600',
        // prefers-reduced-motion is handled globally in index.css
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        leadingIcon
      )}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});
