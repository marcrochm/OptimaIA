/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './js/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe7ff',
          500: '#2b59c3',
          600: '#1e44a8',
          700: '#173a8f',
          800: '#0f2a6b',
          900: '#0a1f52',
        },
      },
    },
  },
  plugins: [],
};
