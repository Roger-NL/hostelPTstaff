import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

// Definição do tipo BeforeInstallPromptEvent que não existe nativamente no TypeScript
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS] = useState(/iPad|iPhone|iPod/.test(navigator.userAgent));

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setPromptInstall(e);
      setSupportsPWA(true);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);

    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
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
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 bg-white hover:bg-orange-50 text-orange-600 hover:text-orange-700 mb-3 border border-orange-100"
    >
      <Download size={18} className="text-orange-600" />
      <span className="text-sm font-light">Instalar App</span>
    </button>
  );
} 