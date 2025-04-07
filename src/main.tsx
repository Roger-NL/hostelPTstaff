import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { applyDeviceClasses, detectDevice } from './utils/deviceDetector';
import { initTouchOptimizer } from './utils/touchOptimizer';
import { initViewportNormalizer } from './utils/viewportNormalizer';

// Detectar tipo de dispositivo
const deviceInfo = detectDevice();

// Configurar viewport para dispositivos móveis
const setViewportForMobile = () => {
  // Inicializa as classes de detecção de dispositivo
  applyDeviceClasses();
  
  // Define o meta viewport dinamicamente
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    // Configura o viewport para prevenir zoom em inputs em iOS
    viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  } else {
    // Cria a tag meta viewport se não existir
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    document.getElementsByTagName('head')[0].appendChild(meta);
  }
  
  // Adiciona meta tag para Apple PWA
  const metaApple = document.createElement('meta');
  metaApple.name = 'apple-mobile-web-app-capable';
  metaApple.content = 'yes';
  document.getElementsByTagName('head')[0].appendChild(metaApple);
  
  // Adiciona meta tag para cor da barra de status
  const metaStatusBar = document.createElement('meta');
  metaStatusBar.name = 'apple-mobile-web-app-status-bar-style';
  metaStatusBar.content = 'black-translucent';
  document.getElementsByTagName('head')[0].appendChild(metaStatusBar);
  
  // Configura altura do viewport em dispositivos iOS
  if (deviceInfo.isIOS) {
    // Função para definir altura real do viewport em iOS
    const setVhVariable = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Definir altura inicial
    setVhVariable();
    
    // Atualizar em mudanças de orientação ou redimensionamento
    window.addEventListener('resize', setVhVariable);
    window.addEventListener('orientationchange', setVhVariable);
  }
  
  // Ajustes para melhorar o desempenho em dispositivos de baixo desempenho
  if (deviceInfo.isMobile) {
    document.documentElement.classList.add('reduce-animation');
    
    // Reduzir número de frames em animações
    const styleReduceMotion = document.createElement('style');
    styleReduceMotion.innerHTML = `
      .animate-spin {
        animation-duration: 1.5s !important;
      }
      .transition-all {
        transition-duration: 0.2s !important;
      }
    `;
    document.head.appendChild(styleReduceMotion);
  }
  
  // Prevenir comportamentos problemáticos de scroll e gestos
  if (deviceInfo.isMobile || deviceInfo.isTablet) {
    // Prevenir bounce de scroll
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
    
    // Prevenir seleção de texto indesejada em dispositivos touch
    document.body.style.webkitUserSelect = 'none';
    document.body.style.userSelect = 'none';
    (document.body.style as any)['-webkit-touch-callout'] = 'none';
    
    // Habilitar seleção de texto apenas em campos de entrada
    const styleAllowTextSelection = document.createElement('style');
    styleAllowTextSelection.innerHTML = `
      input, textarea {
        -webkit-user-select: auto;
        user-select: auto;
      }
    `;
    document.head.appendChild(styleAllowTextSelection);
  }
  
  // Log do dispositivo detectado para debugging (remover em produção)
  console.log('Dispositivo detectado:', deviceInfo);
};

