import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useStore } from './store/useStore';
import { useTranslation } from './hooks/useTranslation';
import { Toaster } from 'react-hot-toast';
import PrivateRoute from './components/PrivateRoute';
import AdminInitializer from './components/AdminInitializer';

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

function App() {
  const { theme, language, setTheme, setLanguage, init } = useStore();
  const { t } = useTranslation();

  // Initialize data from Firebase
  useEffect(() => {
    console.log('Initializing app and loading data from Firebase...');
    // Load data from Firebase
    init().catch(error => {
      console.error('Failed to initialize data from Firebase:', error);
    });
  }, [init]);

  // Alternar tema
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Alternar idioma
  const toggleLanguage = () => {
    setLanguage(language === 'pt' ? 'en' : 'pt');
  };

  return (
    <BrowserRouter>
      <div className={`min-h-screen page-container ${theme === 'dark' ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-gray-100 to-gray-200'}`}>
        <AdminInitializer masterEmail="raugerac@gmail.com" />
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
        <div className="fixed top-4 right-4 z-50 flex gap-2">
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
        
        <div className="page-content">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
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
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
