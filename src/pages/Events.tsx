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
    <div className="p-3 sm:p-6 min-h-screen bg-gradient-to-br from-gray-900/30 to-gray-800/30 backdrop-blur-lg font-inter relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 -left-20 w-80 h-80 rounded-full bg-gray-500/20 blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-gray-600/20 blur-3xl"></div>
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-full max-w-4xl h-60 rounded-full bg-gray-700/20 blur-3xl"></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 space-y-6">
        {/* Header and Add Event Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-thin text-white tracking-wider">Events</h2>
          {isAdmin && (
            <button
              onClick={() => {
                setFormData(initialFormData);
                setEditingEventId(null);
                setShowForm(true);
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-500/80 text-white rounded-xl hover:bg-gray-500 hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300 backdrop-blur-sm w-full sm:w-auto font-thin"
            >
              <Plus size={20} />
              Add Event
            </button>
          )}
        </div>

        {/* Events Container */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/10 shadow-xl">
          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEvents.map(event => (
              <div
                key={event.id}
                className="bg-white/10 backdrop-blur-xl rounded-xl overflow-hidden border border-white/10 shadow-md hover:shadow-lg hover:bg-white/15 transition-all duration-300"
              >
                {/* Event Header */}
                <div className="p-5 border-b border-white/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-thin text-white mb-3">{event.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${getEventStatusColor(event)} font-extralight backdrop-blur-sm`}>
                          {event.status}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-500/20 text-gray-300 font-extralight backdrop-blur-sm border border-gray-500/10">
                          {event.type}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="text-gray-400 hover:text-gray-300 p-1.5 rounded-xl hover:bg-gray-400/10 transition-all duration-300 hover:shadow-md"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setShowConfirmDelete(event.id)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-xl hover:bg-red-400/10 transition-all duration-300 hover:shadow-md"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Content */}
                <div className="p-5 space-y-4">
                  <p className="text-sm text-gray-200 leading-relaxed font-thin">{event.description}</p>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2.5 text-gray-300">
                      <Calendar size={16} className="text-gray-300" />
                      <span className="font-extralight">
                        {format(parseISO(event.startDate), 'MMM d, yyyy HH:mm')} -
                        {format(parseISO(event.endDate), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-300">
                      <MapPin size={16} className="text-gray-300" />
                      <span className="font-extralight">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-300">
                      <Users size={16} className="text-gray-300" />
                      <span className="font-extralight">
                        {event.attendees.length}{event.capacity ? `/${event.capacity}` : ''} attending
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {Array.isArray(event.tags) && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-xs px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-300 font-extralight backdrop-blur-sm border border-gray-500/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Attendees */}
                  <div className="space-y-2.5">
                    <h4 className="text-sm font-thin text-white/90">Attendees</h4>
                    <div className="flex flex-wrap gap-2">
                      {event.attendees.length > 0 ? (
                        event.attendees.map(attendeeId => {
                          const attendee = users.find(u => u.id === attendeeId);
                          return attendee ? (
                            <div
                              key={attendeeId}
                              className="flex items-center gap-1.5 text-xs bg-gray-700/30 border border-white/5 rounded-full px-3 py-1.5"
                            >
                              <User size={12} className="text-gray-300" />
                              <span className="text-gray-300 font-extralight">{attendee.name}</span>
                            </div>
                          ) : null;
                        })
                      ) : (
                        <span className="text-xs text-gray-400 font-extralight">No attendees yet</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-3">
                    {event.status === 'upcoming' && (
                      <>
                        {isAdmin && (
                          <button
                            onClick={() => cancelEvent(event.id)}
                            className="px-3 py-1.5 text-sm bg-red-500/20 border border-red-500/10 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-300 backdrop-blur-sm font-thin"
                          >
                            Cancel Event
                          </button>
                        )}
                        {user && (
                          <button
                            onClick={() => handleJoinLeave(event)}
                            disabled={event.capacity !== undefined && event.attendees.length >= event.capacity && !event.attendees.includes(user.id)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-300 backdrop-blur-sm font-thin
                              ${event.attendees.includes(user.id)
                                ? 'bg-red-500/20 border border-red-500/10 text-red-300 hover:bg-red-500/30'
                                : 'bg-gray-500/80 hover:bg-gray-500 text-white hover:shadow-lg hover:shadow-gray-500/20'}`}
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
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Calendar size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-400 font-extralight text-center">No events scheduled yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/80 backdrop-blur-xl rounded-xl p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-thin text-white/90 tracking-wide">
                {editingEventId ? 'Edit Event' : 'Add New Event'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialFormData);
                  setEditingEventId(null);
                }}
                className="text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-2 bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                  <label className="block text-sm font-thin text-gray-300/90 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white/90 text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500/30 font-thin"
                    required
                  />
                </div>
                
                <div className="col-span-2 bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                  <label className="block text-sm font-thin text-gray-300/90 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white/90 text-sm sm:text-base h-24 font-thin placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500/30"
                    required
                  />
                </div>
                
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                  <SimpleDateTimePicker
                    label="Start Date & Time"
                    value={new Date(formData.startDate)}
                    onChange={(value) => setFormData({ ...formData, startDate: value ? value.toISOString() : new Date().toISOString() })}
                    required
                  />
                </div>
                
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                  <SimpleDateTimePicker
                    label="End Date & Time"
                    value={new Date(formData.endDate)}
                    onChange={(value) => setFormData({ ...formData, endDate: value ? value.toISOString() : new Date().toISOString() })}
                    required
                  />
                </div>
                
                <div className="col-span-2 bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                  <label className="block text-sm font-thin text-gray-300/90 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white/90 text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500/30 font-thin"
                    required
                  />
                </div>
                
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                  <label className="block text-sm font-thin text-gray-300/90 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as 'activity' | 'invitation' })}
                    className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white/90 text-sm sm:text-base font-thin focus:outline-none focus:ring-2 focus:ring-gray-500/30"
                  >
                    <option value="activity">Activity</option>
                    <option value="invitation">Invitation</option>
                  </select>
                </div>
                
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                  <label className="block text-sm font-thin text-gray-300/90 mb-2">
                    Capacity (optional)
                  </label>
                  <input
                    type="number"
                    value={formData.capacity || ''}
                    onChange={e => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white/90 text-sm sm:text-base font-thin focus:outline-none focus:ring-2 focus:ring-gray-500/30"
                    min="1"
                  />
                </div>
                
                <div className="col-span-2 bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                  <label className="block text-sm font-thin text-gray-300/90 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2 max-h-20 overflow-y-auto">
                    {formData.tags?.map(tag => (
                      <span
                        key={tag}
                        className="text-xs sm:text-sm px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            tags: formData.tags?.filter(t => t !== tag)
                          })}
                          className="hover:text-gray-300"
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
                      className="flex-1 bg-gray-700/30 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white/90 text-sm sm:text-base font-thin placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500/30"
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
                      className="px-3 sm:px-4 py-2 bg-gray-500/80 hover:bg-gray-500 text-white rounded-lg hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300 text-sm sm:text-base font-thin"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData(initialFormData);
                    setEditingEventId(null);
                  }}
                  className="px-4 py-2.5 text-white/60 hover:text-white transition-colors text-sm sm:text-base font-thin"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gray-500/80 hover:bg-gray-500 text-white rounded-lg hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300 text-sm sm:text-base font-thin"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/80 backdrop-blur-xl rounded-xl p-5 sm:p-6 w-full max-w-md border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <AlertTriangle size={24} />
              <h2 className="text-lg sm:text-xl font-thin text-white">
                Delete Event
              </h2>
            </div>
            <p className="text-sm sm:text-base text-white/80 mb-5 sm:mb-6 font-thin">
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2.5 text-white/60 hover:text-white transition-colors text-sm sm:text-base font-thin"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showConfirmDelete)}
                className="px-4 py-2.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 text-sm sm:text-base font-thin"
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