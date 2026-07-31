import { cn } from '../lib/cn.js';

export function Card({ className, children, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-ink-200/70 shadow-card',
        hover && 'transition-shadow hover:shadow-soft',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, icon: Icon, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 p-5 border-b border-ink-100', className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Icon size={18} />
          </span>
        )}
        <div>
          <h3 className="font-semibold text-ink-900">{title}</h3>
          {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
