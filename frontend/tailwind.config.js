/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef9ff',
          100: '#d9f2ff',
          200: '#bae8ff',
          300: '#8adbff',
          400: '#52c6ff',
          500: '#29a9ff',
          600: '#1a8df0',
          700: '#1574d4',
          800: '#1761ab',
          900: '#195688',
          950: '#123554',
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
          950: '#020617',
        },
        dark: {
          100: '#1e1e1e',
          200: '#2d2d2d',
          300: '#3c3c3c',
          400: '#4b4b4b',
          500: '#5a5a5a',
          600: '#696969',
          700: '#787878',
          800: '#878787',
          900: '#969696',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'custom': '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
        'dark': '0 4px 20px 0 rgba(0, 0, 0, 0.2)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}