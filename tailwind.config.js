/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E63946',
          dark: '#C1121F',
          light: '#FF6B6B',
        },
        accent: {
          DEFAULT: '#FF6B35',
          dark: '#E85D2A',
          light: '#FF8C5A',
        },
      },
    },
  },
  plugins: [],
};
