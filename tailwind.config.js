/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#00e1ff',
        'background-light': '#f5f8f8',
        'background-dark': '#020617',
        'surface-light': '#ffffff',
        'surface-dark': '#0f172a',
        'border-light': '#e2e8f0',
        'border-dark': '#1e293b',
        'text-main': '#0f172a',
        'text-muted': '#64748b',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      boxShadow: {
        tech: '0 4px 20px -2px rgba(0, 212, 255, 0.1), 0 2px 15px -3px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
