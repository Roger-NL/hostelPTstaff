import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { format, addDays, startOfWeek, parse, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, ChevronDown, Info, FileText } from 'lucide-react';
import type { ShiftTime } from '../types';
import SimpleDatePicker from '../components/SimpleDatePicker';
import { useTranslation } from '../hooks/useTranslation';
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

interface ScheduleSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekDays: Date[];
  schedule: any;
  users: any[];
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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div className="relative w-[85%] sm:w-[400px] bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white mb-2 text-center">Atenção</h3>
          <p className="text-white/80 text-sm text-center">
            {volunteerName} já foi adicionado 5 vezes esta semana
          </p>
        </div>
        <div className="flex flex-col gap-2 p-4">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition text-sm font-medium"
          >
            Confirmar
          </button>
          <button
            onClick={() => onClose()}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function VolunteerModal({ isOpen, onClose, onSelect, volunteers }: ModalProps) {
  console.log('VolunteerModal render:', { isOpen, volunteersCount: volunteers.length });
  
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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div className="relative w-[85%] sm:w-[400px] bg-gray-800 rounded-2xl shadow-xl overflow-hidden max-h-[80vh]">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white text-center">Selecionar Voluntário</h3>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {volunteers.length === 0 ? (
            <p className="text-white/60 text-center py-6 text-sm">Nenhum voluntário disponível</p>
          ) : (
            <div className="divide-y divide-white/10">
              {volunteers.map(volunteer => (
                <button
                  key={volunteer.id}
                  onClick={() => {
                    console.log('Selecting volunteer:', volunteer);
                    onSelect(volunteer.id);
                  }}
                  className="w-full p-4 text-left text-white hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  <span>{volunteer.name}</span>
                  {volunteer.role === 'admin' && (
                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">Admin</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              console.log('Closing volunteer modal');
              onClose();
            }}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition text-sm font-medium"
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
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
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
  
  const volunteers = users;
  console.log('Available volunteers:', volunteers);
  console.log('Modal state:', modalState);
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
      console.log('Assigning shift:', { date: modalState.date, shift: modalState.shift, volunteerId });
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
    console.log('Closing modal');
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

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Header - Mais compacto e moderno */}
      <div className="flex flex-col gap-1.5 mb-3 px-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg xs:text-xl font-extralight text-white">{format(selectedWeek, 'MMMM yyyy')}</h1>
          
          <div className="flex items-center gap-1.5 xs:gap-2">
            <button
              onClick={() => setSummaryModalOpen(true)}
              className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center bg-blue-500/50 rounded-full text-white hover:bg-blue-600/50 transition-colors"
            >
              <FileText size={16} className="xs:hidden" />
              <FileText size={18} className="hidden xs:block" />
            </button>
            <button
              onClick={() => setDatePickerOpen(!datePickerOpen)}
              className="calendar-button w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center bg-gray-700/50 rounded-full text-white hover:bg-gray-600 transition-colors"
            >
              <CalendarIcon size={16} className="xs:hidden" />
              <CalendarIcon size={18} className="hidden xs:block" />
            </button>
            <button
              onClick={handlePreviousWeek}
              className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center bg-gray-700/50 rounded-full text-white hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft size={16} className="xs:hidden" />
              <ChevronLeft size={18} className="hidden xs:block" />
            </button>
            <button
              onClick={handleNextWeek}
              className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center bg-gray-700/50 rounded-full text-white hover:bg-gray-600 transition-colors"
            >
              <ChevronRight size={16} className="xs:hidden" />
              <ChevronRight size={18} className="hidden xs:block" />
            </button>
          </div>
        </div>

        {/* Seletor de semana mais compacto */}
        <div className="rounded-xl bg-gray-800/50 backdrop-blur-sm p-2 text-center text-xs text-white/70 font-light">
          {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
        </div>

        {/* DatePicker mais bem posicionado */}
        {datePickerOpen && (
          <div
            ref={datePickerRef}
            className="absolute right-5 top-20 z-50 bg-gray-800 rounded-xl border border-white/10 shadow-xl"
            style={{ width: 'min(280px, 90vw)' }}
          >
            <SimpleDatePicker
              value={selectedDate}
              onChange={handleDateChange}
            />
          </div>
        )}
      </div>

      {!isMobileView && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto overflow-y-hidden h-full">
            <div className="min-w-[800px] h-full">
              <table className="w-full h-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-gray-800/50 backdrop-blur-sm p-2 text-left text-white/60 text-xs font-medium w-20">Shift</th>
                    {weekDays.map(day => (
                      <th key={day.toString()} className="p-2 text-center text-white/60 min-w-[120px] max-w-[120px]">
                        <div className="text-tiny font-medium">{format(day, 'EEE')}</div>
                        <div className="text-tiny">{format(day, 'MMM d')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SHIFTS.map(shift => (
                    <tr key={shift} className="border-t border-white/5">
                      <td className="sticky left-0 bg-gray-800/70 backdrop-blur-sm p-2 text-white/80 text-xs font-light">
                        <div className="flex flex-col">
                          <span className="whitespace-nowrap">{shift}</span>
                        </div>
                      </td>
                      {weekDays.map(day => {
                        const assignedVolunteers = getShiftAssignment(day, shift);
                        
                        return (
                          <td 
                            key={day.toString()}
                            className="border-l border-white/5 p-2 align-top"
                          >
                            <div className="space-y-1.5">
                              {assignedVolunteers.map((volunteerId: string) => (
                                <div 
                                  key={volunteerId}
                                  className="flex items-center justify-between bg-blue-500/15 hover:bg-blue-500/25 px-2 py-1 rounded-md text-xs group"
                                >
                                  <span className="text-blue-100 text-xs truncate max-w-[80px]">
                                    {getVolunteerName(volunteerId).split(' ')[0]}
                                  </span>
                                  {(user?.role === 'admin' || volunteerId === user?.id) && (
                                    <button
                                      onClick={() => handleRemoveShift(day, shift, volunteerId)}
                                      className="text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {user?.role === 'admin' && (
                                <button
                                  onClick={() => {
                                    console.log('Opening volunteer modal for:', { date: day, shift });
                                    setModalState({
                                      isOpen: true,
                                      date: day,
                                      shift,
                                      volunteerName: ''
                                    });
                                  }}
                                  className="w-full flex items-center justify-center bg-white/5 hover:bg-white/10 p-1 rounded-md text-white/60 hover:text-white transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Visão mobile otimizada */}
      {isMobileView && (
        <div className="flex-1 flex flex-col">
          {/* Seletor de dias mobile */}
          <div className="flex overflow-x-auto gap-1 mb-2 pb-2">
            {weekDays.map((day, index) => (
              <button
                key={day.toString()}
                onClick={() => setActiveMobileDay(index)}
                className={`flex-shrink-0 p-2 rounded-lg text-center min-w-[80px] ${
                  activeMobileDay === index ? 'bg-blue-500/30 text-white' : 'bg-gray-800/40 text-white/70'
                }`}
              >
                <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                <div className="text-tiny mt-0.5">{format(day, 'MMM d')}</div>
              </button>
            ))}
          </div>

          {/* Dia ativo */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg flex-1 p-3">
            <h3 className="text-sm font-medium text-white mb-3">
              {format(weekDays[activeMobileDay], 'EEEE, MMMM d')}
            </h3>
            
            <div className="space-y-2.5">
              {SHIFTS.map(shift => {
                const assignedVolunteers = getShiftAssignment(weekDays[activeMobileDay], shift);
                
                return (
                  <div key={shift} className="bg-white/5 rounded-lg p-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium text-white/80">{shift}</span>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => {
                            setModalState({
                              isOpen: true,
                              date: weekDays[activeMobileDay],
                              shift,
                              volunteerName: ''
                            });
                          }}
                          className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-full text-white/70"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                    
                    {assignedVolunteers.length > 0 ? (
                      <div className="space-y-1">
                        {assignedVolunteers.map((volunteerId: string) => (
                          <div 
                            key={volunteerId}
                            className="flex items-center justify-between bg-blue-500/15 px-2.5 py-1.5 rounded-md"
                          >
                            <span className="text-blue-100 text-xs">
                              {getVolunteerName(volunteerId)}
                            </span>
                            {(user?.role === 'admin' || volunteerId === user?.id) && (
                              <button
                                onClick={() => handleRemoveShift(weekDays[activeMobileDay], shift, volunteerId)}
                                className="text-red-300"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-white/40 text-xs">Sem voluntários</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Debug logs */}
      {(() => {
        console.log('Rendering modals:', { modalState, confirmationModal });
        return null;
      })()}

      <VolunteerModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        onSelect={handleAssignShift}
        volunteers={volunteers}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleConfirmationClose}
        onConfirm={handleConfirmAssignment}
        volunteerName={confirmationModal.volunteerName}
      />

      <ScheduleSummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        weekDays={weekDays}
        schedule={schedule}
        users={users}
        shifts={SHIFTS}
      />
    </div>
  );
}