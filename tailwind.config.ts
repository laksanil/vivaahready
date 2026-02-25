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
        // VivaahReady brand red palette (darker, richer red)
        primary: {
          50: '#fdf2f2',
          100: '#fce8e8',
          200: '#f9c8c8',
          300: '#f29b9b',
          400: '#e05a5a',
          500: '#c42020',
          600: '#991b1b',  // Main brand red (darker)
          700: '#7f1d1d',
          800: '#651515',
          900: '#4d1010',
          950: '#350b0b',
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
        'glow': '0 0 20px rgba(153, 27, 27, 0.3)',
        'glow-lg': '0 0 40px rgba(153, 27, 27, 0.4)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
