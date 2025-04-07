import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Menu, X, Settings, Home, Calendar, ClipboardList, BellRing, Award, LogOut, PlusCircle, LayoutDashboard, PartyPopper, MessageSquare, AlertTriangle, Users } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useDeviceInfo } from '../utils/deviceDetector';
import BackButton from './BackButton';

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  onAddItem?: () => void;
  addItemLabel?: string;
}

export default function PageHeader({ 
  title, 
  actions, 
  showBackButton = true, 
  onAddItem,
  addItemLabel
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
    <div className="px-4 py-3" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Overlay do sidebar */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Sidebar para dispositivos móveis */}
      <div 
        ref={sidebarRef}
        className={`fixed inset-y-0 right-0 w-64 bg-gray-900/70 backdrop-blur-md z-50 shadow-xl transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col h-full">
          <div className={`p-4 border-b border-white/10 ${deviceInfo.hasNotch ? 'pt-safe-top' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-light text-white">{t('menu')}</h2>
              <button 
                onClick={() => setShowSidebar(false)}
                className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white rounded-full hover:bg-white/10"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            {user && (
              <div className="mt-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white">
                  {user.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto py-2">
            <nav className="px-2 space-y-1">
              <div className="overflow-auto max-h-[calc(100vh-120px)] mt-3 flex flex-col space-y-1.5">
                <button
                  onClick={() => handleNavigation('/dashboard')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-left"
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => handleNavigation('/schedule')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-left"
                >
                  <Calendar size={18} />
                  <span>Horários</span>
                </button>
                <button
                  onClick={() => handleNavigation('/events')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-left"
                >
                  <PartyPopper size={18} />
                  <span>Eventos</span>
                </button>
                <button
                  onClick={() => handleNavigation('/messages')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-left"
                >
                  <MessageSquare size={18} />
                  <span>Mensagens</span>
                </button>
                <button
                  onClick={() => handleNavigation('/points')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-left"
                >
                  <Award size={18} />
                  <span>Pontos</span>
                </button>
                <div className="px-3 py-2 flex items-center gap-2 rounded-lg bg-amber-900/30 border border-amber-500/30 text-amber-300 text-sm text-left">
                  <AlertTriangle size={18} />
                  <span>Tarefas (desativado)</span>
                </div>
                <button
                  onClick={() => handleNavigation('/staff')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-left"
                >
                  <Users size={18} />
                  <span>Staff</span>
                </button>
                <button
                  onClick={() => handleNavigation('/settings')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-left"
                >
                  <Settings size={18} />
                  <span>Configurações</span>
                </button>
              </div>
            </nav>
          </div>
          
          <div className={`p-4 border-t border-white/10 ${deviceInfo.hasNotch ? 'pb-safe-bottom' : ''}`}>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg text-left"
            >
              <LogOut size={20} />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Header content - redesenhado para ficar como a página Events */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && <BackButton variant="icon-only" />}
          <h1 className="text-xl font-medium text-white">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {onAddItem && (
            <button 
              onClick={onAddItem}
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-2 flex items-center gap-2 text-sm transition-colors"
            >
              <PlusCircle size={18} />
              {addItemLabel && <span className="hidden md:inline">{addItemLabel}</span>}
            </button>
          )}
          
          {actions}
          
          <button 
            onClick={() => setShowSidebar(true)}
            className="w-10 h-10 md:hidden flex items-center justify-center text-white rounded-full"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>
    </div>
  );
} 