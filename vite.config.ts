import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Otimizando JSX para produção
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage']
  },
  build: {
    chunkSizeWarningLimit: 1000,
    // Minificação aprimorada 
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs em produção
        drop_debugger: true
      }
    },
    // Otimizando o carregamento separando os chunks
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'recharts'],
          utils: ['date-fns', 'zustand'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Separa as páginas grandes em chunks distintos
          pages: [
            './src/pages/Dashboard.tsx',
            './src/pages/Tasks.tsx',
            './src/pages/Events.tsx',
            './src/pages/Schedule.tsx'
          ]
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'firebase': path.resolve(__dirname, './node_modules/firebase')
    },
  },
  // Configurações específicas para desenvolvimento
  server: {
    hmr: {
      // Otimiza HMR para ser mais rápido
      overlay: false
    }
  },
  // Cache mais eficiente durante o desenvolvimento
  cacheDir: '.vite_cache'
});
