import React, { useState, useEffect, useRef } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parse, setHours, setMinutes, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X, Calendar, Clock } from 'lucide-react';
import 'react-day-picker/dist/style.css';
import '../styles/daypicker-dark.css';

interface SimpleDateTimePickerProps {
  value: Date;
  onChange: (date: Date | null) => void;
  label?: string;
  className?: string;
  required?: boolean;
}

const SimpleDateTimePicker: React.FC<SimpleDateTimePickerProps> = ({
  value,
  onChange,
  label,
  className = '',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(value);
  const [hours, setHourValue] = useState(selected ? format(selected, 'HH') : '12');
  const [minutes, setMinuteValue] = useState(selected ? format(selected, 'mm') : '00');
  const [currentView, setCurrentView] = useState<'date' | 'time'>('date');
  const [month, setMonth] = useState<Date>(selected || new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const pickerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Atualiza o selected quando o valor externo muda
    if (value instanceof Date) {
      setSelected(value);
      setMonth(value);
      setHourValue(format(value, 'HH'));
      setMinuteValue(format(value, 'mm'));
    } else {
      setSelected(undefined);
      setHourValue('12');
      setMinuteValue('00');
    }
  }, [value]);

  // Adiciona evento para fechar o calendário quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Só adiciona o listener quando o picker estiver aberto
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    return undefined;
  }, [isOpen]);

  // Calcula a posição do calendário para garantir que fique visível
  useEffect(() => {
    if (isOpen && pickerRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const pickerHeight = isMobile ? 300 : 350; // Altura aproximada do picker
      
      // Verificar se o picker ultrapassa a parte inferior da tela
      if (rect.bottom + pickerHeight > viewportHeight - 10) {
        // Posicionar acima do input se não couber abaixo
        pickerRef.current.style.top = 'auto';
        pickerRef.current.style.bottom = '100%';
        pickerRef.current.style.maxHeight = `${Math.max(rect.top - 20, 250)}px`;
      } else {
        // Posicionar abaixo do input
        pickerRef.current.style.top = '100%';
        pickerRef.current.style.bottom = 'auto';
        pickerRef.current.style.maxHeight = `${Math.min(viewportHeight - rect.bottom - 20, 350)}px`;
      }
    }
  }, [isOpen, isMobile]);

  const handleDayClick = (date: Date | undefined) => {
    if (!date) return;
    
    // Manter a hora e minutos atuais
    const newDate = setHours(setMinutes(date, parseInt(minutes)), parseInt(hours));
    setSelected(newDate);
    if (isMobile) {
      setCurrentView('time');
    }
  };

  const handlePrevMonth = () => {
    setMonth(prev => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    setMonth(prev => addMonths(prev, 1));
  };

  const handleTimeChange = (type: 'hour' | 'minute', value: string) => {
    if (type === 'hour') {
      setHourValue(value);
    } else {
      setMinuteValue(value);
    }

    if (selected) {
      const h = type === 'hour' ? parseInt(value) : parseInt(hours);
      const m = type === 'minute' ? parseInt(value) : parseInt(minutes);
      const newDate = setHours(setMinutes(selected, m), h);
      setSelected(newDate);
    }
  };

  const handleConfirm = () => {
    if (selected) {
      onChange(selected);
    }
    setIsOpen(false);
  };

  const renderMonthNavigation = () => (
    <div className="flex justify-between items-center px-2 py-1">
      <button onClick={handlePrevMonth} className="p-1 text-blue-400">
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm font-medium text-white">
        {format(month, 'MMMM yyyy', { locale: ptBR })}
      </span>
      <button onClick={handleNextMonth} className="p-1 text-blue-400">
        <ChevronRight size={18} />
      </button>
    </div>
  );

  const renderHeader = () => (
    <div className="flex justify-between items-center p-2 sticky top-0 bg-gray-800 z-10 border-b border-white/10">
      {isMobile ? (
        <>
          <div className="flex-1 flex justify-start">
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-blue-400 font-medium"
            >
              Cancelar
            </button>
          </div>
          <div className="flex-1 flex justify-center gap-2">
            <button
              onClick={() => setCurrentView('date')}
              className={`p-1 flex items-center gap-1 ${currentView === 'date' ? 'text-blue-400' : 'text-gray-400'}`}
            >
              <Calendar size={16} />
              <span className="text-sm">Data</span>
            </button>
            <button
              onClick={() => setCurrentView('time')}
              className={`p-1 flex items-center gap-1 ${currentView === 'time' ? 'text-blue-400' : 'text-gray-400'}`}
            >
              <Clock size={16} />
              <span className="text-sm">Hora</span>
            </button>
          </div>
          <div className="flex-1 flex justify-end">
            <button 
              onClick={handleConfirm}
              className="p-2 text-blue-400 font-medium"
            >
              OK
            </button>
          </div>
        </>
      ) : (
        <>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-blue-400 font-medium"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            className="p-2 text-blue-400 font-medium"
          >
            OK
          </button>
        </>
      )}
    </div>
  );

  const renderTimeSelector = () => {
    const hoursOptions = Array.from({ length: 24 }, (_, i) => 
      i.toString().padStart(2, '0')
    );
    const minutesOptions = Array.from({ length: 12 }, (_, i) => 
      (i * 5).toString().padStart(2, '0')
    );

    return (
      <div className="p-4">
        <div className="mb-4">
          <p className="text-white text-sm mb-2 font-medium">Hora</p>
          <div className="grid grid-cols-6 gap-2">
            {hoursOptions.map(h => (
              <button
                key={h}
                onClick={() => handleTimeChange('hour', h)}
                className={`p-2 text-center text-sm rounded-md 
                  ${h === hours 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <p className="text-white text-sm mb-2 font-medium">Minuto</p>
          <div className="grid grid-cols-6 gap-2">
            {minutesOptions.map(m => (
              <button
                key={m}
                onClick={() => handleTimeChange('minute', m)}
                className={`p-2 text-center text-sm rounded-md 
                  ${m === minutes 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        
        {isMobile && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex justify-center">
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-blue-500 text-white rounded-md"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const displayValue = selected 
    ? format(selected, 'dd/MM/yyyy HH:mm') 
    : '';

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {label} {required && <span className="text-white">*</span>}
        </label>
      )}
      
      <input
        type="text"
        value={displayValue}
        onClick={() => setIsOpen(true)}
        readOnly
        className={`w-full bg-gray-700/50 border border-white/10 rounded-lg px-4 py-2 text-white cursor-pointer ${className}`}
        placeholder="Selecione data e hora"
        required={required}
      />
      
      {isOpen && (
        <div 
          ref={pickerRef}
          className="absolute z-50 mt-1 bg-gray-800 rounded-xl shadow-xl border border-white/10 overflow-auto"
          style={{ 
            width: isMobile ? 'min(100%, 300px)' : 'min(100%, 320px)', 
            left: '50%', 
            transform: 'translateX(-50%)' 
          }}
        >
          {renderHeader()}

          {currentView === 'date' && (
            <div className={isMobile ? 'pb-1' : 'pb-2'}>
              {isMobile && renderMonthNavigation()}
              
              <DayPicker
                mode="single"
                selected={selected}
                onSelect={handleDayClick}
                locale={ptBR}
                month={month}
                onMonthChange={setMonth}
                className="bg-gray-800 text-white compact-calendar"
                showOutsideDays={false}
                modifiers={{
                  today: new Date(),
                }}
                modifiersClassNames={{
                  today: 'calendar-day-today',
                  selected: 'calendar-day-selected'
                }}
                styles={{
                  caption: { color: 'white', display: isMobile ? 'none' : 'flex' },
                  caption_label: isMobile ? { display: 'none' } : { color: 'white' },
                  caption_dropdowns: isMobile ? { display: 'none' } : {},
                  nav: isMobile ? { display: 'none' } : {},
                  day: { 
                    color: 'white',
                    backgroundColor: '#374151',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.25rem'
                  },
                  day_selected: { backgroundColor: '#3b82f6' },
                  day_outside: { color: 'gray' },
                }}
              />
            </div>
          )}
          
          {currentView === 'time' && renderTimeSelector()}
        </div>
      )}
    </div>
  );
};

export default SimpleDateTimePicker; 