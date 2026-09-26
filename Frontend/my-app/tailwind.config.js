/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:            'var(--bg)',
        surface:       'var(--surface)',
        'surface-2':   'var(--surface-2)',
        border:        'var(--border)',
        'border-bright':'var(--border-bright)',
        primary:       'var(--text-primary)',
        secondary:     'var(--text-secondary)',
        accent:        'var(--accent)',
        'accent-hover':'var(--accent-hover)',
        'accent-text': 'var(--accent-text)',
        success:       'var(--success)',
        warning:       'var(--warning)',
        danger:        'var(--danger)',
        info:          'var(--info)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.4', transform: 'scale(0.85)' },
        },
        gradientShift: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        'fade-in-up':  'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shimmer':     'shimmer 1.5s infinite linear',
        'pulse-dot':   'pulseDot 1.4s ease-in-out infinite',
        'gradient':    'gradientShift 4s ease infinite',
      },
    },
  },
  plugins: [],
}
