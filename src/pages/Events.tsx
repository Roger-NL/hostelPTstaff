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
        return 'bg-blue-500/20 text-blue-500';
      case 'ongoing':
        return 'bg-green-500/20 text-green-500';
      case 'completed':
        return 'bg-gray-500/20 text-gray-500';
      case 'cancelled':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getEventStatusIcon = (status: Event['status']) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="text-blue-500" />;
      case 'ongoing':
        return <CheckCircle className="text-green-500" />;
      case 'completed':
        return <CheckCircle className="text-gray-500" />;
      case 'cancelled':
        return <XCircle className="text-red-500" />;
      default:
        return <AlertTriangle className="text-yellow-500" />;
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
    <div className="page-container flex flex-col">
      {/* Header */}
      <div className="page-header flex flex-wrap items-center justify-between gap-2 p-3 z-10 bg-gray-900/80 backdrop-blur-sm">
        <h2 className="text-lg xs:text-xl font-extralight text-white">Events</h2>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowConfirmDeleteAll(true)}
                disabled={isDeletingAll}
                className="h-9 px-2 xs:px-3 bg-pink-700/50 text-white rounded-lg text-xs flex items-center gap-1.5 hover:bg-pink-700/70 transition-all disabled:opacity-50"
              >
                {isDeletingAll ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                <span className="hidden xs:inline">Reset</span>
              </button>
              <button
                onClick={handleCleanupEvents}
                disabled={isCleaningUp}
                className="h-9 px-2 xs:px-3 bg-red-500/50 text-white rounded-lg text-xs flex items-center gap-1.5 hover:bg-red-500/70 transition-all disabled:opacity-50"
              >
                {isCleaningUp ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Trash size={16} />
                )}
                <span className="hidden xs:inline">Limpar</span>
              </button>
            </>
          )}
          {isAdmin && (
            <button
              onClick={() => {
                setFormData(initialFormData);
                setEditingEventId(null);
                setShowForm(true);
              }}
              className="h-9 px-2 xs:px-3 bg-green-500 text-white rounded-lg text-xs flex items-center gap-1.5 hover:bg-green-600 transition-all"
            >
              <Plus size={16} />
              <span className="hidden xs:inline">Add Event</span>
              <span className="xs:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Events Content */}
      <div className="page-content bg-gray-800/50 backdrop-blur-sm rounded-lg p-3">
        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4">
          {sortedEvents.map(event => (
            <div
              key={event.id}
              className="bg-gray-700/50 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/20 transition-all shadow-sm hover:shadow-md overflow-hidden"
            >
              {/* Event Header - improved touch targets and spacing */}
              <div className="p-3 border-b border-white/10 bg-gray-800/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-white mb-2 truncate">{event.title}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getEventStatusColor(event)} font-normal flex items-center gap-1`}>
                        {getEventStatusIcon(event.status)}
                        <span>{event.status}</span>
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-600/50 text-gray-300 font-normal">
                        {event.type}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 bg-gray-700/50 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setShowConfirmDelete(event.id)}
                        className="p-2 bg-gray-700/50 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Content - better spacing and readability */}
              <div className="p-3 space-y-3">
                <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">{event.description}</p>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar size={14} className="text-gray-300 shrink-0" />
                    <div className="truncate">
                      <div>{format(parseISO(event.startDate), 'MMM d, yyyy')}</div>
                      <div className="text-gray-400">{format(parseISO(event.startDate), 'HH:mm')} - {format(parseISO(event.endDate), 'HH:mm')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin size={14} className="text-gray-300 shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users size={14} className="text-gray-300 shrink-0" />
                    <span>
                      {event.attendees.length}{event.capacity ? `/${event.capacity}` : ''} attending
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {Array.isArray(event.tags) && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {event.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded-full bg-gray-600/50 text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Attendees - collapsed by default on mobile */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-white/90">Attendees</h4>
                  </div>
                  
                  <div className="flex items-center flex-wrap gap-1.5">
                    {event.attendees.length > 0 ? (
                      event.attendees.slice(0, 3).map(attendeeId => {
                        const attendee = users.find(u => u.id === attendeeId);
                        return attendee ? (
                          <div
                            key={attendeeId}
                            className="flex items-center gap-1 text-xs bg-gray-600/50 rounded-full px-2 py-1"
                          >
                            <User size={12} className="text-gray-300" />
                            <span className="text-gray-300">{attendee.name}</span>
                          </div>
                        ) : null;
                      })
                    ) : (
                      <span className="text-xs text-gray-400">No attendees yet</span>
                    )}
                    
                    {event.attendees.length > 3 && (
                      <div className="text-xs bg-gray-600/50 rounded-full px-2 py-1 text-gray-300">
                        +{event.attendees.length - 3} more
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions - larger touch targets */}
                <div className="flex justify-end gap-2 pt-2">
                  {event.status === 'upcoming' && (
                    <>
                      {isAdmin && (
                        <button
                          onClick={() => cancelEvent(event.id)}
                          className="px-3 py-1.5 text-xs bg-red-500/20 border border-red-500/10 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      {user && (
                        <button
                          onClick={() => handleJoinLeave(event)}
                          disabled={event.capacity !== undefined && event.attendees.length >= event.capacity && !event.attendees.includes(user.id)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors
                            ${event.attendees.includes(user.id)
                              ? 'bg-red-500/20 border border-red-500/10 text-red-300 hover:bg-red-500/30'
                              : 'bg-green-500 text-white hover:bg-green-600'}`}
                        >
                          {event.attendees.includes(user.id) ? 'Leave' : 'Join'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Empty state */}
        {sortedEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center mb-3">
              <Calendar size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-400 text-sm">No events scheduled yet</p>
          </div>
        )}
      </div>

      {/* Event Form Modal - optimized for mobile */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg w-full max-w-xl my-2 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-3 xs:p-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <h2 className="text-base xs:text-lg font-medium text-white">
                {editingEventId ? 'Edit Event' : 'Add Event'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialFormData);
                  setEditingEventId(null);
                }}
                className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Scrollable form content */}
            <div className="flex-1 overflow-y-auto content-scrollable p-3 xs:p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Title field */}
                <div className="bg-gray-700/50 rounded-lg p-3 border border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm"
                    required
                  />
                </div>
                
                {/* Description field */}
                <div className="bg-gray-700/50 rounded-lg p-3 border border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm h-20"
                    required
                  />
                </div>
                
                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-700/50 rounded-lg p-3 border border-white/10">
                    <SimpleDateTimePicker
                      label="Start Date & Time"
                      value={new Date(formData.startDate)}
                      onChange={(value) => setFormData({ ...formData, startDate: value ? value.toISOString() : new Date().toISOString() })}
                      required
                    />
                  </div>
                  
                  <div className="bg-gray-700/50 rounded-lg p-3 border border-white/10">
                    <SimpleDateTimePicker
                      label="End Date & Time"
                      value={new Date(formData.endDate)}
                      onChange={(value) => setFormData({ ...formData, endDate: value ? value.toISOString() : new Date().toISOString() })}
                      required
                    />
                  </div>
                </div>
                
                {/* Location field */}
                <div className="bg-gray-700/50 rounded-lg p-3 border border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm"
                    required
                  />
                </div>
                
                {/* Type and Capacity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-700/50 rounded-lg p-3 border border-white/10">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as 'activity' | 'invitation' })}
                      className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm"
                    >
                      <option value="activity">Activity</option>
                      <option value="invitation">Invitation</option>
                    </select>
                  </div>
                  
                  <div className="bg-gray-700/50 rounded-lg p-3 border border-white/10">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Capacity (optional)
                    </label>
                    <input
                      type="number"
                      value={formData.capacity || ''}
                      onChange={e => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm"
                      min="1"
                    />
                  </div>
                </div>
                
                {/* Tags field */}
                <div className="bg-gray-700/50 rounded-lg p-3 border border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2 max-h-16 overflow-y-auto">
                    {formData.tags?.map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded-full bg-gray-600/50 text-gray-300 flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            tags: formData.tags?.filter(t => t !== tag)
                          })}
                          className="hover:text-white p-0.5"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      className="flex-1 bg-gray-700/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm"
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newTag.trim()) {
                            setFormData({
                              ...formData,
                              tags: [...(formData.tags || []), newTag.trim()]
                            });
                            setNewTag('');
                          }
                        }
                      }}
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
                      className="px-3 py-2.5 bg-gray-500 text-white rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>
            </div>
            
            {/* Form actions - fixed at bottom */}
            <div className="p-3 xs:p-4 border-t border-white/10 shrink-0 bg-gray-800/90 backdrop-blur-md flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialFormData);
                  setEditingEventId(null);
                }}
                className="px-4 py-2.5 text-white/60 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              >
                {editingEventId ? 'Update Event' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - mobile optimized */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-xs sm:max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <h2 className="text-lg font-medium text-white">
                Delete Event
              </h2>
            </div>
            <p className="text-sm text-white/80 mb-5 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2.5 text-white/60 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showConfirmDelete)}
                className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal - mobile optimized */}
      {showConfirmDeleteAll && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-xs sm:max-w-sm border border-pink-500/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Trash2 size={20} className="text-pink-400" />
              </div>
              <h2 className="text-lg font-medium text-white">
                Reset Events
              </h2>
            </div>
            <p className="text-sm text-white/80 mb-5 bg-pink-900/30 p-3 rounded-lg border border-pink-500/20">
              <span className="font-bold text-pink-300 block mb-1">WARNING:</span>
              This action will permanently delete ALL events from the system. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDeleteAll(false)}
                className="px-4 py-2.5 text-white/60 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllEvents}
                disabled={isDeletingAll}
                className="px-4 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                {isDeletingAll ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Confirm Reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}