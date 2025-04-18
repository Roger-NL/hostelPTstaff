import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { format, isToday, isYesterday, addDays, subDays, startOfWeek, parseISO } from 'date-fns';
import type { Schedule, ShiftTime } from '../types';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  TrendingUp,
  User,
  Clock,
  Activity,
  Calendar,
  ClipboardList,
  MessageCircle,
  PartyPopper,
  Sun,
  Moon,
  CloudRain,
  Waves,
  Wind,
  Thermometer,
  Users,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  Shield,
  Settings,
  LayoutDashboard,
  HomeIcon,
  CheckSquare,
  AlertTriangle,
  Megaphone,
  Menu,
  X,
  ArrowDown
} from 'lucide-react';
import { firestore } from '../config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import * as authService from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';
import { useMediaQuery } from 'react-responsive';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface DashboardCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  navigateTo?: string;
}

function DashboardCard({ title, value, icon, trend, navigateTo }: DashboardCardProps) {
  const navigate = useNavigate();
  // Garantir que o valor seja um número válido
  const displayValue = isNaN(value) ? 0 : value;
  const trendValue = trend?.value && !isNaN(trend.value) ? trend.value : 0;
  
  const handleClick = () => {
    if (navigateTo) {
      console.log(`Navegando para: ${navigateTo}`);
      try {
        navigate(navigateTo);
      } catch (error) {
        console.error("Erro ao navegar:", error);
      }
    }
  };
  
  // Determinar se o card deve mostrar estado desativado
  const isDisabled = title.includes('Tasks') || title.includes('Tarefas');
  
  return (
    <div 
      className={`group bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 transition-all duration-300 hover:shadow-xl border border-gray-200/70 dark:border-gray-700/50 ${
        navigateTo || isDisabled ? 'cursor-pointer clickable-element' : ''
      } ${isDisabled ? 'opacity-70' : 'hover:transform hover:scale-[1.02]'}`}
      onClick={navigateTo || isDisabled ? handleClick : undefined}
      role="button"
      tabIndex={0}
      data-click-fixed="true"
      style={{
        pointerEvents: "auto"
      }}
    >
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 xs:w-12 xs:h-12 rounded-lg xs:rounded-xl flex items-center justify-center text-blue-600 transition-all duration-300 group-hover:scale-110 ${
          isDisabled 
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
            : 'bg-gradient-to-br from-blue-500/20 to-violet-500/20 dark:from-blue-500/30 dark:to-violet-500/30 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-violet-500 group-hover:text-white'
        }`}>
          {icon}
        </div>
        {trend && !isDisabled && (
          <div className={`flex items-center gap-1 text-xs xs:text-sm ${
            trend.isPositive ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'
          }`}>
            <TrendingUp size={14} className={`transition-transform duration-300 ${
              !trend.isPositive ? 'rotate-180' : ''
            }`} />
            <span className="font-medium">{trendValue}%</span>
          </div>
        )}
      </div>
      <div className="mt-3 xs:mt-4">
        <h3 className="text-gray-600 dark:text-gray-300 text-xs xs:text-sm font-light">{title}</h3>
        {isDisabled ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm font-light mt-1">Módulo desativado</p>
        ) : (
          <p className="text-gray-900 dark:text-white text-xl xs:text-2xl font-extralight mt-1 transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{displayValue}</p>
        )}
      </div>
    </div>
  );
}

export default function DashboardContent() {
  const { user, tasks = [], events = [], messages = [], users = [], schedule = {} as Schedule, setUser } = useStore();
  const { t } = useTranslation();
  const [isPromoting, setIsPromoting] = useState(false);
  const { loadAllUsers } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const maxPullDistance = 100;
  
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 639 });
  const isTablet = useMediaQuery({ minWidth: 640, maxWidth: 1023 });
  const isDesktop = useMediaQuery({ minWidth: 1024 });
  
  // Intersection observers for animations
  const [statsRef, statsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [tasksRef, tasksInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [scheduleRef, scheduleInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [weatherRef, weatherInView] = useInView({ threshold: 0.1, triggerOnce: true });

  // Função para navegar para outras páginas
  const navigateTo = (path: string) => {
    // Emitir um evento customizado para o Dashboard.tsx poder capturá-lo
    const navigationEvent = new CustomEvent('navigate', {
      detail: { path }
    });
    window.dispatchEvent(navigationEvent);
    
    // Não precisamos mais chamar navigate diretamente
    // navigate(path);
  };

  // Carrega todos os usuários quando o componente é montado
  useEffect(() => {
    const loadUsers = async () => {
      console.log('Carregando usuários no Dashboard...');
      try {
        const loadedUsers = await loadAllUsers();
        console.log(`${loadedUsers.length} usuários carregados no Dashboard`);
      } catch (error) {
        console.error('Erro ao carregar usuários no Dashboard:', error);
      }
    };
    
    loadUsers();
  }, [loadAllUsers]);
  
  // Ensure tasks is always an array
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  
  // Calculate statistics with safe tasks array
  const completedTasks = safeTasks.filter(t => t && t.status === 'done' && t.type === 'hostel').length;
  const totalTasks = safeTasks.filter(t => t && t.type === 'hostel').length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const upcomingEvents = Array.isArray(events) ? events.filter(e => e && e.status === 'upcoming').length : 0;
  const unreadMessages = Array.isArray(messages) ? messages.filter(m => m && !m.read.includes(user?.id || '')).length : 0;

  // Get today's tasks with safe array
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = safeTasks.filter(t => 
    t && t.type === 'hostel' && 
    t.createdAt && format(new Date(t.createdAt), 'yyyy-MM-dd') === today
  );

  // Get current weather data (mock data for now)
  const weather = {
    temperature: 24,
    condition: 'sunny',
    windSpeed: 12,
    waveHeight: 1.2,
    humidity: 65
  };

  // Encontra o próximo turno do usuário
  const getUserNextShift = () => {
    if (!user?.id) return null;
    
    const allShifts: ShiftTime[] = ['08:00-11:00', '10:00-13:00', '13:00-16:00', '16:00-19:00', '19:00-22:00'];
    const now = new Date();
    const currentHour = now.getHours();
    
    // Verifica os próximos 14 dias
    for (let day = 0; day < 14; day++) {
      const date = addDays(now, day);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayShifts = schedule[dateStr] || {};
      
      // Se for hoje, começa a partir do próximo turno
      let shiftsToCheck = allShifts;
      if (day === 0) {
        // Determina quais turnos já passaram hoje
        shiftsToCheck = allShifts.filter(shift => {
          const shiftStart = parseInt(shift.split('-')[0].split(':')[0]);
          return shiftStart > currentHour;
        });
      }
      
      // Verifica cada turno do dia
      for (let shift of shiftsToCheck) {
        const volunteerIds = dayShifts[shift] || [];
        if (volunteerIds.includes(user.id)) {
          return {
            shift,
            date: format(date, 'EEEE, d MMMM'),
            formattedDate: format(date, 'dd/MM'),
            rawDate: dateStr
          };
        }
      }
    }
    
    return null;
  };

  const userNextShift = getUserNextShift();
  
  // Get current shift
  const getCurrentShift = (): ShiftTime => {
    const hour = new Date().getHours();
    const minute = new Date().getMinutes();
    
    if (hour >= 8 && hour < 11) return '08:00-11:00';
    if (hour >= 11 && hour < 13) return '10:00-13:00';
    if (hour >= 13 && hour < 16) return '13:00-16:00';
    if (hour >= 16 && hour < 19) return '16:00-19:00';
    if (hour >= 19 && hour < 22) return '19:00-22:00';
    
    // Default to morning shift during the night
    return '08:00-11:00';
  };

  const currentShift = getCurrentShift();
  
  // Função para encontrar o último turno com voluntários independente de quando ocorreu
  const getLastActiveShift = (): { shift: ShiftTime, date: string, volunteers: any[] } => {
    const today = new Date();
    const allShifts: ShiftTime[] = ['08:00-11:00', '10:00-13:00', '13:00-16:00', '16:00-19:00', '19:00-22:00'];
    
    // Procura pelos últimos 30 dias para encontrar turnos com voluntários
    for (let day = 0; day <= 30; day++) {
      const date = subDays(today, day);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayShifts = schedule[dateStr] || {};
      
      // Se é hoje, verifica apenas turnos que já acabaram
      if (day === 0) {
        const currentHour = today.getHours();
        for (let i = allShifts.length - 1; i >= 0; i--) {
          const shift = allShifts[i];
          const shiftEndHour = parseInt(shift.split('-')[1].split(':')[0]);
          
          if (shiftEndHour <= currentHour) {
            const volunteerIds = dayShifts[shift] || [];
            if (volunteerIds.length > 0) {
              const volunteers = volunteerIds
                .map(id => users.find(u => u.id === id))
                .filter(Boolean);
              
              if (volunteers.length > 0) {
                return { shift, date: dateStr, volunteers };
              }
            }
          }
        }
      } else {
        // Para dias anteriores, verifica todos os turnos
        for (let i = allShifts.length - 1; i >= 0; i--) {
          const shift = allShifts[i];
          const volunteerIds = dayShifts[shift] || [];
          if (volunteerIds.length > 0) {
            const volunteers = volunteerIds
              .map(id => users.find(u => u.id === id))
              .filter(Boolean);
            
            if (volunteers.length > 0) {
              return { shift, date: dateStr, volunteers };
            }
          }
        }
      }
    }
    
    // Se não encontrou nenhum, retorna um valor padrão
    return { 
      shift: '08:00-11:00', 
      date: format(today, 'yyyy-MM-dd'), 
      volunteers: [] 
    };
  };

  // Função para encontrar o próximo turno com voluntários
  const getNextShiftWithVolunteers = (): { shift: ShiftTime, date: string, volunteers: any[] } => {
    const today = new Date();
    const allShifts: ShiftTime[] = ['08:00-11:00', '10:00-13:00', '13:00-16:00', '16:00-19:00', '19:00-22:00'];
    
    // Procura pelos próximos 30 dias para encontrar turnos com voluntários
    for (let day = 0; day < 30; day++) {
      const date = addDays(today, day);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayShifts = schedule[dateStr] || {};
      
      // Se é hoje, verifica apenas turnos que ainda não começaram
      if (day === 0) {
        const currentHour = today.getHours();
        for (let i = 0; i < allShifts.length; i++) {
          const shift = allShifts[i];
          const shiftStartHour = parseInt(shift.split('-')[0].split(':')[0]);
          
          if (shiftStartHour > currentHour) {
            const volunteerIds = dayShifts[shift] || [];
            if (volunteerIds.length > 0) {
              const volunteers = volunteerIds
                .map(id => users.find(u => u.id === id))
                .filter(Boolean);
              
              if (volunteers.length > 0) {
                return { shift, date: dateStr, volunteers };
              }
            }
          }
        }
      } else {
        // Para dias futuros, verifica todos os turnos
        for (let i = 0; i < allShifts.length; i++) {
          const shift = allShifts[i];
          const volunteerIds = dayShifts[shift] || [];
          if (volunteerIds.length > 0) {
            const volunteers = volunteerIds
              .map(id => users.find(u => u.id === id))
              .filter(Boolean);
            
            if (volunteers.length > 0) {
              return { shift, date: dateStr, volunteers };
            }
          }
        }
      }
    }
    
    // Se não encontrou nenhum, retorna um valor padrão
    return { 
      shift: '08:00-11:00', 
      date: format(addDays(today, 1), 'yyyy-MM-dd'), 
      volunteers: [] 
    };
  };
  
  const lastActiveShiftInfo = getLastActiveShift();
  const nextShiftWithVolunteersInfo = getNextShiftWithVolunteers();
  
  const getShiftVolunteers = (shift: ShiftTime) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const shifts = schedule[today] || {};
    const volunteerIds = shifts[shift] || [];
    
    // Filtrar voluntários para evitar valores undefined
    const volunteers = volunteerIds
      .map(id => users.find(u => u.id === id))
      .filter(Boolean); // Remove undefined/null values
    
    // Adiciona logs para debug
    console.log(`Shift ${shift} volunteers:`, volunteers);
    
    // Se não houver voluntários, retorna um array vazio (não tentamos mais criar um admin default)
    return volunteers;
  };

  // Verifica se o usuário está realmente no turno atual
  const checkUserInCurrentShift = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayShifts = schedule[today] || {};
    const volunteerIds = todayShifts[currentShift] || [];
    
    return volunteerIds.includes(user?.id || '');
  };

  const isUserInCurrentShift = checkUserInCurrentShift();

  // Encontra os dias de folga do usuário
  const getDaysOff = () => {
    const daysOff = [];
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Começa na segunda-feira
    
    // Verifica os 7 dias da semana atual
    for (let i = 0; i < 7; i++) {
      const date = addDays(startOfCurrentWeek, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayShifts = schedule[dateStr] || {};
      
      // Verifica se o usuário não está em nenhum turno neste dia
      const hasShift = Object.values(dayShifts).some(volunteerIds => 
        Array.isArray(volunteerIds) && volunteerIds.includes(user?.id || '')
      );
      
      if (!hasShift) {
        daysOff.push(date);
      }
    }
    
    return daysOff;
  };

  const daysOff = getDaysOff();

  // Get shift name based on the time range
  const getShiftName = (shift: ShiftTime): string => {
    switch(shift) {
      case '08:00-11:00': return t('schedule.shifts.morning');
      case '10:00-13:00': return t('schedule.shifts.midMorning');
      case '13:00-16:00': return t('schedule.shifts.afternoon');
      case '16:00-19:00': return t('schedule.shifts.evening');
      case '19:00-22:00': return t('schedule.shifts.night');
      default: return shift;
    }
  };

  // Função para formatar a data de exibição
  const formatDisplayDate = (dateStr: string): string => {
    const date = parseISO(dateStr);
    if (isToday(date)) {
      return "Hoje";
    } else if (isYesterday(date)) {
      return "Ontem";
    } else {
      return format(date, 'dd/MM');
    }
  };

  // Função para promover usuário a administrador
  const handleMakeAdmin = async () => {
    if (!user) return;
    
    setIsPromoting(true);
    try {
      if (window.confirm('Deseja realmente se tornar um administrador?')) {
        console.log('Promovendo usuário a administrador:', user.id);
        
        // 1. Atualiza no Firestore
        const userRef = doc(firestore, 'users', user.id);
        await updateDoc(userRef, { role: 'admin' });
        
        // 2. Notificar o usuário e recarregar a página
        alert('Você agora é um administrador! A página será recarregada para aplicar as mudanças.');
        
        // 3. Recarregar a página para obter todos os dados atualizados
        // isso evita problemas de tipagem e garante que o usuário tenha todas as permissões
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      alert('Ocorreu um erro ao tentar promover usuário. Tente novamente mais tarde.');
    } finally {
      setIsPromoting(false);
    }
  };

  // Definimos o currentVolunteers antes de usar na renderização
  const currentVolunteers = getShiftVolunteers(currentShift);
  const hasCurrentVolunteers = currentVolunteers && currentVolunteers.length > 0;

  // Função para tratar cliques no card de tarefas desativado
  const handleTasksCardClick = () => {
    alert("O módulo de Tarefas está desativado. Entre em contato com o administrador do sistema para ativar este módulo.");
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Pull to refresh functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      const touchY = e.touches[0].clientY;
      const distance = touchY - touchStartY.current;
      
      if (distance > 0) {
        setPullDistance(Math.min(distance, maxPullDistance));
      }
    }
  };
  
  const handleTouchEnd = () => {
    if (pullDistance >= maxPullDistance * 0.7) {
      setIsRefreshing(true);
      // Simulate refresh
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        // Here you would typically reload data
        window.location.reload();
      }, 1500);
    } else {
      setPullDistance(0);
    }
  };

  const navigationItems = [
    { icon: <HomeIcon size={18} />, label: 'Dashboard', path: '/' },
    { icon: <Calendar size={18} />, label: 'Schedule', path: '/schedule' },
    { icon: <ClipboardList size={18} />, label: 'Tasks', path: '/tasks' },
    { icon: <Users size={18} />, label: 'Staff', path: '/staff' },
    { icon: <PartyPopper size={18} />, label: 'Events', path: '/events' }
  ];

  return (
    <div className="space-y-6 max-w-[2000px] mx-auto">
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {pullDistance > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 flex justify-center items-center py-4 bg-gray-900/95 backdrop-blur-md z-50"
          >
            <div className="flex items-center gap-2 text-sm text-gray-300">
              {isRefreshing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <ArrowDown size={20} className={`transform transition-transform ${pullDistance >= maxPullDistance * 0.7 ? 'rotate-180' : ''}`} />
                  <span>{pullDistance >= maxPullDistance * 0.7 ? 'Release to refresh' : 'Pull to refresh'}</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div 
        className="space-y-6"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Status do Usuário */}
        <div className="space-y-4 xs:space-y-6">
          {/* User next shift - MOVED TO TOP */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 border border-gray-200/70 dark:border-gray-700/50"
          >
            <h2 className="text-lg xs:text-xl font-extralight text-gray-800 dark:text-white mb-3 xs:mb-4 flex items-center gap-2">
              <Clock size={18} className="text-teal-500 xs:hidden" />
              <Clock size={20} className="text-teal-500 hidden xs:block" />
              {t('dashboard.yourNextShift') || "Your Next Shift"}
            </h2>
            
            {userNextShift ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-20 h-20 xs:w-24 xs:h-24 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white mb-4">
                  <Calendar size={32} className="xs:hidden" />
                  <Calendar size={40} className="hidden xs:block" />
                </div>
                <h3 className="text-md xs:text-lg font-light text-gray-800 dark:text-white">{userNextShift.date}</h3>
                <p className="text-xl xs:text-2xl font-extralight text-gray-700 dark:text-gray-300 mt-2">{userNextShift.shift}</p>
                <div className="mt-6 px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-lg text-xs xs:text-sm font-light flex items-center gap-2">
                  <Shield size={14} className="xs:hidden" />
                  <Shield size={16} className="hidden xs:block" />
                  <span>{t('dashboard.dutyConfirmed')}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
                  <Calendar size={24} />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-light">
                  {t('dashboard.noUpcomingShifts')}
                </p>
              </div>
            )}
          </motion.div>

          {/* Welcome section with stats */}
          <motion.div 
            ref={statsRef}
            variants={containerVariants}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
            className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6"
          >
            {/* Tasks Card - Disabled with explanation */}
            <motion.div 
              variants={itemVariants}
              onClick={handleTasksCardClick}
              className="group bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 transition-all duration-300 hover:shadow-xl border border-gray-200/70 dark:border-gray-700/50 cursor-pointer clickable-element opacity-70"
              role="button"
              tabIndex={0}
              data-click-fixed="true"
              style={{ pointerEvents: "auto" }}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-lg xs:rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-all duration-300 group-hover:scale-110">
                  <ClipboardList size={22} />
                </div>
              </div>
              <div className="mt-3 xs:mt-4">
                <h3 className="text-gray-600 dark:text-gray-300 text-xs xs:text-sm font-light">{t('tasks.title')}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-light mt-1">Módulo desativado</p>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <DashboardCard 
                title={t('dashboard.stats.events') || "Events"} 
                value={upcomingEvents} 
                icon={<>
                  <PartyPopper size={18} className="xs:hidden" />
                  <PartyPopper size={24} className="hidden xs:block" />
                </>}
                navigateTo="/events"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <DashboardCard 
                title={t('dashboard.stats.messages') || "Messages"} 
                value={unreadMessages} 
                icon={<>
                  <MessageCircle size={18} className="xs:hidden" />
                  <MessageCircle size={24} className="hidden xs:block" />
                </>}
                navigateTo="/messages"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <DashboardCard 
                title={t('dashboard.stats.points') || "Your Points"} 
                value={user?.points || 0} 
                icon={<>
                  <Award size={18} className="xs:hidden" />
                  <Award size={24} className="hidden xs:block" />
                </>}
                navigateTo="/points"
              />
            </motion.div>
          </motion.div>

          {/* Today's team section - UPDATED */}
          <motion.div 
            ref={scheduleRef}
            initial={{ opacity: 0, y: 20 }}
            animate={scheduleInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 border border-gray-200/70 dark:border-gray-700/50"
          >
            <h2 className="text-lg xs:text-xl font-extralight text-gray-800 dark:text-white mb-3 xs:mb-4 flex items-center gap-2">
              <Users size={18} className="text-blue-500 xs:hidden" />
              <Users size={20} className="text-blue-500 hidden xs:block" />
              {t('dashboard.todayTeam') || "Today's Team"}
            </h2>
            
            <div className="space-y-3 xs:space-y-4">
              {/* Last active shift with volunteers */}
              <div className="space-y-2 xs:space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs xs:text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <ClockIcon size={14} className="text-gray-500 xs:hidden" />
                    <ClockIcon size={16} className="text-gray-500 hidden xs:block" />
                    {t('dashboard.lastActiveShift')}
                  </h3>
                  <span className="text-xxs xs:text-xs font-light text-gray-500">
                    {formatDisplayDate(lastActiveShiftInfo.date)} - {lastActiveShiftInfo.shift}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {lastActiveShiftInfo.volunteers && lastActiveShiftInfo.volunteers.length > 0 ? (
                    <div className="w-full">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{lastActiveShiftInfo.shift}</div>
                      <div className="flex flex-wrap gap-2">
                        {lastActiveShiftInfo.volunteers.map(volunteer => volunteer && (
                          <div key={volunteer.id} className="flex items-center px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/50 gap-1.5">
                            <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center text-blue-600 text-xs">
                              {volunteer.name[0]}
                            </div>
                            <span className="text-xs font-light text-gray-800 dark:text-gray-200">
                              {volunteer.name.split(' ')[0]}
                              {volunteer.id === user?.id && ` (${t('dashboard.you')})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.noVolunteersAssigned')}</span>
                  )}
                </div>
              </div>

              {/* Current shift - only show if there are volunteers */}
              {hasCurrentVolunteers && (
                <div className="space-y-2 xs:space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs xs:text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <ClockIcon size={14} className="text-blue-500 xs:hidden" />
                      <ClockIcon size={16} className="text-blue-500 hidden xs:block" />
                      {getShiftName(currentShift)} {/* Current */}
                    </h3>
                    <span className="text-xxs xs:text-xs font-medium text-blue-600 dark:text-blue-400">{currentShift}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <div className="w-full">
                      <div className="text-xs font-medium text-blue-600 dark:text-blue-300 mb-1.5">{currentShift}</div>
                      <div className="flex flex-wrap gap-2">
                        {currentVolunteers.map(volunteer => volunteer && (
                          <div key={volunteer.id} className="flex items-center px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 gap-1.5">
                            <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                              {volunteer.name[0]}
                            </div>
                            <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                              {volunteer.name.split(' ')[0]}
                              {volunteer.id === user?.id && ` (${t('dashboard.you')})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Next shift with volunteers */}
              <div className="space-y-2 xs:space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs xs:text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <ClockIcon size={14} className="text-gray-500 xs:hidden" />
                    <ClockIcon size={16} className="text-gray-500 hidden xs:block" />
                    {t('dashboard.nextShiftWithVolunteers')}
                  </h3>
                  <span className="text-xxs xs:text-xs font-light text-gray-500">
                    {formatDisplayDate(nextShiftWithVolunteersInfo.date)} - {nextShiftWithVolunteersInfo.shift}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {nextShiftWithVolunteersInfo.volunteers && nextShiftWithVolunteersInfo.volunteers.length > 0 ? (
                    <div className="w-full">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{nextShiftWithVolunteersInfo.shift}</div>
                      <div className="flex flex-wrap gap-2">
                        {nextShiftWithVolunteersInfo.volunteers.map(volunteer => volunteer && (
                          <div key={volunteer.id} className="flex items-center px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/50 gap-1.5">
                            <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center text-blue-600 text-xs">
                              {volunteer.name[0]}
                            </div>
                            <span className="text-xs font-light text-gray-800 dark:text-gray-200">
                              {volunteer.name.split(' ')[0]}
                              {volunteer.id === user?.id && ` (${t('dashboard.you')})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.noVolunteersAssigned')}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Weather and Other sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6">
            {/* Weather section */}
            <motion.div 
              ref={weatherRef}
              initial={{ opacity: 0, y: 20 }}
              animate={weatherInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 border border-gray-200/70 dark:border-gray-700/50 lg:col-span-1"
            >
              <h2 className="text-lg xs:text-xl font-extralight text-gray-800 dark:text-white mb-3 xs:mb-4 flex items-center gap-2">
                <Sun size={18} className="text-amber-500 xs:hidden" />
                <Sun size={20} className="text-amber-500 hidden xs:block" />
                {t('dashboard.weather.title') || "Beach Conditions"}
              </h2>
              <div className="space-y-3 xs:space-y-4">
                <div className="flex items-center justify-between px-3 xs:px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-200/50 dark:border-amber-700/30">
                  <div className="flex items-center gap-1.5 xs:gap-2">
                    <Thermometer size={16} className="text-amber-500 xs:hidden" />
                    <Thermometer size={18} className="text-amber-500 hidden xs:block" />
                    <span className="text-gray-700 dark:text-gray-300 font-light text-xs xs:text-sm">{t('dashboard.weather.temperature') || "Temperature"}</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-xs xs:text-sm">{weather.temperature}°C</span>
                </div>
                <div className="flex items-center justify-between px-3 xs:px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-teal-500/20 border border-blue-200/50 dark:border-blue-700/30">
                  <div className="flex items-center gap-1.5 xs:gap-2">
                    <Wind size={16} className="text-blue-500 xs:hidden" />
                    <Wind size={18} className="text-blue-500 hidden xs:block" />
                    <span className="text-gray-700 dark:text-gray-300 font-light text-xs xs:text-sm">{t('dashboard.weather.windSpeed') || "Wind Speed"}</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-xs xs:text-sm">{weather.windSpeed} km/h</span>
                </div>
                <div className="flex items-center justify-between px-3 xs:px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-200/50 dark:border-teal-700/30">
                  <div className="flex items-center gap-1.5 xs:gap-2">
                    <Waves size={16} className="text-teal-500 xs:hidden" />
                    <Waves size={18} className="text-teal-500 hidden xs:block" />
                    <span className="text-gray-700 dark:text-gray-300 font-light text-xs xs:text-sm">{t('dashboard.weather.waveHeight') || "Wave Height"}</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-xs xs:text-sm">{weather.waveHeight}m</span>
                </div>
                <div className="flex items-center justify-between px-3 xs:px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-200/50 dark:border-cyan-700/30">
                  <div className="flex items-center gap-1.5 xs:gap-2">
                    <CloudRain size={16} className="text-cyan-500 xs:hidden" />
                    <CloudRain size={18} className="text-cyan-500 hidden xs:block" />
                    <span className="text-gray-700 dark:text-gray-300 font-light text-xs xs:text-sm">{t('dashboard.weather.humidity') || "Humidity"}</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-xs xs:text-sm">{weather.humidity}%</span>
                </div>
              </div>
            </motion.div>

            {/* Tasks */}
            <motion.div 
              ref={tasksRef}
              initial={{ opacity: 0, y: 20 }}
              animate={tasksInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 border border-gray-200/70 dark:border-gray-700/50 lg:col-span-2"
            >
              <h2 className="text-lg xs:text-xl font-extralight text-gray-800 dark:text-white mb-3 xs:mb-4 flex items-center gap-2">
                <ClipboardList size={18} className="text-indigo-500 xs:hidden" />
                <ClipboardList size={20} className="text-indigo-500 hidden xs:block" />
                {t('dashboard.pendingTasks')}
              </h2>
              
              <div className="space-y-2 xs:space-y-3">
                {Array.isArray(safeTasks) && safeTasks.length > 0 ? (
                  safeTasks
                    .filter(t => t && typeof t === 'object' && t.status !== 'done' && t.type === 'hostel')
                    .slice(0, 5)
                    .map(task => (
                      <motion.div 
                        key={task.id || Math.random()}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-center justify-between p-2.5 xs:p-3 rounded-lg ${
                          task.status === 'inProgress'
                            ? 'bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/20'
                            : 'bg-gray-100/50 dark:bg-gray-700/20 border border-gray-200 dark:border-gray-700/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`w-5 h-5 xs:w-6 xs:h-6 rounded-full flex items-center justify-center ${
                            task.status === 'inProgress'
                              ? 'bg-amber-500 text-white'
                              : 'bg-gray-500 text-white'
                          }`}>
                            {task.status === 'inProgress'
                              ? <Activity size={12} className="xs:hidden" />
                              : <AlertCircle size={12} className="xs:hidden" />
                            }
                            {task.status === 'inProgress'
                              ? <Activity size={14} className="hidden xs:block" />
                              : <AlertCircle size={14} className="hidden xs:block" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs xs:text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {task.title || 'Untitled Task'}
                            </h4>
                            <p className="text-xxs xs:text-xs font-light text-gray-500 dark:text-gray-400 truncate">
                              {task.description 
                                ? (task.description.length > 40 
                                    ? task.description.substring(0, 40) + '...' 
                                    : task.description)
                                : 'No description'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <div className="flex items-center gap-1 ml-2 text-amber-500">
                            <Award size={12} className="xs:hidden" />
                            <Award size={14} className="hidden xs:block" />
                            <span className="text-xxs xs:text-xs">{task.points || 0}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                ) : (
                  <div className="text-center py-4 xs:py-6">
                    <div className="w-10 h-10 xs:w-12 xs:h-12 mx-auto bg-gray-100 dark:bg-gray-700/30 rounded-full flex items-center justify-center mb-2 xs:mb-3">
                      <ClipboardList size={18} className="text-gray-400 xs:hidden" />
                      <ClipboardList size={20} className="text-gray-400 hidden xs:block" />
                    </div>
                    <p className="text-xs xs:text-sm text-gray-500 dark:text-gray-400">
                      {t('dashboard.noTasks')}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* User Schedule */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={scheduleInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 border border-gray-200/70 dark:border-gray-700/50 md:col-span-3"
            >
              <h2 className="text-lg xs:text-xl font-extralight text-gray-800 dark:text-white mb-3 xs:mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-blue-500 xs:hidden" />
                <Calendar size={20} className="text-blue-500 hidden xs:block" />
                {t('dashboard.yourSchedule')}
              </h2>
              
              <div className="space-y-4">
                <div className="p-3 xs:p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-200/30 dark:border-blue-700/20 space-y-3">
                  <h3 className="text-sm xs:text-base font-medium text-blue-800 dark:text-blue-300">
                    {t('dashboard.nextShiftSimple')}
                  </h3>
                  
                  {userNextShift ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-blue-500 xs:hidden" />
                        <Calendar size={16} className="text-blue-500 hidden xs:block" />
                        <span className="text-xs xs:text-sm text-gray-700 dark:text-gray-300">{userNextShift.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-blue-500 xs:hidden" />
                        <Clock size={16} className="text-blue-500 hidden xs:block" />
                        <span className="text-xs xs:text-sm text-gray-700 dark:text-gray-300">{userNextShift.shift} ({getShiftName(userNextShift.shift as ShiftTime)})</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs xs:text-sm text-gray-600 dark:text-gray-400 font-light">
                      {t('dashboard.noUpcomingShifts')}
                    </p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('dashboard.daysOff')}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2">
                    {daysOff.length > 0 ? (
                      daysOff.map((day, index) => (
                        <div 
                          key={index}
                          className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700/50 text-xxs xs:text-xs font-light text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700"
                        >
                          {format(day, 'EEE, dd MMM')}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-light">
                        {t('dashboard.noDaysOff')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 