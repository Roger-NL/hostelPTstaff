import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTranslation } from './hooks/useTranslation';

const BACKGROUND_IMAGE = "url('https://images.unsplash.com/photo-1502680390469-be75c86b636f?ixlib=rb-1.2.1&auto=format&fit=crop&w=3200&q=80')";

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(t('error.invalidCredentials'));
    } finally {
      setLoading(false);
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="email"
                  placeholder={t('email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full text-white placeholder-white/50"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full text-white placeholder-white/50"
                  required
                />
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
                  disabled={loading}
                  className="w-full bg-black/30 hover:bg-black/40 text-white rounded-lg px-6 py-3 font-light tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    t('login')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 