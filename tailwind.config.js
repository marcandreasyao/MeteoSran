/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'bubble-in': 'bubble-in 0.7s cubic-bezier(.4,0,.2,1)',
        'fade-in': 'fade-in 0.5s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bubble-in: {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(0.98)' },
          '60%': { opacity: '1', transform: 'translateY(-4px) scale(1.02)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
    function ({ addUtilities }) {
      const newUtilities = {
        '.backdrop-blur-glass': {
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
        },
      };
      addUtilities(newUtilities, ['responsive']);
      // To use the bubble-in animation, add this to your global CSS:
      // .bubble-in { @apply animate-bubble-in; }
    },
  ],
}; 