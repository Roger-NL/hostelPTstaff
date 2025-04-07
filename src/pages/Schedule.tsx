import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { format, addDays, startOfWeek, parse, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, ChevronDown, Info, FileText, Users, AlertCircle } from 'lucide-react';
import type { ShiftTime } from '../types';
import SimpleDatePicker from '../components/SimpleDatePicker';
import { useTranslation } from '../hooks/useTranslation';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';

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
  const { t } = useTranslation();
  
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-[90%] sm:w-[340px] bg-gray-800/95 rounded-lg shadow-xl overflow-hidden border border-gray-700/30">
        <div className="p-3.5 border-b border-gray-700/30">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mr-2.5">
              <AlertCircle size={18} />
            </div>
            <h3 className="text-sm font-medium text-white/90">{t('schedule.exceedLimitTitle')}</h3>
          </div>
          <p className="text-white/70 text-xs">
            <span className="font-medium text-amber-300">{volunteerName}</span> {t('schedule.exceedLimitMessage', { name: '' })}
          </p>
        </div>
        <div className="flex p-3">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-1.5 bg-gray-700/50 text-white/80 rounded hover:bg-gray-700 transition text-xs font-medium mr-2"
          >
            {t('schedule.cancel')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-3 py-1.5 bg-blue-500/80 text-white rounded hover:bg-blue-600 transition text-xs font-medium"
          >
            {t('schedule.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

function VolunteerModal({ isOpen, onClose, onSelect, volunteers }: ModalProps) {
  const { t } = useTranslation();
  
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-[90%] sm:w-[360px] bg-gray-800/95 rounded-lg shadow-xl overflow-hidden max-h-[75vh] border border-gray-700/30">
        <div className="p-3 border-b border-gray-700/30 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/90">{t('schedule.selectVolunteer')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="max-h-[50vh] overflow-y-auto">
          {volunteers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center mb-2">
                <Users size={20} className="text-gray-400" />
              </div>
              <p className="text-gray-400 text-sm">{t('dashboard.noVolunteersAssigned')}</p>
            </div>
          ) : (
            <div className="p-1">
              {volunteers.map(volunteer => (
                <button
                  key={volunteer.id}
                  onClick={() => {
                    console.log('Selecting volunteer:', volunteer);
                    onSelect(volunteer.id);
                  }}
                  className="w-full p-2.5 text-left text-white hover:bg-blue-500/10 transition-colors flex items-center justify-between rounded-md my-0.5"
                >
                  <span className="text-sm">{volunteer.name}</span>
                  {volunteer.role === 'admin' && (
                    <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded">{t('roles.admin')}</span>
                  )}
                </button>
              ))}
            </div>
          )}
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

// Adicionar os estilos globais usando uma tag style normal
export function ScheduleGlobalStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          .hide-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;  /* Chrome, Safari, Opera */
          }
          .text-xxs {
            font-size: 0.65rem;
            line-height: 1rem;
          }
        `
      }}
    />
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
    <div className="page-container flex flex-col">
      <ScheduleGlobalStyles />
      <PageHeader 
        title={format(selectedWeek, 'MMMM yyyy')}
        actions={
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSummaryModalOpen(true)}
              className="w-7 h-7 flex items-center justify-center bg-blue-500/30 hover:bg-blue-500/50 text-white rounded-lg transition-colors"
              title={t('schedule.summary')}
            >
              <FileText size={14} />
            </button>
            <button
              onClick={() => setDatePickerOpen(!datePickerOpen)}
              className="calendar-button w-7 h-7 flex items-center justify-center bg-gray-700/30 hover:bg-gray-700/50 text-white/90 rounded-lg transition-colors"
              title={t('common.selectDate')}
            >
              <CalendarIcon size={14} />
            </button>
            <button
              onClick={handlePreviousWeek}
              className="w-7 h-7 flex items-center justify-center bg-gray-700/30 hover:bg-gray-700/50 text-white/90 rounded-lg transition-colors"
              title={t('common.previousWeek')}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNextWeek}
              className="w-7 h-7 flex items-center justify-center bg-gray-700/30 hover:bg-gray-700/50 text-white/90 rounded-lg transition-colors"
              title={t('common.nextWeek')}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        }
      />
      
      {/* Calendar view */}
      <div className="page-content p-4 flex-1 overflow-hidden">
        {!isMobileView && (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-md border border-gray-700/30 flex-1 flex flex-col min-h-0 overflow-hidden shadow-sm">
            <div className="overflow-x-auto overflow-y-hidden h-full hide-scrollbar">
              <div className="min-w-[800px] h-full">
                <table className="w-full h-full border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-gray-800/50 backdrop-blur-sm p-2 text-left text-white/70 text-xs font-medium w-20 border-b border-gray-700/30">
                        <span className="pl-1">{t('schedule.timeSlot')}</span>
                      </th>
                      {weekDays.map(day => (
                        <th key={day.toString()} className="p-2 text-center text-white/70 min-w-[110px] max-w-[110px] border-b border-gray-700/30">
                          <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                          <div className="text-xs opacity-75">{format(day, 'MMM d')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  
                  <tbody>
                    {SHIFTS.map(shift => (
                      <tr key={shift} className="border-t border-gray-700/10 hover:bg-gray-700/10">
                        <td className="sticky left-0 bg-gray-800/70 backdrop-blur-sm p-2 text-white/80 text-xs">
                          <div className="flex flex-col pl-1">
                            <span className="whitespace-nowrap font-medium">{shift}</span>
                          </div>
                        </td>
                        {weekDays.map(day => {
                          const assignedVolunteers = getShiftAssignment(day, shift);
                          
                          return (
                            <td 
                              key={day.toString()}
                              className="border-l border-gray-700/10 align-top"
                            >
                              <div className="min-h-[80px] p-1.5 relative">
                                {assignedVolunteers.map((volunteerId: string) => (
                                  <div 
                                    key={volunteerId}
                                    className="flex items-center justify-between bg-blue-500/15 hover:bg-blue-500/25 px-2 py-1 rounded text-xs group mb-1"
                                  >
                                    <span className="text-blue-200 text-xs truncate max-w-[80px]">
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
                                    className="absolute bottom-1 right-1 w-5 h-5 flex items-center justify-center bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-300 transition-colors"
                                  >
                                    <Plus size={12} />
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
            <div className="flex overflow-x-auto gap-0.5 mb-2 pb-1 hide-scrollbar">
              {weekDays.map((day, index) => (
                <button
                  key={day.toString()}
                  onClick={() => setActiveMobileDay(index)}
                  className={`flex-shrink-0 py-1 px-1.5 rounded-md text-center min-w-[55px] ${
                    activeMobileDay === index 
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' 
                      : 'bg-gray-800/30 text-white/70 border border-transparent'
                  }`}
                >
                  <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                  <div className="text-xxs opacity-80">{format(day, 'MMM d')}</div>
                </button>
              ))}
            </div>

            {/* Dia ativo */}
            <div className="bg-gray-800/20 backdrop-blur-sm rounded-md px-2 py-1 mb-2.5">
              <h3 className="text-xs font-medium text-white/80">
                {format(weekDays[activeMobileDay], 'EEEE, MMMM d')}
              </h3>
            </div>

            {/* Slots de horários */}
            <div className="space-y-1.5">
              {SHIFTS.map(shift => {
                const assignedVolunteers = getShiftAssignment(weekDays[activeMobileDay], shift);
                
                return (
                  <div key={shift} className="bg-gray-800/20 backdrop-blur-sm rounded-md p-2 border border-gray-700/40 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-white/90">{shift}</span>
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
                          className="w-5 h-5 flex items-center justify-center bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-300 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      )}
                    </div>
                    
                    <div className="pt-1">
                      {assignedVolunteers.length === 0 ? (
                        <p className="text-gray-400 text-xs italic py-0.5">{t('schedule.noVolunteers')}</p>
                      ) : (
                        <div className="space-y-1">
                          {assignedVolunteers.map(volunteerId => (
                            <div 
                              key={volunteerId}
                              className="flex items-center justify-between bg-blue-500/10 hover:bg-blue-500/15 px-2 py-1 rounded text-xs group"
                            >
                              <span className="text-blue-200 text-xs truncate max-w-[80%]">
                                {getVolunteerName(volunteerId)}
                              </span>
                              {(user?.role === 'admin' || volunteerId === user?.id) && (
                                <button
                                  onClick={() => handleRemoveShift(weekDays[activeMobileDay], shift, volunteerId)}
                                  className="text-red-300 opacity-70 hover:opacity-100 transition-opacity"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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

        {/* DatePicker */}
        {datePickerOpen && datePickerRef.current && createPortal(
          <div 
            ref={datePickerRef}
            className="absolute z-50 bg-gray-800 border border-gray-700/50 rounded-lg shadow-lg overflow-hidden"
            style={{ 
              top: pickerPosition.top, 
              left: pickerPosition.left,
              minWidth: '300px' 
            }}
          >
            <SimpleDatePicker 
              value={selectedWeek}
              onChange={(date) => {
                if (date) {
                  setSelectedWeek(date);
                }
                setDatePickerOpen(false);
              }}
            />
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}