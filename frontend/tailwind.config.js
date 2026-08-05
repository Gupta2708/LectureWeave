/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      colors: {
        // --- Legacy scales (kept so not-yet-migrated pages render unchanged) ---
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },

        // --- Redesign token layer (mapped to CSS vars in styles/tokens.css) ---
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          800: 'var(--brand-800)',
          900: 'var(--brand-900)',
          soft: 'var(--brand-soft)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          subtle: 'var(--surface-subtle)',
          muted: 'var(--surface-muted)',
        },
        background: 'var(--background)',
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          faint: 'var(--ink-faint)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        accent: {
          cyan: 'var(--accent-cyan)',
          violet: 'var(--accent-violet)',
        },
        success: { DEFAULT: 'var(--success)', soft: 'var(--success-soft)' },
        warning: { DEFAULT: 'var(--warning)', soft: 'var(--warning-soft)' },
        danger: { DEFAULT: 'var(--danger)', soft: 'var(--danger-soft)' },
        info: { DEFAULT: 'var(--info)', soft: 'var(--info-soft)' },
        marketing: {
          bg: 'var(--marketing-background)',
          surface: 'var(--marketing-surface)',
          surface2: 'var(--marketing-surface-2)',
          text: 'var(--marketing-text)',
          textsoft: 'var(--marketing-text-soft)',
          line: 'var(--marketing-line)',
        },
      },
      boxShadow: {
        // Additive only — does not override Tailwind's sm/md/lg so legacy
        // pages keep their existing shadows.
        xs: 'var(--shadow-xs)',
        brand: 'var(--shadow-brand)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
  plugins: [],
}
