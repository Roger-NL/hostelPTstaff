import { useEffect, useRef, useState } from 'react';

interface PerformanceOptions {
  disableAnimations?: boolean;
  simplifyUI?: boolean;
  enableVirtualization?: boolean;
  deferRendering?: boolean;
  deferTime?: number;
}

/**
 * Hook para otimizar a performance em diferentes dispositivos
 * 
 * @param options Opções de otimização
 * @returns Objeto com flags de otimização e utilitários
 */
export const usePerformanceOptimizer = (options: PerformanceOptions = {}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  
  const {
    disableAnimations = true,
    simplifyUI = true,
    enableVirtualization = true,
    deferRendering = true,
    deferTime = 100
  } = options;
  
  useEffect(() => {
    // Detecta o tipo de dispositivo e desempenho
    const detectDeviceCapabilities = () => {
      // Checar se é um dispositivo móvel
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Checar tamanho da tela
      const smallScreen = window.innerWidth < 768;
      setIsSmallScreen(smallScreen);
      
      // Checar hardware device com memória limitada (aproximação)
      // Uma maneira de identificar dispositivos de baixo desempenho é verificar o número
      // de núcleos lógicos da CPU e a memória RAM disponível
      const lowMemory = 'deviceMemory' in navigator && (navigator as any).deviceMemory < 4;
      const lowCPU = 'hardwareConcurrency' in navigator && navigator.hardwareConcurrency < 4;
      
      // Dispositivo considerado de baixo desempenho se for móvel + tela pequena OU tiver baixa memória/CPU
      setIsLowEndDevice(
        (isMobile && smallScreen) || lowMemory || lowCPU
      );
    };
    
    // Aplicar otimizações conforme necessário
    const applyOptimizations = () => {
      if (isLowEndDevice) {
        // Adiciona classe para otimizações CSS
        document.documentElement.classList.add('low-end-device');
        
        if (disableAnimations) {
          document.documentElement.classList.add('reduce-animation');
        }
        
        if (simplifyUI) {
          document.documentElement.classList.add('simplified-ui');
        }
      }
    };
    
    // Detectar capabilities e aplicar otimizações
    detectDeviceCapabilities();
    
    if (deferRendering) {
      // Adia a montagem completa em dispositivos de baixo desempenho
      timeoutRef.current = window.setTimeout(() => {
        setIsMounted(true);
        applyOptimizations();
      }, isLowEndDevice ? deferTime : 0);
    } else {
      setIsMounted(true);
      applyOptimizations();
    }
    
    // Limpar timeout quando componente for desmontado
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [disableAnimations, simplifyUI, deferRendering, deferTime, isLowEndDevice]);
  
  return {
    isReady: isMounted,
    isLowEndDevice,
    isSmallScreen,
    shouldVirtualize: enableVirtualization && isLowEndDevice,
    shouldSimplifyUI: simplifyUI && isLowEndDevice,
    shouldDisableAnimations: disableAnimations && isLowEndDevice
  };
};

export default usePerformanceOptimizer; 