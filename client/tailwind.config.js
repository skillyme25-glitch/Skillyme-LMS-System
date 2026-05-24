/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        indigo:  { DEFAULT: '#3730A3', dark: '#2E27A3', light: '#4338CA', subtle: '#EEF2FF' },
        gold:    { DEFAULT: '#F59E0B', dark: '#D97706', light: '#FCD34D', subtle: '#FFFBEB' },
        success: { DEFAULT: '#16A34A', subtle: '#F0FDF4' },
        warning: { DEFAULT: '#D97706', subtle: '#FFFBEB' },
        danger:  { DEFAULT: '#DC2626', subtle: '#FEF2F2' },
        ink:     { DEFAULT: '#111827', mid: '#374151', muted: '#6B7280', faint: '#9CA3AF' },
        surface: { DEFAULT: '#F8F7FF', card: '#FFFFFF', alt: '#F3F4F6' },
        border:  'hsl(var(--border))',
        input:   'hsl(var(--input))',
        ring:    'hsl(var(--ring))',
        background: '#F8F7FF',
        foreground: '#111827',
        primary: {
          DEFAULT: '#3730A3',
          foreground: '#ffffff',
          dark: '#2E27A3',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"DM Serif Display"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        sm:   '4px',
        DEFAULT: '6px',
        md:   '6px',
        lg:   '8px',
        xl:   '12px',
        '2xl': '16px',
        '3xl': '24px',
        full: '9999px',
      },
      boxShadow: {
        xs:   '0 1px 2px rgba(55,48,163,0.04)',
        sm:   '0 1px 3px rgba(55,48,163,0.08), 0 1px 2px rgba(55,48,163,0.04)',
        md:   '0 4px 12px rgba(55,48,163,0.10), 0 2px 4px rgba(55,48,163,0.06)',
        lg:   '0 10px 32px rgba(55,48,163,0.12), 0 4px 8px rgba(55,48,163,0.06)',
        card: '0 1px 4px rgba(55,48,163,0.08), 0 0 0 1px rgba(55,48,163,0.06)',
        'card-hover': '0 8px 24px rgba(55,48,163,0.14), 0 0 0 1px rgba(55,48,163,0.10)',
        gold: '0 0 24px rgba(245,158,11,0.30)',
        indigo: '0 0 24px rgba(55,48,163,0.25)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'ken-burns': {
          from: { transform: 'scale(1.06)' },
          to:   { transform: 'scale(1)' },
        },
        'pulse-gold': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(245,158,11,0)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.4s ease-out both',
        'slide-up':   'slide-up 0.45s ease-out both',
        'slide-down': 'slide-down 0.25s ease-out both',
        'scale-in':   'scale-in 0.2s ease-out both',
        'ken-burns':  'ken-burns 14s ease-out both',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
