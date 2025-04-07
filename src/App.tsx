import React, { useEffect, Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, X } from 'lucide-react';
import { useStore } from './store/useStore';
import { useTranslation } from './hooks/useTranslation';
import { Toaster } from 'react-hot-toast';
import PrivateRoute from './components/PrivateRoute';
import AdminInitializer from './components/AdminInitializer';
import { useAuth } from './hooks/useAuth';
import { initDeviceMonitor, useDeviceInfo } from './utils/deviceDetector';

// Lazy loading de componentes pesados
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Events = lazy(() => import('./pages/Events'));
const Staff = lazy(() => import('./pages/Staff'));
const Messages = lazy(() => import('./pages/Messages'));
const Settings = lazy(() => import('./pages/Settings'));
const Points = lazy(() => import('./pages/Points'));

// Componente de carregamento
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
  </div>
);

// Componente para configurar viewport e meta tags para dispositivos móveis
const MobileMetaTags = () => {
  useEffect(() => {
    // Atualiza a meta tag viewport para garantir a escala correta
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }

    // Adiciona meta tag para modo de aplicativo em iOS
    const appleMobileWebAppCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!appleMobileWebAppCapable) {
      const meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-capable';
      meta.content = 'yes';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }

    // Status bar transparente para iOS
    const statusBarStyle = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!statusBarStyle) {
      const meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-status-bar-style';
      meta.content = 'black-translucent';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }

    // Tema cor para browsers Android
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#121212';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
  }, []);

  return null;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    const mainContent = document.querySelector('.content-scrollable');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [pathname]);
  
  return null;
};

// Componente para lidar com eventos de toque móvel
const TouchEventHandler = () => {
  useEffect(() => {
    // Prevenir zoom de pinça em dispositivos touch
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevenir atraso de 300ms em dispositivos móveis
    document.addEventListener('touchstart', () => {}, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });

    // Prevenir pull-to-refresh em iOS/Android
    let startY = 0;
    document.addEventListener('touchstart', (e) => {
      startY = e.touches[0].pageY;
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      const y = e.touches[0].pageY;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop === 0 && y > startY) {
        e.preventDefault();
      }
    }, { passive: false });

    return () => {
      document.removeEventListener('touchstart', () => {}, { passive: false } as EventListenerOptions);
      document.removeEventListener('touchmove', preventZoom, { passive: false } as EventListenerOptions);
    };
  }, []);

  return null;
};

