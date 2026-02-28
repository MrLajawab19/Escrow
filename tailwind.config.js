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
        // Stripe Indigo & Paytm Blue Palette
        primary: {
          50: '#F5F5FF',
          100: '#EBEBFF',
          200: '#CCCAFF',
          300: '#ACA9FF',
          400: '#8885FF',
          500: '#635BFF', // Stripe Indigo
          600: '#524CE6',
          700: '#423DCC',
          800: '#312EB3',
          900: '#211F99',
          950: '#100F4C',
        },
        secondary: {
          50: '#E6FAFF',
          100: '#CCF5FF',
          200: '#99EAFC',
          300: '#66E0F9',
          400: '#33D5F6',
          500: '#00BAF2', // Paytm Blue
          600: '#00A3D6',
          700: '#008CBA',
          800: '#00759E',
          900: '#005E82',
          950: '#002F41',
        },
        navy: {
          50: '#F0F3F7',
          100: '#E1E7EF',
          200: '#C2CFDE',
          300: '#A4B7CD',
          400: '#859FBD',
          500: '#6787AC',
          600: '#496F9B',
          700: '#2A578A',
          800: '#173E66',
          900: '#0A2540', // Stripe Deep Navy
          950: '#051220',
        },
        neutral: {
          50: '#F6F9FC', // Soft Background
          100: '#F0F4F8',
          200: '#E6EBF1', // Border Light
          300: '#DDE2E8',
          400: '#C0C8D1',
          500: '#A3ACB5',
          600: '#8898AA', // Neutral Text
          700: '#6D7C8F',
          800: '#526074',
          900: '#374558',
          950: '#1C293D',
        },
        success: {
          50: '#E8FAF2',
          100: '#CFF5E4',
          200: '#A1EAC8',
          300: '#72DFAB',
          400: '#44D48F',
          500: '#16C784', // Success Green
          600: '#12A169',
          700: '#0D7B4E',
          800: '#095536',
          900: '#042F1D',
        },
        error: {
          50: '#FFE6E6',
          100: '#FFCCCC',
          200: '#FF9999',
          300: '#FF6666',
          400: '#FF4D4F', // Error Red
          500: '#E6393B',
          600: '#CC292A',
          700: '#B31A1B',
          800: '#990A0C',
          900: '#800000',
        },
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem', /* 12px */
        '2xl': '1rem',   /* 16px */
        '3xl': '1.5rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'elevated': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
