import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { UserCircle, ChevronDown, LogIn, User, Check } from 'lucide-react';

// Definição do tipo para logins salvos
interface SavedLogin {
  email: string;
  name: string;
  password?: string;
  timestamp: number;
  lastUsed?: number;
}

const BACKGROUND_IMAGE = "url('https://images.unsplash.com/photo-1502680390469-be75c86b636f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=70')";

// Chave para armazenar logins no localStorage
const SAVED_LOGINS_KEY = 'hostel_saved_logins';

// Função simples de criptografia para senhas (apenas ofuscação básica)
const encryptPassword = (password: string): string => {
  return btoa(password); // Codificação base64 simples
};

// Função para descriptografar senhas
const decryptPassword = (encrypted: string): string => {
  return atob(encrypted); // Decodificação base64 simples
};

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedLogins, setSavedLogins] = useState<SavedLogin[]>([]);
  const [showSavedLogins, setShowSavedLogins] = useState(false);
  const [showQuickLogin, setShowQuickLogin] = useState(false);
  
  useEffect(() => {
    // Pré-carrega a imagem de fundo
    const img = new Image();
    img.src = BACKGROUND_IMAGE.replace(/url\(['"](.+)['"]\)/, '$1');
  }, []);
  
  // Carrega logins salvos quando o componente monta
  useEffect(() => {
    const loadSavedLogins = () => {
      try {
        const saved = localStorage.getItem(SAVED_LOGINS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as SavedLogin[];
          // Ordena por último uso, depois por timestamp (mais recente primeiro)
          const sorted = parsed.sort((a, b) => 
            (b.lastUsed || b.timestamp) - (a.lastUsed || a.timestamp)
          );
          setSavedLogins(sorted);
          
          // Se houver logins salvos, preenche o email com o mais recente
          if (sorted.length > 0) {
            setEmail(sorted[0].email);
            
            // Se tiver a senha salva, preencher automaticamente
            if (sorted[0].password) {
              setPassword(decryptPassword(sorted[0].password));
              setRememberPassword(true);
            }
            
            // Sempre mostrar a opção de login rápido se houver logins salvos
            setShowQuickLogin(true);
          }
        }
      } catch (e) {
        console.error('Erro ao carregar logins salvos:', e);
      }
    };
    
    loadSavedLogins();
  }, []);
  
  // Função para salvar um login usado
  const saveLogin = (email: string, name?: string, savePassword?: boolean) => {
    try {
      // Busca logins existentes
      const existingSaved = localStorage.getItem(SAVED_LOGINS_KEY);
      let logins: SavedLogin[] = existingSaved ? JSON.parse(existingSaved) : [];
      
      // Verifica se o email já existe
      const existingIndex = logins.findIndex(login => login.email === email);
      const now = Date.now();
      
      if (existingIndex >= 0) {
        // Atualiza login existente
        logins[existingIndex].lastUsed = now;
        if (name && !logins[existingIndex].name) {
          logins[existingIndex].name = name;
        }
        
        // Se marcou para lembrar senha, salva a senha criptografada
        if (savePassword && password) {
          logins[existingIndex].password = encryptPassword(password);
        }
      } else {
        // Adiciona novo login
        const newLogin: SavedLogin = {
          email,
          name,
          timestamp: now,
          lastUsed: now
        };
        
        // Se marcou para lembrar senha, salva a senha criptografada
        if (savePassword && password) {
          newLogin.password = encryptPassword(password);
        }
        
        logins.push(newLogin);
      }
      
      // Limita a 5 logins salvos
      if (logins.length > 5) {
        logins = logins
          .sort((a, b) => (b.lastUsed || b.timestamp) - (a.lastUsed || a.timestamp))
          .slice(0, 5);
      }
      
      // Salva no localStorage
      localStorage.setItem(SAVED_LOGINS_KEY, JSON.stringify(logins));
      
      // Atualiza estado
      setSavedLogins(logins);
    } catch (e) {
      console.error('Erro ao salvar login:', e);
    }
  };
  
  // Tenta recuperar a última senha usada (se armazenada temporariamente)
  const getLastPassword = (): string => {
    try {
      const tempPwd = sessionStorage.getItem('temp_last_pwd');
      if (tempPwd) {
        return tempPwd;
      }
    } catch (e) {
      console.error('Erro ao recuperar senha temporária:', e);
    }
    return '';
  };

  // Login rápido com o último usuário
  const handleQuickLogin = async (savedLogin: SavedLogin) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const password = savedLogin.password ? decryptPassword(savedLogin.password) : '';
      await login(savedLogin.email, password);
      
      // Se chegou aqui, login foi bem sucedido
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro no login rápido:', error);
      setError(t('login.invalidCredentials'));
      setShowQuickLogin(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Salva a senha temporariamente para login rápido futuro
  const saveTempPassword = (pwd: string) => {
    try {
      // Salva a senha apenas temporariamente para login rápido
      // Será removida quando o navegador fechar
      sessionStorage.setItem('temp_last_pwd', pwd);
    } catch (e) {
      console.error('Erro ao salvar senha temporária:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Login: Tentando fazer login com email:', email);
      const userProfile = await login(email, password);
      console.log('Login: Login bem-sucedido, redirecionando para dashboard. Papel do usuário:', userProfile.role);
      
      // Salva o login usado, com a senha se escolheu lembrar
      saveLogin(email, userProfile.name, rememberPassword);
      
      // Se não escolheu lembrar senha, ainda salva temporariamente para login rápido
      if (!rememberPassword) {
        saveTempPassword(password);
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Mensagens personalizadas para erros específicos
      if (err.code === 'auth/wrong-password') {
        console.log('Login: Senha incorreta');
        setError(t('error.wrongPassword'));
      } else if (err.code === 'auth/user-not-found') {
        console.log('Login: Usuário não encontrado');
        setError(t('error.userNotFound'));
      } else if (err.code === 'auth/too-many-requests') {
        console.log('Login: Muitas tentativas, conta temporariamente bloqueada');
        setError(t('error.tooManyAttempts'));
      } else if (err.message === 'Falha ao processar perfil de usuário') {
        console.log('Login: Perfil não encontrado no Firestore');
        setError(t('error.profileNotFound'));
      } else {
        console.log('Login: Erro genérico de credenciais');
        setError(t('error.invalidCredentials'));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const selectSavedLogin = (saved: SavedLogin) => {
    setEmail(saved.email);
    setShowSavedLogins(false);
    
    // Se tiver senha salva, preenche automaticamente
    if (saved.password) {
      setPassword(decryptPassword(saved.password));
      setRememberPassword(true);
    } else {
      setPassword('');
    }
    
    // Foca no campo de senha para facilitar o preenchimento
    const passwordField = document.getElementById('password-field');
    if (passwordField) {
      passwordField.focus();
    }
  };
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Grain effect */}
      <div className="grain fixed" />

      {/* Background image with overlay */}
      <div className="fixed inset-0">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: BACKGROUND_IMAGE,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(4px) brightness(0.5)',
            transform: 'scale(1.1)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl text-white mb-4 font-normal tracking-wide">
              {t('welcome')}
            </h1>
            <p className="text-lg text-white/90 font-light tracking-wide">
              {t('applicationName')}
            </p>
          </div>

          {/* Login Form */}
          <div className="glass-morphism rounded-2xl p-8 space-y-8">
            {error && (
              <div className="text-red-400 text-sm text-center bg-black/30 py-2 rounded">{error}</div>
            )}
            
            {/* Login rápido com último usuário */}
            {showQuickLogin && savedLogins.length > 0 && !isLoading && (
              <div className="p-4 bg-blue-600/30 border border-blue-500/40 rounded-xl mb-4 backdrop-blur-sm shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-500/30 p-2 rounded-full">
                    <UserCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium text-lg">{savedLogins[0].name || savedLogins[0].email}</div>
                    <div className="text-white/70 text-sm">{savedLogins[0].email}</div>
                  </div>
                </div>
                <div className="text-center mb-3 text-white/60 text-xs italic">
                  <span className="inline-flex items-center gap-1">
                    <LogIn className="w-3 h-3" />
                    {t('quickLoginHint')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickLogin(savedLogins[0])}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <LogIn className="w-5 h-5" />
                  {t('quickLogin')}
                </button>
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setShowQuickLogin(false)}
                    className="text-sm text-white/70 hover:text-white hover:underline transition-colors"
                  >
                    {t('useAnotherAccount')}
                  </button>
                </div>
              </div>
            )}
            
            {(!showQuickLogin || isLoading) && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <div className="relative">
                    <input
                      type="email"
                      placeholder={t('email')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field w-full text-white placeholder-white/50 pr-10"
                      required
                    />
                    {savedLogins.length > 0 && (
                      <button 
                        type="button"
                        onClick={() => setShowSavedLogins(!showSavedLogins)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                      >
                        <ChevronDown className={`w-5 h-5 transition-transform ${showSavedLogins ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                  
                  {/* Lista de logins salvos */}
                  {showSavedLogins && savedLogins.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-gray-800/90 backdrop-blur-sm rounded-lg border border-white/10 shadow-lg overflow-hidden">
                      <ul>
                        {savedLogins.map((saved, index) => (
                          <li 
                            key={index}
                            onClick={() => selectSavedLogin(saved)}
                            className="flex items-center gap-3 p-3 text-white hover:bg-gray-700/50 cursor-pointer border-b border-white/5 last:border-0"
                          >
                            <UserCircle className="w-6 h-6 text-blue-400" />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{saved.email}</div>
                              {saved.name && <div className="text-xs text-white/60">{saved.name}</div>}
                            </div>
                            <LogIn className="w-4 h-4 text-white/40" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    id="password-field"
                    type="password"
                    placeholder={t('password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field w-full text-white placeholder-white/50"
                    required
                  />
                </div>

                {/* "Lembrar senha" checkbox */}
                <div className="flex items-center">
                  <div 
                    className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer mr-2 transition-colors duration-200 ${
                      rememberPassword 
                        ? 'bg-yellow-500 border-yellow-500' 
                        : 'bg-black/30 border border-white/30 hover:bg-black/40'
                    }`}
                    onClick={() => setRememberPassword(!rememberPassword)}
                  >
                    {rememberPassword && <Check className="w-4 h-4 text-gray-900" />}
                  </div>
                  <label 
                    className="text-sm text-white/80 cursor-pointer select-none"
                    onClick={() => setRememberPassword(!rememberPassword)}
                  >
                    {t('rememberPassword')}
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Link to="/forgot-password" className="text-yellow-500 hover:text-yellow-400">
                      {t('forgotPassword')}
                    </Link>
                  </div>
                  <div className="text-sm">
                    <Link to="/register" className="text-yellow-500 hover:text-yellow-400">
                      {t('register')}
                    </Link>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black/30 hover:bg-black/40 text-white rounded-lg px-6 py-3 font-light tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        {t('login')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;