/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: '#09090b',
          card: '#18181b',
          border: '#27272a',
          accent: '#6366f1',
        },
      },
      boxShadow: {
        panel: '0 12px 50px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
};
