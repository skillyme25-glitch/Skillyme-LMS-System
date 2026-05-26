/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Brand accents ─────────────────────────── */
        teal:   { DEFAULT: '#00E0B8', dark: '#00B896', bright: '#3DFFD2', glow: 'rgba(0,224,184,0.15)',  tint: 'rgba(0,224,184,0.08)' },
        purple: { DEFAULT: '#7B3CFF', dark: '#6228E0', bright: '#9B5FFF', glow: 'rgba(123,60,255,0.15)', tint: 'rgba(123,60,255,0.08)' },

        /* ── Legacy semantic aliases (still referenced by components) ── */
        indigo:  { DEFAULT: '#00E0B8', dark: '#00B896', light: '#3DFFD2', subtle: 'rgba(0,224,184,0.08)' },
        gold:    { DEFAULT: '#FFB800', dark: '#E6A600', light: '#FFD166', subtle: 'rgba(255,184,0,0.15)' },

        /* ── Functional ──────────────────────────── */
        success: { DEFAULT: '#00E0B8', subtle: 'rgba(0,224,184,0.15)' },
        warning: { DEFAULT: '#FFB800', subtle: 'rgba(255,184,0,0.15)' },
        danger:  { DEFAULT: '#FF4D4D', subtle: 'rgba(255,77,77,0.15)' },

        /* ── Ink / text scale ───────────────────── */
        ink: {
          DEFAULT: '#FFFFFF',
          mid:     '#D9E2F2',
          muted:   '#D9E2F2',
          faint:   'rgba(217,226,242,0.40)',
        },

        /* ── Surfaces ───────────────────────────── */
        surface: {
          DEFAULT: '#070B1A',
          card:    '#0F1328',
          alt:     '#161B35',
        },

        /* ── Tailwind / shadcn primitives ───────── */
        border:     'rgba(255, 255, 255, 0.06)',
        input:      'rgba(255, 255, 255, 0.08)',
        ring:       '#00E0B8',
        background: '#070B1A',
        foreground: '#FFFFFF',

        primary: {
          DEFAULT:    '#00E0B8',
          foreground: '#FFFFFF',
          dark:       '#00B896',
        },
        secondary: {
          DEFAULT:    '#7B3CFF',
          foreground: '#FFFFFF',
          dark:       '#6228E0',
        },
        muted: {
          DEFAULT:    '#161B35',
          foreground: '#D9E2F2',
        },
        accent: {
          DEFAULT:    '#00E0B8',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT:    '#FF4D4D',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT:    '#0F1328',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT:    '#0F1328',
          foreground: '#FFFFFF',
        },
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"DM Serif Display"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },

      borderRadius: {
        none:  '0px',
        sm:    '4px',
        DEFAULT: '6px',
        md:    '6px',
        lg:    '8px',
        xl:    '12px',
        '2xl': '16px',
        '3xl': '24px',
        full:  '9999px',
      },

      boxShadow: {
        xs:           '0 1px 2px rgba(0,0,0,0.40)',
        sm:           '0 1px 3px rgba(0,0,0,0.50), 0 1px 2px rgba(0,0,0,0.40)',
        md:           '0 4px 12px rgba(0,0,0,0.50), 0 2px 4px rgba(0,0,0,0.40)',
        lg:           '0 10px 32px rgba(0,0,0,0.60), 0 4px 8px rgba(0,0,0,0.40)',
        card:         '0 1px 4px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.06)',
        'card-hover': '0 8px 24px rgba(0,224,184,0.15), 0 0 0 1px rgba(0,224,184,0.20)',
        'glow-teal':  '0 0 20px rgba(0,224,184,0.25)',
        'glow-purple':'0 0 20px rgba(123,60,255,0.25)',
        gold:         '0 0 24px rgba(0,224,184,0.30)',
        indigo:       '0 0 24px rgba(0,224,184,0.25)',
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
          '0%,100%': { boxShadow: '0 0 0 0 rgba(0,224,184,0.4)' },
          '50%':     { boxShadow: '0 0 0 8px rgba(0,224,184,0)' },
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
        'fade-in':        'fade-in 0.4s ease-out both',
        'slide-up':       'slide-up 0.45s ease-out both',
        'slide-down':     'slide-down 0.25s ease-out both',
        'scale-in':       'scale-in 0.2s ease-out both',
        'ken-burns':      'ken-burns 14s ease-out both',
        'pulse-gold':     'pulse-gold 2s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
