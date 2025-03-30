import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { format, isToday, isYesterday, addDays, subDays, startOfWeek } from 'date-fns';
import type { Schedule, ShiftTime } from '../types';
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
  Shield
} from 'lucide-react';
import { firestore } from '../config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import * as authService from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';

interface DashboardCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function DashboardCard({ title, value, icon, trend }: DashboardCardProps) {
  // Garantir que o valor seja um número válido
  const displayValue = isNaN(value) ? 0 : value;
  const trendValue = trend?.value && !isNaN(trend.value) ? trend.value : 0;
  
  return (
    <div className="group bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 transition-all duration-300 hover:shadow-xl border border-gray-200/70 dark:border-gray-700/50 hover:transform hover:scale-[1.02]">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-lg xs:rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 dark:from-blue-500/30 dark:to-violet-500/30 flex items-center justify-center text-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-violet-500 group-hover:text-white">
          {icon}
        </div>
        {trend && (
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
        <p className="text-gray-900 dark:text-white text-xl xs:text-2xl font-extralight mt-1 transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{displayValue}</p>
      </div>
    </div>
  );
}

export default function DashboardContent() {
  const { user, tasks = [], events = [], messages = [], users = [], schedule = {} as Schedule, setUser } = useStore();
  const { t } = useTranslation();
  const [isPromoting, setIsPromoting] = useState(false);
  const { loadAllUsers } = useAuth();

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

  // Calculate statistics
  const completedTasks = tasks.filter(t => t.status === 'done' && t.type === 'hostel').length;
  const totalTasks = tasks.filter(t => t.type === 'hostel').length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const upcomingEvents = events.filter(e => e.status === 'upcoming').length;
  const unreadMessages = messages.filter(m => !m.read.includes(user?.id || '')).length;

  // Get current weather data (mock data for now)
  const weather = {
    temperature: 24,
    condition: 'sunny',
    windSpeed: 12,
    waveHeight: 1.2,
    humidity: 65
  };

  // Get today's tasks
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = tasks.filter(t => 
    t.type === 'hostel' && 
    format(new Date(t.createdAt), 'yyyy-MM-dd') === today
  );

  // Get current shift based on time
  const getCurrentShift = (): ShiftTime => {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 10) return '08:00-10:00';
    if (hour >= 10 && hour < 13) return '10:00-13:00';
    if (hour >= 13 && hour < 16) return '13:00-16:00';
    if (hour >= 16 && hour < 19) return '16:00-19:00';
    return '19:00-22:00';
  };

  // Get previous, current and next shifts
  const currentShift = getCurrentShift();
  const previousShift = currentShift === '08:00-10:00' ? '19:00-22:00' : 
                        currentShift === '10:00-13:00' ? '08:00-10:00' :
                        currentShift === '13:00-16:00' ? '10:00-13:00' :
                        currentShift === '16:00-19:00' ? '13:00-16:00' : '16:00-19:00';
  const nextShift = currentShift === '08:00-10:00' ? '10:00-13:00' : 
                    currentShift === '10:00-13:00' ? '13:00-16:00' :
                    currentShift === '13:00-16:00' ? '16:00-19:00' :
                    currentShift === '16:00-19:00' ? '19:00-22:00' : '08:00-10:00';

  const getShiftVolunteers = (shift: ShiftTime) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const shifts = schedule[today] || {};
    const volunteerIds = shifts[shift] || [];
    const volunteers = volunteerIds.map(id => users.find(u => u.id === id));
    
    // Se não houver voluntários, retorna um admin
    if (volunteers.length === 0) {
      const admin = users.find(u => u.role === 'admin');
      return admin ? [admin] : [];
    }
    
    return volunteers;
  };

  const previousVolunteers = getShiftVolunteers(previousShift);
  const currentVolunteers = getShiftVolunteers(currentShift);
  const nextVolunteers = getShiftVolunteers(nextShift);

  // Encontra o próximo turno do usuário
  const getUserNextShift = () => {
    const allShifts: ShiftTime[] = ['08:00-10:00', '10:00-13:00', '13:00-16:00', '16:00-19:00', '19:00-22:00'];
    const currentIndex = allShifts.indexOf(currentShift);
    
    // Verifica os próximos 7 dias
    for (let day = 0; day < 7; day++) {
      const date = addDays(new Date(), day);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayShifts = schedule[dateStr] || {};
      
      // Se for hoje, começa a partir do próximo turno
      const startIndex = day === 0 ? currentIndex + 1 : 0;
      
      for (let i = startIndex; i < allShifts.length; i++) {
        const shift = allShifts[i];
        const volunteerIds = dayShifts[shift] || [];
        
        if (volunteerIds.includes(user?.id || '')) {
          return {
            shift,
            date: format(date, 'EEEE, d MMMM')
          };
        }
      }
    }
    
    return null;
  };

