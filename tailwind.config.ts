import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0C2340',
          gold: '#C9A227',
          ivory: '#FAF8F5',
        },
        canvas: {
          bg: '#1a1a2e',
          surface: '#16213e',
          border: '#0f3460',
          node: '#1f2937',
          'node-hover': '#283548',
          accent: '#e94560',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        },
        sidebar: {
          bg: '#111827',
          hover: '#1f2937',
          active: '#374151',
          text: '#d1d5db',
          'text-muted': '#9ca3af',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
