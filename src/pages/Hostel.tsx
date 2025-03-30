import React, { useState } from 'react';
import { Plus, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SimpleDatePicker from '../components/SimpleDatePicker';
import { useMediaQuery } from 'react-responsive';

interface Room {
  id: string;
  number: string;
  name: string;
}

type BookingStatus = 'Pendente' | 'Confirmado' | 'Cancelado' | 'Concluído';

const colorScheme: Record<BookingStatus, string> = {
  'Pendente': '#f59e0b', // amber-500
  'Confirmado': '#3b82f6', // blue-500
  'Cancelado': '#ef4444', // red-500
  'Concluído': '#10b981', // emerald-500
};

const filterOptions = {
  status: ['Pendente', 'Confirmado', 'Cancelado', 'Concluído'] as BookingStatus[]
};

const Hostel = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [formData, setFormData] = useState({
    guestName: '',
    checkIn: new Date(),
    checkOut: new Date(),
    roomNumber: '',
    status: 'Pendente' as BookingStatus,
    notes: ''
  });
  const [rooms, setRooms] = useState<Room[]>([
    { id: '1', number: '101', name: 'Quarto Simples' },
    { id: '2', number: '102', name: 'Quarto Duplo' },
    { id: '3', number: '103', name: 'Quarto Família' },
  ]);
  const [bookingStatuses] = useState<BookingStatus[]>(['Pendente', 'Confirmado', 'Cancelado', 'Concluído']);
  const [filters, setFilters] = useState({
    status: ['Pendente'] as BookingStatus[],
    dateRange: {
      startDate: new Date(),
      endDate: new Date()
    }
  });

  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth => new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(nextMonth => new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 1));
  };

  const handleSave = () => {
    // Implemente a lógica para salvar a nova reserva
    console.log('Salvando reserva:', formData);
    setIsCreateModalOpen(false);
    if (editingBooking) {
      setEditingBooking(null);
    }
    resetForm();
  };

  const handleDelete = () => {
    // Implemente a lógica para excluir a reserva
    console.log('Excluindo reserva:', editingBooking);
    setIsCreateModalOpen(false);
    setEditingBooking(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      guestName: '',
      checkIn: new Date(),
      checkOut: new Date(),
      roomNumber: '',
      status: 'Pendente',
      notes: ''
    });
  };

  const toggleStatusFilter = (status: BookingStatus) => {
    if (filters.status.includes(status)) {
      setFilters(prev => ({
        ...prev,
        status: prev.status.filter((s) => s !== status)
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        status: [...prev.status, status]
      }));
    }
  };

  const resetFilters = () => {
    setFilters({
      status: ['Pendente'] as BookingStatus[],
      dateRange: {
        startDate: new Date(),
        endDate: new Date()
      }
    });
  };

  const applyFilters = () => {
    // Implemente a lógica para aplicar os filtros
    console.log('Aplicando filtros:', filters);
  };

  // Componente interno para os botões do cabeçalho
  const HeaderButtons = () => {
    // Simulação de uso do media query (substituir quando o pacote estiver instalado)
    const isMobile = useMediaQuery({ maxWidth: 640 });
  
    return (
      <div className="flex flex-wrap items-center gap-2 justify-end">
        {isMobile ? (
          <>
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500 text-white"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={20} />
            </button>
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-500 text-white"
              onClick={() => setIsFilterModalOpen(true)}
            >
              <Filter size={20} />
            </button>
          </>
        ) : (
          <>
            <button
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} />
              <span>Adicionar Reserva</span>
            </button>
            <button
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-2"
              onClick={() => setIsFilterModalOpen(true)}
            >
              <Filter size={16} />
              <span>Filtros</span>
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white overflow-hidden">
      <div className="p-4 bg-gray-800 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Reservas do Hostel</h1>
          <HeaderButtons />
        </div>
        <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevMonth} 
              className="p-1.5 text-blue-400 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-white font-medium">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button 
              onClick={handleNextMonth} 
              className="p-1.5 text-blue-400 rounded-lg"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 sm:ml-auto">
            {Object.keys(colorScheme).map(status => (
              <div key={status} className="flex items-center gap-1 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: colorScheme[status as BookingStatus] }}
                />
                <span className="text-gray-300">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendário principal ou visualização da hospedagem */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Implementar visualização do calendário ou dos quartos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Exemplo de card de quarto */}
          {rooms.map(room => (
            <div key={room.id} className="bg-gray-800 rounded-lg overflow-hidden border border-white/10">
              <div className="p-4">
                <h3 className="font-medium">Quarto {room.number}</h3>
                <p className="text-sm text-gray-400">{room.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de filtros */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-800/95 z-10">
              <h2 className="text-lg font-medium">Filtrar Reservas</h2>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-full"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {filterOptions.status.map(status => (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
                      className={`py-2 px-3 rounded-lg text-sm ${
                        filters.status.includes(status)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-200 border border-white/10'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Período</label>
                <div className="space-y-2">
                  <SimpleDatePicker
                    label="De"
                    value={filters.dateRange.startDate}
                    onChange={(date: Date | null) => 
                      setFilters(prev => ({
                        ...prev, 
                        dateRange: {...prev.dateRange, startDate: date || new Date()}
                      }))
                    }
                  />
                  <SimpleDatePicker
                    label="Até"
                    value={filters.dateRange.endDate}
                    onChange={(date: Date | null) => 
                      setFilters(prev => ({
                        ...prev, 
                        dateRange: {...prev.dateRange, endDate: date || new Date()}
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-white/10 flex gap-2 sticky bottom-0 bg-gray-800/95">
              <button
                onClick={() => resetFilters()}
                className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-gray-700 flex-1 text-sm"
              >
                Limpar
              </button>
              <button
                onClick={() => {
                  applyFilters();
                  setIsFilterModalOpen(false);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex-1 text-sm"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de criação/edição */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-800/95 z-10">
              <h2 className="text-lg font-medium">
                {editingBooking ? 'Editar Reserva' : 'Nova Reserva'}
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingBooking(null);
                  resetForm();
                }}
                className="p-1.5 text-gray-400 hover:text-white rounded-full"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Hóspede</label>
                <input
                  type="text"
                  value={formData.guestName}
                  onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                  className="w-full bg-gray-700/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                  placeholder="Nome completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SimpleDatePicker
                  label="Check-in"
                  value={formData.checkIn}
                  onChange={(date: Date | null) => setFormData({...formData, checkIn: date || new Date()})}
                  required
                />
                <SimpleDatePicker
                  label="Check-out"
                  value={formData.checkOut}
                  onChange={(date: Date | null) => setFormData({...formData, checkOut: date || new Date()})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quarto</label>
                <select
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                  className="w-full bg-gray-700/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Selecione...</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.number}>
                      {room.number} - {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {bookingStatuses.map(status => (
                    <button
                      key={status}
                      onClick={() => setFormData({...formData, status})}
                      className={`py-2 px-3 rounded-lg text-sm ${
                        formData.status === status
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-200 border border-white/10'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-gray-700/50 border border-white/10 rounded-lg px-4 py-2 text-white h-24"
                  placeholder="Detalhes adicionais sobre a reserva..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-white/10 flex gap-2 sticky bottom-0 bg-gray-800/95">
              {editingBooking && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                >
                  Excluir
                </button>
              )}
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingBooking(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex-1 text-sm"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hostel; 