import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { applyDeviceClasses } from './utils/deviceDetector';

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
};

// Configurar o ambiente antes de renderizar
setViewportForMobile();

// Renderizar a aplicação
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
