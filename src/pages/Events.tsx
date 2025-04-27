import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Tag,
  Plus,
  Edit,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Trash,
  RefreshCw,
  ChevronDown,
  Filter
} from 'lucide-react';
import type { Event } from '../types';
import SimpleDateTimePicker from '../components/SimpleDateTimePicker';
import { toast } from 'react-hot-toast';
import * as eventService from '../services/event.service';
import usePerformanceOptimizer from '../hooks/usePerformanceOptimizer';

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  type: 'activity' | 'invitation';
  capacity?: number;
  tags?: string[];
  attendees?: string[];
  organizer?: string;
}

const initialFormData: EventFormData = {
  title: '',
  description: '',
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
  location: '',
  type: 'activity',
  capacity: undefined,
  tags: [],
  attendees: [],
  organizer: '',
};

export default function Events() {
  const {
    events,
    users,
    user,
    addEvent,
    updateEvent,
    deleteEvent,
    joinEvent,
    leaveEvent,
    cancelEvent
  } = useStore();

  // Aplicar otimização de performance
  const { shouldSimplifyUI } = usePerformanceOptimizer();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEventId) {
      updateEvent(editingEventId, formData);
    } else {
      const eventData = {
        ...formData,
        attendees: formData.attendees || [],
        organizer: formData.organizer || user?.id || '',
      };
      addEvent(eventData);
    }
    
    setFormData(initialFormData);
    setEditingEventId(null);
    setShowForm(false);
  };

  const handleEdit = (event: Event) => {
    setFormData({
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      type: event.type,
      capacity: event.capacity,
      tags: Array.isArray(event.tags) ? event.tags : [],
      attendees: event.attendees,
      organizer: event.organizer,
    });
    setEditingEventId(event.id);
    setShowForm(true);
  };

  const handleDelete = async (eventId: string) => {
    try {
      // Mostrar toast de carregamento
      const toastId = toast.loading('Excluindo evento...');
      
      // Tenta excluir o evento (isso agora retorna uma Promise)
      const success = await deleteEvent(eventId);
      
      // Se chegou aqui, a exclusão foi bem-sucedida
      if (success) {
        toast.success('Evento excluído com sucesso!', { id: toastId });
        setShowConfirmDelete(null);
      } else {
        // Falha na exclusão, mas sem erro crítico
        toast.error('Não foi possível excluir o evento. Tente novamente.', { id: toastId });
      }
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      // Erro crítico durante a exclusão
      toast.error('Erro ao excluir evento. Verifique sua conexão e tente novamente.', { id: 'delete-error' });
    }
  };

  const handleJoinLeave = (event: Event) => {
    if (!user) return;
    
    if (event.attendees.includes(user.id)) {
      leaveEvent(event.id, user.id);
    } else {
      joinEvent(event.id, user.id);
    }
  };

  const getEventStatusColor = (event: Event) => {
    switch (event.status) {
      case 'upcoming':
        return 'bg-orange-500/20 text-white';
      case 'ongoing':
        return 'bg-green-500/20 text-green-500';
      case 'completed':
        return 'bg-orange-300/20 text-white';
      case 'cancelled':
        return 'bg-red-500/20 text-white';
      default:
        return 'bg-orange-200/20 text-white';
    }
  };

  const getEventStatusIcon = (status: Event['status']) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="text-white" />;
      case 'ongoing':
        return <CheckCircle className="text-green-500" />;
      case 'completed':
        return <CheckCircle className="text-white" />;
      case 'cancelled':
        return <XCircle className="text-white" />;
      default:
        return <AlertTriangle className="text-white" />;
    }
  };

  const updateEventStatus = (event: Event) => {
    const now = new Date();
    const start = parseISO(event.startDate);
    const end = parseISO(event.endDate);

    if (event.status === 'cancelled') return;

    let newStatus: Event['status'] = event.status;

    if (isBefore(end, now)) {
      newStatus = 'completed';
    } else if (isAfter(now, start) && isBefore(now, end)) {
      newStatus = 'ongoing';
    } else {
      newStatus = 'upcoming';
    }

    if (newStatus !== event.status) {
      updateEvent(event.id, { status: newStatus });
    }
  };

  // Update event statuses
  events.forEach(updateEventStatus);

  // Sort events by start date
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Função para limpar eventos excluídos
  const handleCleanupEvents = async () => {
    if (!isAdmin) return;
    
    try {
      setIsCleaningUp(true);
      toast.loading('Limpando eventos excluídos...');
      
      const success = await eventService.cleanupDeletedEvents();
      
      if (success) {
        toast.success('Eventos excluídos foram limpos permanentemente');
        
        // Recarregar a lista de eventos
        window.location.reload();
      } else {
        toast.error('Falha ao limpar alguns eventos. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao limpar eventos:', error);
      toast.error('Erro ao limpar eventos excluídos');
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Função para excluir todos os eventos
  const handleDeleteAllEvents = async () => {
    if (!isAdmin) return;
    
    try {
      setIsDeletingAll(true);
      const toastId = toast.loading('Excluindo todos os eventos...');
      
      const success = await eventService.deleteAllEvents();
      
      if (success) {
        toast.success('Todos os eventos foram excluídos com sucesso!', { id: toastId });
        // Recarregar a página para obter um estado limpo
        window.location.reload();
      } else {
        toast.error('Falha ao excluir todos os eventos. Tente novamente.', { id: toastId });
      }
      
      setShowConfirmDeleteAll(false);
    } catch (error) {
      console.error('Erro ao excluir todos os eventos:', error);
      toast.error('Erro ao excluir todos os eventos.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-light text-orange-700">Eventos</h1>
        
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowConfirmDeleteAll(true)}
                className="p-2 bg-red-100 text-white rounded-lg hover:bg-red-200 transition-colors"
                disabled={isDeletingAll}
              >
                {isDeletingAll ? <RefreshCw className="animate-spin" size={20} /> : <Trash2 size={20} />}
              </button>
              
              <button
                onClick={handleCleanupEvents}
                className="p-2 bg-orange-100 text-white rounded-lg hover:bg-orange-200 transition-colors"
                disabled={isCleaningUp}
              >
                {isCleaningUp ? <RefreshCw className="animate-spin" size={20} /> : <Trash size={20} />}
              </button>
            </>
          )}
          
            <button
              onClick={() => {
                setFormData(initialFormData);
                setEditingEventId(null);
                setShowForm(true);
              }}
            className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg transition-colors"
            >
            <Plus size={20} />
            </button>
        </div>
      </div>

      {/* Events Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedEvents.map(event => (
            <div
              key={event.id}
            className="bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100 hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* Event Header */}
            <div className="p-4 border-b border-orange-100">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-medium text-orange-700 line-clamp-2">{event.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getEventStatusColor(event)}`}>
                  {event.status === 'upcoming' ? 'Próximo' :
                   event.status === 'ongoing' ? 'Em andamento' :
                   event.status === 'completed' ? 'Concluído' : 'Cancelado'}
                      </span>
                    </div>
              
              <p className="text-sm text-orange-600 line-clamp-2 mb-3">{event.description}</p>
              
              <div className="space-y-1 text-xs text-orange-600">
                <div className="flex items-center gap-1">
                  <Calendar size={14} className="text-orange-500" />
                  <span>{format(new Date(event.startDate), "dd/MM/yyyy 'às' HH:mm")}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-orange-500" />
                  <span>{event.location}</span>
              </div>

                <div className="flex items-center gap-1">
                  <Users size={14} className="text-orange-500" />
                    <span>
                    {event.attendees.length} participante{event.attendees.length !== 1 ? 's' : ''}
                    {event.capacity ? ` / ${event.capacity}` : ''}
                    </span>
                </div>
                  </div>
                </div>

            {/* Event Footer */}
            <div className="px-4 py-3">
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {event.tags.map((tag, index) => (
                    <span key={index} className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

              <div className="flex justify-between">
                {event.status !== 'cancelled' && event.status !== 'completed' ? (
                  <button
                    onClick={() => handleJoinLeave(event)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      event.attendees.includes(user?.id || '') 
                        ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                    } transition-colors`}
                  >
                    {event.attendees.includes(user?.id || '') ? 'Sair' : 'Participar'}
                  </button>
                ) : (
                  <div></div> 
                )}
                
                      {isAdmin && (
                  <div className="flex gap-2">
                        <button
                      onClick={() => handleEdit(event)}
                      className="p-1.5 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                      <Edit size={16} />
                        </button>
                        <button
                      onClick={() => setShowConfirmDelete(event.id)}
                      className="p-1.5 bg-red-100 text-white rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={16} />
                        </button>
                  </div>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-4 border-b border-orange-100">
              <h3 className="text-lg font-medium text-orange-700">
                {editingEventId ? 'Editar Evento' : 'Novo Evento'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-orange-600 mb-1">
                  Título
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    required
                  />
                </div>
                
              <div>
                <label className="block text-sm font-medium text-orange-600 mb-1">
                  Descrição
                  </label>
                  <textarea
                    value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 min-h-[100px]"
                    required
                  />
                </div>
                
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-orange-600 mb-1">
                    Data Início
                  </label>
                    <SimpleDateTimePicker
                      value={new Date(formData.startDate)}
                      onChange={(value) => setFormData({ ...formData, startDate: value ? value.toISOString() : new Date().toISOString() })}
                    />
                  </div>
                  
                <div>
                  <label className="block text-sm font-medium text-orange-600 mb-1">
                    Data Fim
                  </label>
                    <SimpleDateTimePicker
                      value={new Date(formData.endDate)}
                      onChange={(value) => setFormData({ ...formData, endDate: value ? value.toISOString() : new Date().toISOString() })}
                    />
                  </div>
                </div>
                
              <div>
                <label className="block text-sm font-medium text-orange-600 mb-1">
                  Local
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    required
                  />
                </div>
                
              <div>
                <label className="block text-sm font-medium text-orange-600 mb-1">
                  Tipo
                    </label>
                    <select
                      value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'activity' | 'invitation' })}
                  className="w-full p-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  required
                    >
                  <option value="activity">Atividade</option>
                  <option value="invitation">Convite</option>
                    </select>
                  </div>
                  
              <div>
                <label className="block text-sm font-medium text-orange-600 mb-1">
                  Capacidade
                    </label>
                    <input
                      type="number"
                      value={formData.capacity || ''}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || undefined })}
                  className="w-full p-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  placeholder="Ilimitado se vazio"
                      min="1"
                    />
                </div>
                
              <div>
                <label className="block text-sm font-medium text-orange-600 mb-1">
                    Tags
                  </label>
                <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="flex-1 p-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="Adicionar tag"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newTag.trim()) {
                          setFormData({
                            ...formData,
                            tags: [...(formData.tags || []), newTag.trim()]
                          });
                          setNewTag('');
                        }
                      }}
                    className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags?.map((tag, index) => (
                    <div key={index} className="bg-orange-100 text-orange-600 px-2 py-1 rounded-lg flex items-center">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            tags: formData.tags?.filter((_, i) => i !== index)
                          });
                        }}
                        className="ml-1 text-orange-600 hover:text-orange-700"
                      >
                        <X size={14} />
                    </button>
                  </div>
                  ))}
                </div>
            </div>
            
              <div className="flex justify-end pt-4 border-t border-orange-100">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialFormData);
                  setEditingEventId(null);
                }}
                  className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors mr-2"
              >
                  Cancelar
              </button>
              <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                  {editingEventId ? 'Atualizar' : 'Criar'}
              </button>
            </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-4 border-b border-orange-100">
              <h3 className="text-lg font-medium text-orange-700">Confirmar Exclusão</h3>
              </div>
            
            <div className="p-4">
              <p className="text-orange-600">Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.</p>
            </div>
            
            <div className="p-4 flex justify-end border-t border-orange-100">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors mr-2"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showConfirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete All Modal */}
      {showConfirmDeleteAll && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-4 border-b border-orange-100">
              <h3 className="text-lg font-medium text-orange-700">Excluir Todos os Eventos</h3>
              </div>
            
            <div className="p-4">
              <p className="text-orange-600 mb-2">Tem certeza que deseja excluir <strong>TODOS</strong> os eventos?</p>
              <p className="text-orange-600">Esta ação não pode ser desfeita!</p>
            </div>
            
            <div className="p-4 flex justify-end border-t border-orange-100">
              <button
                onClick={() => setShowConfirmDeleteAll(false)}
                className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors mr-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAllEvents}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir Todos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}