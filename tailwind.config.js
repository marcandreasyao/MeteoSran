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
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 1vw + 0.5rem, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 1.5vw + 0.5rem, 1rem)',
        'fluid-base': 'clamp(1rem, 2vw + 0.5rem, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 2.5vw + 0.5rem, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 3vw + 0.5rem, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 4vw + 0.5rem, 2rem)',
        'fluid-3xl': 'clamp(1.875rem, 5vw + 0.5rem, 2.5rem)',
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'fade-up-soft': 'fade-up-soft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
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
        'fade-up-soft': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
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
        '.pb-safe': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.pt-safe': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.pl-safe': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.pr-safe': {
          'padding-right': 'env(safe-area-inset-right)',
        },
        '.min-touch-target': {
          'min-height': '44px',
          'min-width': '44px',
        },
      };
      addUtilities(newUtilities, ['responsive']);
      // To use the bubble-in animation, add this to your global CSS:
      // .bubble-in { @apply animate-bubble-in; }
    },
  ],
}; 