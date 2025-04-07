/**
 * Utilitário para corrigir problemas de interação em dispositivos móveis
 * Foca especificamente em resolver problemas de clique e navegação
 */

/**
 * Aplica correções para problemas de clique em dispositivos móveis
 * Esta função deve ser chamada logo após o carregamento da página
 * @returns Uma função para limpar os listeners quando não forem mais necessários
 */
export function applyMobileClickFixes(): () => void {
  // Logs adicionais para debugging
  console.log('Aplicando correções para interação móvel...');
  
  // 1. Garantir que eventos de clique são capturados corretamente
  const clickHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    console.log('Clique detectado em:', target?.tagName, target?.className);
    
    // Se o elemento clicado não tiver um manipulador de clique direto,
    // verificamos se algum de seus pais deve receber o clique
    if (!target.hasAttribute('data-click-fixed')) {
      let currentTarget = target.parentElement;
      
      // Busca um elemento clicável pai
      while (currentTarget && currentTarget !== document.body) {
        if (currentTarget.hasAttribute('data-click-fixed') || 
            currentTarget.tagName === 'BUTTON' || 
            currentTarget.tagName === 'A' || 
            currentTarget.hasAttribute('role') && currentTarget.getAttribute('role') === 'button') {
          
          console.log('Propagando clique para elemento pai:', currentTarget.tagName, currentTarget.className);
          
          // Simular um clique no elemento pai
          setTimeout(() => {
            currentTarget?.click();
          }, 10);
          
          // Não seguir com a propagação do evento original
          e.stopPropagation();
          break;
        }
        
        currentTarget = currentTarget.parentElement;
      }
    }
  };
  
  document.addEventListener('click', clickHandler, {capture: true});
  
  // 2. Corrigir problemas com cards e elementos navegáveis
  const makeElementsClickable = () => {
    const clickableElements = document.querySelectorAll('a, button, [role="button"], .clickable-element, [class*="card"], [class*="Card"]');
    
    clickableElements.forEach(element => {
      if (!element.hasAttribute('data-click-fixed')) {
        element.setAttribute('data-click-fixed', 'true');
        
        // Forçar pointer-events auto para garantir clicabilidade
        (element as HTMLElement).style.setProperty('pointer-events', 'auto', 'important');
        
        // Adicionar role="button" para elementos que atuam como botões
        if (!element.hasAttribute('role') && 
            element.tagName !== 'A' && 
            element.tagName !== 'BUTTON') {
          element.setAttribute('role', 'button');
        }
        
        // Garantir que o elemento seja focalizável
        if (!element.hasAttribute('tabindex')) {
          element.setAttribute('tabindex', '0');
        }
        
        // Log para confirmação
        console.log('Elemento corrigido:', element.tagName, element.className);
      }
    });
  };
  
  // Aplicar correções imediatamente
  makeElementsClickable();
  
  // Atualizar a cada 2 segundos para elementos adicionados dinamicamente
  const intervalId = setInterval(makeElementsClickable, 2000);
  
  // 3. Observar o DOM para mudanças e aplicar correções
  const observer = new MutationObserver((mutations) => {
    let foundNewElements = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            
            // Verificar se o elemento ou seus filhos precisam ser corrigidos
            if (element.matches('a, button, [role="button"], .clickable-element, [class*="card"], [class*="Card"]') ||
                element.querySelectorAll('a, button, [role="button"], .clickable-element, [class*="card"], [class*="Card"]').length > 0) {
              foundNewElements = true;
            }
          }
        });
      }
    });
    
    if (foundNewElements) {
      makeElementsClickable();
    }
  });
  
  // Iniciar observação do DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // 4. Corrigir problemas específicos de dispositivos móveis
  let touchEndListener: ((e: TouchEvent) => void) | null = null;
  
  if ('ontouchstart' in window) {
    console.log('Dispositivo com tela de toque detectado, aplicando correções específicas...');
    
    // 4.1 Reduzir atraso do toque
    document.documentElement.style.setProperty('touch-action', 'manipulation');
    
    // 4.2 Fixar problemas com eventos de duplo toque
    touchEndListener = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // Se for um elemento clicável, não interferimos
      if (target.tagName === 'A' || 
          target.tagName === 'BUTTON' || 
          (target.getAttribute('role') === 'button') ||
          target.classList.contains('clickable-element')) {
        return;
      }
      
      // Para outros elementos, prevenimos duplo toque
      const now = Date.now();
      const lastTouch = parseInt(target.getAttribute('data-last-touch') || '0');
      
      if (now - lastTouch < 300) {
        e.preventDefault();
      }
      
      target.setAttribute('data-last-touch', now.toString());
    };
    
    document.addEventListener('touchend', touchEndListener, { passive: false });
  }
  
  // Retornar função de limpeza
  return () => {
    // Cleanup quando a função for desmontada
    clearInterval(intervalId);
    observer.disconnect();
    document.removeEventListener('click', clickHandler, {capture: true});
    
    if (touchEndListener) {
      document.removeEventListener('touchend', touchEndListener, { passive: false } as EventListenerOptions);
    }
  };
}

/**
 * Identifica se um elemento está dentro de um contêiner com transformação (scale, rotate, etc)
 * Isso pode ajudar a corrigir problemas com cliques em elementos transformados
 */
export function isInTransformedContainer(element: HTMLElement): boolean {
  let currentElement = element;
  
  while (currentElement && currentElement !== document.body) {
    const style = window.getComputedStyle(currentElement);
    const transform = style.getPropertyValue('transform');
    
    if (transform && transform !== 'none') {
      return true;
    }
    
    currentElement = currentElement.parentElement as HTMLElement;
  }
  
  return false;
}

/**
 * Corrige eventos de interação para um elemento específico
 * Útil para elementos que são adicionados dinamicamente ou que precisam de correções especiais
 */
export function fixElementInteraction(element: HTMLElement): void {
  if (!element) return;
  
  // Garantir interatividade correta
  element.setAttribute('data-click-fixed', 'true');
  element.style.setProperty('pointer-events', 'auto', 'important');
  
  // Se for um elemento transformado ou dentro de um contêiner transformado
  if (isInTransformedContainer(element)) {
    element.style.setProperty('position', 'relative', 'important');
    element.style.setProperty('z-index', '1', 'important');
    element.style.setProperty('transform', 'translateZ(0)', 'important');
  }
  
  // Garante que o elemento é focalizável
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '0');
  }
  
  // Log para confirmação
  console.log('Interação corrigida para elemento específico:', element.tagName, element.className);
} 