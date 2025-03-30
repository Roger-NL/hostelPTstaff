import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { translations } from '../i18n/translations';
import {
  Plus,
  Trash2,
  Award,
  Edit,
  Clock,
  AlertCircle,
  User,
  MessageSquare,
  CheckSquare,
  Tag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  X,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import type { Task, TaskComment, TaskChecklistItem } from '../types';

interface TaskFormData {
  title: string;
  description: string;
  points: number;
  priority: Task['priority'];
  dueDate: string;
  assignedTo?: string[];
  tags?: string[];
  type: 'hostel' | 'personal';
  isPrivate?: boolean;
}

const initialFormData: TaskFormData = {
  title: '',
  description: '',
  points: 10,
  priority: 'medium',
  dueDate: new Date().toISOString().split('T')[0],
  assignedTo: [],
  tags: [],
  type: 'hostel',
  isPrivate: false
};

export default function Tasks() {
  const {
    tasks,
    users,
    user,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    assignTask,
    addTaskComment,
    deleteTaskComment,
    addTaskChecklistItem,
    toggleTaskChecklistItem,
    deleteTaskChecklistItem,
    addTaskTag,
    removeTaskTag
  } = useStore();
  
  const t = translations['en'];
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';
  const volunteers = users.filter(u => u.role === 'user');

  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask?.id]);

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    moveTask(taskId, newStatus);
    setShowStatusDropdown(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTaskId) {
      updateTask(editingTaskId, formData);
    } else {
      addTask(formData);
    }
    
    setFormData(initialFormData);
    setEditingTaskId(null);
    setShowForm(false);
  };

  const handleEdit = (task: Task) => {
    console.log('Editing task:', task);
    setFormData({
      title: task.title,
      description: task.description,
      points: task.points,
      priority: task.priority,
      dueDate: task.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      assignedTo: Array.isArray(task.assignedTo) ? [...task.assignedTo] : [],
      tags: Array.isArray(task.tags) ? [...task.tags] : [],
      type: task.type,
      isPrivate: task.isPrivate
    });
    setEditingTaskId(task.id);
    setShowForm(true);
  };

  const handleDelete = (taskId: string) => {
    deleteTask(taskId);
    setShowConfirmDelete(null);
    setSelectedTask(null);
  };

  const handleAddComment = (taskId: string) => {
    if (!newComment.trim()) return;
    addTaskComment(taskId, newComment);
    setNewComment('');
  };

  const handleAddChecklistItem = (taskId: string) => {
    if (!newChecklistItem.trim()) return;
    addTaskChecklistItem(taskId, newChecklistItem);
    setNewChecklistItem('');
  };

  const handleAddTag = (taskId: string) => {
    if (!newTag.trim()) return;
    addTaskTag(taskId, newTag);
    setNewTag('');
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-400/15 text-red-400';
      case 'medium':
        return 'bg-amber-400/15 text-amber-400';
      case 'low':
        return 'bg-emerald-400/15 text-emerald-400';
      default:
        return 'bg-gray-400/15 text-gray-400';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="text-emerald-400" />;
      case 'inProgress':
        return <AlertTriangle className="text-amber-400" />;
      default:
        return <XCircle className="text-gray-400" />;
    }
  };

  const TaskCard = ({ task, index }: { task: Task; index: number }) => (
    <div
      className="group bg-white/10 backdrop-blur-xl rounded-xl shadow-md border border-white/10 shadow-white/5 select-none hover:bg-white/15 hover:shadow-lg transition-all duration-300"
      onClick={() => setSelectedTask(task)}
    >
      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 border-b border-white/5">
        <h4 className="font-extralight text-white flex items-center gap-2 flex-1 text-sm sm:text-base tracking-wide">
          {task.title}
          <span className={`text-xs px-2.5 py-1 rounded-full ${getPriorityColor(task.priority)} font-extralight backdrop-blur-sm`}>
            {task.priority}
          </span>
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusDropdown(showStatusDropdown === task.id ? null : task.id);
              }}
              className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 hover:shadow-md transition-all duration-300 font-medium backdrop-blur-sm"
            >
              {getStatusIcon(task.status)}
              <span className="text-white">{task.status}</span>
              <ChevronDown size={14} className="text-white/70" />
            </button>
            {showStatusDropdown === task.id && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowStatusDropdown(null)}
                />
                <div 
                  className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-44 bg-white/10 backdrop-blur-2xl rounded-xl shadow-xl z-50 border border-white/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleStatusChange(task.id, 'todo')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/20 text-white flex items-center gap-2 font-medium transition-all duration-300 first:rounded-t-xl"
                  >
                    <XCircle size={16} className="text-gray-200" />
                    <span>To Do</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(task.id, 'inProgress')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/20 text-white flex items-center gap-2 font-medium transition-all duration-300"
                  >
                    <AlertTriangle size={16} className="text-amber-300" />
                    <span>In Progress</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(task.id, 'done')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/20 text-white flex items-center gap-2 font-medium transition-all duration-300 last:rounded-b-xl"
                  >
                    <CheckCircle2 size={16} className="text-emerald-300" />
                    <span>Done</span>
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center text-amber-400 text-xs sm:text-sm font-medium">
            <Award size={16} className="mr-1 transition-transform group-hover:scale-110 duration-300" />
            <span>{task.points}</span>
          </div>
          {isAdmin && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(task);
                }}
                className="text-gray-400 hover:text-gray-300 p-1.5 rounded-xl hover:bg-gray-400/10 transition-all duration-300 hover:shadow-md"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirmDelete(task.id);
                }}
                className="text-red-400 hover:text-red-300 p-1.5 rounded-xl hover:bg-red-400/10 transition-all duration-300 hover:shadow-md"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-xs sm:text-sm text-gray-200 mb-3 sm:mb-4 leading-relaxed group-hover:text-white transition-colors duration-300">
          {task.description}
        </p>
        
        {Array.isArray(task.tags) && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {task.tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-300 font-extralight backdrop-blur-sm border border-gray-500/10"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-gray-300" />
            <span className="font-extralight text-gray-300">
              {format(new Date(task.dueDate || new Date()), 'MMM d, yyyy')}
            </span>
          </div>
          
          {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 && (
            <div className="flex items-center gap-1.5">
              <User size={14} className="text-gray-300" />
              <span className="font-extralight text-gray-300">
                {task.assignedTo.map(id => 
                  users.find(u => u.id === id)?.name.split(' ')[0]
                ).join(', ')}
              </span>
            </div>
          )}
          
          {task.status === 'todo' && new Date(task.dueDate || new Date()) < new Date() && (
            <div className="flex items-center gap-1.5 text-red-400 font-medium">
              <AlertCircle size={14} />
              <span>Overdue</span>
            </div>
          )}
          
          <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
            {Array.isArray(task.comments) && task.comments.length > 0 && (
              <div className="flex items-center gap-1.5 text-gray-400 font-medium">
                <MessageSquare size={14} />
                <span>{task.comments.length}</span>
              </div>
            )}
            {Array.isArray(task.checklist) && task.checklist.length > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckSquare size={14} />
                <span>
                  {task.checklist.filter(item => item.completed).length}/{task.checklist.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const TaskColumn = ({ status, title }: { status: Task['status'], title: string }) => {
    const tasksInColumn = tasks.filter(t => t.status === status);
    
    return (
      <div className="flex-1 min-w-[280px] sm:min-w-[300px] bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 flex flex-col">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-thin text-white tracking-wide">{title}</h3>
          <span className="text-xs sm:text-sm text-white/80 font-thin px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm">
            {tasksInColumn.length}
          </span>
        </div>
        
        {tasksInColumn.length > 0 ? (
          <div className="space-y-3 sm:space-y-4 flex-1">
            {tasksInColumn.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-3">
                {status === 'todo' ? (
                  <XCircle size={24} className="text-gray-400" />
                ) : status === 'inProgress' ? (
                  <AlertTriangle size={24} className="text-gray-400" />
                ) : (
                  <CheckCircle2 size={24} className="text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-400 font-extralight">
                No {title.toLowerCase()} tasks
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-6 min-h-screen bg-gradient-to-br from-gray-900/30 to-gray-800/30 backdrop-blur-lg font-inter relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 -left-20 w-80 h-80 rounded-full bg-gray-500/20 blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-gray-600/20 blur-3xl"></div>
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-full max-w-4xl h-60 rounded-full bg-gray-700/20 blur-3xl"></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-thin text-white tracking-wider">Task Management</h2>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-500/80 text-white rounded-xl hover:bg-gray-500 hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300 backdrop-blur-sm w-full sm:w-auto font-thin"
            >
              <Plus size={20} />
              Add Task
            </button>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/10 shadow-xl mb-6">
          <h2 className="text-xl font-thin text-white/90 mb-6 tracking-wide">Tasks</h2>
          <div className="flex flex-col lg:flex-row gap-6">
            <TaskColumn status="todo" title="To Do" />
            <TaskColumn status="inProgress" title="In Progress" />
            <TaskColumn status="done" title="Done" />
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-thin text-white/90 tracking-wide">
                {editingTaskId ? 'Edit Task' : 'Add New Task'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialFormData);
                  setEditingTaskId(null);
                }}
                className="text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:gap-5">
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
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
                
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                    <label className="block text-sm font-thin text-gray-300/90 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                      className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white/90 text-sm sm:text-base font-thin focus:outline-none focus:ring-2 focus:ring-gray-500/30"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                    <label className="block text-sm font-thin text-gray-300/90 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
                      className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white/90 text-sm sm:text-base font-thin focus:outline-none focus:ring-2 focus:ring-gray-500/30"
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                    <label className="block text-sm font-thin text-gray-300/90 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white/90 text-sm sm:text-base font-thin focus:outline-none focus:ring-2 focus:ring-gray-500/30"
                      required
                    />
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                    <label className="block text-sm font-thin text-gray-300/90 mb-2">
                      Assign To
                    </label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 mb-2 max-h-20 overflow-y-auto">
                        {formData.assignedTo?.map(userId => {
                          const volunteer = volunteers.find(v => v.id === userId);
                          return volunteer ? (
                            <div
                              key={userId}
                              className="flex items-center gap-2 bg-gray-700/30 rounded-lg p-2"
                            >
                              <div className="w-6 h-6 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400 text-sm font-thin">
                                {volunteer.name[0]}
                              </div>
                              <span className="text-sm text-white font-thin">{volunteer.name}</span>
                              <button
                                onClick={() => {
                                  const newAssignedTo = formData.assignedTo?.filter(id => id !== userId) || [];
                                  setFormData({ ...formData, assignedTo: newAssignedTo });
                                }}
                                className="text-red-400 hover:text-red-300 p-1"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                      <select
                        className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white/90 text-sm sm:text-base font-thin focus:outline-none focus:ring-2 focus:ring-gray-500/30"
                        onChange={(e) => {
                          const userId = e.target.value;
                          if (userId && !formData.assignedTo?.includes(userId)) {
                            const newAssignedTo = [...(formData.assignedTo || []), userId];
                            setFormData({ ...formData, assignedTo: newAssignedTo });
                          }
                          e.target.value = ''; // Reset select after adding
                        }}
                        value=""
                      >
                        <option value="">Add volunteer...</option>
                        {volunteers
                          .filter(v => !formData.assignedTo?.includes(v.id))
                          .map(volunteer => (
                            <option key={volunteer.id} value={volunteer.id}>
                              {volunteer.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                  <label className="block text-sm font-thin text-gray-300/90 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2 max-h-20 overflow-y-auto">
                    {formData.tags?.map(tag => (
                      <span
                        key={tag}
                        className="text-xs sm:text-sm px-2 py-1 rounded-full bg-gray-500/20 text-gray-300 flex items-center gap-1"
                      >
                        {tag}
                        <button
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
                    setEditingTaskId(null);
                  }}
                  className="px-4 py-2.5 text-white/60 hover:text-white transition-colors text-sm sm:text-base font-thin"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gray-500/80 hover:bg-gray-500 text-white rounded-lg hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300 text-sm sm:text-base font-thin"
                >
                  {editingTaskId ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xl flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1c1e]/80 backdrop-blur-2xl rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/10">
            <div className="p-5 sm:p-6 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-thin text-white/90 mb-3 tracking-wide">
                    {selectedTask.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-400/90">
                    <div className="flex items-center gap-1.5">
                      <Clock size={16} />
                      <span className="font-extralight">
                        {format(new Date(selectedTask.dueDate || new Date()), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award size={16} />
                      <span className="font-extralight text-amber-400/90">{selectedTask.points} points</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/[0.08] transition-all duration-300"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-5 sm:space-y-6">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                    <h3 className="text-lg sm:text-xl font-thin text-white/90 mb-3 tracking-wide">Description</h3>
                    <p className="text-sm sm:text-base text-gray-300/90 leading-relaxed font-thin">{selectedTask.description}</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                    <h3 className="text-lg sm:text-xl font-thin text-white/90 mb-3 tracking-wide">Checklist</h3>
                    <div className="space-y-2">
                      {Array.isArray(selectedTask.checklist) && selectedTask.checklist.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 group"
                        >
                          <button
                            onClick={() => toggleTaskChecklistItem(selectedTask.id, item.id)}
                            className={`flex items-center gap-2 flex-1 p-3 rounded-xl hover:bg-white/5 text-sm sm:text-base transition-colors
                              ${item.completed ? 'text-gray-500 line-through' : 'text-white'}`}
                          >
                            <CheckSquare
                              size={16}
                              className={item.completed ? 'text-emerald-400' : 'text-gray-400'}
                            />
                            {item.content}
                          </button>
                          <button
                            onClick={() => deleteTaskChecklistItem(selectedTask.id, item.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={newChecklistItem}
                        onChange={e => setNewChecklistItem(e.target.value)}
                        placeholder="Add checklist item"
                        className="flex-1 bg-gray-700/30 border border-white/10 rounded-xl px-4 py-2.5 text-white/90 text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500/30 font-thin"
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddChecklistItem(selectedTask.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddChecklistItem(selectedTask.id)}
                        className="px-4 py-2.5 bg-gray-500/80 hover:bg-gray-500 text-white rounded-xl hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300 font-thin"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                    <h3 className="text-lg sm:text-xl font-thin text-white/90 mb-3 tracking-wide">Tags</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.isArray(selectedTask.tags) && selectedTask.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-sm px-3 py-1.5 rounded-full bg-gray-500/15 text-gray-300 flex items-center gap-1.5 font-thin backdrop-blur-sm"
                        >
                          {tag}
                          <button
                            onClick={() => removeTaskTag(selectedTask.id, tag)}
                            className="hover:text-gray-300 p-1 rounded-full hover:bg-gray-500/10 transition-colors"
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
                        className="flex-1 bg-gray-700/30 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white/90 text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500/30 font-thin"
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newTag.trim()) {
                              addTaskTag(selectedTask.id, newTag.trim());
                              setNewTag('');
                            }
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newTag.trim()) {
                            addTaskTag(selectedTask.id, newTag.trim());
                            setNewTag('');
                          }
                        }}
                        className="px-3 py-2 bg-gray-500/80 hover:bg-gray-500 text-white rounded-lg hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300 font-thin"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 sm:space-y-6">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                    <h3 className="text-lg sm:text-xl font-thin text-white/90 mb-3 tracking-wide">Assigned To</h3>
                    <div className="space-y-2 mb-3">
                      {Array.isArray(selectedTask.assignedTo) && selectedTask.assignedTo.map(userId => {
                        const assignedUser = users.find(u => u.id === userId);
                        return assignedUser ? (
                          <div
                            key={userId}
                            className="flex items-center justify-between bg-gray-700/50 rounded-lg p-2"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400 font-thin">
                                {assignedUser.name[0]}
                              </div>
                              <span className="text-sm sm:text-base text-white font-thin">{assignedUser.name}</span>
                            </div>
                            <button
                              onClick={() => {
                                const newAssignedTo = selectedTask.assignedTo?.filter(id => id !== userId) || [];
                                console.log('Removing user from task:', { userId, newAssignedTo });
                                updateTask(selectedTask.id, { assignedTo: newAssignedTo });
                              }}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 bg-gray-700/50 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white/90 text-sm sm:text-base font-thin"
                        onChange={(e) => {
                          const userId = e.target.value;
                          if (userId && !selectedTask.assignedTo?.includes(userId)) {
                            const newAssignedTo = [...(selectedTask.assignedTo || []), userId];
                            console.log('Adding user to task:', { userId, newAssignedTo });
                            updateTask(selectedTask.id, { assignedTo: newAssignedTo });
                          }
                          e.target.value = ''; // Reset select after adding
                        }}
                        value=""
                      >
                        <option value="">Add volunteer...</option>
                        {volunteers
                          .filter(v => !selectedTask.assignedTo?.includes(v.id))
                          .map(volunteer => (
                            <option key={volunteer.id} value={volunteer.id}>
                              {volunteer.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5">
                    <h3 className="text-lg sm:text-xl font-thin text-white/90 mb-3 tracking-wide">Comments</h3>
                    <div className="space-y-3 sm:space-y-4 mb-4">
                      {Array.isArray(selectedTask.comments) && selectedTask.comments.map(comment => {
                        const commentUser = users.find(u => u.id === comment.userId);
                        return (
                          <div
                            key={comment.id}
                            className="bg-gray-700/50 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <User size={14} className="text-gray-400" />
                                <span className="text-xs sm:text-sm text-white">
                                  {commentUser?.name || 'Unknown User'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  {format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}
                                </span>
                                <button
                                  onClick={() => deleteTaskComment(selectedTask.id, comment.id)}
                                  className="text-red-400 hover:text-red-300 p-1"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-300">{comment.content}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a comment"
                        className="flex-1 bg-gray-700/30 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white/90 text-sm sm:text-base font-thin"
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddComment(selectedTask.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(selectedTask.id)}
                        className="px-3 py-2 bg-gray-500/80 hover:bg-gray-500 text-white rounded-lg hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300 font-thin"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/80 backdrop-blur-xl rounded-xl p-5 sm:p-6 w-full max-w-md border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <AlertCircle size={24} />
              <h2 className="text-lg sm:text-xl font-thin text-white">
                Delete Task
              </h2>
            </div>
            <p className="text-sm sm:text-base text-white/80 mb-5 sm:mb-6 font-thin">
              Are you sure you want to delete this task? This action cannot be undone.
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