import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import {
  Users,
  Award,
  Sun,
  Moon,
  CloudRain,
  Waves,
  Wind,
  Thermometer,
  TrendingUp,
  User,
  Clock,
  Activity,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PartyPopper,
  MessageCircle,
  Menu,
  HomeIcon,
  ChevronsLeft,
  ChevronsRight,
  CheckSquare
} from 'lucide-react';
import { format } from 'date-fns';
import Schedule from './Schedule';
import Staff from './Staff';
import Tasks from './Tasks';
import Events from './Events';
import SettingsPage from './Settings';
import Messages from './Messages';
import DashboardContent from './DashboardContent';
import LaundrySchedule from './LaundrySchedule';

export default function MainDashboard() {
  const { user, users, tasks, messages, logout } = useStore();
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

  // Função para obter o texto de role do usuário
  const getUserRoleText = (role?: string) => {
    if (!role) return '';
    
    // Verifica se a chave de tradução existe
    try {
      const translatedRole = t(`roles.${role}`);
      // Se retornar a própria chave, significa que a tradução não existe
      if (translatedRole === `roles.${role}`) {
        // Fallback para texto com primeira letra maiúscula
        return role.charAt(0).toUpperCase() + role.slice(1);
      }
      return translatedRole;
    } catch (error) {
      // Em caso de erro, retorna o role original com primeira letra maiúscula
      return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  // Função para obter a saudação baseada na hora do dia
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return t('dashboard.welcomeMorning').replace('{name}', user?.name?.split(' ')[0] || '');
    } else if (hour >= 12 && hour < 18) {
      return t('dashboard.welcomeAfternoon').replace('{name}', user?.name?.split(' ')[0] || '');
    } else {
      return t('dashboard.welcomeEvening').replace('{name}', user?.name?.split(' ')[0] || '');
    }
  };

  // Construir os itens do menu, incluindo autorizações apenas para admin
  const baseMenuItems = [
    { icon: LayoutDashboard, label: t('dashboard.title'), view: 'dashboard' },
    { icon: Calendar, label: t('schedule.title'), view: 'schedule' },
    { icon: ClipboardList, label: t('taskManagement'), view: 'tasks' },
    { icon: Users, label: t('staff.title'), view: 'staff' },
    { icon: PartyPopper, label: t('events.title'), view: 'events' },
    { icon: MessageCircle, label: t('messages.title'), view: 'messages', badge: unreadCount },
    { icon: HomeIcon, label: t('laundry.title'), view: 'laundry' },
    { icon: SettingsIcon, label: t('settings.title'), view: 'settings' }
  ];
  
  // Adicionar opção de autorizações se o usuário for admin
  const menuItems = user?.role === 'admin' 
    ? [
        ...baseMenuItems.slice(0, 7),
        { icon: CheckSquare, label: t('approvals.title'), view: 'approvals' },
        baseMenuItems[7]
      ] 
    : baseMenuItems;

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 border-b border-gray-700/30 flex items-center justify-between mobile-safe-top">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-light">{menuItems.find((item) => item.view === view)?.label}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-light hidden md:block">{getGreeting()}</div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 content-scrollable">
          {/* Render the selected view component */}
          {view === 'dashboard' && <DashboardContent />}
          {view === 'schedule' && <Schedule />}
          {view === 'tasks' && <Tasks />}
          {view === 'staff' && <Staff />}
          {view === 'events' && <Events />}
          {view === 'settings' && <SettingsPage />}
          {view === 'messages' && <Messages />}
          {view === 'laundry' && <LaundrySchedule />}
          {view === 'approvals' && user?.role === 'admin' && (
            <div className="space-y-6">
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