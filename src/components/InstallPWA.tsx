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
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setPromptInstall(e);
      setSupportsPWA(true);
      setDeferredPrompt(e);
      setShowInstallButton(true);
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

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
    }
  };

  const confirmInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
          setShowInstallModal(false);
        }
      });
    }
  };

  const closeInstallModal = () => {
    setShowInstallModal(false);
  };

  // Sempre mostra o botão em iOS, ou quando suporta PWA
  if (!supportsPWA && !isIOS) {
    return null;
  }

  return (
    <>
      {showInstallButton && (
        <button 
          onClick={handleInstallClick}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white mb-3 border border-gray-600"
        >
          <Download size={18} className="text-orange-400" />
          <span className="text-sm font-light">Instalar App</span>
        </button>
      )}
      
      {(showInstallModal && deferredPrompt) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Download size={28} className="text-blue-700" />
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-center text-blue-900 mb-2">Install Web App</h3>
            <p className="text-sm text-blue-700 text-center mb-6">
              Install this application on your device for quick and easy access when you're on the go.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={confirmInstall}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-lg font-medium text-sm"
              >
                Install
              </button>
              <button 
                onClick={closeInstallModal}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700 rounded-lg font-medium text-sm"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 