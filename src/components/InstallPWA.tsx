import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setPromptInstall(e);
      setSupportsPWA(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (!promptInstall) {
      // Se não temos o prompt, significa que o app já está instalado ou
      // estamos no iOS, então vamos mostrar instruções manuais
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert('Para instalar o app:\n1. Toque no botão de compartilhar\n2. Role para baixo e toque em "Adicionar à Tela de Início"');
      } else {
        alert('O app já está instalado ou seu navegador não suporta a instalação.');
      }
      return;
    }
    promptInstall.prompt();
  };

  // Se o dispositivo não suporta PWA e não é iOS, não mostramos o botão
  if (!supportsPWA && !/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors w-full"
    >
      <Download size={20} />
      <span className="text-sm font-light">Instalar App</span>
    </button>
  );
} 