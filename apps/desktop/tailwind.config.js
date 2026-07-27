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
        apple: {
          bgLight: '#F5F5F7',
          cardLight: '#FFFFFF',
          sidebarLight: '#E8E8ED',
          textLight: '#1D1D1F',
          subtextLight: '#86868B',
          yellow: '#E5A93C',
          accent: '#007AFF',

          bgDark: '#1E1E1E',
          cardDark: '#2C2C2E',
          sidebarDark: '#252528',
          textDark: '#F5F5F7',
          subtextDark: '#98989D',
        }
      }
    },
  },
  plugins: [],
}