// Script para corrigir problemas com botões e elementos clicáveis
const fixInteractiveElements = () => {
  // Adicionar script para garantir que botões funcionem corretamente
  const fixScript = document.createElement('script');
  fixScript.innerHTML = `
    (function() {
      // Função para garantir que todos os elementos interativos funcionem
      function makeElementsClickable() {
        // Selecionar todos os elementos interativos
        var elements = document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"], input[type="reset"], [class*="btn"], [class*="button"]');
        
        // Garantir que cada elemento tenha eventos funcionando corretamente
        elements.forEach(function(el) {
          // Adicionar novo atributo para indicar que foi processado
          if (!el.hasAttribute('data-click-fixed')) {
            el.setAttribute('data-click-fixed', 'true');
            
            // Aplicar estilos inline para garantir clicabilidade
            el.style.setProperty('pointer-events', 'auto', 'important');
            el.style.setProperty('cursor', 'pointer', 'important');
            el.style.setProperty('touch-action', 'manipulation', 'important');
            
            // Para elementos transformados, adicionar z-index
            var parent = el.parentElement;
            while (parent && parent !== document.body) {
              var transform = window.getComputedStyle(parent).getPropertyValue('transform');
              if (transform && transform !== 'none') {
                el.style.setProperty('position', 'relative', 'important');
                el.style.setProperty('z-index', '1', 'important');
                break;
              }
              parent = parent.parentElement;
            }
          }
        });
      }
      
      // Executar imediatamente
      makeElementsClickable();
      
      // Configurar um MutationObserver para detectar novos elementos
      var observer = new MutationObserver(function(mutations) {
        makeElementsClickable();
      });
      
      // Observar mudanças no DOM
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Garantir que os eventos de clique se propaguem corretamente
      document.addEventListener('click', function(e) {
        var target = e.target;
        
        // Se o clique foi em um elemento dentro de um botão, propagar para o botão
        while (target && target !== document.body) {
          if (
            target.tagName === 'BUTTON' || 
            target.tagName === 'A' || 
            target.getAttribute('role') === 'button' ||
            target.classList.contains('btn') ||
            target.classList.contains('button')
          ) {
            // Se o evento não começou no botão, simular um clique nele
            if (e.target !== target) {
              target.click();
              e.preventDefault();
              e.stopPropagation();
            }
            break;
          }
          target = target.parentElement;
        }
      }, true);
    })();
  `;
  document.head.appendChild(fixScript);
  
  // Adicionar CSS para garantir que elementos interativos sejam clicáveis
  const fixStyles = document.createElement('style');
  fixStyles.innerHTML = `
    /* Garantir que elementos clicáveis funcionem */
    button, a, [role="button"], input[type="button"], input[type="submit"], input[type="reset"], .btn, .button {
      pointer-events: auto !important;
      cursor: pointer !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: rgba(0,0,0,0) !important;
    }
    
    /* Corrigir problema de propagação de eventos em elementos aninhados */
    button *, a *, [role="button"] * {
      pointer-events: none;
    }
    
    /* Forçar elementos a serem interativos mesmo quando estão dentro de contêineres com transformação */
    .transform-container button, .transform-container a, .transform-container [role="button"],
    [style*="transform"] button, [style*="transform"] a, [style*="transform"] [role="button"] {
      position: relative !important;
      z-index: 1 !important;
      transform: translateZ(0) !important;
    }
  `;
  document.head.appendChild(fixStyles);
};

// Configurar o ambiente antes de renderizar
setViewportForMobile();

// Inicializar otimizador de toque para toda a aplicação
if (deviceInfo.isMobile || deviceInfo.isTablet || deviceInfo.isTouchDevice) {
  initTouchOptimizer({
    preventDoubleTapZoom: true,
    disableContextMenu: !deviceInfo.isDesktop,
    optimizeFastClick: true,
    preventGhostClicks: true
  });
}

// Inicializar normalizador de viewport para garantir consistência visual
// em diferentes dispositivos e navegadores
initViewportNormalizer();

// Aplicar correção para elementos interativos
fixInteractiveElements();

// Função para detecção e adaptação a diferentes dispositivos
const detectAndAdaptToDevice = () => {
  // Detectar características específicas do dispositivo para ajustes mais precisos
  const isLowEndDevice = deviceInfo.isAndroid && navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  const isHighDensityScreen = window.devicePixelRatio > 2;
  
  // Aplicar classes específicas para tipos de dispositivos
  if (isLowEndDevice) {
    document.documentElement.classList.add('low-end-device');
    document.documentElement.classList.add('reduce-animation');
    document.documentElement.classList.add('simplified-ui');
  }
  
  if (isHighDensityScreen) {
    document.documentElement.classList.add('high-density-screen');
  }
  
  // Adicionar medidas específicas para diferentes navegadores
  if (deviceInfo.isSafari && deviceInfo.isIOS) {
    // Correções específicas para Safari iOS
    document.documentElement.classList.add('safari-ios');
    
    const safariIOSFixes = document.createElement('style');
    safariIOSFixes.innerHTML = `
      /* Fix para problemas de scroll em Safari iOS */
      .safari-ios .content-scrollable {
        -webkit-overflow-scrolling: touch !important;
      }
      
      /* Fix para problemas de posicionamento fixed em Safari iOS */
      .safari-ios .fixed {
        transform: translateZ(0);
      }
      
      /* Hack para forçar redraw em Safari iOS */
      .safari-ios * {
        -webkit-backface-visibility: hidden;
      }
    `;
    document.head.appendChild(safariIOSFixes);
  }
  
  if (deviceInfo.isChrome && deviceInfo.isAndroid) {
    // Correções específicas para Chrome em Android
    document.documentElement.classList.add('chrome-android');
  }
};

// Executar detecção e adaptação para dispositivos específicos
detectAndAdaptToDevice();

// Renderizar a aplicação
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
