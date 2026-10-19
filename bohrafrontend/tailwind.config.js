/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        secondary: {
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.22,1,0.36,1)',
        'slide-out-right': 'slideOutRight 0.3s cubic-bezier(0.22,1,0.36,1) forwards',
        'bell': 'bellRing 0.6s ease-in-out 3',
        'alarm-pulse': 'alarmPulse 1s ease-in-out infinite',
        'toast-progress': 'toastProgress linear forwards',
      },
      keyframes: {
        slideIn: {
          '0%': { width: '80px' },
          '100%': { width: '256px' },
        },
        slideOut: {
          '0%': { width: '256px' },
          '100%': { width: '80px' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideOutRight: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(120%)' },
        },
        bellRing: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '15%': { transform: 'rotate(12deg)' },
          '30%': { transform: 'rotate(-10deg)' },
          '45%': { transform: 'rotate(8deg)' },
          '60%': { transform: 'rotate(-6deg)' },
          '75%': { transform: 'rotate(4deg)' },
        },
        alarmPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        toastProgress: {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
      },
    },
  },
  plugins: [],
};
