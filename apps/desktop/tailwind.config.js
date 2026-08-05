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
        continuum: {
          bgDark: '#0f1013',
          cardDark: '#17191e',
          sidebarDark: '#121317',
          borderDark: '#232630',
          textDark: '#f1f5f9',
          subtextDark: '#94a3b8',

          bgLight: '#f8fafc',
          cardLight: '#ffffff',
          sidebarLight: '#f1f5f9',
          borderLight: '#e2e8f0',
          textLight: '#0f172a',
          subtextLight: '#64748b',

          amber: '#f59e0b',
          amberGlow: '#fbbf24',
          amberDark: '#d97706',
          amberMuted: '#b45309',
        },
        apple: {
          bgLight: '#F5F5F7',
          cardLight: '#FFFFFF',
          sidebarLight: '#E8E8ED',
          textLight: '#1D1D1F',
          subtextLight: '#86868B',
          yellow: '#f59e0b',
          accent: '#007AFF',

          bgDark: '#0f1013',
          cardDark: '#17191e',
          sidebarDark: '#121317',
          textDark: '#F5F5F7',
          subtextDark: '#98989D',
        }
      }
    },
  },
  plugins: [],
}

