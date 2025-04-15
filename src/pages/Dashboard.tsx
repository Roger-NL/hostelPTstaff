import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import {
  Users,
  Award,
  Calendar,
  ClipboardList,
  Settings as SettingsIcon,
  LogOut,
  PartyPopper,
  MessageCircle,
  HomeIcon,
  CheckSquare,
  BellRing,
} from 'lucide-react';
import DashboardContent from './DashboardContent';
import LaundrySchedule from './LaundrySchedule';
import Schedule from './Schedule';
import Staff from './Staff';
import Tasks from './Tasks';
import Events from './Events';
import SettingsPage from './Settings';
import Messages from './Messages';
import Points from './Points';

export default function MainDashboard() {
  const { user, messages, logout, language } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard');
  
  // Calculate unread messages
  const unreadCount = messages?.filter(msg => !msg.read.includes(user?.id || '')).length || 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Função para lidar com a navegação vinda do DashboardContent
  useEffect(() => {
    // Esta função será usada para ouvir eventos de navegação
    const handleNavigation = (event: CustomEvent) => {
      const path = event.detail?.path;
      if (path) {
        // Converter o caminho (por exemplo, '/tasks') para a view correta (por exemplo, 'tasks')
        const targetView = path.replace('/', '');
        if (targetView && menuItems.some(item => item.view === targetView)) {
          setView(targetView);
        }
      }
    };

    // Adicionar o listener ao window
    window.addEventListener('navigate', handleNavigation as EventListener);
    
    return () => {
      // Limpar o listener ao desmontar
      window.removeEventListener('navigate', handleNavigation as EventListener);
    };
  }, []);

  // Define the type for menu items
  type MenuItem = {
    icon: React.ElementType;
    label: string;
    view: string;
    badge?: number;
    action?: () => void;
  };

  // Construir os itens do menu, incluindo autorizações apenas para admin
  const menuItems: MenuItem[] = [
    { icon: HomeIcon, label: t('navigation.items.dashboard'), view: 'dashboard' },
    { icon: Calendar, label: t('navigation.items.schedule'), view: 'schedule' },
    { icon: ClipboardList, label: t('navigation.items.tasks'), view: 'tasks' },
    { icon: Users, label: t('navigation.items.staff'), view: 'staff' },
    { icon: PartyPopper, label: t('navigation.items.events'), view: 'events' },
    { icon: MessageCircle, label: t('navigation.items.messages'), view: 'messages', badge: unreadCount },
    { icon: HomeIcon, label: t('navigation.items.hostel'), view: 'hostel' },
    { icon: Award, label: t('navigation.items.points'), view: 'points' },
  ];
  
  // Adicionar opção de autorizações se o usuário for admin
  if (user?.role === 'admin') {
    menuItems.push({ icon: CheckSquare, label: t('navigation.items.approvals'), view: 'approvals' });
  }
  
  // Sempre adicionar settings no final
  menuItems.push({ icon: SettingsIcon, label: t('navigation.items.settings'), view: 'settings' });
  
  // Adicionar logout como item do menu
  menuItems.push({ icon: LogOut, label: t('logout'), view: 'logout', action: handleLogout });

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Side Navigation */}
      <div className="w-16 lg:w-56 bg-gray-800/30 backdrop-blur-md border-r border-white/5 shrink-0 hidden md:flex flex-col">
        <div className="p-4 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
            <BellRing size={16} />
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
              <li key={item.view}>
                <button
                  onClick={item.action || (() => setView(item.view))}
                  className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg transition-colors
                    ${item.view === 'logout' 
                      ? 'text-red-400 hover:bg-red-500/10 mt-4' 
                      : view === item.view 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <div className="relative">
                    <item.icon size={20} />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="hidden lg:block truncate">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-white/5">
          {user && (
            <div className="mb-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                {user.name[0].toUpperCase()}
              </div>
              <div className="hidden lg:block overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Top Navigation */}
      <div className="md:hidden flex items-center justify-between p-4 bg-gray-800/50 backdrop-blur-sm border-b border-white/5 fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
            <BellRing size={16} />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botão de logout para Mobile */}
          <button
            onClick={handleLogout}
            className="w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 rounded-full transition-colors"
          >
            <LogOut size={16} />
          </button>
          
          {user && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
              {user.name[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden flex items-center justify-around py-2 px-1 bg-gray-800/90 backdrop-blur-lg border-t border-white/5 fixed bottom-0 left-0 right-0 z-10">
        {menuItems.slice(0, 5).map((item) => (
          <button
            key={item.view}
            onClick={item.action || (() => setView(item.view))}
            className={`p-2 rounded-md flex flex-col items-center ${
              view === item.view ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            <div className="relative">
              <item.icon size={20} />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col md:pt-0 pt-16 pb-14 md:pb-0">
        {/* Render the selected view component */}
        <div className="flex-1 overflow-auto">
          {view === 'dashboard' && <DashboardContent />}
          {view === 'schedule' && <Schedule />}
          {view === 'tasks' && <Tasks />}
          {view === 'settings' && <SettingsPage />}
          {view === 'staff' && <Staff />}
          {view === 'events' && <Events />}
          {view === 'messages' && <Messages />}
          {view === 'points' && <Points />}
          {view === 'hostel' && <LaundrySchedule />}
          {view === 'approvals' && user?.role === 'admin' && (
            <div className="p-4 space-y-6">
              <h2 className="text-xl font-light">{t('approvals.photoApprovals')}</h2>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
                <p className="text-center text-gray-400 py-8">
                  {t('approvals.noPhotosPending')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}