/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        secondary: "#10B981",
        dark: "#0f172a",
        light: "#f8fafc",
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float 5s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 6s ease infinite',
        'shimmer': 'shimmer 1.5s linear infinite',
        'pop-scale': 'pop-scale 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'count-up': 'count-up 0.6s ease forwards',
        'slide-up': 'slide-up 0.5s ease forwards',
        'pulse-glow': 'pulse-glow 2s ease infinite',
        'particle-drift': 'particle-drift 4s ease-out infinite',
        'spin-smooth': 'spin-smooth 1s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pop-scale': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.25)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(99, 102, 241, 0)' },
        },
        'particle-drift': {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '0.6' },
          '100%': { transform: 'translate(var(--tx, 20px), var(--ty, -30px)) scale(0)', opacity: '0' },
        },
        'spin-smooth': {
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
