/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Green ramp — primary
        forest: {
          50: '#f1f8f0',
          100: '#dcebd8',
          200: '#bcd9b4',
          300: '#8fc084',
          400: '#5fa052',
          500: '#3d8230',
          600: '#2c6721',
          700: '#23521b',
          800: '#1c4217',
          900: '#163413',
          950: '#0a1f08',
        },
        // Earthy brown — secondary
        earth: {
          50: '#faf6f0',
          100: '#f0e3d2',
          200: '#e0c4a3',
          300: '#cd9f70',
          400: '#bb8048',
          500: '#a36632',
          600: '#8a5128',
          700: '#6f3e22',
          800: '#5a321d',
          900: '#4a2a19',
          950: '#2a1810',
        },
        // Sky accent
        sky: {
          50: '#f0f7fb',
          100: '#d8ecf5',
          200: '#b3d8eb',
          300: '#7fbcda',
          400: '#4597c4',
          500: '#2a7ba8',
          600: '#1f6188',
          700: '#1a4e6e',
          800: '#173e57',
          900: '#142f43',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(22, 52, 19, 0.12)',
        card: '0 2px 12px -4px rgba(22, 52, 19, 0.08)',
        glow: '0 0 0 1px rgba(61, 130, 48, 0.15), 0 8px 32px -12px rgba(61, 130, 48, 0.35)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.25s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