  const userNextShift = getUserNextShift();

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
      case '08:00-10:00': return t('schedule.shifts.morning');
      case '10:00-13:00': return t('schedule.shifts.midMorning');
      case '13:00-16:00': return t('schedule.shifts.afternoon');
      case '16:00-19:00': return t('schedule.shifts.evening');
      case '19:00-22:00': return t('schedule.shifts.night');
      default: return shift;
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

  return (
    <div className="space-y-6 xs:space-y-8">
      {/* Welcome section with stats */}
      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
        <DashboardCard 
          title={t('dashboard.stats.tasks') || "Tasks"} 
          value={completedTasks} 
          icon={<>
            <ClipboardList size={18} className="xs:hidden" />
            <ClipboardList size={24} className="hidden xs:block" />
          </>}
          trend={{ value: completionRate, isPositive: true }}
        />
        <DashboardCard 
          title={t('dashboard.stats.events') || "Events"} 
          value={upcomingEvents} 
          icon={<>
            <PartyPopper size={18} className="xs:hidden" />
            <PartyPopper size={24} className="hidden xs:block" />
          </>}
        />
        <DashboardCard 
          title={t('dashboard.stats.messages') || "Messages"} 
          value={unreadMessages} 
          icon={<>
            <MessageCircle size={18} className="xs:hidden" />
            <MessageCircle size={24} className="hidden xs:block" />
          </>}
        />
        <DashboardCard 
          title={t('dashboard.stats.points') || "Your Points"} 
          value={user?.points || 0} 
          icon={<>
            <Award size={18} className="xs:hidden" />
            <Award size={24} className="hidden xs:block" />
          </>}
        />
      </div>

      {/* Weather and Today's info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6">
        {/* Weather section */}
        <div className="bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 border border-gray-200/70 dark:border-gray-700/50 lg:col-span-1">
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
        </div>

        {/* Today's shifts */}
        <div className="bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 border border-gray-200/70 dark:border-gray-700/50 lg:col-span-1">
          <h2 className="text-lg xs:text-xl font-extralight text-gray-800 dark:text-white mb-3 xs:mb-4 flex items-center gap-2">
            <Users size={18} className="text-blue-500 xs:hidden" />
            <Users size={20} className="text-blue-500 hidden xs:block" />
            {t('dashboard.todayTeam') || "Today's Team"}
          </h2>
          
          <div className="space-y-3 xs:space-y-4">
            <div className="space-y-2 xs:space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs xs:text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                  <ClockIcon size={14} className="text-gray-500 xs:hidden" />
                  <ClockIcon size={16} className="text-gray-500 hidden xs:block" />
                  {getShiftName(previousShift)}
                </h3>
                <span className="text-xxs xs:text-xs font-light text-gray-500">{previousShift}</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {previousVolunteers.map(volunteer => volunteer && (
                  <div key={volunteer.id} className="flex items-center px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/50 gap-1.5">
                    <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center text-blue-600 text-xs">
                      {volunteer.name[0]}
                    </div>
                    <span className="text-xs font-light text-gray-800 dark:text-gray-200">
                      {volunteer.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

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
                {currentVolunteers.map(volunteer => volunteer && (
                  <div key={volunteer.id} className="flex items-center px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 gap-1.5">
                    <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                      {volunteer.name[0]}
                    </div>
                    <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                      {volunteer.name.split(' ')[0]}
                      {volunteer.id === user?.id && ' (You)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 xs:space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs xs:text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                  <ClockIcon size={14} className="text-gray-500 xs:hidden" />
                  <ClockIcon size={16} className="text-gray-500 hidden xs:block" />
                  {getShiftName(nextShift)} {/* Next */}
                </h3>
                <span className="text-xxs xs:text-xs font-light text-gray-500">{nextShift}</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {nextVolunteers.map(volunteer => volunteer && (
                  <div key={volunteer.id} className="flex items-center px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/50 gap-1.5">
                    <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center text-blue-600 text-xs">
                      {volunteer.name[0]}
                    </div>
                    <span className="text-xs font-light text-gray-800 dark:text-gray-200">
                      {volunteer.name.split(' ')[0]}
                      {volunteer.id === user?.id && ' (You)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tasks and User next shift */}
        <div className="bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-6 border border-gray-200/70 dark:border-gray-700/50 lg:col-span-2">
          <h2 className="text-xl font-extralight text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <ClipboardList size={20} className="text-indigo-500" />
            {t('dashboard.todaysTasks') || "Today's Tasks"}
          </h2>
          {todayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
                <ClipboardList size={24} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-light">{t('dashboard.noTasks') || "No tasks for today"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between rounded-lg p-3 bg-gray-50 dark:bg-gray-800/70 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-10 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <h3 className="text-sm font-medium text-gray-800 dark:text-white">{task.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          task.status === 'todo' ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                          task.status === 'inProgress' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                          'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        } font-light`}>
                          {task.status}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-light flex items-center gap-1">
                          <Clock size={12} />
                          {format(new Date(task.dueDate || new Date()), 'MMM d')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-amber-500 text-sm font-medium">
                    <Award size={16} className="mr-1" />
                    <span>{task.points}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User next shift */}
        <div className="bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-6 border border-gray-200/70 dark:border-gray-700/50">
          <h2 className="text-xl font-extralight text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={20} className="text-teal-500" />
            {t('dashboard.yourNextShift') || "Your Next Shift"}
          </h2>
          
          {userNextShift ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white mb-4">
                <Calendar size={40} />
              </div>
              <h3 className="text-lg font-light text-gray-800 dark:text-white">{userNextShift.date}</h3>
              <p className="text-2xl font-extralight text-gray-700 dark:text-gray-300 mt-2">{userNextShift.shift}</p>
              <div className="mt-6 px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-lg text-sm font-light flex items-center gap-2">
                <Shield size={16} />
                <span>{t('dashboard.dutyConfirmed') || "Duty confirmed"}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
                <Calendar size={24} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-light">
                {t('dashboard.noUpcomingShifts') || "No upcoming shifts found"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 border border-gray-200/70 dark:border-gray-700/50 md:col-span-1">
        <h2 className="text-lg xs:text-xl font-extralight text-gray-800 dark:text-white mb-3 xs:mb-4 flex items-center gap-2">
          <ClipboardList size={18} className="text-blue-500 xs:hidden" />
          <ClipboardList size={20} className="text-blue-500 hidden xs:block" />
          {t('dashboard.tasks') || "Tasks"}
        </h2>
        
        <div className="space-y-2 xs:space-y-3">
          {todayTasks.length > 0 ? (
            todayTasks.map(task => (
              <div 
                key={task.id} 
                className={`flex items-center justify-between p-2.5 xs:p-3 rounded-lg ${
                  task.status === 'done' 
                    ? 'bg-emerald-100/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/20' 
                    : task.status === 'inProgress'
                      ? 'bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/20'
                      : 'bg-gray-100/50 dark:bg-gray-700/20 border border-gray-200 dark:border-gray-700/20'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`w-5 h-5 xs:w-6 xs:h-6 rounded-full flex items-center justify-center ${
                    task.status === 'done'
                      ? 'bg-emerald-500 text-white'
                      : task.status === 'inProgress'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-500 text-white'
                  }`}>
                    {task.status === 'done' 
                      ? <CheckCircle size={12} className="xs:hidden" /> 
                      : task.status === 'inProgress'
                        ? <Activity size={12} className="xs:hidden" />
                        : <AlertCircle size={12} className="xs:hidden" />
                    }
                    {task.status === 'done' 
                      ? <CheckCircle size={14} className="hidden xs:block" /> 
                      : task.status === 'inProgress'
                        ? <Activity size={14} className="hidden xs:block" />
                        : <AlertCircle size={14} className="hidden xs:block" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs xs:text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {task.title}
                    </h4>
                    <p className="text-xxs xs:text-xs font-light text-gray-500 dark:text-gray-400 truncate">
                      {task.description.length > 40 
                        ? task.description.substring(0, 40) + '...' 
                        : task.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <div className="flex items-center gap-1 ml-2 text-amber-500">
                    <Award size={12} className="xs:hidden" />
                    <Award size={14} className="hidden xs:block" />
                    <span className="text-xxs xs:text-xs">{task.points}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 xs:py-6">
              <div className="w-10 h-10 xs:w-12 xs:h-12 mx-auto bg-gray-100 dark:bg-gray-700/30 rounded-full flex items-center justify-center mb-2 xs:mb-3">
                <ClipboardList size={18} className="text-gray-400 xs:hidden" />
                <ClipboardList size={20} className="text-gray-400 hidden xs:block" />
              </div>
              <p className="text-xs xs:text-sm text-gray-500 dark:text-gray-400">
                {t('dashboard.noTasks') || "No tasks for today"}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* User Next Shift */}
      <div className="bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 border border-gray-200/70 dark:border-gray-700/50 md:col-span-1">
        <h2 className="text-lg xs:text-xl font-extralight text-gray-800 dark:text-white mb-3 xs:mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-blue-500 xs:hidden" />
          <Calendar size={20} className="text-blue-500 hidden xs:block" />
          {t('dashboard.yourSchedule') || "Your Schedule"}
        </h2>
        
        <div className="space-y-4">
          <div className="p-3 xs:p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-200/30 dark:border-blue-700/20 space-y-3">
            <h3 className="text-sm xs:text-base font-medium text-blue-800 dark:text-blue-300">
              {t('dashboard.nextShift') || "Your Next Shift"}
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
                {t('dashboard.noUpcomingShifts') || "You don't have any upcoming shifts"}
              </p>
            )}
          </div>
          
          <div>
            <h3 className="text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('dashboard.daysOff') || "Your Days Off"}
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
                  {t('dashboard.noDaysOff') || "No days off this week"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 