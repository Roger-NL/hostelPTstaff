/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        rustic: ['var(--font-rustic)', 'system-ui'],
        pirate: ['var(--font-pirate)', 'cursive'],
        arial: ['Arial', 'sans-serif'],
        'inter': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
      },
      backgroundImage: {
        'beach-dark': "url('https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80')",
        'beach-light': "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80')",
      },
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        regular: '400',
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
      },
      fontSize: {
        'xxs': '0.65rem',
        'tiny': '0.7rem',
      },
    },
  },
  plugins: [],
};