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
  ChevronsRight
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);
  
  // Effect para ajustar sidebar baseado no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate unread messages
  const unreadCount = messages?.filter(msg => !msg.read.includes(user?.id || '')).length || 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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

  const menuItems = [
    { icon: LayoutDashboard, label: t('dashboard.title'), view: 'dashboard' },
    { icon: Calendar, label: t('schedule.title'), view: 'schedule' },
    { icon: ClipboardList, label: t('taskManagement'), view: 'tasks' },
    { icon: Users, label: t('staff.title'), view: 'staff' },
    { icon: PartyPopper, label: t('events.title'), view: 'events' },
    { icon: MessageCircle, label: t('messages.title'), view: 'messages', badge: unreadCount },
    { icon: HomeIcon, label: t('laundry.title'), view: 'laundry' },
    { icon: SettingsIcon, label: t('settings.title'), view: 'settings' }
  ];

  return (
    <div className="page-container bg-gradient-to-br from-sky-200 to-violet-200 dark:from-gray-900 dark:to-gray-800 flex relative font-sans text-gray-800 dark:text-white">
      {/* Background with light effect */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-200 to-violet-200 dark:from-gray-900 dark:to-gray-800" />
        <div className="absolute top-0 -left-10 w-72 h-72 bg-purple-400 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute top-40 -right-10 w-96 h-96 bg-blue-400 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-20 w-80 h-80 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      </div>

      {/* Menu Toggle Button for Mobile/Collapsed View */}
      <button 
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className={`fixed top-4 left-4 z-20 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl text-gray-700 dark:text-white hover:bg-white dark:hover:bg-gray-700 shadow-lg transition-all duration-300 ${!isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <Menu size={18} />
      </button>

      {/* Sidebar Overlay - only shows when sidebar is expanded */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-screen transition-all duration-500 flex flex-col z-40 
          ${isSidebarCollapsed 
            ? 'w-0 -translate-x-full opacity-0 pointer-events-none invisible' 
            : 'w-[260px] xs:w-[280px] translate-x-0 opacity-100 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-2xl border-r border-white/20 dark:border-gray-700/30'}`}
      >
        <div className="p-4 xs:p-5 border-b border-gray-100 dark:border-gray-700/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-lg xs:rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
              H
            </div>
            <h1 className="text-lg xs:text-xl font-extralight tracking-wide">Hostel</h1>
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(true)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors flex items-center justify-center"
          >
            <ChevronsLeft size={18} />
          </button>
        </div>
        
        <div className="flex-1 content-scrollable p-3 xs:p-4 space-y-1.5 xs:space-y-2">
          {menuItems.map(item => (
            <button
              key={item.view}
              onClick={() => {
                setView(item.view);
                setIsSidebarCollapsed(window.innerWidth < 1024);
              }}
              className={`flex items-center gap-2.5 p-2.5 xs:p-3 w-full rounded-lg xs:rounded-xl transition-all duration-300 relative font-light text-sm xs:text-base
                ${view === item.view 
                  ? 'bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-blue-700 dark:text-blue-300 font-normal' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/30 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <item.icon size={18} className={view === item.view ? 'text-blue-500' : ''} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <div className="absolute top-1.5 right-2 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xxs xs:text-xs flex items-center justify-center px-1 shadow-lg">
                  {item.badge}
                </div>
              )}
              {view === item.view && (
                <div className="absolute right-3 w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full bg-blue-500"></div>
              )}
            </button>
          ))}
        </div>
        
        <div className="p-3 xs:p-4 border-t border-gray-100 dark:border-gray-700/30">
          <div className="p-2.5 xs:p-3 rounded-lg xs:rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-lg xs:rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="flex-1">
                <h3 className="text-xs xs:text-sm font-medium">{user?.name || 'User'}</h3>
                <p className="text-xxs xs:text-xs text-gray-500 dark:text-gray-400 font-light">{getUserRoleText(user?.role)}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full p-2 xs:p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs xs:text-sm font-light flex items-center justify-center gap-2"
            >
              <LogOut size={14} /> {t('logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div 
        className={`flex-1 transition-all duration-500 content-scrollable
          ${!isSidebarCollapsed ? 'lg:pl-[280px]' : ''}`}
      >
        <div className="content-area relative z-10 h-full">
          {view === 'dashboard' && <DashboardContent />}
          {view === 'schedule' && <Schedule />}
          {view === 'tasks' && <Tasks />}
          {view === 'staff' && <Staff />}
          {view === 'events' && <Events />}
          {view === 'settings' && <SettingsPage />}
          {view === 'messages' && <Messages />}
          {view === 'laundry' && <LaundrySchedule />}
        </div>
      </div>
    </div>
  );
}