import { cn } from '../lib/cn.js';
import { Star } from 'lucide-react';
import { initials } from '../lib/format.js';

export function Avatar({ name, size = 40, className, src }) {
  if (src) {
    return <img src={src} alt={name} width={size} height={size} className={cn('rounded-full object-cover', className)} />;
  }
  return (
    <span
      className={cn('inline-flex items-center justify-center rounded-full bg-accent-soft font-semibold text-accent', className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}

export function StarRating({ value = 0, count, size = 14, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-warning', className)}>
      <Star size={size} className="fill-current" />
      <span className="font-medium text-ink-700">{Number(value).toFixed(1)}</span>
      {count != null && <span className="text-xs text-ink-400">({count})</span>}
    </span>
  );
}

// Interactive star picker for rating forms.
export function StarPicker({ value, onChange, size = 30 }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="transition-transform hover:scale-110 focus:outline-none">
          <Star size={size} className={cn(n <= value ? 'fill-warning text-warning' : 'text-ink-300')} />
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, icon: Icon, action, className }) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Icon size={22} />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Segmented({ options, value, onChange, className }) {
  return (
    <div className={cn('inline-flex rounded-xl bg-ink-100 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
            value === o.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Logo({ mark: Mark, name = 'YatraCab', tagline, className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-accent-fg shadow-glow">
        {Mark && <Mark size={20} />}
      </span>
      <div className="leading-tight">
        <p className="font-semibold text-ink-900">{name}</p>
        {tagline && <p className="text-[11px] text-ink-400">{tagline}</p>}
      </div>
    </div>
  );
}
