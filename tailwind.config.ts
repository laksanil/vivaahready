import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // VivaahReady brand red palette (from logo #E31C25)
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#E31C25',  // Main brand red from logo
          700: '#c81e1e',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Silver/gray palette for backgrounds
        silver: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Gold accent for premium feel
        accent: {
          50: '#fffbeb',
          100: '#fff3c6',
          200: '#ffe588',
          300: '#ffd54f',
          400: '#ffca28',
          500: '#f9a825',
          600: '#dd7d02',
          700: '#b75f06',
          800: '#944a0c',
          900: '#7a3d0d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(227, 28, 37, 0.3)',
        'glow-lg': '0 0 40px rgba(227, 28, 37, 0.4)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
