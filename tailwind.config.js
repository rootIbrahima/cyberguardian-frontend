/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#0F1929',
        blue: {
          50:  '#F3F8FD',
          100: '#E8F1FA',
          400: '#6AADE6',
          500: '#3B8FDB',
          600: '#2A7ACC',
          700: '#1F5C99',
          800: '#153D66',
          900: '#0F2D4D',
        },
        gray: {
          50:  '#F5F6FA',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          900: '#111827',
        },
        green: {
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
        },
        red: {
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
        },
        orange: {
          100: '#FED7AA',
          500: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
