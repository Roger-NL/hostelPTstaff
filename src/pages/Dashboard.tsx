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
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div
        className={`bg-gray-800/50 w-64 shrink-0 transition-all duration-300 fixed lg:static top-0 bottom-0 z-20 ${
          isSidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-700/30 flex items-center justify-between">
          <h1 className={`text-xl font-extralight tracking-wider ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
            Hostel PT Staff
          </h1>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-gray-400 hover:text-white transition-colors hidden lg:block"
          >
            <ChevronLeft size={20} className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Menu */}
        <div className="p-4 content-scrollable">
          {menuItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left mb-1
                ${view === item.view ? 'bg-gray-700/60 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/30'}`}
            >
              <item.icon size={18} />
              <span className={`text-sm ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
              {item.badge ? (
                <span className="ml-auto bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/30 mobile-safe-bottom">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className={`flex-1 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                <h3 className="text-sm font-medium">{user?.name || 'User'}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-light">{getUserRoleText(user?.role)}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`w-full p-2.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors text-sm font-light flex items-center ${
                isSidebarCollapsed ? 'lg:justify-center' : 'justify-center gap-2'
              }`}
            >
              <LogOut size={14} />
              <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar overlay */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 border-b border-gray-700/30 flex items-center justify-between mobile-safe-top">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="text-gray-400 hover:text-white transition-colors lg:hidden"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-light">{menuItems.find((item) => item.view === view)?.label}</h2>
          </div>
          <div className="text-sm font-light hidden md:block">{getGreeting()}</div>
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
        </div>
      </div>
    </div>
  );
}