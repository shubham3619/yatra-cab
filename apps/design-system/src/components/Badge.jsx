import { cn } from '../lib/cn.js';

const TONES = {
  neutral: 'bg-ink-100 text-ink-600',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};

export function Badge({ tone = 'neutral', className, children, dot = false }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

// Maps a {label, tone} meta record (from format.js) to a Badge.
export function StatusBadge({ meta, dot = true, className }) {
  if (!meta) return null;
  return (
    <Badge tone={meta.tone} dot={dot} className={className}>
      {meta.label}
    </Badge>
  );
}
