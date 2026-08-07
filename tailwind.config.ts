import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'hsl(var(--canvas) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        raised: 'hsl(var(--raised) / <alpha-value>)',
        line: 'hsl(var(--line) / <alpha-value>)',
        ink: 'hsl(var(--ink) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        faint: 'hsl(var(--faint) / <alpha-value>)',
        brass: 'hsl(var(--brass) / <alpha-value>)',
        'brass-soft': 'hsl(var(--brass-soft) / <alpha-value>)',
        forest: 'hsl(var(--forest) / <alpha-value>)',
        clay: 'hsl(var(--clay) / <alpha-value>)',
        sky: 'hsl(var(--sky) / <alpha-value>)',
      },
      opacity: {
        2: '0.02',
        3: '0.03',
        6: '0.06',
        8: '0.08',
        12: '0.12',
        15: '0.15',
        18: '0.18',
        22: '0.22',
        35: '0.35',
        45: '0.45',
        55: '0.55',
        65: '0.65',
        85: '0.85',
        88: '0.88',
        92: '0.92',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        DEFAULT: '10px',
        md: '12px',
        lg: '16px',
        xl: '22px',
      },
      boxShadow: {
        subtle: '0 1px 2px hsl(var(--shadow) / 0.06), 0 1px 1px hsl(var(--shadow) / 0.04)',
        card: '0 1px 3px hsl(var(--shadow) / 0.07), 0 8px 24px -12px hsl(var(--shadow) / 0.14)',
        lift: '0 2px 6px hsl(var(--shadow) / 0.08), 0 18px 42px -18px hsl(var(--shadow) / 0.24)',
        pop: '0 24px 60px -22px hsl(var(--shadow) / 0.34)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .45s cubic-bezier(.22,1,.36,1) both',
        'fade-in': 'fade-in .3s ease both',
        'scale-in': 'scale-in .22s cubic-bezier(.22,1,.36,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
