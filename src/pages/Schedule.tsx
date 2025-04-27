import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { format, addDays, startOfWeek, parse, isSameDay, startOfMonth, getMonth, isWeekend, parseISO } from 'date-fns';
import { pt, ptBR, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, ChevronDown, Info, FileText, ArrowLeft, Users, Check } from 'lucide-react';
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
  [key: string]: any;
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-[85%] sm:w-[400px] bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
        <div className="p-5 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2 text-center">Atenção</h3>
          <p className="text-gray-300 text-center">
            <strong className="text-blue-400">{volunteerName}</strong> já foi adicionado 5 vezes esta semana
          </p>
        </div>
        <div className="flex flex-col gap-3 p-5">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            Confirmar Mesmo Assim
          </button>
          <button
            onClick={() => onClose()}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function VolunteerModal({ isOpen, onClose, onSelect, volunteers }: ModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
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
  
  const filteredVolunteers = volunteers.filter(
    v => v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-[90%] sm:w-[450px] bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white text-center mb-3">Adicionar Voluntário</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar voluntário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {filteredVolunteers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">Nenhum voluntário encontrado</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredVolunteers.map(volunteer => (
                <button
                  key={volunteer.id}
                  onClick={() => {
                    onSelect(volunteer.id);
                  }}
                  className="w-full p-3 text-left hover:bg-gray-700 transition-colors rounded-lg mb-1 flex items-center"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3">
                    {volunteer.name[0]}
                  </div>
                  <div>
                    <div className="text-white font-medium">{volunteer.name}</div>
                    {volunteer.role === 'admin' && (
                      <div className="text-xs text-blue-400">Administrador</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm font-medium"
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
      totalShifts: workingDays.reduce((total, day) => total + day.shifts.length, 0)
    };
  }).filter(data => data.totalShifts > 0)
    .sort((a, b) => b.totalShifts - a.totalShifts);

  // Labels based on language
  const labels = {
    shifts: language === 'pt' ? 'Turnos' : 'Shifts',
    close: language === 'pt' ? 'Fechar' : 'Close',
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-[90%] sm:w-[500px] bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white text-center">Resumo da Semana</h3>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4">
          {volunteerSchedules.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">Nenhum turno atribuído esta semana</p>
            </div>
          ) : (
            <div className="space-y-4">
              {volunteerSchedules.map(({ user, workingDays, totalShifts }) => (
                <div key={user.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {user.name[0]}
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.name}</div>
                        <div className="text-sm text-blue-400">{totalShifts} {labels.shifts}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {workingDays.map(day => (
                      <div key={format(day.date, 'yyyy-MM-dd')} className="bg-gray-800 rounded-lg p-2">
                        <div className="text-sm text-white font-medium mb-1">
                          {format(day.date, 'EEE, dd MMM', { locale: language === 'pt' ? ptBR : enUS })}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {day.shifts.map(shift => (
                            <span key={shift} className="text-xs bg-blue-500/30 text-blue-300 px-2 py-1 rounded-md">
                              {shift}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
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
  
  // New state for manage volunteer modal
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedDateShift, setSelectedDateShift] = useState<{date: string, shift: ShiftTime} | null>(null);
  
  const isAdmin = user?.role === 'admin';
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
        
        // Show success toast
        toast.success(`${volunteerName.split(' ')[0]} adicionado ao turno com sucesso!`, {
          duration: 2000
        });
      }
    }
  };

  const handleConfirmAssignment = () => {
    if (modalState.date && modalState.shift && modalState.pendingVolunteerId) {
      const dateStr = format(modalState.date, 'yyyy-MM-dd');
      const volunteerName = getVolunteerName(modalState.pendingVolunteerId);
      
      assignShift(dateStr, modalState.shift, modalState.pendingVolunteerId);
      
      toast.success(`${volunteerName.split(' ')[0]} adicionado ao turno com sucesso!`, {
        duration: 2000
      });
      
      setModalState({ isOpen: false, volunteerName: '' });
    }
  };

  const handleRemoveShift = (date: Date, shift: ShiftTime, volunteerId: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const volunteerName = getVolunteerName(volunteerId);
    
    removeShift(dateStr, shift, volunteerId);
    
    toast.success(`${volunteerName.split(' ')[0]} removido do turno com sucesso!`, {
      duration: 2000
    });
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

  // Function to handle date change
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setSelectedWeek(startOfWeek(date, { weekStartsOn: 1 }));
      setDatePickerOpen(false);
    }
  };

  const datePickerRef = useRef<HTMLDivElement>(null);
  
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

  useEffect(() => {
    const handleResize = () => {
      // Close any open dialogs when window resizes
      setDatePickerOpen(false);
      setShowDateOptions(false);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const goToToday = () => {
    setSelectedWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
    setSelectedDate(new Date());
  };

  const goToNextWeek = () => {
    setSelectedWeek(prevWeek => {
      const nextWeek = addDays(prevWeek, 7);
      setSelectedDate(nextWeek);
      return nextWeek;
    });
  };

  const goToPreviousWeek = () => {
    setSelectedWeek(prevWeek => {
      const prevWeekDate = addDays(prevWeek, -7);
      setSelectedDate(prevWeekDate);
      return prevWeekDate;
    });
  };

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

  // For week view
  const daysOfWeek = useMemo(() => {
    const locale = language === 'pt' ? ptBR : enUS;
    return Array.from({ length: 7 }).map((_, i) => {
      const day = addDays(selectedWeek, i);
      return format(day, 'EEE', { locale });
    });
  }, [selectedWeek, language]);

  // For month view
  const [month, days, visibleRange] = useMemo(() => {
    const firstDayOfMonth = startOfMonth(selectedDate);
    const firstVisibleDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
    const month = getMonth(selectedDate);
    
    // Always show 5 weeks for consistency
    const numberOfDays = 7 * 5;
    
    const days = Array.from({ length: numberOfDays }, (_, i) => addDays(firstVisibleDate, i));
    
    return [
      month,
      days,
      {
        start: days[0],
        end: days[days.length - 1]
      }
    ];
  }, [selectedDate]);

  const handlePrevious = () => {
    if (currentViewMode === 'week') {
      goToPreviousWeek();
    } else {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setSelectedDate(newDate);
    }
  };

  const handleNext = () => {
    if (currentViewMode === 'week') {
      goToNextWeek();
    } else {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setSelectedDate(newDate);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setSelectedWeek(startOfWeek(today, { weekStartsOn: 1 }));
  };

  // Selected volunteers for the manage modal
  const selectedVolunteers = useMemo(() => {
    if (!selectedDateShift) return [];
    
    return schedule[selectedDateShift.date]?.[selectedDateShift.shift] || [];
  }, [schedule, selectedDateShift]);

  // Function to get a friendly name for the shift
  const getShiftName = (shift: string) => {
    const [start, end] = shift.split('-');
    if (language === 'pt') {
      return `${start}h às ${end}h`;
    } else {
      return `${start} to ${end}`;
    }
  };

  // Function to open the volunteer management modal
  const handleManageVolunteers = (date: string, shift: ShiftTime) => {
    setSelectedDateShift({ date, shift });
    setShowManageModal(true);
  };

  // Function to open the volunteer selection modal
  const handleAddVolunteer = (date: Date, shift: ShiftTime) => {
    setModalState({
      isOpen: true,
      date,
      shift,
      volunteerName: ''
    });
  };

  return (
    <div className="bg-gray-900 text-white h-screen overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col p-4">
        {/* Header and Navigation */}
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <h1 className="text-2xl font-bold text-white">{t('schedule.title')}</h1>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-800 rounded-lg border border-gray-700">
              <button 
                onClick={handlePrevious}
                className="p-2 rounded-l-lg hover:bg-gray-700 text-gray-300"
                aria-label="Previous"
              >
                <ChevronLeft size={18} />
              </button>
              
              <button 
                onClick={handleToday}
                className="px-3 py-2 text-white text-sm"
              >
                {t('today')}
              </button>
              
              <button 
                onClick={handleNext}
                className="p-2 rounded-r-lg hover:bg-gray-700 text-gray-300"
                aria-label="Next"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            
            <div className="bg-gray-800 py-2 px-3 rounded-lg border border-gray-700 text-sm font-medium">
              {format(visibleRange.start, 'MMM d', { locale: language === 'pt' ? ptBR : enUS })} - 
              {format(visibleRange.end, ' MMM d, yyyy', { locale: language === 'pt' ? ptBR : enUS })}
            </div>
            
            <button
              onClick={() => setSummaryModalOpen(true)}
              className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700"
              title="Ver resumo da semana"
            >
              <FileText size={18} />
            </button>
          </div>
        </div>
        
        {/* Calendar Header */}
        <div className="bg-gray-800 rounded-t-lg border border-gray-700 grid grid-cols-7 border-b-0">
          {daysOfWeek.map((day, i) => {
            const currentDay = addDays(selectedWeek, i);
            const isToday = isSameDay(currentDay, new Date());
            
            return (
              <div 
                key={i} 
                className={`py-2 text-center ${
                  isToday ? 'bg-blue-900/30' : (i === 0 || i === 6) ? 'bg-gray-800/80' : 'bg-gray-800'
                }`}
              >
                <div className={`text-sm font-medium ${
                  (i === 0 || i === 6) ? 'text-blue-300' : 'text-gray-300'
                }`}>
                  {day}
                </div>
                <div className={`text-xl font-bold ${
                  isToday ? 'text-white' : (i === 0 || i === 6) ? 'text-blue-300' : 'text-white'
                }`}>
                  {format(currentDay, 'd')}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Schedule Grid */}
        <div className="flex-1 overflow-auto bg-gray-800 rounded-b-lg border border-gray-700">
          {SHIFTS.map((shift) => (
            <div key={shift} className="border-b border-gray-700 last:border-b-0">
              {/* Shift Header */}
              <div className="sticky left-0 bg-gray-800 border-b border-gray-700 p-2 flex items-center">
                <div className="w-24 shrink-0 text-sm font-medium text-blue-300">
                  {getShiftName(shift)}
                </div>
              </div>
              
              {/* Shift Row */}
              <div className="grid grid-cols-7">
                {weekDays.map((day, dayIndex) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isToday = isSameDay(day, new Date());
                  const isWeekendDay = isWeekend(day);
                  const volunteers = schedule[dateStr]?.[shift] || [];
                  
                  return (
                    <div 
                      key={dayIndex}
                      className={`p-2 border-r border-gray-700 last:border-r-0 min-h-[70px] ${
                        isToday ? 'bg-blue-900/20' : isWeekendDay ? 'bg-gray-850' : 'bg-gray-825'
                      }`}
                    >
                      {/* Empty state with add button */}
                      {volunteers.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          {isAdmin && (
                            <button
                              onClick={() => handleAddVolunteer(day, shift)}
                              className="p-2 bg-blue-600/80 hover:bg-blue-600 rounded-lg text-white"
                              title="Adicionar voluntário"
                            >
                              <Plus size={16} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {/* Header with manage button */}
                          {volunteers.length > 0 && isAdmin && (
                            <div className="flex justify-end mb-1">
                              <button
                                onClick={() => handleManageVolunteers(dateStr, shift)}
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                              >
                                <span>Gerenciar</span>
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          )}
                          
                          {/* Volunteers */}
                          <div className="flex flex-col gap-1">
                            {volunteers.map((volunteerId) => {
                              const volunteer = users.find(u => u.id === volunteerId);
                              const isCurrentUser = volunteerId === user?.id;
                              
                              return volunteer ? (
                                <div 
                                  key={volunteerId}
                                  className={`text-sm py-1 px-2 rounded-md flex items-center justify-between ${
                                    isCurrentUser 
                                      ? 'bg-blue-600/60 text-white' 
                                      : 'bg-gray-700/80 text-white'
                                  }`}
                                >
                                  <span>{volunteer.name.split(' ')[0]}</span>
                                  
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleRemoveShift(day, shift, volunteerId)}
                                      className="text-gray-300 hover:text-white p-1 hover:bg-gray-600/50 rounded-full"
                                      title="Remover voluntário"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              ) : null;
                            })}
                          </div>
                          
                          {/* Add more button */}
                          {isAdmin && (
                            <button
                              onClick={() => handleAddVolunteer(day, shift)}
                              className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800/50 rounded-md py-1 px-2 bg-blue-900/20 mt-1 flex items-center justify-center gap-1"
                            >
                              <Plus size={12} />
                              <span>Adicionar</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Modals */}
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
      
      {/* Manage Volunteers Modal */}
      {showManageModal && selectedDateShift && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl p-5 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-medium text-white">
                {format(parseISO(selectedDateShift.date), 'dd/MM/yyyy')} - {getShiftName(selectedDateShift.shift)}
              </h2>
              <button 
                onClick={() => setShowManageModal(false)} 
                className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded-full"
              >
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
                          className="text-white hover:text-white hover:bg-red-900/20 p-1.5 rounded-full transition-colors"
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
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setTimeout(() => {
                    handleAddVolunteer(parseISO(selectedDateShift.date), selectedDateShift.shift);
                  }, 100);
                }}
                className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                <span>Adicionar Voluntário</span>
              </button>
            </div>
            
            <button
              onClick={() => setShowManageModal(false)}
              className="w-full p-3 border border-gray-700 hover:bg-gray-700 text-white rounded-lg"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}