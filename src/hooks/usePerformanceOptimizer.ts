import { useEffect, useRef, useState } from 'react';

interface PerformanceOptions {
  disableAnimations?: boolean;
  simplifyUI?: boolean;
  enableVirtualization?: boolean;
  deferRendering?: boolean;
  deferTime?: number;
  fixedLayout?: boolean;
  reduceAnimations?: boolean;
  mobileOptimizations?: boolean;
  setViewportHeight?: boolean;
}

/**
 * Hook para otimizar a performance e garantir que o app seja bem exibido em diferentes dispositivos
 * 
 * @param options Opções de otimização
 * @returns Objeto com flags de otimização e utilitários
 */
export function usePerformanceOptimizer(options: PerformanceOptions = {}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasBrowserChrome, setHasBrowserChrome] = useState(false);
  const [viewportHeight, setViewportHeightState] = useState(window.innerHeight);
  const timeoutRef = useRef<number | null>(null);
  
  const {
    disableAnimations = false,
    simplifyUI = false,
    enableVirtualization = true,
    deferRendering = true,
    deferTime = 100,
    fixedLayout = true,
    reduceAnimations = false,
    mobileOptimizations = true,
    setViewportHeight = true
  } = options;
  
  useEffect(() => {
    // Defer mounting for better performance
    if (deferRendering) {
      timeoutRef.current = window.setTimeout(() => {
        setIsMounted(true);
      }, deferTime);
    } else {
      setIsMounted(true);
    }
    
    // Detect device capabilities
    const memory = ((navigator as any).deviceMemory as number) || 4;
    const cores = navigator.hardwareConcurrency || 4;
    
    // Consider a device as low-end if it has less than 4GB RAM or fewer than 4 cores
    setIsLowEndDevice(memory < 4 || cores < 4);
    
    // Detect small screen
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Apply optimizations based on detection
    const applyOptimizations = () => {
      if (disableAnimations && isLowEndDevice) {
        document.body.classList.add('reduce-animation');
      } else {
        document.body.classList.remove('reduce-animation');
      }
      
      if (simplifyUI && isLowEndDevice) {
        document.body.classList.add('simplified-ui');
      } else {
        document.body.classList.remove('simplified-ui');
      }
      
      if (fixedLayout) {
        document.documentElement.classList.add('fixed-layout');
        document.body.classList.add('fixed-layout');
      } else {
        document.documentElement.classList.remove('fixed-layout');
        document.body.classList.remove('fixed-layout');
      }
    };
    
    applyOptimizations();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [disableAnimations, simplifyUI, deferRendering, deferTime, isLowEndDevice, fixedLayout]);
  
  useEffect(() => {
    // Detecta se é dispositivo móvel
    const checkMobile = () => {
      const mobile = window.innerWidth <= 767 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);

      // Verifica se é um dispositivo iOS com notch
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const hasNotch = isIOS && window.screen.height >= 812;
      
      // Verifica se há barra de navegação inferior persistente
      // Usamos "as any" para evitar erros do TypeScript com propriedades não padrão
      const isStandalone = (navigator as any).standalone === true;
      const hasWindowDifference = isIOS && window.innerHeight < window.screen.height;
      
      setHasBrowserChrome(hasNotch || isStandalone || hasWindowDifference);
    };

    // Atualiza a variável CSS --vh quando a altura da viewport muda (solução para 100vh em mobile)
    const setVH = () => {
      if (setViewportHeight) {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        setViewportHeightState(window.innerHeight);
      }
    };

    // Executa as verificações iniciais
    checkMobile();
    setVH();

    // Handler de resize unificado para evitar múltiplos listeners
    const handleResize = () => {
      checkMobile();
      setVH();
    };

    // Adiciona event listeners para responder a mudanças na janela
    window.addEventListener('resize', handleResize);

    // Detecta quando o teclado virtual está aberto no iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isMobile && isIOS) {
      const handleFocus = () => {
        document.body.classList.add('ios-keyboard-open');
      };
      
      const handleBlur = () => {
        document.body.classList.remove('ios-keyboard-open');
      };
      
      document.addEventListener('focusin', handleFocus);
      document.addEventListener('focusout', handleBlur);
      
      return () => {
        document.removeEventListener('focusin', handleFocus);
        document.removeEventListener('focusout', handleBlur);
        window.removeEventListener('resize', handleResize);
      };
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [
    isMobile, 
    setViewportHeight
  ]);
  
  return {
    isReady: isMounted,
    isLowEndDevice,
    isSmallScreen,
    shouldVirtualize: enableVirtualization && isLowEndDevice,
    shouldSimplifyUI: simplifyUI && isLowEndDevice,
    shouldDisableAnimations: disableAnimations && isLowEndDevice,
    useFixedLayout: fixedLayout,
    isMobile,
    hasBrowserChrome,
    viewportHeight,
  };
}

export default usePerformanceOptimizer; 