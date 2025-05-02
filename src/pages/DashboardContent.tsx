import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { format, isToday, isYesterday, addDays, subDays, startOfWeek, parseISO, differenceInMinutes } from 'date-fns';
import type { Schedule, ShiftTime, WorkLog } from '../types';
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
  Shield,
  Play,
  Square,
  TimerOff,
  Sunset,
  Sunrise,
  Umbrella,
  WavesIcon
} from 'lucide-react';
import { firestore } from '../config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import * as authService from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

// Definindo um tipo para o usuário para substituir 'any[]'
interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
  shifts?: string[];
  [key: string]: any; // Para compatibilidade com outros campos
}

export default function DashboardContent() {
  const { 
    user, 
    tasks = [], 
    events = [], 
    messages = [], 
    users = [], 
    schedule = {} as Schedule, 
    setUser,
    startShift,
    endShift,
    getActiveShift,
    getUserWorkLogs
  } = useStore();
  const { t } = useTranslation();
  const [isPromoting, setIsPromoting] = useState(false);
  const { loadAllUsers } = useAuth();
  const [isStartingShift, setIsStartingShift] = useState(false);
  const [isEndingShift, setIsEndingShift] = useState(false);
  
  // Estado para controlar o timer do turno ativo
  const [activeTime, setActiveTime] = useState<number | null>(null);
  
  // Estado para controlar o modal de histórico de turnos
  const [showShiftHistory, setShowShiftHistory] = useState(false);
  const [userShiftLogs, setUserShiftLogs] = useState<WorkLog[]>([]);
  
  // Efeito para carregar o turno ativo do usuário, se houver
  useEffect(() => {
    const loadActiveShift = async () => {
      if (user?.id) {
        await getActiveShift();
      }
    };
    
    loadActiveShift();
  }, [user?.id, getActiveShift]);
  
  // Efeito para atualizar o timer do turno ativo
  useEffect(() => {
    if (!user?.activeShift) {
      setActiveTime(null);
      return;
    }
    
    const updateTimer = () => {
      const startTime = parseISO(user.activeShift!.startTime);
      const now = new Date();
      const minutesActive = differenceInMinutes(now, startTime);
      setActiveTime(minutesActive);
    };
    
    // Atualizar o timer imediatamente
    updateTimer();
    
    // Atualizar o timer a cada minuto
    const interval = setInterval(updateTimer, 60000);
    
    return () => clearInterval(interval);
  }, [user?.activeShift]);
  
  // Manipulador para iniciar um turno
  const handleStartShift = async () => {
    if (!user) return;
    
    setIsStartingShift(true);
    try {
      const currentShift = getCurrentShift();
      const result = await startShift(currentShift);
      
      if (result) {
        // Se o resultado contém forceClosed, significa que um turno anterior foi fechado automaticamente
        if (result.forceClosed) {
          toast.success(t('notifications.previousShiftClosed'), {
            duration: 3000,
            position: 'top-center',
            icon: '⏱️'
          });
          // Um pequeno atraso para o usuário ver ambas as notificações
          setTimeout(() => {
            toast.success(t('notifications.shiftStarted'), {
              duration: 3000,
              position: 'top-center',
              icon: '🏄‍♂️'
            });
          }, 1000);
        } else {
          toast.success(t('notifications.shiftStarted'), {
            duration: 3000,
            position: 'top-center',
            icon: '🏄‍♂️'
          });
        }
        console.log('Turno iniciado com sucesso:', result);
      } else {
        toast.error(t('notifications.shiftStartFailed'), {
          duration: 3000,
          position: 'top-center'
        });
        console.error('Falha ao iniciar turno');
      }
    } catch (error) {
      console.error('Erro ao iniciar turno:', error);
      toast.error(t('notifications.shiftStartFailed'), {
        duration: 3000,
        position: 'top-center'
      });
    } finally {
      setIsStartingShift(false);
    }
  };
  
  // Manipulador para finalizar um turno
  const handleEndShift = async () => {
    if (!user) return;
    
    setIsEndingShift(true);
    try {
      const result = await endShift();
      
      if (result) {
        toast.success(t('notifications.shiftEnded'), {
          duration: 3000,
          position: 'top-center',
          icon: '🌊'
        });
        console.log('Turno finalizado com sucesso:', result);
      } else {
        toast.error(t('notifications.shiftEndFailed'), {
          duration: 3000,
          position: 'top-center'
        });
        console.error('Falha ao finalizar turno');
      }
    } catch (error) {
      console.error('Erro ao finalizar turno:', error);
      toast.error(t('notifications.shiftEndFailed'), {
        duration: 3000,
        position: 'top-center'
      });
    } finally {
      setIsEndingShift(false);
    }
  };
  
  // Formatar o tempo ativo em horas e minutos
  const formatActiveTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    
    return `${mins}m`;
  };

  // Carrega todos os usuários quando o componente é montado
  useEffect(() => {
    const fetchUsers = async () => {
      console.log('Carregando usuários no Dashboard...');
      try {
        const loadedUsers = await loadAllUsers();
        console.log(`${loadedUsers.length} usuários carregados no Dashboard`);
      } catch (error) {
        console.error('Erro ao carregar usuários no Dashboard:', error);
      }
    };
    
    fetchUsers();
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
    
    const allShifts: ShiftTime[] = ['09:00-12:00', '14:00-17:00', '19:00-22:00'];
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
    
    if (hour >= 9 && hour < 12) return '09:00-12:00';
    if (hour >= 14 && hour < 17) return '14:00-17:00';
    if (hour >= 19 && hour < 22) return '19:00-22:00';
    
    // Default to morning shift during other hours
    return '09:00-12:00';
  };

  const currentShift = getCurrentShift();
  
  // Função para encontrar o último turno com voluntários independente de quando ocorreu
  const getLastActiveShift = (): { shift: ShiftTime, date: string, volunteers: UserType[] } => {
    const today = new Date();
    const allShifts: ShiftTime[] = ['09:00-12:00', '14:00-17:00', '19:00-22:00'];
    
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
                .filter(Boolean)
                .map(u => ({ ...u!, role: u!.role || 'volunteer' } as UserType));
              
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
              .filter(Boolean)
              .map(u => ({ ...u!, role: u!.role || 'volunteer' } as UserType));
            
            if (volunteers.length > 0) {
              return { shift, date: dateStr, volunteers };
            }
          }
        }
      }
    }
    
    // Se não encontrou nenhum, retorna um valor padrão
    return { 
      shift: '09:00-12:00', 
      date: format(today, 'yyyy-MM-dd'), 
      volunteers: [] 
    };
  };

  // Função para encontrar o próximo turno com voluntários
  const getNextShiftWithVolunteers = (): { shift: ShiftTime, date: string, volunteers: UserType[] } => {
    const today = new Date();
    const allShifts: ShiftTime[] = ['09:00-12:00', '14:00-17:00', '19:00-22:00'];
    
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
                .filter(Boolean)
                .map(u => ({ ...u!, role: u!.role || 'volunteer' } as UserType));
              
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
              .filter(Boolean)
              .map(u => ({ ...u!, role: u!.role || 'volunteer' } as UserType));
            
            if (volunteers.length > 0) {
              return { shift, date: dateStr, volunteers };
            }
          }
        }
      }
    }
    
    // Se não encontrou nenhum, retorna um valor padrão
    return { 
      shift: '09:00-12:00', 
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
      .filter(Boolean)
      .map(u => ({ ...u!, role: u!.role || 'volunteer' } as UserType)); // Remove undefined/null values
    
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
      case '09:00-12:00': return t('schedule.shifts.morning');
      case '14:00-17:00': return t('schedule.shifts.midMorning');
      case '19:00-22:00': return t('schedule.shifts.evening');
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

  // Carregar histórico de turnos do usuário
  const loadUserShiftHistory = async () => {
    if (!user?.id) return;
    
    try {
      console.log(`Carregando histórico de turnos para ${user.id}`);
      const logs = await getUserWorkLogs(user.id);
      console.log(`Logs carregados: ${logs.length}`);
      setUserShiftLogs(logs);
      setShowShiftHistory(true);
    } catch (error) {
      console.error('Erro ao carregar histórico de turnos:', error);
      toast.error(t('common.errorLoading'), {
        duration: 3000,
        position: 'top-center'
      });
    }
  };
  
  // Formatar data
  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Formatar hora
  const formatTime = (timeString: string): string => {
    try {
      return format(parseISO(timeString), 'HH:mm');
    } catch (error) {
      return timeString;
    }
  };
  
  // Formattar minutos para horas e minutos
  const formatMinutesToHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    }
    
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  return (
    <div className="space-y-6">
      {/* Seção para controle de turno - MOVIDA PARA O TOPO */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl p-5 shadow-lg border border-blue-700/50 relative overflow-hidden">
        {/* Decoração em estilo surf */}
        <div className="absolute -right-6 -top-6 text-blue-500/20 transform rotate-12">
          <Sunset size={100} />
        </div>
        <div className="absolute -left-5 bottom-0 text-blue-500/10 transform">
          <Waves size={80} />
        </div>
        
        <div className="relative z-10">
          <h2 className="text-xl font-medium text-blue-300 mb-4 flex items-center drop-shadow-md">
            <WavesIcon size={20} className="mr-2 text-blue-400" />
            {t('dashboard.shiftControl')}
          </h2>
          
          <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-lg p-5 border border-blue-800/50 shadow-inner">
            {user?.activeShift ? (
              <>
                <div className="mb-4">
                  <p className="text-green-400 font-medium flex items-center text-lg">
                    <Activity size={18} className="mr-2" />
                    {t('dashboard.activeShift')}
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                      <span className="text-gray-400 text-sm block mb-1">{t('dashboard.startedAt')}:</span>
                      <span className="text-white text-lg font-medium">
                        {format(parseISO(user.activeShift.startTime), 'HH:mm')}
                      </span>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                      <span className="text-gray-400 text-sm block mb-1">{t('dashboard.currentShift')}:</span>
                      <span className="text-white text-lg font-medium">{getShiftName(user.activeShift.shiftTime)}</span>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                      <span className="text-gray-400 text-sm block mb-1">{t('dashboard.timeActive')}:</span>
                      <span className="text-white text-lg font-medium">
                        {activeTime !== null ? formatActiveTime(activeTime) : '--:--'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center mt-3">
                  <div className="text-amber-500 font-medium flex items-center">
                    <ClockIcon size={14} className="mr-1" />
                    {t('dashboard.activeFor')}: {activeTime !== null ? formatActiveTime(activeTime) : '--:--'}
                  </div>
                  <button
                    onClick={handleEndShift}
                    disabled={isEndingShift}
                    className="ml-3 flex items-center justify-center h-8 px-3 rounded-md bg-red-600/80 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEndingShift ? (
                      <>
                        <div className="h-3 w-3 border-2 border-white/60 border-t-transparent rounded-full animate-spin mr-1"></div>
                        {t('dashboard.processing')}
                      </>
                    ) : (
                      <>
                        <Square size={12} className="mr-1" />
                        {t('dashboard.endShift')}
                      </>
                    )}
                  </button>
                  <button 
                    onClick={loadUserShiftHistory}
                    className="ml-2 flex items-center justify-center h-8 px-3 rounded-md bg-blue-600/80 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                  >
                    <ClipboardList size={12} className="mr-1" />
                    {t('workHours.shiftHistory')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 flex-shrink-0 bg-blue-900/60 rounded-lg flex items-center justify-center text-blue-300 mr-3">
                    <Sunrise size={22} />
                  </div>
                  <p className="text-gray-300">{t('dashboard.noActiveShift')}</p>
                </div>
                <div className="flex items-center mt-3">
                  <button
                    onClick={handleStartShift}
                    disabled={isStartingShift}
                    className="flex items-center justify-center h-8 px-3 rounded-md bg-green-600/80 hover:bg-green-700 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStartingShift ? (
                      <>
                        <div className="h-3 w-3 border-2 border-white/60 border-t-transparent rounded-full animate-spin mr-1"></div>
                        {t('dashboard.processing')}
                      </>
                    ) : (
                      <>
                        <Play size={12} className="mr-1" />
                        {t('dashboard.startShift')}
                      </>
                    )}
                  </button>
                  <button 
                    onClick={loadUserShiftHistory}
                    className="ml-2 flex items-center justify-center h-8 px-3 rounded-md bg-blue-600/80 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                  >
                    <ClipboardList size={12} className="mr-1" />
                    {t('workHours.shiftHistory')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Weather conditions - Estilo surf */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-5 shadow-lg border border-gray-700/50 relative overflow-hidden">
        <div className="absolute -right-6 top-0 text-yellow-500/10 transform">
          <Sun size={80} />
        </div>
        <div className="absolute left-0 -bottom-8 text-blue-500/10 transform">
          <Waves size={100} />
        </div>
        
        <div className="relative z-10">
          <h2 className="text-lg font-medium text-blue-300 mb-3 flex items-center">
            <Waves size={18} className="mr-2" />
            {t('dashboard.weather.title')}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-lg border border-blue-900/30 shadow-inner flex items-center">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center text-yellow-500 mr-3">
                <Thermometer size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{t('dashboard.weather.temperature')}</p>
                <p className="text-lg font-medium text-white">{weather.temperature}°C</p>
              </div>
            </div>
            
            <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-lg border border-blue-900/30 shadow-inner flex items-center">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-500 mr-3">
                <Wind size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{t('dashboard.weather.windSpeed')}</p>
                <p className="text-lg font-medium text-white">{weather.windSpeed} km/h</p>
              </div>
            </div>
            
            <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-lg border border-blue-900/30 shadow-inner flex items-center">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-500 mr-3">
                <Waves size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{t('dashboard.weather.waveHeight')}</p>
                <p className="text-lg font-medium text-white">{weather.waveHeight}m</p>
              </div>
            </div>
            
            <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-lg border border-blue-900/30 shadow-inner flex items-center">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-600 mr-3">
                <CloudRain size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{t('dashboard.weather.humidity')}</p>
                <p className="text-lg font-medium text-white">{weather.humidity}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Next shift and today's team - com estilo surf */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 shadow-lg border border-gray-700/50 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-blue-500/10 transform rotate-12">
            <Calendar size={80} />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-lg font-medium text-blue-300 mb-3 flex items-center">
              <Calendar size={18} className="mr-2" />
              {t('dashboard.yourNextShift')}
            </h2>
            
            {userNextShift ? (
              <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-lg border border-blue-900/30 shadow-inner">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 bg-blue-900/60 rounded-lg flex items-center justify-center text-blue-400 mr-3">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium">{userNextShift.date}</p>
                    <p className="text-sm text-gray-400">{getShiftName(userNextShift.shift)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-lg border border-blue-900/30 shadow-inner">
                <p className="text-gray-400 text-sm">{t('dashboard.noShiftsScheduled')}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Dias de folga do usuário */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 shadow-lg border border-gray-700/50 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-blue-500/10 transform rotate-12">
            <Umbrella size={80} />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-lg font-medium text-blue-300 mb-3 flex items-center">
              <Umbrella size={18} className="mr-2" />
              {t('dashboard.daysOff')}
            </h2>
            
            <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-lg border border-blue-900/30 shadow-inner max-h-32 overflow-y-auto scrollbar-thin">
              {daysOff.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {daysOff.map((day, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-lg bg-blue-900/40 text-sm text-blue-300 border border-blue-900/60"
                    >
                      {format(day, 'EEE, dd MMM')}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">{t('dashboard.noDaysOff')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Today's team - mostrar todos os turnos */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 shadow-lg border border-gray-700/50 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 text-blue-500/10 transform rotate-12">
          <Users size={80} />
        </div>
        
        <div className="relative z-10">
          <h2 className="text-lg font-medium text-blue-300 mb-3 flex items-center">
            <Users size={18} className="mr-2" />
            {t('dashboard.todayTeam')}
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Turno da Manhã */}
            <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-lg border border-blue-900/30 shadow-inner">
              <h3 className="text-sm font-medium text-white mb-2 flex items-center">
                <Sunrise size={16} className="mr-2 text-yellow-400" />
                {t('schedule.shifts.morning')}
              </h3>
              
              <div className="max-h-32 overflow-y-auto scrollbar-thin">
                {getShiftVolunteers('09:00-12:00').length > 0 ? (
                  <div className="space-y-2">
                    {getShiftVolunteers('09:00-12:00').map(volunteer => (
                      <div key={volunteer.id} className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-white font-medium shadow-md mr-2">
                          {volunteer.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm text-gray-300">
                          {volunteer.name} {volunteer.id === user?.id ? `(${t('dashboard.you')})` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">{t('dashboard.noVolunteersAssigned')}</p>
                )}
              </div>
            </div>
            
            {/* Turno da Tarde */}
            <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-lg border border-blue-900/30 shadow-inner">
              <h3 className="text-sm font-medium text-white mb-2 flex items-center">
                <Sun size={16} className="mr-2 text-amber-400" />
                {t('schedule.shifts.midMorning')}
              </h3>
              
              <div className="max-h-32 overflow-y-auto scrollbar-thin">
                {getShiftVolunteers('14:00-17:00').length > 0 ? (
                  <div className="space-y-2">
                    {getShiftVolunteers('14:00-17:00').map(volunteer => (
                      <div key={volunteer.id} className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-white font-medium shadow-md mr-2">
                          {volunteer.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm text-gray-300">
                          {volunteer.name} {volunteer.id === user?.id ? `(${t('dashboard.you')})` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">{t('dashboard.noVolunteersAssigned')}</p>
                )}
              </div>
            </div>
            
            {/* Turno da Noite */}
            <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-lg border border-blue-900/30 shadow-inner">
              <h3 className="text-sm font-medium text-white mb-2 flex items-center">
                <Sunset size={16} className="mr-2 text-orange-400" />
                {t('schedule.shifts.evening')}
              </h3>
              
              <div className="max-h-32 overflow-y-auto scrollbar-thin">
                {getShiftVolunteers('19:00-22:00').length > 0 ? (
                  <div className="space-y-2">
                    {getShiftVolunteers('19:00-22:00').map(volunteer => (
                      <div key={volunteer.id} className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-white font-medium shadow-md mr-2">
                          {volunteer.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm text-gray-300">
                          {volunteer.name} {volunteer.id === user?.id ? `(${t('dashboard.you')})` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">{t('dashboard.noVolunteersAssigned')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Today's tasks - com estilo surf */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 shadow-lg border border-gray-700/50 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 text-blue-500/10 transform rotate-12">
          <ClipboardList size={80} />
        </div>
        
        <div className="relative z-10">
          <h2 className="text-lg font-medium text-blue-300 mb-3 flex items-center">
            <ClipboardList size={18} className="mr-2" />
            {t('dashboard.todaysTasks')}
          </h2>
          
          <div className="bg-gray-800/60 backdrop-blur-sm p-1 rounded-lg border border-blue-900/30 shadow-inner max-h-60 overflow-y-auto scrollbar-thin">
            {todayTasks.length > 0 ? (
              <div className="divide-y divide-gray-700/50">
                {todayTasks.map(task => (
                  <div key={task.id} className="p-3 hover:bg-gray-700/30 rounded-md">
                    <div className="flex items-start">
                      <div className={`w-2 h-2 rounded-full mt-2 mr-2 ${
                        task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-200">{task.title}</h3>
                        <p className="text-xs text-gray-400">{task.description.substring(0, 60)}{task.description.length > 60 ? '...' : ''}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-blue-400 flex items-center">
                            <Award size={12} className="mr-1" />
                            {task.points} pts
                          </span>
                          <span className="mx-2 text-gray-600">•</span>
                          <span className="text-xs text-gray-500">
                            {task.status === 'todo' ? t('todo') : 
                            task.status === 'inProgress' ? t('inProgress') : t('done')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3">
                <p className="text-gray-400 text-sm">{t('dashboard.noTasks')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    
    {/* Modal de Histórico de Turnos */}
    {showShiftHistory && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-medium text-blue-300 flex items-center">
              <User size={18} className="mr-2" />
              {user?.name}
            </h3>
            <button
              onClick={() => setShowShiftHistory(false)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            >
              &times;
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto flex-1">
            <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
              <Calendar size={14} className="mr-1" />
              {t('workHours.shiftHistory')}
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-2 px-3 text-xs text-gray-400 font-medium">{t('workHours.date')}</th>
                    <th className="py-2 px-3 text-xs text-gray-400 font-medium">{t('workHours.shift')}</th>
                    <th className="py-2 px-3 text-xs text-gray-400 font-medium">{t('workHours.startTime')}</th>
                    <th className="py-2 px-3 text-xs text-gray-400 font-medium">{t('workHours.endTime')}</th>
                    <th className="py-2 px-3 text-xs text-gray-400 font-medium">{t('workHours.duration')}</th>
                  </tr>
                </thead>
                <tbody>
                  {userShiftLogs.map(log => (
                    <tr key={log.id} className="border-b border-gray-700">
                      <td className="py-2 px-3 text-sm">{formatDate(log.shiftDate)}</td>
                      <td className="py-2 px-3 text-sm">{log.shiftTime}</td>
                      <td className="py-2 px-3 text-sm">{formatTime(log.startTime)}</td>
                      <td className="py-2 px-3 text-sm">
                        {log.endTime ? formatTime(log.endTime) : '-'}
                      </td>
                      <td className="py-2 px-3 text-sm">
                        {log.totalMinutes ? formatMinutesToHours(log.totalMinutes) : '-'}
                      </td>
                    </tr>
                  ))}
                  
                  {userShiftLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-400 text-sm">
                        {t('workHours.noShifts')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => setShowShiftHistory(false)}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              {t('workHours.close')}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
} 