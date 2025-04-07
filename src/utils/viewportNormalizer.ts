/**
 * Utilitário para normalizar o viewport e garantir consistência visual
 * entre diferentes dispositivos móveis e navegadores
 */
import { detectDevice } from './deviceDetector';

interface ViewportConfig {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

// Configuração de referência para o design base
const baseConfig: ViewportConfig = {
  width: 375, // Base em iPhone 8/X (comum para designs)
  height: 667,
  scale: 1,
  fontScale: 1
};

// Cache para armazenar os fatores de escala atuais
let currentScaleFactors = {
  width: 1,
  height: 1,
  devicePixelRatio: window.devicePixelRatio || 1
};

/**
 * Normaliza o viewport para garantir que a interface seja consistente
 * entre diferentes dispositivos e orientações
 */
export function normalizeViewport(): void {
  const deviceInfo = detectDevice();
  const isLandscape = window.innerWidth > window.innerHeight;
  
  // Detectar ambiente e navegador
  const isIOS = deviceInfo.isIOS;
  const isAndroid = deviceInfo.isAndroid;
  const isSafari = deviceInfo.isSafari;
  const isSmallScreen = window.innerWidth < 360;
  
  // Altura real da viewport considerando barras de navegador
  const setRealViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    document.documentElement.style.setProperty('--vw', `${window.innerWidth * 0.01}px`);
    document.documentElement.style.setProperty('--real-height', `${window.innerHeight}px`);
    document.documentElement.style.setProperty('--screen-width', `${window.innerWidth}px`);
  };
  
  // Calcular e aplicar fatores de escala
  const calculateScaleFactors = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Calcular proporções em relação ao design base
    const widthRatio = screenWidth / baseConfig.width;
    const heightRatio = screenHeight / baseConfig.height;
    
    // Aplicar limitações para evitar elementos muito grandes ou pequenos
    // Reduzir a faixa de limites para evitar distorções excessivas
    let effectiveWidthRatio = Math.min(Math.max(widthRatio, 0.85), 1.15);
    let effectiveHeightRatio = Math.min(Math.max(heightRatio, 0.85), 1.15);
    
    // Ajuste para telas muito pequenas
    if (isSmallScreen) {
      effectiveWidthRatio = Math.min(effectiveWidthRatio, 0.95);
    }
    
    // Ajuste para alta densidade de pixels
    const dpr = window.devicePixelRatio || 1;
    const dprAdjustment = Math.max(0.9, Math.min(1 / Math.sqrt(dpr), 1.1));
    
    // Guardar para uso em outros componentes
    currentScaleFactors = {
      width: effectiveWidthRatio,
      height: effectiveHeightRatio,
      devicePixelRatio: dpr
    };
    
