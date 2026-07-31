import { cn } from '../lib/cn.js';
import { Loader2, Inbox, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button.jsx';

export function Spinner({ size = 20, className }) {
  return <Loader2 size={size} className={cn('animate-spin text-accent', className)} />;
}

export function LoadingScreen({ label = 'Loading…', className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-ink-500', className)}>
      <Spinner size={28} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('yc-skeleton h-4 w-full', className)} />;
}

export function EmptyState({ icon: Icon = Inbox, title, message, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-14 text-center', className)}>
      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-400">
        <Icon size={26} />
      </span>
      <h3 className="font-semibold text-ink-800">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-danger/20 bg-danger-soft px-6 py-12 text-center', className)}>
      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-danger">
        <AlertTriangle size={26} />
      </span>
      <h3 className="font-semibold text-ink-800">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-600">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Renders the right state for a react-query result. Pass children as a render
 * fn receiving the data, or as nodes.
 */
export function QueryBoundary({ query, loading, empty, isEmpty, children }) {
  if (query.isError) return <ErrorState message={query.error?.message} onRetry={query.refetch} />;
  const data = query.data;
  // Treat "no data yet, no error" as loading — covers initial fetch AND the
  // gap between a failed attempt and its retry (react-query v5 reports
  // isLoading=false there), so children never runs with undefined data.
  if (data === undefined) return loading || <LoadingScreen />;
  if (empty && isEmpty?.(data)) return empty;
  return typeof children === 'function' ? children(data) : children;
}
