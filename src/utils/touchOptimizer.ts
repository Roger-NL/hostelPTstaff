/**
 * Utilitário para otimizar interações de toque em dispositivos móveis
 * Resolve problemas comuns como atraso de toque, clique duplo acidental e travamentos
 */

// Interface para configuração do otimizador de toque
export interface TouchOptimizerConfig {
  preventDoubleTapZoom: boolean;
  disableContextMenu: boolean;
  optimizeFastClick: boolean;
  preventGhostClicks: boolean;
  useActiveStateForButtons: boolean;
  disableCalloutOnLongPress: boolean;
  useFastActive: boolean;
}

// Configuração padrão
const defaultConfig: TouchOptimizerConfig = {
  preventDoubleTapZoom: true,
  disableContextMenu: true,
  optimizeFastClick: true,
  preventGhostClicks: true,
  useActiveStateForButtons: true,
  disableCalloutOnLongPress: true,
  useFastActive: true
};

/**
 * Inicializa o otimizador de toque para dispositivos móveis
 */
export function initTouchOptimizer(config: Partial<TouchOptimizerConfig> = {}): () => void {
  // Mesclar configuração padrão com a configuração fornecida
  const mergedConfig: TouchOptimizerConfig = { ...defaultConfig, ...config };
  
  // Objeto para rastrear eventos de toque
  const touchState = {
    lastTouchTime: 0,
    lastTouchX: 0,
    lastTouchY: 0,
    touchTimer: null as NodeJS.Timeout | null,
    activeElement: null as HTMLElement | null,
  };
  
  // Adicionar CSS para melhorar a experiência de toque
  const style = document.createElement('style');
  style.textContent = `
    /* Otimizações de toque */
    html {
      touch-action: manipulation;
    }
    body {
      -webkit-touch-callout: ${mergedConfig.disableCalloutOnLongPress ? 'none' : 'default'};
      -webkit-tap-highlight-color: rgba(0,0,0,0);
      touch-action: manipulation;
    }
    button, a, [role="button"], input, select {
      touch-action: manipulation;
      -webkit-tap-highlight-color: rgba(0,0,0,0);
      cursor: pointer;
    }
    .touch-optimized:active {
      transform: scale(0.98);
      transition: transform 0.1s ease;
    }
    .touch-active {
      opacity: 0.7;
      transition: opacity 0.1s ease;
    }
    @media (hover: none) {
      /* Estilizações específicas para dispositivos sem hover */
      button, a, [role="button"] {
        min-height: 44px;
        min-width: 44px;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Prevenir zoom de duplo toque - mas apenas em elementos não interativos
  const preventDoubleTapZoom = (e: TouchEvent) => {
    // Ignorar prevenção em elementos interativos
    if (
      e.target instanceof HTMLButtonElement ||
      e.target instanceof HTMLAnchorElement ||
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLSelectElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target instanceof HTMLElement && e.target.getAttribute('role') === 'button')
    ) {
      return; // Permitir comportamento padrão em elementos interativos
    }
    
    const now = Date.now();
    const timeDiff = now - touchState.lastTouchTime;
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const xyDiff = Math.hypot(touchX - touchState.lastTouchX, touchY - touchState.lastTouchY);
    
    if (timeDiff < 300 && xyDiff < 20) {
      e.preventDefault();
    }
    
    touchState.lastTouchTime = now;
    touchState.lastTouchX = touchX;
    touchState.lastTouchY = touchY;
  };
  
  // Implementar FastClick para reduzir atraso de toque
  const optimizeFastClick = () => {
    const addTouchClass = (e: TouchEvent) => {
      if (!mergedConfig.useFastActive) return;
      
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'BUTTON' || target.tagName === 'A' || 
          target.getAttribute('role') === 'button')) {
        touchState.activeElement = target;
        target.classList.add('touch-active');
      }
    };
    
    const removeTouchClass = () => {
      if (touchState.activeElement) {
        touchState.activeElement.classList.remove('touch-active');
        touchState.activeElement = null;
      }
    };
    
    document.addEventListener('touchstart', addTouchClass, { passive: true });
    document.addEventListener('touchend', removeTouchClass, { passive: true });
    document.addEventListener('touchcancel', removeTouchClass, { passive: true });
  };
  
  // Prevenir cliques fantasmas (ghost clicks) - versão corrigida
  const preventGhostClicks = () => {
    const positions: Array<{ x: number; y: number; timestamp: number }> = [];
    
    // Registrar posição de toque
    const recordTouchPosition = (e: TouchEvent) => {
      // Não rastrear toques em elementos interativos
      if (
        e.target instanceof HTMLButtonElement ||
        e.target instanceof HTMLAnchorElement ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.getAttribute('role') === 'button')
      ) {
        return;
      }
      
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        positions.push({
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now()
        });
      }
    };
    
    // Verificar e prevenir cliques fantasmas
    const checkAndPreventGhostClick = (e: MouseEvent) => {
      // Não prevenir cliques em elementos interativos
      if (
        e.target instanceof HTMLButtonElement ||
        e.target instanceof HTMLAnchorElement ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.getAttribute('role') === 'button')
      ) {
        return;
      }
      
      const now = Date.now();
      
      // Remover posições antigas (mais de 2500ms)
      while (positions.length > 0 && now - positions[0].timestamp > 2500) {
        positions.shift();
      }
      
      // Verificar se o clique corresponde a um toque recente
      for (let i = 0; i < positions.length; i++) {
        const dx = Math.abs(e.clientX - positions[i].x);
        const dy = Math.abs(e.clientY - positions[i].y);
        
        if (dx < 25 && dy < 25) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
      }
    };
    
    document.addEventListener('touchend', recordTouchPosition, { passive: true });
    document.addEventListener('click', checkAndPreventGhostClick, true);
  };
  
  // Aplicar otimizações com base na configuração
  if (mergedConfig.preventDoubleTapZoom) {
    document.addEventListener('touchstart', preventDoubleTapZoom, { passive: false });
  }
  
  if (mergedConfig.disableContextMenu) {
    document.addEventListener('contextmenu', (e) => {
      // Permitir menu de contexto em campos de entrada
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return true;
      }
      e.preventDefault();
      return false;
    });
  }
  
  if (mergedConfig.optimizeFastClick) {
    optimizeFastClick();
  }
  
  if (mergedConfig.preventGhostClicks) {
    preventGhostClicks();
  }
  
  if (mergedConfig.useActiveStateForButtons) {
    const buttons = document.querySelectorAll('button, a, [role="button"]');
    buttons.forEach(button => {
      button.classList.add('touch-optimized');
    });
    
    // Observador de mutação para adicionar classe a novos botões
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (node.tagName === 'BUTTON' || node.tagName === 'A' || 
                  node.getAttribute('role') === 'button') {
                node.classList.add('touch-optimized');
              }
              
              const childButtons = node.querySelectorAll('button, a, [role="button"]');
              childButtons.forEach(button => {
                button.classList.add('touch-optimized');
              });
            }
          });
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // Corrigir eventos do pointer para garantir que os botões funcionem corretamente
  const fixPointerEvents = () => {
    // Adicionar classe especial a todos os elementos interativos
    const interactiveElements = document.querySelectorAll('button, a, [role="button"], input, select, textarea');
    interactiveElements.forEach(element => {
      element.classList.add('clickable-element');
    });
    
    // Adicionar estilo para garantir que eventos passem corretamente
    const pointerFix = document.createElement('style');
    pointerFix.innerHTML = `
      .clickable-element {
        pointer-events: auto !important;
        z-index: 1;
        position: relative;
      }
    `;
    document.head.appendChild(pointerFix);
    
    // Observador para novos elementos interativos
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node instanceof HTMLElement) {
              if (
                node.tagName === 'BUTTON' || 
                node.tagName === 'A' || 
                node.getAttribute('role') === 'button' ||
                node.tagName === 'INPUT' || 
                node.tagName === 'SELECT' || 
                node.tagName === 'TEXTAREA'
              ) {
                node.classList.add('clickable-element');
              }
              
              const childInteractive = node.querySelectorAll('button, a, [role="button"], input, select, textarea');
              childInteractive.forEach(el => {
                el.classList.add('clickable-element');
              });
            }
          });
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      observer.disconnect();
      if (pointerFix.parentNode) {
        pointerFix.parentNode.removeChild(pointerFix);
      }
    };
  };
  
  // Aplicar fix de pointer events
  const pointerFixCleanup = fixPointerEvents();
  
  // Retornar função de limpeza
  return () => {
    if (mergedConfig.preventDoubleTapZoom) {
      document.removeEventListener('touchstart', preventDoubleTapZoom);
    }
    
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
    
    pointerFixCleanup();
  };
}

/**
 * Hook personalizado para aplicar otimizações de toque a elementos específicos
 * @param ref Referência ao elemento DOM
 */
export function applyTouchOptimization(element: HTMLElement | null): void {
  if (!element) return;
  
  // Adicionar atributos para otimização de toque
  element.setAttribute('touch-action', 'manipulation');
  (element.style as any)['-webkit-tap-highlight-color'] = 'rgba(0,0,0,0)';
  
  // Se for um elemento clicável, adicionar classe de otimização
  if (element.tagName === 'BUTTON' || element.tagName === 'A' || 
      element.getAttribute('role') === 'button' ||
      element.tagName === 'INPUT' || element.tagName === 'SELECT') {
    element.classList.add('touch-optimized');
    element.classList.add('clickable-element'); // Garantir que eventos de clique funcionem
    
    // Garantir tamanho mínimo para facilitar o toque
    if (window.matchMedia('(hover: none)').matches) {
      const computedStyle = window.getComputedStyle(element);
      if (parseInt(computedStyle.height) < 44) {
        element.style.minHeight = '44px';
      }
      if (parseInt(computedStyle.width) < 44) {
        element.style.minWidth = '44px';
      }
    }
  }
} 