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
        // Warm stone neutrals. A touch of earth in the greys is what stops the
        // UI reading cold and clinical — surfaces feel like sandstone, not steel.
        ink: {
          50: '#fdfcfb', 100: '#f6f3ef', 200: '#e9e3dc', 300: '#d6cec4',
          400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c',
          800: '#292524', 900: '#1c1917', 950: '#0c0a09',
        },
        // The chrome is black & white; status stays in colour, because a
        // cancelled ride and a confirmed one must never look the same.
        success: { DEFAULT: '#15803d', soft: '#f0fdf4' },
        warning: { DEFAULT: '#b45309', soft: '#fffbeb' },
        danger: { DEFAULT: '#b91c1c', soft: '#fef2f2' },
        info: { DEFAULT: '#1d4ed8', soft: '#eff6ff' },
        // Vehicle-category accents — the ONLY colour left in the interface.
        vehicle: {
          hatchback: '#2563eb',
          sedan: '#059669',
          suv: '#d97706',
          tempo: '#7c3aed',
        },
      },
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.15rem' }],
        sm: ['0.9375rem', { lineHeight: '1.375rem' }],
        base: ['1.0625rem', { lineHeight: '1.6rem' }],
        lg: ['1.1875rem', { lineHeight: '1.75rem' }],
        xl: ['1.375rem', { lineHeight: '1.85rem' }],
        '2xl': ['1.625rem', { lineHeight: '2.05rem' }],
        '3xl': ['2rem', { lineHeight: '2.35rem' }],
        '4xl': ['2.5rem', { lineHeight: '2.75rem' }],
        '5xl': ['3.25rem', { lineHeight: '1.05' }],
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
        glow: '0 10px 30px -8px rgb(var(--yc-accent) / 0.45)',
        'glow-lg': '0 18px 45px -10px rgb(var(--yc-accent) / 0.5)',
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
