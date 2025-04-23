import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { format, isToday, isYesterday, addDays, subDays, startOfWeek, parseISO } from 'date-fns';
import type { Schedule, ShiftTime } from '../types';
import {
  Award,
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

  return (
    <div className="space-y-6 xs:space-y-8">
      {/* User next shift - MOVED TO TOP */}
      <div className="bg-white backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 border border-orange-100 shadow-sm">
        <h2 className="text-lg xs:text-xl font-extralight text-orange-700 mb-3 xs:mb-4 flex items-center gap-2">
          <Clock size={18} className="text-orange-600 xs:hidden" />
          <Clock size={20} className="text-orange-600 hidden xs:block" />
          {t('dashboard.yourNextShift') || "Your Next Shift"}
        </h2>
        
        {userNextShift ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-20 h-20 xs:w-24 xs:h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white mb-4">
              <Calendar size={32} className="xs:hidden" />
              <Calendar size={40} className="hidden xs:block" />
            </div>
            <h3 className="text-md xs:text-lg font-light text-orange-700">{userNextShift.date}</h3>
            <p className="text-xl xs:text-2xl font-extralight text-orange-600 mt-2">{userNextShift.shift}</p>
            <div className="mt-6 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-xs xs:text-sm font-light flex items-center gap-2">
              <Shield size={14} className="xs:hidden" />
              <Shield size={16} className="hidden xs:block" />
              <span>{t('dashboard.dutyConfirmed')}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-400 mb-4">
              <Calendar size={24} />
            </div>
            <p className="text-orange-500 font-light">
              {t('dashboard.noUpcomingShifts')}
            </p>
          </div>
        )}
      </div>

      {/* Today's team section - UPDATED */}
      <div className="bg-white backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 border border-orange-100 shadow-sm">
        <h2 className="text-lg xs:text-xl font-extralight text-orange-700 mb-3 xs:mb-4 flex items-center gap-2">
          <Users size={18} className="text-orange-600 xs:hidden" />
          <Users size={20} className="text-orange-600 hidden xs:block" />
          {t('dashboard.todayTeam') || "Today's Team"}
        </h2>
        
        <div className="space-y-3 xs:space-y-4">
          {/* Last active shift with volunteers */}
          <div className="space-y-2 xs:space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs xs:text-sm font-medium text-orange-700 flex items-center gap-1.5">
                <ClockIcon size={14} className="text-orange-600 xs:hidden" />
                <ClockIcon size={16} className="text-orange-600 hidden xs:block" />
                {t('dashboard.lastActiveShift')}
              </h3>
              <span className="text-xxs xs:text-xs font-light text-orange-500">
                {formatDisplayDate(lastActiveShiftInfo.date)} - {lastActiveShiftInfo.shift}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {lastActiveShiftInfo.volunteers && lastActiveShiftInfo.volunteers.length > 0 ? (
                lastActiveShiftInfo.volunteers.map(volunteer => volunteer && (
                  <div key={volunteer.id} className="flex items-center px-2 py-1 rounded-lg bg-orange-50 gap-1.5">
                    <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs">
                      {volunteer.name[0]}
                    </div>
                    <span className="text-xs font-light text-orange-700">
                      {volunteer.name.split(' ')[0]}
                      {volunteer.id === user?.id && ` (${t('dashboard.you')})`}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-orange-500">{t('dashboard.noVolunteersAssigned')}</span>
              )}
            </div>
          </div>

          {/* Current shift - only show if there are volunteers */}
          {hasCurrentVolunteers && (
            <div className="space-y-2 xs:space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs xs:text-sm font-medium text-orange-700 flex items-center gap-1.5">
                  <ClockIcon size={14} className="text-orange-600 xs:hidden" />
                  <ClockIcon size={16} className="text-orange-600 hidden xs:block" />
                  {getShiftName(currentShift)} {/* Current */}
                </h3>
                <span className="text-xxs xs:text-xs font-medium text-orange-600">{currentShift}</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {currentVolunteers.map(volunteer => volunteer && (
                  <div key={volunteer.id} className="flex items-center px-2 py-1 rounded-lg bg-orange-100 gap-1.5">
                    <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs">
                      {volunteer.name[0]}
                    </div>
                    <span className="text-xs font-medium text-orange-700">
                      {volunteer.name.split(' ')[0]}
                      {volunteer.id === user?.id && ` (${t('dashboard.you')})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next shift with volunteers */}
          <div className="space-y-2 xs:space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs xs:text-sm font-medium text-orange-700 flex items-center gap-1.5">
                <ClockIcon size={14} className="text-orange-600 xs:hidden" />
                <ClockIcon size={16} className="text-orange-600 hidden xs:block" />
                {t('dashboard.nextShiftWithVolunteers')}
              </h3>
              <span className="text-xxs xs:text-xs font-light text-orange-500">
                {formatDisplayDate(nextShiftWithVolunteersInfo.date)} - {nextShiftWithVolunteersInfo.shift}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {nextShiftWithVolunteersInfo.volunteers && nextShiftWithVolunteersInfo.volunteers.length > 0 ? (
                nextShiftWithVolunteersInfo.volunteers.map(volunteer => volunteer && (
                  <div key={volunteer.id} className="flex items-center px-2 py-1 rounded-lg bg-orange-50 gap-1.5">
                    <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs">
                      {volunteer.name[0]}
                    </div>
                    <span className="text-xs font-light text-orange-700">
                      {volunteer.name.split(' ')[0]}
                      {volunteer.id === user?.id && ` (${t('dashboard.you')})`}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-orange-500">{t('dashboard.noVolunteersAssigned')}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weather and Other sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6">
        {/* Weather section */}
        <div className="bg-white backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 border border-orange-100 shadow-sm lg:col-span-1">
          <h2 className="text-lg xs:text-xl font-extralight text-orange-700 mb-3 xs:mb-4 flex items-center gap-2">
            <Sun size={18} className="text-orange-600 xs:hidden" />
            <Sun size={20} className="text-orange-600 hidden xs:block" />
            {t('dashboard.weather.title') || "Beach Conditions"}
          </h2>
          <div className="space-y-3 xs:space-y-4">
            <div className="flex items-center justify-between px-3 xs:px-4 py-2 rounded-lg bg-orange-50 border border-orange-100">
              <div className="flex items-center gap-1.5 xs:gap-2">
                <Thermometer size={16} className="text-orange-600 xs:hidden" />
                <Thermometer size={18} className="text-orange-600 hidden xs:block" />
                <span className="text-orange-700 font-light text-xs xs:text-sm">{t('dashboard.weather.temperature') || "Temperature"}</span>
              </div>
              <span className="font-medium text-orange-700 text-xs xs:text-sm">{weather.temperature}°C</span>
            </div>
            <div className="flex items-center justify-between px-3 xs:px-4 py-2 rounded-lg bg-orange-50 border border-orange-100">
              <div className="flex items-center gap-1.5 xs:gap-2">
                <Wind size={16} className="text-orange-600 xs:hidden" />
                <Wind size={18} className="text-orange-600 hidden xs:block" />
                <span className="text-orange-700 font-light text-xs xs:text-sm">{t('dashboard.weather.windSpeed') || "Wind Speed"}</span>
              </div>
              <span className="font-medium text-orange-700 text-xs xs:text-sm">{weather.windSpeed} km/h</span>
            </div>
            <div className="flex items-center justify-between px-3 xs:px-4 py-2 rounded-lg bg-orange-50 border border-orange-100">
              <div className="flex items-center gap-1.5 xs:gap-2">
                <Waves size={16} className="text-orange-600 xs:hidden" />
                <Waves size={18} className="text-orange-600 hidden xs:block" />
                <span className="text-orange-700 font-light text-xs xs:text-sm">{t('dashboard.weather.waveHeight') || "Wave Height"}</span>
              </div>
              <span className="font-medium text-orange-700 text-xs xs:text-sm">{weather.waveHeight}m</span>
            </div>
            <div className="flex items-center justify-between px-3 xs:px-4 py-2 rounded-lg bg-orange-50 border border-orange-100">
              <div className="flex items-center gap-1.5 xs:gap-2">
                <CloudRain size={16} className="text-orange-600 xs:hidden" />
                <CloudRain size={18} className="text-orange-600 hidden xs:block" />
                <span className="text-orange-700 font-light text-xs xs:text-sm">{t('dashboard.weather.humidity') || "Humidity"}</span>
              </div>
              <span className="font-medium text-orange-700 text-xs xs:text-sm">{weather.humidity}%</span>
            </div>
          </div>
        </div>

        {/* User Schedule */}
        <div className="bg-white backdrop-blur-md rounded-xl p-4 xs:p-5 sm:p-6 border border-orange-100 shadow-sm md:col-span-3">
          <h2 className="text-lg xs:text-xl font-extralight text-orange-700 mb-3 xs:mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-orange-600 xs:hidden" />
            <Calendar size={20} className="text-orange-600 hidden xs:block" />
            {t('dashboard.yourSchedule')}
          </h2>
          
          <div className="space-y-4">
            <div className="p-3 xs:p-4 rounded-lg bg-orange-50 border border-orange-100 space-y-3">
              <h3 className="text-sm xs:text-base font-medium text-orange-700">
                {t('dashboard.nextShiftSimple')}
              </h3>
              
              {userNextShift ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-orange-600 xs:hidden" />
                    <Calendar size={16} className="text-orange-600 hidden xs:block" />
                    <span className="text-xs xs:text-sm text-orange-700">{userNextShift.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-orange-600 xs:hidden" />
                    <Clock size={16} className="text-orange-600 hidden xs:block" />
                    <span className="text-xs xs:text-sm text-orange-700">{userNextShift.shift} ({getShiftName(userNextShift.shift as ShiftTime)})</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs xs:text-sm text-orange-600 font-light">
                  {t('dashboard.noUpcomingShifts')}
                </p>
              )}
            </div>
            
            <div>
              <h3 className="text-xs xs:text-sm font-medium text-orange-700 mb-2">
                {t('dashboard.daysOff')}
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {daysOff.length > 0 ? (
                  daysOff.map((day, index) => (
                    <div 
                      key={index}
                      className="px-3 py-1 rounded-full bg-orange-50 text-xxs xs:text-xs font-light text-orange-700 border border-orange-100"
                    >
                      {format(day, 'EEE, dd MMM')}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-orange-600 font-light">
                    {t('dashboard.noDaysOff')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 