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
import Messages from './Messages';
import DashboardContent from './DashboardContent';
import LaundrySchedule from './LaundrySchedule';
import InstallPWA from '../components/InstallPWA';

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
    
    try {
      const translatedRole = t(`roles.${role}`);
      if (translatedRole === `roles.${role}`) {
        return role.charAt(0).toUpperCase() + role.slice(1);
      }
      return translatedRole;
    } catch (error) {
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

  // Construir os itens do menu
  const baseMenuItems = [
    { icon: LayoutDashboard, label: t('dashboard.title'), view: 'dashboard' },
    { icon: Calendar, label: t('schedule.title'), view: 'schedule' },
    { icon: ClipboardList, label: t('taskManagement'), view: 'tasks' },
    { icon: Users, label: t('staff.title'), view: 'staff' },
    { icon: PartyPopper, label: t('events.title'), view: 'events' },
    { icon: MessageCircle, label: t('messages.title'), view: 'messages', badge: unreadCount },
    { icon: HomeIcon, label: t('laundry.title'), view: 'laundry' }
  ];
  
  // Adicionar opção de autorizações se o usuário for admin
  const menuItems = user?.role === 'admin' 
    ? [...baseMenuItems, { icon: CheckSquare, label: t('approvals.title'), view: 'approvals' }]
    : baseMenuItems;

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0'}
          bg-gray-800/90 backdrop-blur-xl border-r border-white/10
          ios-safe-top ios-safe-bottom`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h1 className={`text-xl font-extralight tracking-wider ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
            Hostel PT Staff
          </h1>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-gray-400 hover:text-white transition-colors hidden lg:block"
          >
            <ChevronsLeft size={20} className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Menu */}
        <div className="py-4 flex-1 overflow-y-auto scrollbar-none">
          <div className="px-3 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.view}
                onClick={() => {
                  setView(item.view);
                  if (window.innerWidth < 1024) {
                    setIsSidebarCollapsed(true);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${view === item.view 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <item.icon size={18} className={view === item.view ? 'text-blue-400' : ''} />
                <span className={`text-sm font-light ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                  {item.label}
                </span>
                {item.badge ? (
                  <span className="ml-auto bg-pink-500/90 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* User Profile and Logout */}
        <div className="p-4 border-t border-white/10">
          <InstallPWA />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-medium shadow-lg">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className={`flex-1 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
              <h3 className="text-sm font-medium">{user?.name || 'User'}</h3>
              <p className="text-xs text-gray-400 font-light">{getUserRoleText(user?.role)}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-light flex items-center ${
              isSidebarCollapsed ? 'lg:justify-center' : 'justify-center gap-2'
            }`}
          >
            <LogOut size={14} />
            <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>{t('logout')}</span>
          </button>
        </div>
      </div>
      
      {/* Mobile sidebar overlay */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Top Bar */}
        <div className="bg-gray-800/90 backdrop-blur-xl border-b border-white/10 py-3 px-4 flex items-center justify-between ios-safe-top">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors lg:hidden"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-light">{menuItems.find((item) => item.view === view)?.label}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-sm font-light">
              <User size={16} className="text-blue-400" />
              <span>{getGreeting()}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 ios-safe-bottom">
          {view === 'dashboard' && <DashboardContent />}
          {view === 'schedule' && <Schedule />}
          {view === 'tasks' && <Tasks />}
          {view === 'staff' && <Staff />}
          {view === 'events' && <Events />}
          {view === 'messages' && <Messages />}
          {view === 'laundry' && <LaundrySchedule />}
          {view === 'approvals' && user?.role === 'admin' && (
            <div className="space-y-6">
              <h2 className="text-xl font-light">{t('approvals.photoApprovals')}</h2>
              <div className="bg-gray-800/90 backdrop-blur-xl rounded-xl p-6 border border-white/10">
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