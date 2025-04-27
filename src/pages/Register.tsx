import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { User } from '../types';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    country: '',
    age: '',
    relationshipStatus: 'single',
    phone: '',
    arrivalDate: '',
    departureDate: '',
    gender: 'other'
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name || !formData.email || !formData.password || !formData.country || 
        !formData.age || !formData.phone || !formData.arrivalDate || !formData.departureDate) {
      setError(t('error.required'));
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Prepara os dados para registro no Firebase
      const userData: Partial<User> = {
        name: formData.name,
        email: formData.email,
        country: formData.country,
        age: Number(formData.age),
        relationshipStatus: formData.relationshipStatus as 'single' | 'dating' | 'married',
        gender: formData.gender as 'male' | 'female' | 'other',
        phone: formData.phone,
        arrivalDate: formData.arrivalDate,
        departureDate: formData.departureDate,
        points: 0,
        role: 'user'
      };
      
      // Registra no Firebase
      const newUser = await register(formData.email, formData.password, userData);
      
      if (newUser) {
        toast.success(t('register.success'));
        navigate('/dashboard');
      } else {
        setError(t('error.general'));
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError(t('error.emailExists'));
      } else {
        setError(t('error.general'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Grain effect */}
      <div className="grain" />

      {/* Background image with parallax effect */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-beach-light dark:bg-beach-dark bg-cover bg-center"
          style={{
            filter: 'blur(4px) brightness(0.5)',
            transform: 'scale(1.1)',
          }}
        />
      </div>

      {/* Back button */}
      <Link
        to="/"
        className="absolute top-8 left-8 z-50 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-arial">{t('backToLogin')}</span>
      </Link>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-16">
        <div className={`w-full max-w-2xl stagger-fade ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-normal tracking-wide text-white mb-2">
              {t('joinCommunity')}
            </h1>
            <p className="text-base text-white/80 font-arial">
              {t('experienceMagic')}
            </p>
          </div>

          {/* Registration Form */}
          <div className="glass-morphism rounded-2xl p-6 space-y-6">
            {error && (
              <div className="text-white text-sm text-center bg-black/30 py-2 rounded font-arial">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-white/90 text-base font-normal mb-4 font-arial">{t('personalInfo')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-1 font-arial">{t('name')}</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input-field w-full text-white placeholder-white/50 text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1 font-arial">{t('email')}</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input-field w-full text-white placeholder-white/50 text-base"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Security */}
              <div>
                <h2 className="text-white/90 text-base font-normal mb-4 font-arial">{t('security')}</h2>
                <div>
                  <label className="block text-white/70 text-sm mb-1 font-arial">{t('password')}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field w-full text-white placeholder-white/50 text-base"
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="text-white/90 text-base font-normal mb-4 font-arial">{t('contactInfo')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-1 font-arial">{t('country')}</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="input-field w-full text-white placeholder-white/50 text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1 font-arial">{t('phone')}</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-field w-full text-white placeholder-white/50 text-base"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div>
                <h2 className="text-white/90 text-base font-normal mb-4 font-arial">{t('personalDetails')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-1 font-arial">{t('age')}</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="input-field w-full text-white placeholder-white/50 text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1 font-arial">{t('relationshipStatus')}</label>
                    <select
                      name="relationshipStatus"
                      value={formData.relationshipStatus}
                      onChange={handleChange}
                      className="input-field w-full text-white bg-transparent"
                      required
                    >
                      <option value="single" className="text-black">{t('single')}</option>
                      <option value="dating" className="text-black">{t('dating')}</option>
                      <option value="married" className="text-black">{t('married')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1 font-arial">{t('gender')}</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="input-field w-full text-white bg-transparent"
                      required
                    >
                      <option value="male" className="text-black">{t('male')}</option>
                      <option value="female" className="text-black">{t('female')}</option>
                      <option value="other" className="text-black">{t('other')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stay Duration */}
              <div>
                <h2 className="text-white/90 text-base font-normal mb-4 font-arial">{t('stayDuration')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-1 font-arial">{t('arrivalDate')}</label>
                    <input
                      type="date"
                      name="arrivalDate"
                      value={formData.arrivalDate}
                      onChange={handleChange}
                      className="input-field w-full text-white placeholder-white/50 text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1 font-arial">{t('departureDate')}</label>
                    <input
                      type="date"
                      name="departureDate"
                      value={formData.departureDate}
                      onChange={handleChange}
                      className="input-field w-full text-white placeholder-white/50 text-base"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white/10 hover:bg-white/20 text-white rounded-lg px-6 py-3 transition-all duration-300 hover-lift text-base font-arial disabled:opacity-50"
                >
                  {loading ? (
                    <svg className="w-5 h-5 mx-auto animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    t('submit')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}