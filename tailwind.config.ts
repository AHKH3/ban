import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-border': 'var(--accent-border)',
        'accent-contrast': 'var(--accent-contrast)',
        'tile-bg': 'var(--tile-bg)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        success: 'var(--success)',
      },
      fontFamily: {
        sans: ['var(--font-en)', 'Georgia', 'serif'],
        serif: ['var(--font-en)', 'Georgia', 'serif'],
        arabic: ['var(--font-ar)', 'Noto Naskh Arabic', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
      },
      transitionDuration: {
        fast: 'var(--motion-fast)',
        base: 'var(--motion-base)',
        slow: 'var(--motion-slow)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in var(--motion-base) var(--ease-out)',
        'slide-in-right': 'slide-in-right var(--motion-slow) var(--ease-out)',
        'slide-in-up': 'slide-in-up var(--motion-base) var(--ease-out)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config
