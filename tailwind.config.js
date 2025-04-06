/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    screens: {
      'xxs': '320px',  // Dispositivos muito pequenos
      'xs': '375px',   // iPhone SE, iPhone 8
      'sm': '640px',   // Tablets pequenos, dispositivos maiores
      'md': '768px',   // Tablets
      'lg': '1024px',  // Desktops e tablets landscape
      'xl': '1280px',  // Desktops grandes
      '2xl': '1536px', // Telas extra grandes
      // Breakpoints específicos para diferentes modelos de iPhone
      'iphone-se': {'raw': '(device-width: 375px) and (device-height: 667px)'},
      'iphone-x': {'raw': '(device-width: 375px) and (device-height: 812px)'},
      'iphone-plus': {'raw': '(device-width: 414px) and (device-height: 736px)'},
      'iphone-12': {'raw': '(device-width: 390px) and (device-height: 844px)'},
      'iphone-12-max': {'raw': '(device-width: 428px) and (device-height: 926px)'},
      // Breakpoints específicos para diferentes modelos de Android
      'android-small': {'raw': '(max-width: 360px)'},
      'android-medium': {'raw': '(min-width: 361px) and (max-width: 400px)'},
      'android-large': {'raw': '(min-width: 401px) and (max-width: 480px)'},
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
        // Valores específicos para safe-area em diferentes dispositivos
        'safe-top': 'var(--safe-area-inset-top, 0px)',
        'safe-bottom': 'var(--safe-area-inset-bottom, 0px)',
        'safe-left': 'var(--safe-area-inset-left, 0px)',
        'safe-right': 'var(--safe-area-inset-right, 0px)',
      },
      fontSize: {
        'xxs': '0.65rem',
        'tiny': '0.7rem',
      },
      height: {
        'screen-ios': 'var(--app-height)',
        'screen-dynamic': 'calc(var(--vh, 1vh) * 100)',
      },
      minHeight: {
        'screen-ios': 'var(--app-height)',
        'screen-dynamic': 'calc(var(--vh, 1vh) * 100)',
      },
      maxHeight: {
        'screen-ios': 'var(--app-height)',
        'screen-dynamic': 'calc(var(--vh, 1vh) * 100)',
      },
    },
  },
  // Adicionar variantes para detectar diferentes dispositivos
  plugins: [
    function({ addVariant }) {
      // Variantes para iOS
      addVariant('ios', '.ios-device &');
      // Variantes para Android
      addVariant('android', ':not(.ios-device).mobile-device &');
      // Variante para PWA
      addVariant('pwa', '.pwa-mode &');
    }
  ],
};