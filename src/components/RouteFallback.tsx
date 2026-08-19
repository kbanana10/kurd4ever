/**
 * RouteFallback.tsx
 *
 * Suspense fallback shown while a lazily-loaded route chunk is downloading.
 *
 * AUDIT FIX: added alongside route-level code splitting. It is deliberately
 * skeleton-shaped rather than a bare spinner so the layout does not jump when
 * the real screen mounts (reduces cumulative layout shift), and it announces
 * itself to assistive technology.
 */
export function RouteFallback() {
  return (
    <div
      className="p-4 space-y-4 animate-pulse"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading page…</span>

      {/* Header block */}
      <div className="space-y-2">
        <div className="h-6 w-40 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-56 rounded bg-slate-100 dark:bg-slate-800/70" />
      </div>

      {/* Card placeholders */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-24 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        />
      ))}
    </div>
  );
}
