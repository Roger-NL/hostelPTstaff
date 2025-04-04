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
  User
} from 'lucide-react';
import type { Event } from '../types';
import SimpleDateTimePicker from '../components/SimpleDateTimePicker';

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

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

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

  const handleDelete = (eventId: string) => {
    deleteEvent(eventId);
    setShowConfirmDelete(null);
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

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col overflow-auto pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sticky top-0 bg-gray-900/80 backdrop-blur-sm py-2 z-10">
        <h2 className="text-lg xs:text-xl font-extralight text-white">Events</h2>
        {isAdmin && (
          <button
            onClick={() => {
              setFormData(initialFormData);
              setEditingEventId(null);
              setShowForm(true);
            }}
            className="h-9 px-2.5 xs:px-3 bg-green-500 text-white rounded-lg xs:rounded-xl shadow-md hover:bg-green-600 transition-colors flex items-center gap-1.5 text-xs xs:text-sm font-light"
          >
            <Plus size={16} />
            <span className="hidden xs:inline">Add Event</span>
            <span className="xs:hidden">Add</span>
          </button>
        )}
      </div>

      {/* Events Container */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 xs:p-4 sm:p-6 flex-1 overflow-auto">
        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6">
          {sortedEvents.map(event => (
            <div
              key={event.id}
              className="bg-gray-700/50 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/20 transition-all shadow-sm hover:shadow-md overflow-hidden"
            >
              {/* Event Header */}
              <div className="p-3 xs:p-4 border-b border-white/10 bg-gray-800/50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base xs:text-lg font-medium text-white mb-2 truncate pr-2">{event.title}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getEventStatusColor(event)} font-normal`}>
                        {event.status}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-600/50 text-gray-300 font-normal">
                        {event.type}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-1 bg-gray-700/50 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setShowConfirmDelete(event.id)}
                        className="p-1 bg-gray-700/50 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Content */}
              <div className="p-3 xs:p-4 space-y-3">
                <p className="text-xs xs:text-sm text-gray-300 leading-relaxed line-clamp-3">{event.description}</p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar size={14} className="text-gray-300 shrink-0" />
                    <span className="truncate">
                      {format(parseISO(event.startDate), 'MMM d, yyyy HH:mm')} -
                      {format(parseISO(event.endDate), 'MMM d, yyyy HH:mm')}
                    </span>
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
                        className="text-[10px] px-2 py-0.5 rounded-full bg-gray-600/50 text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Attendees */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-medium text-white/90">Attendees</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {event.attendees.length > 0 ? (
                      event.attendees.map(attendeeId => {
                        const attendee = users.find(u => u.id === attendeeId);
                        return attendee ? (
                          <div
                            key={attendeeId}
                            className="flex items-center gap-1 text-[10px] bg-gray-600/50 rounded-full px-2 py-0.5"
                          >
                            <User size={10} className="text-gray-300" />
                            <span className="text-gray-300">{attendee.name}</span>
                          </div>
                        ) : null;
                      })
                    ) : (
                      <span className="text-[10px] text-gray-400">No attendees yet</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  {event.status === 'upcoming' && (
                    <>
                      {isAdmin && (
                        <button
                          onClick={() => cancelEvent(event.id)}
                          className="px-2 py-1 text-xs bg-red-500/20 border border-red-500/10 text-red-300 rounded hover:bg-red-500/30 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      {user && (
                        <button
                          onClick={() => handleJoinLeave(event)}
                          disabled={event.capacity !== undefined && event.attendees.length >= event.capacity && !event.attendees.includes(user.id)}
                          className={`px-2 py-1 text-xs rounded transition-colors
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

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 xs:p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-4 xs:p-6 w-full max-w-2xl my-4">
            <div className="flex items-center justify-between mb-4 xs:mb-6">
              <h2 className="text-lg xs:text-xl font-semibold text-white">
                {editingEventId ? 'Edit Event' : 'Add Event'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialFormData);
                  setEditingEventId(null);
                }}
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 xs:space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4">
                <div className="col-span-2 bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                
                <div className="col-span-2 bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm h-24"
                    required
                  />
                </div>
                
                <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
                  <SimpleDateTimePicker
                    label="Start Date & Time"
                    value={new Date(formData.startDate)}
                    onChange={(value) => setFormData({ ...formData, startDate: value ? value.toISOString() : new Date().toISOString() })}
                    required
                  />
                </div>
                
                <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
                  <SimpleDateTimePicker
                    label="End Date & Time"
                    value={new Date(formData.endDate)}
                    onChange={(value) => setFormData({ ...formData, endDate: value ? value.toISOString() : new Date().toISOString() })}
                    required
                  />
                </div>
                
                <div className="col-span-2 bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
                
                <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as 'activity' | 'invitation' })}
                    className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="activity">Activity</option>
                    <option value="invitation">Invitation</option>
                  </select>
                </div>
                
                <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Capacity (optional)
                  </label>
                  <input
                    type="number"
                    value={formData.capacity || ''}
                    onChange={e => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    min="1"
                  />
                </div>
                
                <div className="col-span-2 bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2 max-h-20 overflow-y-auto">
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
                          className="hover:text-white"
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
                      className="flex-1 bg-gray-700/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
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
                      className="px-3 py-2 bg-gray-500 text-white rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData(initialFormData);
                    setEditingEventId(null);
                  }}
                  className="px-3 xs:px-4 py-2 text-white/60 hover:text-white transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 xs:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                  {editingEventId ? 'Update Event' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 xs:p-4">
          <div className="bg-gray-800 rounded-lg p-4 xs:p-6 w-full max-w-md">
            <h2 className="text-lg xs:text-xl font-semibold text-white mb-3">
              Delete Event
            </h2>
            <p className="text-sm text-white/80 mb-4 xs:mb-6">
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-3 xs:px-4 py-2 text-white/60 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showConfirmDelete)}
                className="px-3 xs:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}