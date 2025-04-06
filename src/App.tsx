import React, { useEffect, Suspense, lazy, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, X, Menu, Home, CheckSquare, Calendar, Clock, Settings, User } from 'lucide-react';
import { useStore } from './store/useStore';
import { useTranslation } from './hooks/useTranslation';
import { Toaster } from 'react-hot-toast';
import PrivateRoute from './components/PrivateRoute';
import AdminInitializer from './components/AdminInitializer';
import { useAuth } from './hooks/useAuth';

// Lazy loading de componentes pesados
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Events = lazy(() => import('./pages/Events'));
const Staff = lazy(() => import('./pages/Staff'));

// Componente de carregamento
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
  </div>
);

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

// Componente interno que utiliza os hooks de navegação
const AppContent = () => {
  const { theme, language, setTheme, setLanguage, init, setUser, user } = useStore();
  const { t } = useTranslation();
  const { currentUser, isAuthenticated } = useAuth();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Referência para o menu flutuante
  const menuRef = useRef<HTMLDivElement>(null);

  // Ajustar a altura do viewport para dispositivos móveis
  useEffect(() => {
    // Função para ajustar a altura do viewport em dispositivos móveis
    const setAppHeight = () => {
      // Primeiro obter a altura real do viewport (sem barras de navegação)
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // Em alguns navegadores móveis, precisamos atualizar após orientação mudar
      setTimeout(() => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }, 100);
    };
    
    // Configurar no início
    setAppHeight();
    
    // Atualizar quando redimensionar ou mudar orientação
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);
    
    return () => {
      window.removeEventListener('resize', setAppHeight);
      window.removeEventListener('orientationchange', setAppHeight);
    };
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

  // Manipulador para o botão voltar do navegador mobile
  useEffect(() => {
    const handleBackButton = (event: PopStateEvent) => {
      // Previne o comportamento padrão do botão voltar
      event.preventDefault();
      
      // Redireciona para a página inicial
      navigate('/', { replace: true });
    };
    
    // Adiciona o evento ao histórico do navegador
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handleBackButton);
    
    // Limpeza ao desmontar
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [navigate]);

  // Efeito para fechar o menu quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    
    // Adiciona o event listener
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as EventListener);
    }
    
    // Limpeza
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [showMenu]);

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

  // Determina se deve mostrar o menu flutuante (bolinha) 
  // True para todas as páginas
  const showFloatingMenu = true;

  return (
    <div className={`min-h-screen page-container ${theme === 'dark' ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-gray-100 to-gray-200'}`}>
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
      
      <div className="page-content">
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
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </div>

      {/* Menu flutuante (bolinha) - agora visível em todas as páginas */}
      {showFloatingMenu && user && (
        <>
          {/* Overlay para melhorar a experiência ao clicar fora */}
          {showMenu && (
            <div 
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-200 ease-in-out"
              onClick={() => setShowMenu(false)}
            />
          )}
          <div className="fixed bottom-4 right-4 z-50" ref={menuRef}>
            <div className="relative">
              {showMenu && (
                <div className="absolute bottom-16 right-0 bg-gray-800 rounded-lg shadow-xl p-2 w-48 border border-gray-700 flex flex-col gap-1 animate-fadeIn">
                  <button 
                    onClick={() => {
                      navigate('/');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2"
                  >
                    <Home size={16} />
                    {t('home')}
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/tasks');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2"
                  >
                    <CheckSquare size={16} />
                    {t('tasks')}
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/events');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2"
                  >
                    <Calendar size={16} />
                    {t('events')}
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/schedule');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2"
                  >
                    <Clock size={16} />
                    {t('schedule')}
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/staff');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2"
                  >
                    <User size={16} />
                    {t('staff')}
                  </button>
                  <button 
                    onClick={() => {
                      toggleTheme();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2"
                  >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    {theme === 'dark' ? t('light_mode') : t('dark_mode')}
                  </button>
                  <button 
                    onClick={() => {
                      toggleLanguage();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2"
                  >
                    <span className="w-4 h-4 flex items-center justify-center">{language === 'pt' ? 'EN' : 'PT'}</span>
                    {language === 'pt' ? 'English' : 'Português'}
                  </button>
                </div>
              )}
              
              {/* Botão flutuante principal */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="shadow-lg bg-yellow-500 hover:bg-yellow-600 text-white rounded-full w-14 h-14 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition-all"
                aria-label="Menu"
              >
                {showMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </>
      )}
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
