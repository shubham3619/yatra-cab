import { cn } from '../lib/cn.js';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-gradient text-accent-fg shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5',
  secondary: 'bg-white text-ink-800 border border-ink-200 hover:border-ink-300 hover:bg-ink-50',
  ghost: 'text-ink-600 hover:bg-ink-100',
  danger: 'bg-danger text-white shadow-sm hover:brightness-110 hover:-translate-y-0.5',
  success: 'bg-success text-white shadow-sm hover:brightness-110 hover:-translate-y-0.5',
  soft: 'bg-accent-soft text-accent hover:bg-accent-softer',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export function Button({
  as: Comp = 'button',
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  disabled,
  icon: Icon,
  children,
  ...props
}) {
  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150',
        'focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={size === 'lg' ? 20 : 16} /> : Icon ? <Icon size={size === 'lg' ? 20 : 16} /> : null}
      {children}
    </Comp>
  );
}

export function IconButton({ icon: Icon, className, label, size = 18, ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-500',
        'hover:bg-ink-100 hover:text-ink-800 transition-colors focus:outline-none',
        className
      )}
      {...props}
    >
      <Icon size={size} />
    </button>
  );
}
