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
        // Burgundy red primary palette
        primary: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f9d0d9',
          300: '#f4a9b8',
          400: '#ec7a93',
          500: '#df4d6f',
          600: '#c9294d',
          700: '#a91e3f',  // Main burgundy
          800: '#8b1b38',
          900: '#771a34',
          950: '#420a18',
        },
        // Silver/gray palette
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
        // Accent - gold for elegance
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
    },
  },
  plugins: [],
}

export default config
