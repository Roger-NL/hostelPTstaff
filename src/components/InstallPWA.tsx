import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isIOS] = useState(/iPad|iPhone|iPod/.test(navigator.userAgent));

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
      if (isIOS) {
        alert('Para instalar o app:\n1. Toque no botão de compartilhar (ícone de compartilhamento)\n2. Role para baixo e toque em "Adicionar à Tela de Início"');
      } else {
        alert('O app já está instalado ou seu navegador não suporta a instalação.');
      }
      return;
    }
    promptInstall.prompt();
  };

  // Sempre mostra o botão em iOS, ou quando suporta PWA
  if (!supportsPWA && !isIOS) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 mb-3 border border-blue-100"
    >
      <Download size={18} />
      <span className="text-sm font-light">Instalar App</span>
    </button>
  );
} 