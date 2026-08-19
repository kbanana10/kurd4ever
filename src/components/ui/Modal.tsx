/**
 * Modal.tsx
 *
 * AUDIT FIX — accessible dialog primitive.
 *
 * The audit found the app renders several overlays (exit confirmation, daily
 * goal sheet, interstitial/rewarded ads, game settings) and NONE of them had
 * `role="dialog"`, `aria-modal`, focus trapping, Escape-to-close, or focus
 * restoration. Across the whole `src/` tree there were 0 occurrences of
 * `role="dialog"` and 0 of `aria-modal`. For a screen-reader or keyboard-only
 * user those overlays were effectively invisible and inescapable: focus stayed
 * on the page behind the scrim.
 *
 * This primitive provides the standard dialog contract once, so no screen has
 * to re-implement it.
 */
import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** Bottom sheet on mobile, centred card on larger screens. */
  variant?: 'sheet' | 'center';
  /** Hide the default close button when the body supplies its own actions. */
  hideCloseButton?: boolean;
  closeLabel?: string;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  variant = 'center',
  hideCloseButton = false,
  closeLabel = 'Close modal',
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`).current;
  const descId = useRef(`modal-desc-${Math.random().toString(36).slice(2, 9)}`).current;

  // Remember what had focus, then restore it on close (WCAG 2.4.3 Focus Order).
  useEffect(() => {
    if (!open) return;
    // SAFETY: document.activeElement is Element | null; narrowed for .focus(), and restore uses optional call.
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const id = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panelRef.current)?.focus();
    }, 0);
    return () => {
      window.clearTimeout(id);
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // Prevent the page behind the scrim from scrolling.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      // Focus trap.
      const nodes = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  if (globalThis.document === undefined) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className={cn(
            'fixed inset-0 z-[100] flex justify-center p-0 sm:p-4',
            variant === 'sheet' ? 'items-end sm:items-center' : 'items-center'
          )}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            initial={variant === 'sheet' ? { y: '100%', opacity: 0.6 } : { scale: 0.95, opacity: 0 }}
            animate={variant === 'sheet' ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={variant === 'sheet' ? { y: '100%', opacity: 0.6 } : { scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className={cn(
              'relative z-10 w-full max-w-md bg-white dark:bg-slate-950',
              'border border-line shadow-[0_24px_60px_rgba(0,0,0,0.18)]',
              'flex flex-col gap-4 p-6 max-h-[90vh] overflow-y-auto outline-none',
              variant === 'sheet' ? 'rounded-t-[32px] sm:rounded-[32px]' : 'rounded-[28px] m-4',
              className
            )}
          >
            {variant === 'sheet' && (
              <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto -mt-2 sm:hidden" />
            )}

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>

              {!hideCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="shrink-0 min-w-[44px] min-h-[44px] -me-2 -mt-2 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
