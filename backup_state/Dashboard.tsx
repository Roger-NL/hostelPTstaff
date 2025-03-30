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

export default function MainDashboard() {
  const { user, users, tasks, messages, logout } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

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
    { icon: SettingsIcon, label: t('settings.title'), view: 'settings' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 to-violet-200 dark:from-gray-900 dark:to-gray-800 flex relative font-sans text-gray-800 dark:text-white">
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
        className={`fixed top-6 left-6 z-20 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl text-gray-700 dark:text-white hover:bg-white dark:hover:bg-gray-700 shadow-lg transition-all duration-300 ${!isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <Menu size={20} />
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
            : 'w-[280px] translate-x-0 opacity-100 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-2xl border-r border-white/20 dark:border-gray-700/30'}`}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-700/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl">
              H
            </div>
            <h1 className="text-xl font-extralight tracking-wide">Hostel</h1>
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors flex items-center justify-center"
          >
            <ChevronsLeft size={20} />
          </button>
        </div>
        
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.view}
              onClick={() => {
                setView(item.view);
                setIsSidebarCollapsed(true);
              }}
              className={`flex items-center gap-3 p-3 w-full rounded-xl transition-all duration-300 relative font-light
                ${view === item.view 
                  ? 'bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-blue-700 dark:text-blue-300 font-normal' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/30 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <item.icon size={20} className={view === item.view ? 'text-blue-500' : ''} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <div className="absolute top-2 right-2 min-w-[20px] h-[20px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1 shadow-lg">
                  {item.badge}
                </div>
              )}
              {view === item.view && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              )}
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-100 dark:border-gray-700/30">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium">{user?.name || 'User'}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-light">{getUserRoleText(user?.role)}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-light flex items-center justify-center gap-2"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - always full width */}
      <div className="flex-1 p-6 pt-16 md:p-8 md:pt-8 overflow-auto relative z-10">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                {isSidebarCollapsed && (
                  <>
                    <button
                      onClick={() => setIsSidebarCollapsed(false)}
                      className="p-2 mr-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl text-gray-700 dark:text-white hover:bg-white dark:hover:bg-gray-700 shadow-lg transition-all duration-300 lg:hidden"
                    >
                      <Menu size={20} />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl lg:hidden">
                      H
                    </div>
                  </>
                )}
                <h1 className="text-2xl font-extralight text-gray-800 dark:text-white tracking-wide">
                  {view === 'schedule' ? t('schedule.title') : 
                  view === 'staff' ? t('staff.title') :
                  view === 'tasks' ? t('taskManagement') :
                  view === 'events' ? t('events.title') :
                  view === 'settings' ? t('settings.title') :
                  view === 'messages' ? t('messages.title') :
                  t('dashboard.title')}
                </h1>
              </div>
              
              <div className="flex items-center gap-3">
                {view === 'staff' && (
                  <button className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white py-2 px-4 rounded-xl text-sm font-light flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-blue-500/20">
                    <Users size={16} />
                    <span>Add User</span>
                  </button>
                )}
                <div className="h-10 px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg text-sm font-light flex items-center gap-2 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700/30">
                  <User size={16} className="text-blue-500" />
                  <span>{getGreeting()}</span>
                  <span className="text-amber-500 flex items-center ml-1 gap-1 font-normal">
                    <Award size={14} />
                    {user?.points || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white/60 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20 min-h-[calc(100vh-180px)]">
            {view === 'dashboard' && <DashboardContent />}
            {view === 'schedule' && <Schedule />}
            {view === 'tasks' && <Tasks />}
            {view === 'staff' && <Staff />}
            {view === 'events' && <Events />}
            {view === 'messages' && <Messages />}
            {view === 'settings' && <SettingsPage />}
          </div>
        </div>
      </div>
    </div>
  );
}