// Componente interno que utiliza os hooks de navegação
const AppContent = () => {
  const { theme, language, setTheme, setLanguage, init, setUser, user } = useStore();
  const { t } = useTranslation();
  const { currentUser, isAuthenticated } = useAuth();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const deviceInfo = useDeviceInfo();
  const location = useLocation();
  const navigate = useNavigate();

  // Inicializar o monitor de dispositivos
  useEffect(() => {
    const cleanup = initDeviceMonitor();
    return cleanup;
  }, []);

  // Verificar se é a primeira visita
  useEffect(() => {
    const hasSeenLanguageModal = localStorage.getItem('has_seen_language_modal');
    if (!hasSeenLanguageModal) {
      setShowLanguageModal(true);
    }
  }, []);

  // Initialize data from Firebase
  useEffect(() => {
    console.log('Initializing app and loading data from Firebase...');
    // Load data from Firebase
    init().catch(error => {
      console.error('Failed to initialize data from Firebase:', error);
    });
  }, [init]);

  // Sincroniza o usuário do hook de autenticação com o store global
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      console.log('Sincronizando usuário autenticado com o store global:', currentUser.name);
      setUser(currentUser);
    }
  }, [isAuthenticated, currentUser, setUser]);

  // Configurar visualização em tela cheia para dispositivos móveis
  useEffect(() => {
    const enableFullscreen = () => {
      const doc = window.document as any;
      const docEl = doc.documentElement;

      const requestFullScreen = 
        docEl.requestFullscreen || 
        docEl.mozRequestFullScreen || 
        docEl.webkitRequestFullScreen || 
        docEl.msRequestFullscreen;

      if (requestFullScreen && deviceInfo.isMobile) {
        requestFullScreen.call(docEl);
      }
    };

    // Tentar habilitar tela cheia ao interagir com a página
    const handleUserInteraction = () => {
      enableFullscreen();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    if (deviceInfo.isMobile) {
      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);
    }

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [deviceInfo.isMobile]);

  // Manipulador para o botão voltar do navegador mobile
  useEffect(() => {
    const handleBackButton = (event: PopStateEvent) => {
      // Não desconectar o usuário quando pressionar voltar
      
      // Se estiver logado, previne o comportamento padrão
      if (isAuthenticated) {
        event.preventDefault();
        
        // Verifica se a rota atual é o dashboard
        if (location.pathname === '/dashboard') {
          // Se já estiver no dashboard, não faz nada, permanece na página
          window.history.pushState(null, '', location.pathname);
        } else {
          // Se estiver em outra página, volta para o dashboard
          navigate('/dashboard');
        }
      } else {
        // Se não estiver logado, deixa o comportamento padrão de voltar acontecer
        if (location.pathname === '/login') {
          // Se já estiver no login, previne o comportamento de sair da aplicação
          event.preventDefault();
          window.history.pushState(null, '', location.pathname);
        }
      }
    };
    
    // Adiciona o evento ao histórico do navegador
    window.addEventListener('popstate', handleBackButton);
    
    // Limpeza ao desmontar
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [navigate, isAuthenticated, location.pathname]);

  // Alternar tema
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Alternar idioma
  const toggleLanguage = () => {
    setLanguage(language === 'pt' ? 'en' : 'pt');
  };

  // Selecionar idioma específico e fechar o modal
  const selectLanguage = (lang: 'en' | 'pt') => {
    setLanguage(lang);
    localStorage.setItem('has_seen_language_modal', 'true');
    setShowLanguageModal(false);
  };

  // Fechar o modal de idioma
  const closeLanguageModal = () => {
    localStorage.setItem('has_seen_language_modal', 'true');
    setShowLanguageModal(false);
  };

  // Classes que consideram o tipo de dispositivo
  const containerClasses = `
    min-h-screen 
    mobile-fullscreen 
    page-container 
    ${theme === 'dark' ? 'dark bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-gray-100 to-gray-200'}
    ${deviceInfo.isIOS ? 'ios-safe-bottom ios-safe-top' : ''}
    ${deviceInfo.hasNotch ? 'notch-aware' : ''}
    ${deviceInfo.isAndroid ? 'android-safe-area' : ''}
    ${deviceInfo.isTouchDevice ? 'touch-device' : ''}
    ${deviceInfo.isSmallScreen ? 'small-screen-device' : ''}
  `;

  const contentClasses = `
    page-content 
    ${deviceInfo.isMobile ? 'mobile-safe-bottom' : ''} 
    ${deviceInfo.isIOS ? 'ios-safe-bottom' : ''}
    ${deviceInfo.hasNotch ? 'home-indicator-aware' : ''}
    ${deviceInfo.isSmallScreen ? 'compact-ui' : ''}
  `;

  return (
    <div className={containerClasses}>
      <MobileMetaTags />
      <TouchEventHandler />
      <AdminInitializer masterEmail="" />
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'text-sm font-light',
          style: {
            background: theme === 'dark' ? '#1f2937' : 'white',
            color: theme === 'dark' ? 'white' : '#1f2937',
            borderRadius: '0.5rem',
            border: '1px solid',
            borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          success: {
            icon: '✅',
            duration: 3000,
          },
          error: {
            icon: '❌',
            duration: 4000,
          },
          loading: {
            icon: '⏳',
          },
        }}
      />
      
      {/* Modal de seleção de idioma na primeira visita */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`mx-4 p-6 rounded-lg shadow-xl ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} max-w-md`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{language === 'pt' ? 'Selecione o idioma' : 'Select language'}</h2>
              <button 
                onClick={closeLanguageModal}
                className={`p-1 rounded-full hover:bg-opacity-10 ${theme === 'dark' ? 'hover:bg-white' : 'hover:bg-gray-800'}`}
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="mb-4">
              {language === 'pt' 
                ? 'Escolha o idioma de sua preferência. Esta opção pode ser alterada posteriormente nas configurações do sistema.'
                : 'Choose your preferred language. This option can be changed later in the system settings.'
              }
            </p>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => selectLanguage('pt')}
                className={`py-2 px-4 rounded transition ${
                  language === 'pt' 
                    ? 'bg-yellow-500 text-gray-900 font-medium' 
                    : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Português
              </button>
              <button
                onClick={() => selectLanguage('en')}
                className={`py-2 px-4 rounded transition ${
                  language === 'en' 
                    ? 'bg-yellow-500 text-gray-900 font-medium' 
                    : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mostra botões de tema e idioma APENAS na página de login ou quando não estiver autenticado */}
      {!isAuthenticated && (
        <div className="fixed top-4 right-4 z-40 flex gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 shadow-md hover:bg-gray-100'} transition-colors`}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={toggleLanguage}
            className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 shadow-md hover:bg-gray-100'} transition-colors font-medium text-xs`}
            aria-label={language === 'pt' ? 'Switch to English' : 'Alternar para Português'}
          >
            {language === 'pt' ? 'EN' : 'PT'}
          </button>
        </div>
      )}
      
      {/* Corpo da aplicação com classes adequadas para diferentes dispositivos */}
      <div className={contentClasses}>
        <Suspense fallback={<LoadingFallback />}>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard/*" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/schedule" 
              element={
                <PrivateRoute>
                  <Schedule />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/tasks" 
              element={
                <PrivateRoute>
                  <Tasks />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/events" 
              element={
                <PrivateRoute>
                  <Events />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/staff" 
              element={
                <PrivateRoute>
                  <Staff />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/messages" 
              element={
                <PrivateRoute>
                  <Messages />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/points" 
              element={
                <PrivateRoute>
                  <Points />
                </PrivateRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
