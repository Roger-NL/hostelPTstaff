import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { format, addDays, startOfWeek, parse, isSameDay, startOfMonth, getMonth, isWeekend, parseISO } from 'date-fns';
import { pt, ptBR, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, ChevronDown, Info, FileText, ArrowLeft, Users } from 'lucide-react';
import type { ShiftTime } from '../types';
import SimpleDatePicker from '../components/SimpleDatePicker';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SHIFTS: ShiftTime[] = [
  '08:00-11:00',
  '10:00-13:00',
  '13:00-16:00',
  '16:00-19:00',
  '19:00-22:00'
];

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (volunteerId: string) => void;
  volunteers: Array<{ id: string; name: string; role: string; }>;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  volunteerName: string;
}

interface ScheduleData {
  [date: string]: {
    [shift in ShiftTime]?: string[];
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  shifts?: string[];
  [key: string]: any; // Para outros campos que possam existir
}

interface ScheduleSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekDays: Date[];
  schedule: ScheduleData;
  users: User[];
  shifts: ShiftTime[];
}

function ConfirmationModal({ isOpen, onClose, onConfirm, volunteerName }: ConfirmationModalProps) {
  // Emit event to control sidebar visibility
  useEffect(() => {
    const event = new CustomEvent('modalStateChange', { detail: { isOpen } });
    window.dispatchEvent(event);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
      />
      <div className="relative w-[85%] sm:w-[400px] bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-orange-100">
          <h3 className="text-lg font-semibold text-orange-700 mb-2 text-center">Atenção</h3>
          <p className="text-orange-600 text-sm text-center">
            {volunteerName} já foi adicionado 5 vezes esta semana
          </p>
        </div>
        <div className="flex flex-col gap-2 p-4">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition text-sm font-medium"
          >
            Confirmar
          </button>
          <button
            onClick={() => onClose()}
            className="w-full px-4 py-3 bg-white text-orange-600 rounded-xl hover:bg-orange-50 transition text-sm font-medium border border-orange-100"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function VolunteerModal({ isOpen, onClose, onSelect, volunteers }: ModalProps) {
  // Emit event to control sidebar visibility
  useEffect(() => {
    const event = new CustomEvent('modalStateChange', { detail: { isOpen } });
    window.dispatchEvent(event);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
      />
      <div className="relative w-[85%] sm:w-[400px] bg-white rounded-2xl shadow-lg overflow-hidden max-h-[80vh]">
        <div className="p-4 border-b border-orange-100">
          <h3 className="text-lg font-semibold text-orange-700 text-center">Selecionar Voluntário</h3>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {volunteers.length === 0 ? (
            <p className="text-orange-500 text-center py-6 text-sm">Nenhum voluntário disponível</p>
          ) : (
            <div className="divide-y divide-orange-100">
              {volunteers.map(volunteer => (
                <button
                  key={volunteer.id}
                  onClick={() => {
                    onSelect(volunteer.id);
                  }}
                  className="w-full p-4 text-left text-orange-700 hover:bg-orange-50 transition-colors flex items-center justify-between"
                >
                  <span>{volunteer.name}</span>
                  {volunteer.role === 'admin' && (
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full">Admin</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-orange-100">
          <button
            onClick={() => {
              onClose();
            }}
            className="w-full px-4 py-3 bg-white text-orange-600 rounded-xl hover:bg-orange-50 transition text-sm font-medium border border-orange-100"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleSummaryModal({ isOpen, onClose, weekDays, schedule, users, shifts }: ScheduleSummaryModalProps) {
  const { t, language } = useTranslation();
  
  useEffect(() => {
    const event = new CustomEvent('modalStateChange', { detail: { isOpen } });
    window.dispatchEvent(event);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Create a map of volunteer schedules
  const volunteerSchedules = users.map(user => {
    const workingDays: { date: Date; shifts: ShiftTime[] }[] = [];
    
    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayShifts: ShiftTime[] = [];
      
      shifts.forEach(shift => {
        const volunteers = schedule[dateStr]?.[shift] || [];
        if (volunteers.includes(user.id)) {
          dayShifts.push(shift);
        }
      });
      
      if (dayShifts.length > 0) {
        workingDays.push({ date: day, shifts: dayShifts });
      }
    });
    
    return {
      user,
      workingDays,
      daysOff: weekDays.filter(day => 
        !workingDays.some(workDay => isSameDay(workDay.date, day))
      )
    };
  }).filter(item => item.workingDays.length > 0); // Only include volunteers with shifts

  const labels = {
    title: language === 'pt' ? 'Resumo da Escala Semanal' : 'Weekly Schedule Summary',
    name: language === 'pt' ? 'Nome' : 'Name',
    workingDays: language === 'pt' ? 'Dias de Trabalho' : 'Working Days',
    daysOff: language === 'pt' ? 'Dias de Folga' : 'Days Off',
    shifts: language === 'pt' ? 'Turnos' : 'Shifts',
    close: language === 'pt' ? 'Fechar' : 'Close',
    date: language === 'pt' ? 'Data' : 'Date',
    noSchedule: language === 'pt' ? 'Nenhum voluntário escalado esta semana' : 'No volunteers scheduled this week'
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-[90%] max-w-4xl max-h-[85vh] bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText size={20} className="text-blue-400" />
            {labels.title}
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto">
          {volunteerSchedules.length === 0 ? (
            <p className="text-white/60 text-center py-8">{labels.noSchedule}</p>
          ) : (
            <div className="space-y-6">
              {volunteerSchedules.map(({ user, workingDays, daysOff }) => (
                <div key={user.id} className="bg-white/5 rounded-xl p-4">
                  <h4 className="text-lg font-medium text-white mb-3 pb-2 border-b border-white/10 flex items-center justify-between">
                    {user.name}
                    <span className={`text-xs px-2.5 py-1 rounded-full ${user.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {user.role === 'admin' ? 'Admin' : 'Volunteer'}
                    </span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Working Days */}
                    <div>
                      <h5 className="text-sm font-medium text-white/80 mb-2 flex items-center gap-1.5">
                        <CalendarIcon size={14} className="text-blue-400" />
                        {labels.workingDays}
                      </h5>
                      
                      <div className="space-y-2 mt-2">
                        {workingDays.map(({ date, shifts }) => (
                          <div key={date.toString()} className="bg-white/5 rounded-lg p-3">
                            <p className="text-white text-sm font-medium mb-1">
                              {format(date, language === 'pt' ? 'EEEE, d MMM' : 'EEEE, MMM d', { locale: language === 'pt' ? pt : undefined })}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {shifts.map(shift => (
                                <span key={shift} className="text-xs bg-blue-500/15 text-blue-300 px-2 py-1 rounded-md">
                                  {shift}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Days Off */}
                    <div>
                      <h5 className="text-sm font-medium text-white/80 mb-2 flex items-center gap-1.5">
                        <CalendarIcon size={14} className="text-emerald-400" />
                        {labels.daysOff}
                      </h5>
                      
                      <div className="bg-white/5 rounded-lg p-3">
                        {daysOff.length > 0 ? (
                          <div className="space-y-1.5">
                            {daysOff.map(day => (
                              <p key={day.toString()} className="text-white/80 text-sm">
                                {format(day, language === 'pt' ? 'EEEE, d MMM' : 'EEEE, MMM d', { locale: language === 'pt' ? pt : undefined })}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-white/60 text-sm italic">
                            {language === 'pt' ? 'Sem dias de folga' : 'No days off'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-white/10 mt-auto">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition text-sm font-medium"
          >
            {labels.close}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Schedule() {
  const { users, schedule, assignShift, removeShift, user, language } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState<'week' | 'month'>('week');
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    date?: Date;
    shift?: ShiftTime;
    pendingVolunteerId?: string;
    volunteerName: string;
  }>({
    isOpen: false,
    volunteerName: ''
  });
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    volunteerName: string;
  }>({ isOpen: false, volunteerName: '' });
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const dateOptionsRef = useRef<HTMLDivElement>(null);
  
  const volunteers = users;
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(selectedWeek, i));

  const handlePreviousWeek = () => {
    setSelectedWeek(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setSelectedWeek(prev => addDays(prev, 7));
  };

  const getVolunteerName = (volunteerId: string) => {
    return users.find(user => user.id === volunteerId)?.name || 'Unknown';
  };

  const getShiftAssignment = (date: Date, shift: ShiftTime) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const shiftData = schedule[dateStr]?.[shift];
    return Array.isArray(shiftData) ? shiftData : [];
  };

  const countVolunteerShifts = (volunteerId: string): number => {
    let count = 0;
    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      SHIFTS.forEach(shift => {
        const volunteers = schedule[dateStr]?.[shift] || [];
        if (volunteers.includes(volunteerId)) {
          count++;
        }
      });
    });
    return count;
  };

  const handleAssignShift = (volunteerId: string) => {
    if (modalState.date && modalState.shift) {
      const shiftCount = countVolunteerShifts(volunteerId);
      const volunteerName = getVolunteerName(volunteerId);

      if (shiftCount >= 5) {
        setModalState(prev => ({ ...prev, pendingVolunteerId: volunteerId, volunteerName }));
        setConfirmationModal({
          isOpen: true,
          volunteerName
        });
      } else {
        const dateStr = format(modalState.date, 'yyyy-MM-dd');
        assignShift(dateStr, modalState.shift, volunteerId);
        setModalState({ isOpen: false, volunteerName: '' });
      }
    }
  };

  const handleConfirmAssignment = () => {
    if (modalState.date && modalState.shift && modalState.pendingVolunteerId) {
      const dateStr = format(modalState.date, 'yyyy-MM-dd');
      const volunteerName = getVolunteerName(modalState.pendingVolunteerId);
      
      // Mostrar toast de carregamento
      toast.loading(`Atribuindo ${volunteerName.split(' ')[0]} ao turno ${modalState.shift}...`, { 
        id: `assign-${modalState.pendingVolunteerId}-${modalState.shift}`
      });
      
      // Chamar a função de atribuir
      assignShift(dateStr, modalState.shift, modalState.pendingVolunteerId);
      
      // Atualizar o toast para sucesso após um período curto
      setTimeout(() => {
        toast.success(`${volunteerName.split(' ')[0]} atribuído(a) ao turno ${modalState.shift}`, { 
          id: `assign-${modalState.pendingVolunteerId}-${modalState.shift}`,
          duration: 2000
        });
      }, 1000);
      
      setModalState({ isOpen: false, volunteerName: '' });
    }
  };

  const handleRemoveShift = (date: Date, shift: ShiftTime, volunteerId: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const volunteerName = getVolunteerName(volunteerId);
    
    // Mostrar toast de carregamento
    toast.loading(`Removendo ${volunteerName.split(' ')[0]} do turno ${shift}...`, { 
      id: `remove-${volunteerId}-${shift}` 
    });
    
    // Chamar a função de remover
    removeShift(dateStr, shift, volunteerId);
    
    // Atualizar o toast para sucesso após um período curto
    setTimeout(() => {
      toast.success(`${volunteerName.split(' ')[0]} removido(a) do turno ${shift}`, { 
        id: `remove-${volunteerId}-${shift}`,
        duration: 2000
      });
    }, 1000);
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      volunteerName: ''
    });
  };

  const handleConfirmationClose = () => {
    setConfirmationModal({
      isOpen: false,
      volunteerName: ''
    });
  };

  // Função para lidar com a mudança de data
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setSelectedWeek(startOfWeek(date, { weekStartsOn: 1 }));
      setDatePickerOpen(false);
    }
  };

  const datePickerRef = useRef<HTMLDivElement>(null);
  
  // Adicionar variável para armazenar a posição do calendário
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  
  // Atualizar useEffect para calcular a posição correta do calendário quando aberto
  useEffect(() => {
    if (datePickerOpen && datePickerRef.current) {
      // Obter as dimensões e posições necessárias
      const buttonRect = document.querySelector('.calendar-button')?.getBoundingClientRect();
      if (!buttonRect) return;
      
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const pickerWidth = Math.min(300, viewportWidth * 0.9);
      
      // Calcular posição horizontal (centralizado abaixo do botão)
      let left = buttonRect.left + (buttonRect.width / 2) - (pickerWidth / 2);
      
      // Garantir que não ultrapasse os limites da tela horizontalmente
      if (left < 10) left = 10;
      if (left + pickerWidth > viewportWidth - 10) left = viewportWidth - pickerWidth - 10;
      
      // Calcular posição vertical (abaixo ou acima do botão)
      let top = buttonRect.bottom + 5;
      
      // Se não couber abaixo, posicionar acima
      const pickerHeight = 300; // altura estimada
      if (top + pickerHeight > viewportHeight - 10) {
        top = buttonRect.top - pickerHeight - 5;
      }
      
      setPickerPosition({ top, left });
    }
  }, [datePickerOpen]);

  // Adicionar event listener para fechar o datepicker quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setDatePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [activeMobileDay, setActiveMobileDay] = useState(0); // Índice do dia ativo na visualização móvel
  
  // Detectar tamanho da tela para alternar entre visualizações
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Função para ir para hoje
  const goToToday = () => {
    const today = new Date();
    setSelectedWeek(startOfWeek(today, { weekStartsOn: 1 }));
    setSelectedDate(today);
    setShowDateOptions(false);
  };

  // Função para ir para próxima semana
  const goToNextWeek = () => {
    setSelectedWeek(prev => addDays(prev, 7));
    setShowDateOptions(false);
  };

  // Função para ir para semana anterior
  const goToPreviousWeek = () => {
    setSelectedWeek(prev => addDays(prev, -7));
    setShowDateOptions(false);
  };

  // Fechar menu de opções de data ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateOptionsRef.current && !dateOptionsRef.current.contains(event.target as Node)) {
        setShowDateOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Definição de variáveis de estado para a interface
  const [visibleRange, setVisibleRange] = useState({
    start: selectedWeek,
    end: addDays(selectedWeek, 6)
  });
  
  // Função para navegar para a semana/mês anterior
  const handlePrevious = () => {
    if (currentViewMode === 'week') {
      handlePreviousWeek();
    } else {
      // Lógica para mês anterior
      setSelectedWeek(addDays(selectedWeek, -30));
    }
  };
  
  // Função para navegar para a próxima semana/mês
  const handleNext = () => {
    if (currentViewMode === 'week') {
      handleNextWeek();
    } else {
      // Lógica para próximo mês
      setSelectedWeek(addDays(selectedWeek, 30));
    }
  };
  
  // Função para ir para hoje
  const handleToday = () => {
    goToToday();
  };
  
  // Atualizar o visibleRange quando o selectedWeek mudar
  useEffect(() => {
    setVisibleRange({
      start: selectedWeek,
      end: addDays(selectedWeek, currentViewMode === 'week' ? 6 : 29)
    });
  }, [selectedWeek, currentViewMode]);
  
  // Definir os dias mostrados com base no modo de visualização
  const days = useMemo(() => {
    if (currentViewMode === 'week') {
      return Array.from({ length: 7 }, (_, i) => addDays(selectedWeek, i));
    } else {
      // Lógica para visualização mensal
      const start = startOfWeek(startOfMonth(selectedWeek), { weekStartsOn: 1 });
      return Array.from({ length: 42 }, (_, i) => addDays(start, i));
    }
  }, [selectedWeek, currentViewMode]);
  
  // Obter nomes dos dias da semana
  const daysOfWeek = useMemo(() => {
    const locale = language === 'pt' ? 'pt-BR' : 'en-US';
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
      return format(day, 'EEEE', { locale: locale === 'pt-BR' ? ptBR : enUS });
    });
  }, [language]);
  
  // Variáveis para a visualização do mês
  const month = getMonth(selectedWeek);
  const rows = Math.ceil(days.length / 7);
  
  const getShiftName = (shift: string) => {
    // Função para obter o nome do turno formatado
    const [start, end] = shift.split('-');
    return `${start}h-${end}h`;
  };
  
  // Função para verificar se é administrador
  const isAdmin = user?.role === 'admin';
  
  // Estado para modal de gerenciamento de voluntários
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedDateShift, setSelectedDateShift] = useState<{ date: string, shift: ShiftTime } | null>(null);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  
  // Função para abrir modal de gerenciamento
  const handleManageVolunteers = (date: string, shift: ShiftTime) => {
    setSelectedDateShift({ date, shift });
    setSelectedVolunteers(schedule[date]?.[shift] || []);
    setShowManageModal(true);
  };
  
  // Função para adicionar voluntário
  const handleAddVolunteer = (date: Date) => {
    setModalState({
      isOpen: true,
      date: date,
      shift: SHIFTS[0],
      volunteerName: ''
    });
  };

  return (
    <div className="bg-gradient-to-br from-gray-950 to-gray-900 text-white h-screen flex flex-col">
      <div className="max-w-7xl mx-auto px-2 py-1 w-full flex-1 flex flex-col">
        {/* Page Header - muito compacto */}
        <div className="mb-2">
          <h1 className="text-xl font-bold text-white">{t('schedule.title')}</h1>
        </div>
        
        {/* Navigation Controls - simplificado */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <div className="flex bg-gray-800 rounded-lg p-0.5">
              <button 
                onClick={handlePrevious}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <ChevronLeft size={18} />
              </button>
              
              <button 
                onClick={handleToday}
                className="px-2 py-1 rounded-lg bg-blue-600 text-white mx-1 text-sm"
              >
                {t('today')}
              </button>
              
              <button 
                onClick={handleNext}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            
            <div className="ml-2 text-base font-medium text-white">
              {visibleRange.start && format(visibleRange.start, 'MMMM yyyy')}
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="flex bg-gray-800 rounded-lg p-0.5">
              <button 
                onClick={() => setCurrentViewMode('week')}
                className={`px-2 py-1 rounded-lg text-sm ${
                  currentViewMode === 'week' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('schedule.weekView')}
              </button>
              
              <button 
                onClick={() => setCurrentViewMode('month')}
                className={`px-2 py-1 rounded-lg text-sm ${
                  currentViewMode === 'month' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('schedule.monthView')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Schedule Grid - design compacto */}
        <div className="bg-gray-900/95 rounded-lg border border-gray-700 flex-1 overflow-hidden">
          {/* Days Header - compacto */}
          <div className="grid grid-cols-7 border-b border-gray-700/80">
            {daysOfWeek.map((day, i) => (
              <div 
                key={day} 
                className={`py-1 text-center ${
                  i === 0 || i === 6 
                    ? 'text-orange-400 font-medium' 
                    : 'text-gray-200 font-medium'
                }`}
              >
                <span className="hidden sm:inline text-xs">{day}</span>
                <span className="sm:hidden text-xs">{day.substring(0, 3)}</span>
              </div>
            ))}
          </div>
          
          {/* Calendar Grid - sem gaps, altura fixa */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const isToday = isSameDay(day, new Date());
              const isInMonth = month === getMonth(day);
              
              return (
                <div 
                  key={index}
                  className={`border-r border-b border-gray-700/50 ${
                    isToday 
                      ? 'bg-blue-900/30' 
                      : !isInMonth 
                      ? 'bg-gray-900/70' 
                      : 'bg-gray-800/70'
                  } relative overflow-hidden`}
                >
                  {/* Day Header - compacto */}
                  <div className={`p-1 flex justify-between items-center ${
                    isToday ? 'bg-blue-900/60' : 'bg-gray-800/80'
                  } border-b border-gray-700/50`}>
                    <div className="flex items-center">
                      <span className={`rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold ${
                        isToday 
                          ? 'bg-blue-600 text-white' 
                          : isWeekend(day) 
                          ? 'text-orange-400' 
                          : 'text-white'
                      }`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    
                    {isAdmin && (
                      <button 
                        onClick={() => handleAddVolunteer(day)}
                        className="p-1 rounded-full bg-blue-600/80 text-white text-xs"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                  
                  {/* Shifts - compacto, sem padding extra */}
                  <div className="text-[10px]">
                    {SHIFTS.map(shift => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const volunteers = schedule[dateStr]?.[shift] || [];
                      
                      return (
                        <div key={shift} className="border-b border-gray-700/30">
                          <div className="flex justify-between items-center p-1">
                            <span className="text-gray-300 text-[10px]">{getShiftName(shift)}</span>
                            {isAdmin && volunteers.length > 0 && (
                              <button
                                onClick={() => handleManageVolunteers(dateStr, shift)}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <Users size={10} />
                              </button>
                            )}
                          </div>
                          
                          {volunteers.length > 0 ? (
                            <div className="flex flex-wrap gap-1 p-1">
                              {volunteers.map(volunteerId => {
                                const volunteer = users.find(u => u.id === volunteerId);
                                const isCurrentUser = volunteerId === user?.id;
                                
                                return volunteer ? (
                                  <div 
                                    key={volunteerId}
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                                      isCurrentUser 
                                        ? 'bg-blue-600/80 text-white' 
                                        : 'bg-gray-700/80 text-gray-200'
                                    }`}
                                  >
                                    {volunteer.name.split(' ')[0]}
                                  </div>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <div className="text-gray-500 px-1 py-0.5 text-center text-[10px]">—</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Modals - Keep existing code */}
      {showManageModal && selectedDateShift && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl p-5 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-medium text-white">
                {format(parseISO(selectedDateShift.date), 'dd/MM/yyyy')} - {getShiftName(selectedDateShift.shift)}
              </h2>
              <button onClick={() => setShowManageModal(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-5">
              <h3 className="text-sm font-medium text-gray-300 mb-3">{t('schedule.currentVolunteers')}</h3>
              {selectedVolunteers.length > 0 ? (
                <div className="space-y-2">
                  {selectedVolunteers.map(volunteerId => {
                    const volunteer = users.find(u => u.id === volunteerId);
                    return volunteer ? (
                      <div key={volunteerId} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                            {volunteer.name[0]}
                          </div>
                          <div className="text-white">{volunteer.name}</div>
                        </div>
                        <button 
                          onClick={() => handleRemoveShift(parseISO(selectedDateShift.date), selectedDateShift.shift, volunteerId)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1.5 rounded-full transition-colors"
                          aria-label="Remove volunteer"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="text-gray-400 text-sm bg-gray-700/50 rounded-lg p-4 text-center">
                  {t('schedule.noVolunteersAssigned')}
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">{t('schedule.addVolunteer')}</h3>
              <div className="flex gap-2">
                <select 
                  className="bg-gray-700 border border-gray-600 text-white rounded-lg p-2.5 flex-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssignShift(e.target.value);
                    }
                  }}
                >
                  <option value="">-- {t('schedule.selectVolunteer')} --</option>
                  {volunteers
                    .filter(v => !selectedVolunteers.includes(v.id))
                    .map(volunteer => (
                      <option key={volunteer.id} value={volunteer.id}>
                        {volunteer.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}