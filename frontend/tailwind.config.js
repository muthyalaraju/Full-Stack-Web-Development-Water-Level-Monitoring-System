/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tank: {
          low: '#ef4444',     // Red for <=20%
          normal: '#0ea5e9',  // Sky blue for 21-80%
          full: '#10b981',    // Emerald green for >=81%
          deep: '#0369a1',    // Deep ocean blue
        }
      },
      animation: {
        'wave': 'wave 4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}

