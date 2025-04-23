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
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  ArrowRightCircle,
  ChevronsLeft,
  X
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
import { Link } from 'react-router-dom';

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
    <div className="flex h-screen bg-white/80 text-blue-600">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 lg:translate-x-0 lg:w-72 xl:w-80 ${
          isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
        } 
        bg-white backdrop-blur-xl border-r border-blue-100
        w-[280px] lg:w-72 xl:w-80`
        }
      >
        <div className="p-4 border-b border-blue-100 flex items-center justify-between">
          <h1 className={`text-xl font-extralight tracking-wider text-blue-600 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
            Hostel PT Staff
          </h1>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-blue-600 hover:text-blue-700 transition-colors hidden lg:block"
          >
            {isSidebarCollapsed ? <ArrowRightCircle size={20} /> : <ChevronsLeft size={20} />}
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            {menuItems
              .map(item => (
                <li key={item.view}>
                  <Link
                    to={item.view}
                    onClick={() => {
                      setView(item.view);
                      if (window.innerWidth < 1024) {
                        setIsSidebarCollapsed(true);
                      }
                    }}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      view === item.view
                      ? 'bg-blue-100/70 text-blue-700'
                      : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50/50'}`}
                  >
                    <item.icon size={18} className="text-blue-600" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-blue-500/90 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium shadow-lg">
              {user?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-700">{user?.name || 'User'}</h3>
              <p className="text-xs text-blue-500 font-light">{getUserRoleText(user?.role)}</p>
            </div>
          </div>
          <InstallPWA />
          <button 
            onClick={handleLogout}
            className={`w-full p-2.5 rounded-lg bg-blue-100/70 hover:bg-blue-200/70 transition-colors text-sm font-light text-blue-700 flex items-center ${
              isSidebarCollapsed ? 'lg:justify-center' : 'justify-center lg:justify-start'
            } gap-2 mt-3`}
          >
            <LogOut size={18} />
            <span>
              {t('logout')}
            </span>
          </button>
        </div>
      </aside>
      
      {/* Mobile sidebar overlay */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Top Bar */}
        <div className="bg-white border-b border-blue-100 py-3 px-4 flex items-center justify-between ios-safe-top shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-medium text-blue-700">
              {view === 'dashboard' ? getGreeting() : t(`${view}.title`)}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-500 font-light hidden lg:block">
              {format(new Date(), 'PPPP')}
            </span>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 ios-safe-bottom bg-white/80 backdrop-blur-sm">
          {view === 'dashboard' && <DashboardContent />}
          {view === 'schedule' && <Schedule />}
          {view === 'tasks' && <Tasks />}
          {view === 'staff' && <Staff />}
          {view === 'events' && <Events />}
          {view === 'messages' && <Messages />}
          {view === 'laundry' && <LaundrySchedule />}
          {view === 'approvals' && <div className="text-center py-12 text-blue-600">Approvals coming soon</div>}
        </div>
      </div>
    </div>
  );
}