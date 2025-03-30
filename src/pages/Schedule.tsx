import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { format, addDays, startOfWeek, parse, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, ChevronDown, Info, FileText } from 'lucide-react';
import type { ShiftTime } from '../types';
import SimpleDatePicker from '../components/SimpleDatePicker';
import { useTranslation } from '../hooks/useTranslation';

const SHIFTS: ShiftTime[] = [
  '08:00-10:00',
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
      assignShift(dateStr, modalState.shift, modalState.pendingVolunteerId);
      setModalState({ isOpen: false, volunteerName: '' });
    }
  };

  const handleRemoveShift = (date: Date, shift: ShiftTime, volunteerId: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    removeShift(dateStr, shift, volunteerId);
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
      {/* Header - Redesenhado para padrão iOS */}
      <div className="flex flex-col gap-2 mb-4 px-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">{format(selectedWeek, 'MMMM yyyy')}</h1>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSummaryModalOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-blue-500/50 rounded-full text-white hover:bg-blue-600/50 transition-colors"
            >
              <FileText size={18} />
            </button>
            <button
              onClick={() => setDatePickerOpen(!datePickerOpen)}
              className="calendar-button w-10 h-10 flex items-center justify-center bg-gray-700/50 rounded-full text-white hover:bg-gray-600 transition-colors"
            >
              <CalendarIcon size={18} />
            </button>
            <button
              onClick={handlePreviousWeek}
              className="w-10 h-10 flex items-center justify-center bg-gray-700/50 rounded-full text-white hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextWeek}
              className="w-10 h-10 flex items-center justify-center bg-gray-700/50 rounded-full text-white hover:bg-gray-600 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        <div className="text-sm text-center text-gray-300 bg-gray-800/40 py-1.5 px-3 rounded-full self-center">
          {format(selectedWeek, 'MMM d')} - {format(addDays(selectedWeek, 6), 'MMM d, yyyy')}
        </div>
        
        {datePickerOpen && (
          <div 
            className="fixed z-50 shadow-2xl" 
            ref={datePickerRef}
            style={{
              width: 'min(100%, 300px)',
              maxWidth: '90vw',
              top: `${pickerPosition.top}px`,
              left: `${pickerPosition.left}px`
            }}
          >
            <SimpleDatePicker
              value={selectedDate}
              onChange={handleDateChange}
            />
          </div>
        )}
      </div>

      {/* Mobile Day Selector - Redesenhado para padrão iOS */}
      {isMobileView && (
        <div className="flex overflow-x-auto mb-3 mx-1 pb-1 scrollbar-none">
          {weekDays.map((day, index) => (
            <button
              key={day.toString()}
              onClick={() => setActiveMobileDay(index)}
              className={`flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-full mr-2 ${
                activeMobileDay === index
                  ? 'bg-blue-500 text-white font-medium'
                  : 'bg-gray-800/70 text-gray-300'
              }`}
            >
              <span className={`text-xs ${activeMobileDay === index ? 'font-semibold' : 'font-medium'}`}>
                {format(day, 'EEE')}
              </span>
              <span className={`text-lg ${activeMobileDay === index ? 'font-bold' : ''}`}>
                {format(day, 'd')}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Week View - Desktop */}
      {!isMobileView && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto overflow-y-hidden h-full">
            <div className="min-w-[800px] h-full">
              <table className="w-full h-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-gray-800/50 backdrop-blur-sm p-2 text-left text-white/60 text-sm font-medium w-24">Shift</th>
                    {weekDays.map(day => (
                      <th key={day.toString()} className="p-2 text-center text-white/60 min-w-[140px] max-w-[140px]">
                        <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                        <div className="text-xs">{format(day, 'MMM d')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {SHIFTS.map(shift => (
                    <tr key={shift}>
                      <td className="sticky left-0 bg-gray-800/50 backdrop-blur-sm p-2 text-white/80 text-sm">{shift}</td>
                      {weekDays.map(day => {
                        const volunteers = getShiftAssignment(day, shift) || [];
                        return (
                          <td key={day.toString()} className="p-1.5 border-l border-white/10 min-w-[140px] max-w-[140px] h-[120px]">
                            <div className="space-y-1 h-full flex flex-col">
                              <div className="flex-1 overflow-y-auto">
                                {volunteers.map((volunteerId, index) => {
                                  const volunteer = users.find(u => u.id === volunteerId);
                                  return (
                                    <div key={volunteerId} className="flex items-center justify-between gap-1 bg-gray-700/50 p-1.5 rounded-lg mb-1">
                                      <div className="flex items-center gap-1 min-w-0">
                                        <span className="text-white text-xs truncate">
                                          {getVolunteerName(volunteerId)}
                                        </span>
                                        {volunteer?.role === 'admin' && (
                                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full flex-shrink-0">A</span>
                                        )}
                                      </div>
                                      {user?.role === 'admin' && (
                                        <button
                                          onClick={() => handleRemoveShift(day, shift, volunteerId)}
                                          className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                                        >
                                          <X size={12} />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              {user?.role === 'admin' && (
                                <button
                                  onClick={() => {
                                    console.log('Opening modal for:', { date: day, shift });
                                    setModalState({ isOpen: true, date: day, shift, volunteerName: '' });
                                  }}
                                  className="w-full p-1.5 rounded-lg border border-dashed border-white/20 hover:border-white/40 transition-colors flex items-center justify-center gap-1 text-white/60 hover:text-white/80 text-xs flex-shrink-0"
                                >
                                  <Plus size={12} />
                                  <span>Add Volunteer</span>
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

      {/* Mobile Day View */}
      {isMobileView && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg flex-1 flex flex-col">
          <div className="p-4 space-y-4 overflow-y-auto">
            <h2 className="text-lg font-semibold text-white text-center">
              {format(weekDays[activeMobileDay], 'EEEE, d MMM')}
            </h2>
            
            {SHIFTS.map(shift => {
              const volunteers = getShiftAssignment(weekDays[activeMobileDay], shift) || [];
              return (
                <div key={shift} className="bg-gray-700/30 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">{shift}</h3>
                    {user?.role === 'admin' && volunteers.length === 0 && (
                      <button
                        onClick={() => {
                          setModalState({ 
                            isOpen: true, 
                            date: weekDays[activeMobileDay], 
                            shift, 
                            volunteerName: '' 
                          });
                        }}
                        className="bg-blue-500 text-white px-2.5 py-1 rounded-full text-xs flex items-center gap-1"
                      >
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                  
                  {volunteers.length === 0 ? (
                    <p className="text-gray-400 text-sm italic">Sem voluntários neste horário</p>
                  ) : (
                    <div className="space-y-2">
                      {volunteers.map(volunteerId => {
                        const volunteer = users.find(u => u.id === volunteerId);
                        return (
                          <div key={volunteerId} className="flex items-center justify-between gap-2 p-2.5 bg-gray-700/50 rounded-xl">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm">{getVolunteerName(volunteerId)}</span>
                              {volunteer?.role === 'admin' && (
                                <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">Admin</span>
                              )}
                            </div>
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => handleRemoveShift(weekDays[activeMobileDay], shift, volunteerId)}
                                className="text-red-400 p-1.5 hover:bg-gray-600/50 rounded-full"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      
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
                          className="w-full p-2 rounded-xl border border-dashed border-white/20 hover:border-white/40 transition-colors flex items-center justify-center gap-1 text-white/60 hover:text-white/80 text-xs"
                        >
                          <Plus size={12} />
                          <span>Adicionar Voluntário</span>
                        </button>
                      )}
                    </div>
                  )}
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
    </div>
  );
}