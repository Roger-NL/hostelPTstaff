import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Menu, X, Settings, Home, Calendar, ClipboardList, BellRing, Award, LogOut, PlusCircle, LayoutDashboard, PartyPopper, MessageSquare, AlertTriangle, Users, ChevronLeft } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useDeviceInfo } from '../utils/deviceDetector';
import BackButton from './BackButton';

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  showSettings?: boolean;
  onAddItem?: () => void;
  addItemLabel?: string;
  className?: string;
}

export default function PageHeader({ 
  title, 
  actions, 
  showBackButton = true, 
  showSettings = false,
  onAddItem,
  addItemLabel,
  className = ''
}: PageHeaderProps) {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const { user, logout } = useStore();
  const { t } = useTranslation();
  const deviceInfo = useDeviceInfo();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  
  // Fechar o sidebar quando a rota mudar
  useEffect(() => {
    return () => {
      setShowSidebar(false);
    };
  }, []);
  
  // Evitar scrolling do body quando o sidebar estiver aberto
  useEffect(() => {
    if (showSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSidebar]);
  
  // Manipulador para fechar o sidebar ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setShowSidebar(false);
      }
    };
    
    if (showSidebar) {
      document.addEventListener('mousedown', handleClickOutside as EventListener);
      document.addEventListener('touchstart', handleClickOutside as EventListener);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside as EventListener);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [showSidebar]);
  
  // Suporte para gestos de swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    // Se o swipe da direita para a esquerda for maior que 100px, feche o sidebar
    if (diff > 100 && showSidebar) {
      setShowSidebar(false);
    }
    
    // Se o swipe da esquerda para a direita for maior que 100px, abra o sidebar
    if (diff < -100 && !showSidebar) {
      setShowSidebar(true);
    }
    
    setTouchStartX(null);
  };
  
  // Handler para navegação no sidebar
  const handleNavigation = (path: string) => {
    navigate(path);
    setShowSidebar(false);
  };
  
  // Handler para logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <header className={`flex items-center justify-between py-3 px-4 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 ${className}`}>
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <h1 className="text-lg font-light text-gray-200">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {showSettings && (
          <button
            onClick={() => navigate('/settings')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 transition-colors"
          >
            <Settings size={18} />
          </button>
        )}
      </div>
    </header>
  );
} 