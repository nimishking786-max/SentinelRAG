/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clay: {
          bg: '#f0f3f8',
          card: '#ffffff',
          primary: '#4f46e5',
          secondary: '#3b82f6',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          text: '#1e293b',
          muted: '#64748b'
        },
        vault: {
          bg: '#0a0d14',
          surface: '#111726',
          card: '#161f33',
          border: '#23304b',
          cyan: '#06b6d4',
          neon: '#10b981',
          accent: '#6366f1',
          rose: '#f43f5e'
        }
      },
      boxShadow: {
        'clay-out': '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
        'clay-in': 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff',
        'clay-button': '4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff',
        'clay-button-active': 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff',
        'vault-glow': '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        'cyber-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.4)',
        'cyber-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.4)',
        'cyber-rose': '0 0 20px -3px rgba(239, 68, 68, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
