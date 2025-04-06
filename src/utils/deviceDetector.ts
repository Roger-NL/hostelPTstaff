/**
 * Utilitário para detectar e gerenciar diferentes dispositivos e navegadores
 */
import { useState, useEffect } from 'react';

// Interface para o estado de detecção do dispositivo
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isPWA: boolean;
  hasNotch: boolean;
  browserName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browserHeight: number;
  screenHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
}

// Detecta o dispositivo e navegador atual
export function detectDevice(): DeviceInfo {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  
  // Detecção de sistema operacional
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(userAgent);
  
  // Detecção de tipo de dispositivo
  const isMobile = /iPhone|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) && 
                  !(window.innerWidth > 768);
  const isTablet = (/iPad/.test(userAgent) || 
                  (/Android/.test(userAgent) && !/Mobile/.test(userAgent)) ||
                  (window.innerWidth > 768 && window.innerWidth <= 1024));
  const isDesktop = !isMobile && !isTablet;
  
  // Detecção de navegador
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  
  // Detecção de PWA
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
               (window.navigator as any).standalone || 
               document.referrer.includes('android-app://');
  
  // Detecção de notch (aproximada - baseada nos modelos conhecidos por terem notch)
  const hasNotch = isIOS && 
                  window.screen.height >= 812 && 
                  window.devicePixelRatio >= 2;
  
  // Determinar nome do navegador
  let browserName = 'Unknown';
  if (isSafari) browserName = 'Safari';
  else if (isChrome) browserName = 'Chrome';
  else if (isFirefox) browserName = 'Firefox';
  else if (/Edge/.test(userAgent)) browserName = 'Edge';
  else if (/MSIE|Trident/.test(userAgent)) browserName = 'Internet Explorer';
  
  // Determinar tipo de dispositivo para uso em classes CSS
  const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
  
  // Obter valores de safe area inset
  const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0');
  const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0');
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isFirefox,
    isPWA,
    hasNotch,
    browserName,
    deviceType,
    browserHeight: window.innerHeight,
    screenHeight: window.screen.height,
    safeAreaTop,
    safeAreaBottom
  };
}

// Aplica classes CSS com base no dispositivo detectado
export function applyDeviceClasses(): void {
  const info = detectDevice();
  const root = document.documentElement;
  const body = document.body;
  
  // Limpar classes existentes
  root.classList.remove(
    'mobile-device', 'tablet-device', 'desktop-device',
    'ios-device', 'android-device', 'notch-device', 'pwa-mode'
  );
  
  // Aplicar classes baseadas no dispositivo
  if (info.isMobile) root.classList.add('mobile-device');
  if (info.isTablet) root.classList.add('tablet-device');
  if (info.isDesktop) root.classList.add('desktop-device');
  if (info.isIOS) root.classList.add('ios-device');
  if (info.isAndroid) root.classList.add('android-device');
  if (info.hasNotch) root.classList.add('notch-device');
  if (info.isPWA) root.classList.add('pwa-mode');
  
  // Adicionar classes de navegador
  root.classList.add(`browser-${info.browserName.toLowerCase()}`);
  
  // Definir altura do viewport
  const setVh = () => {
    const vh = window.innerHeight * 0.01;
    root.style.setProperty('--vh', `${vh}px`);
    root.style.setProperty('--app-height', `${window.innerHeight}px`);
  };
  
  // Configurar o viewport para dispositivos específicos
  setVh();
  
  // Adicionar listeners de eventos para manter o viewport atualizado
  window.addEventListener('resize', setVh);
  window.addEventListener('orientationchange', setVh);
  
  // Event listeners específicos para iOS para corrigir problemas com a barra de endereço
  if (info.isIOS) {
    window.addEventListener('focusin', setVh);
    window.addEventListener('focusout', setVh);
  }
}

// Inicializar e monitorar mudanças nas características do dispositivo
export function initDeviceMonitor(): () => void {
  // Aplicar classes iniciais
  applyDeviceClasses();
  
  // Configurar detector de orientação
  const handleOrientationChange = () => {
    applyDeviceClasses();
  };
  
  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);
  
  // Retornar função de limpeza para ser usada em useEffect
  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleOrientationChange);
  };
}

// Hook personalizado para React para monitorar o dispositivo
export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(detectDevice());
  
  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo(detectDevice());
    };
    
    // Aplicar classes iniciais
    applyDeviceClasses();
    
    // Atualizar em mudanças
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);
  
  return deviceInfo;
} 