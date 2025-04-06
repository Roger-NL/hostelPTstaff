import React, { useEffect, Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sun, Moon, X } from 'lucide-react';
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

function App() {
  const { theme, language, setTheme, setLanguage, init, setUser } = useStore();
  const { t } = useTranslation();
  const { currentUser, isAuthenticated } = useAuth();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

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

  return (
    <BrowserRouter>
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
      </div>
    </BrowserRouter>
  );
}

export default App;
