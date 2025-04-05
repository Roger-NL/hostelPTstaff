import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Detecção de dispositivo móvel
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Configurar o tema escuro como padrão
const savedTheme = localStorage.getItem('theme');
if (!savedTheme) {
  document.documentElement.classList.add('dark');
  localStorage.setItem('theme', 'dark');
} else if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

// Otimizações para dispositivos móveis
if (isMobile) {
  // Adiciona classe específica para mobile no body
  document.body.classList.add('mobile-device');
  
  // Desativa transições e animações complexas em devices de baixa performance
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @media (max-width: 767px) {
      .backdrop-blur-xl {
        backdrop-filter: none !important;
      }
      
      .transition-all, .transition-opacity, .transition-transform {
        transition-duration: 0.1s !important;
      }
      
      /* Garante que animações de carregamento continuem funcionando */
      .animate-spin {
        animation-duration: 1.5s !important;
      }
    }
  `;
  document.head.appendChild(styleElement);
  
  // Otimização adicional para telas menores
  if (window.innerWidth < 480) {
    // Desativa efeitos visuais custosos
    document.documentElement.classList.add('reduce-animation');
    
    // Ajuste para melhorar a performance de renderização
    const performanceStyle = document.createElement('style');
    performanceStyle.textContent = `
      .glass-morphism {
        background-color: rgba(0, 0, 0, 0.2) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      
      .bg-opacity-60, .bg-opacity-50, .bg-opacity-40, .bg-opacity-30 {
        background-color: rgba(0, 0, 0, 0.2) !important;
      }
    `;
    document.head.appendChild(performanceStyle);
  }
}

// Desabilita StrictMode em produção para melhorar performance
const AppWithMode = import.meta.env.DEV ? (
  <StrictMode>
    <App />
  </StrictMode>
) : <App />;

createRoot(document.getElementById('root')!).render(AppWithMode);
