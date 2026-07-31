/**
 * Shared Tailwind preset — the single source of truth for colors, typography,
 * spacing, radii, shadows and motion across all three portals. Each app sets
 * its own role accent as a gradient pair (--yc-accent + --yc-accent-2) in its
 * base layer, so the same components pick up a distinct vibrant tint.
 */
export default {
  theme: {
    extend: {
      colors: {
        // Role accent gradient pair — themed per app via CSS variables.
        accent: {
          DEFAULT: 'rgb(var(--yc-accent) / <alpha-value>)',
          to: 'rgb(var(--yc-accent-2) / <alpha-value>)',
          fg: 'rgb(var(--yc-accent-fg) / <alpha-value>)',
          soft: 'rgb(var(--yc-accent-soft) / <alpha-value>)',
          softer: 'rgb(var(--yc-accent-soft) / 0.55)',
        },
        // Neutral surface scale (slate-based) for a calm, data-dense UI.
        ink: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
          400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
          800: '#1e293b', 900: '#0f172a', 950: '#020617',
        },
        success: { DEFAULT: '#059669', soft: '#ecfdf5' },
        warning: { DEFAULT: '#d97706', soft: '#fffbeb' },
        danger: { DEFAULT: '#e11d48', soft: '#fff1f2' },
        info: { DEFAULT: '#2563eb', soft: '#eff6ff' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 2px 8px -2px rgb(15 23 42 / 0.08)',
        soft: '0 8px 30px -8px rgb(15 23 42 / 0.14)',
        pop: '0 20px 50px -12px rgb(15 23 42 / 0.28)',
        glow: '0 10px 30px -8px rgb(var(--yc-accent) / 0.5)',
        'glow-lg': '0 18px 45px -10px rgb(var(--yc-accent) / 0.55)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'scale-in': { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(24px,-18px) scale(1.08)' },
          '66%': { transform: 'translate(-18px,14px) scale(0.94)' },
        },
        'gradient-x': { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        'pulse-ring': { '0%': { transform: 'scale(0.9)', opacity: 0.7 }, '80%,100%': { transform: 'scale(1.8)', opacity: 0 } },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in': 'scale-in 0.2s ease-out both',
        float: 'float 7s ease-in-out infinite',
        blob: 'blob 14s ease-in-out infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
      },
      backgroundSize: { '200': '200% 200%' },
    },
  },
  plugins: [],
};
