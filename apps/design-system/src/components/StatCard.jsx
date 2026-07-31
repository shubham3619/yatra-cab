import { cn } from '../lib/cn.js';

export function StatCard({ icon: Icon, label, value, sub, tone = 'accent', className }) {
  const tones = {
    accent: 'bg-accent-soft text-accent',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-info-soft text-info',
  };
  return (
    <div className={cn('rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        {Icon && (
          <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', tones[tone])}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-400">{sub}</p>}
    </div>
  );
}
