import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import 'react-day-picker/dist/style.css';
import '../styles/daypicker-dark.css';

interface SimpleDatePickerProps {
  value: Date;
  onChange: (date: Date | null) => void;
  label?: string;
  className?: string;
  required?: boolean;
}

// Verificar se estamos em um dispositivo móvel uma única vez na inicialização
const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const SimpleDatePicker: React.FC<SimpleDatePickerProps> = memo(({
  value,
  onChange,
  label,
  className = '',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(value || undefined);
  const [month, setMonth] = useState<Date>(selected || new Date());
  const [isMobile, setIsMobile] = useState(isMobileDevice || window.innerWidth < 640);

  const pickerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detectar dispositivo móvel - versão otimizada com debounce
  useEffect(() => {
    let timeoutId: number;
    
    const checkMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setIsMobile(window.innerWidth < 640);
      }, 150); // debounce para evitar múltiplas renderizações
    };
    
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    // Atualiza o selected quando o valor externo muda
    if (value instanceof Date) {
      setSelected(value);
      setMonth(value);
    } else {
      setSelected(undefined);
    }
  }, [value]);

  // Versão otimizada do handler de clique externo
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Usar capture: true para garantir que o evento seja capturado primeiro
    document.addEventListener('mousedown', handleClickOutside, { capture: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, { capture: true });
    };
  }, [isOpen]);

  // Calcula a posição do calendário com useMemo para otimizar o cálculo
  useEffect(() => {
    if (!isOpen || !pickerRef.current || !containerRef.current) return;
    
    const positionPicker = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const pickerHeight = isMobile ? 300 : 350; // Altura aproximada do picker
      
      // Verificar se o picker ultrapassa a parte inferior da tela
      if (rect.bottom + pickerHeight > viewportHeight) {
        // Posicionar acima do input se não couber abaixo
        pickerRef.current!.style.top = 'auto';
        pickerRef.current!.style.bottom = '100%';
        pickerRef.current!.style.maxHeight = `${rect.top - 20}px`;
      } else {
        // Posicionar abaixo do input
        pickerRef.current!.style.top = '100%';
        pickerRef.current!.style.bottom = 'auto';
        pickerRef.current!.style.maxHeight = `${viewportHeight - rect.bottom - 20}px`;
      }
    };
    
    // Executar posicionamento após um pequeno delay para garantir renderização completa
    const timeoutId = setTimeout(positionPicker, 10);
    return () => clearTimeout(timeoutId);
  }, [isOpen, isMobile]);

  // Memoizar handlers para evitar recriação a cada render
  const handleDayClick = useCallback((date: Date | undefined) => {
    setSelected(date);
    if (date) {
      onChange(date);
    }
    setIsOpen(false);
  }, [onChange]);

  const handlePrevMonth = useCallback(() => {
    setMonth(prev => addMonths(prev, -1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setMonth(prev => addMonths(prev, 1));
  }, []);

  // Calcular displayValue apenas quando selected mudar
  const displayValue = useMemo(() => 
    selected ? format(selected, 'dd/MM/yyyy') : '',
  [selected]);

  // Memoizar o header para dispositivos móveis
  const renderMobileHeader = useCallback(() => (
    <div className="flex justify-between items-center p-2 sticky top-0 bg-gray-800/95 z-10 border-b border-white/10">
      <div className="flex-1 text-left">
        <button 
          onClick={handlePrevMonth}
          className="p-2 text-blue-400 font-medium rounded-lg text-sm"
        >
          Anterior
        </button>
      </div>
      <div className="flex-1 text-center">
        <span className="text-white text-sm font-medium">
          {format(month, 'MMMM yyyy', { locale: ptBR })}
        </span>
      </div>
      <div className="flex-1 text-right">
        <button 
          onClick={handleNextMonth}
          className="p-2 text-blue-400 font-medium rounded-lg text-sm"
        >
          Próximo
        </button>
      </div>
    </div>
  ), [month, handlePrevMonth, handleNextMonth]);

  // Renderizar uma versão mais simples em dispositivos móveis muito pequenos
  if (isMobileDevice && window.innerWidth < 360) {
    return (
      <div className="relative">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {label} {required && <span className="text-white">*</span>}
          </label>
        )}
        <input
          type="date"
          value={selected ? format(selected, 'yyyy-MM-dd') : ''}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : null;
            setSelected(date || undefined);
            onChange(date);
          }}
          className={`w-full bg-gray-700/50 border border-white/10 rounded-lg px-4 py-2 text-white ${className}`}
          required={required}
        />
      </div>
    );
  }

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
        placeholder="Selecione uma data"
        required={required}
      />
      
      {isOpen && (
        <div 
          ref={pickerRef}
          className="absolute z-50 mt-1 bg-gray-800 rounded-xl shadow-xl border border-white/10 overflow-hidden transform origin-top"
          style={{ 
            width: isMobile ? 'min(100%, 300px)' : 'min(100%, 320px)', 
            left: '50%', 
            transform: 'translateX(-50%)' 
          }}
        >
          {/* Cabeçalho customizado para mobile */}
          {isMobile ? renderMobileHeader() : (
            <div className="flex justify-between items-center p-2 sticky top-0 bg-gray-800 z-10 border-b border-white/10">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-blue-400 font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (selected) {
                    handleDayClick(selected);
                  } else {
                    setIsOpen(false);
                  }
                }}
                className="p-2 text-blue-400 font-medium"
              >
                OK
              </button>
            </div>
          )}
          
          <div className={isMobile ? 'py-2' : 'py-2'}>
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
                today: 'today',
                selected: 'selected',
              }}
              styles={{
                caption: { color: 'white', display: isMobile ? 'none' : 'flex' },
                caption_label: isMobile ? { display: 'none' } : { color: 'white' },
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
        </div>
      )}
    </div>
  );
});

SimpleDatePicker.displayName = 'SimpleDatePicker';

export default SimpleDatePicker; 