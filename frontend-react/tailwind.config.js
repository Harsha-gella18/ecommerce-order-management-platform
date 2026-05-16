/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: { DEFAULT: '#0F172A', 950: '#020617' },
        brand: { blue: '#2563EB', cyan: '#06B6D4' },
        surface: { DEFAULT: '#F8FAFC', dark: '#1E293B' },
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 8px -2px rgba(15, 23, 42, 0.06)',
        glass: '0 8px 32px rgba(15, 23, 42, 0.12)',
      },
      backgroundImage: {
        'gradient-customer': 'linear-gradient(135deg, #2563EB 0%, #06B6D4 55%, #0EA5E9 100%)',
        'gradient-mesh':
          'radial-gradient(at 40% 20%, rgba(37, 99, 235, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(6, 182, 212, 0.12) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
};