    // Aplicar ao CSS
    document.documentElement.style.setProperty('--scale-factor', `${effectiveWidthRatio}`);
    document.documentElement.style.setProperty('--scale-factor-height', `${effectiveHeightRatio}`);
    document.documentElement.style.setProperty('--dpr', `${dpr}`);
    document.documentElement.style.setProperty('--dpr-adjustment', `${dprAdjustment}`);
  };
  
  // Ajustes para navegadores específicos
  const applyBrowserSpecificFixes = () => {
    // Correção para Safari iOS
    if (isIOS && isSafari) {
      // Tratar barras do Safari em modo standalone
      if ((window.navigator as any).standalone) {
        document.documentElement.classList.add('ios-standalone');
      }
      
      // Forçar redraw em elementos fixos para corrigir bug de posicionamento no Safari
      const fixSafariPositionBug = () => {
        const fixedElements = document.querySelectorAll('.fixed, .sticky, [style*="position: fixed"], [style*="position:fixed"]');
        fixedElements.forEach(el => {
          const element = el as HTMLElement;
          const originalDisplay = element.style.display;
          element.style.display = 'none';
          void element.offsetHeight; // Forçar reflow
          element.style.display = originalDisplay;
        });
      };
      
      // Aplicar o fix após carregar e em orientação
      window.addEventListener('orientationchange', () => {
        setTimeout(fixSafariPositionBug, 300);
      });
      setTimeout(fixSafariPositionBug, 100);
    }
    
    // Correção para Android com barras de sistema
    if (isAndroid) {
      document.documentElement.classList.add('android-browser');
      if (isLandscape) {
        document.documentElement.classList.add('android-landscape');
      } else {
        document.documentElement.classList.remove('android-landscape');
      }
    }
  };
  
  // Definir escala de fonte base
  const setBaseFontSize = () => {
    // Tamanho padrão para o design base (16px)
    const baseFontSize = 16;
    
    // Ajustar o tamanho da fonte base com base nas proporções da tela
    // mas manter dentro de limites para garantir legibilidade
    let scaledFontSize = baseFontSize * currentScaleFactors.width;
    
    // Limitar o tamanho mínimo e máximo da fonte
    scaledFontSize = Math.max(14, Math.min(scaledFontSize, 18));
    
    // Telas pequenas precisam de fonte um pouco menor
    if (isSmallScreen) {
      scaledFontSize = Math.max(13, scaledFontSize * 0.9);
    }
    
    // Alta densidade de pixels pode usar fonte um pouco menor
    if (currentScaleFactors.devicePixelRatio > 2.5) {
      scaledFontSize *= 0.95;
    }
    
    // Aplicar tamanho base da fonte
    document.documentElement.style.fontSize = `${scaledFontSize}px`;
    document.documentElement.style.setProperty('--base-font-size', `${scaledFontSize}px`);
  };
  
  // Aplicar todas as normalizações
  setRealViewportHeight();
  calculateScaleFactors();
  setBaseFontSize();
  applyBrowserSpecificFixes();
  
  // Adicionar classes globais de viewport
  document.documentElement.classList.add('viewport-normalized');
  
  if (isLandscape) {
    document.documentElement.classList.add('landscape-mode');
    document.documentElement.classList.remove('portrait-mode');
  } else {
    document.documentElement.classList.add('portrait-mode');
    document.documentElement.classList.remove('landscape-mode');
  }
  
  // Adicionar correções para eventos de toque
  fixTouchEventsOnViewport();
}

/**
 * Corrige problemas de eventos de toque/clique no viewport normalizado
 */
function fixTouchEventsOnViewport(): void {
  // Corrigir problemas de clique em elementos interativos
  const style = document.createElement('style');
  style.textContent = `
    /* Garantir que elementos interativos sejam sempre clicáveis */
    button, a, [role="button"], input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"] {
      pointer-events: auto !important;
      position: relative;
      z-index: 1;
      cursor: pointer !important;
      touch-action: manipulation;
    }
    
    /* Evitar que transformações em contêiner quebrem eventos de clique */
    .viewport-normalized [style*="transform:"] button,
    .viewport-normalized [style*="transform:"] a,
    .viewport-normalized [style*="transform:"] [role="button"],
    .viewport-normalized [style*="transform:"] input[type="button"],
    .viewport-normalized [style*="transform:"] input[type="submit"] {
      transform: translateZ(0);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Obtém os fatores de escala atuais para uso em componentes
 */
export function getScaleFactors() {
  return {...currentScaleFactors};
}

/**
 * Inicializa e mantém o normalizador de viewport
 */
export function initViewportNormalizer(): () => void {
  // Aplicar normalização inicial
  normalizeViewport();
  
  // Atualizar em mudanças de tamanho ou orientação
  const handleResize = () => {
    normalizeViewport();
  };
  
  // Atualizar ao carregar a página
  window.addEventListener('load', handleResize);
  
  // Atualizar em mudanças de tamanho ou orientação
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => {
    // Pequeno atraso para garantir que o navegador atualizou as dimensões
    setTimeout(handleResize, 100);
  });
  
  // Para iOS precisamos de tratamento especial para mudanças de barra de endereço
  if (detectDevice().isIOS) {
    window.addEventListener('focusin', () => setTimeout(handleResize, 300));
    window.addEventListener('focusout', () => setTimeout(handleResize, 300));
  }
  
  // Função de limpeza
  return () => {
    window.removeEventListener('load', handleResize);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    
    if (detectDevice().isIOS) {
      window.removeEventListener('focusin', handleResize);
      window.removeEventListener('focusout', handleResize);
    }
  };
}

/**
 * Hook para calcular tamanhos responsivos baseados em um design de referência
 * @param size Tamanho original no design de referência (em px)
 * @param dimension Dimensão a ser escalada (width ou height)
 */
export function calculateResponsiveSize(size: number, dimension: 'width' | 'height' = 'width'): number {
  const scaleFactor = dimension === 'width' ? 
    currentScaleFactors.width : 
    currentScaleFactors.height;
  
  return Math.round(size * scaleFactor);
} 