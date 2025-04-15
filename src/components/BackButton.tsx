import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface BackButtonProps {
  className?: string;
  variant?: 'icon-only' | 'with-text';
}

const BackButton: React.FC<BackButtonProps> = ({ 
  className = '', 
  variant = 'icon-only' 
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <button
      onClick={handleBack}
      className={`flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md border-2 border-blue-400 ${
        variant === 'with-text' ? 'px-5 py-2.5' : 'w-12 h-12'
      } ${className}`}
      aria-label={t('navigation.backToDashboard')}
    >
      <ChevronLeft size={24} strokeWidth={3} />
      {variant === 'with-text' && <span className="text-sm font-bold">{t('navigation.items.dashboard')}</span>}
    </button>
  );
};

export default BackButton; 