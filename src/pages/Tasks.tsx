import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import usePerformanceOptimizer from '../hooks/usePerformanceOptimizer';

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
    removeTaskTag,
    deleteAllTasks,
    cleanupDeletedTasks
  } = useStore();
  
  // Aplica otimizações de performance
  const { 
    shouldVirtualize, 
    isLowEndDevice, 
    shouldSimplifyUI 
  } = usePerformanceOptimizer();
  
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
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [showConfirmAllDelete, setShowConfirmAllDelete] = useState(false);
  const [showConfirmCleanup, setShowConfirmCleanup] = useState(false);

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
      className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/20 transition-all shadow-sm hover:shadow-md cursor-pointer"
      onClick={() => setSelectedTask(task)}
    >
      <div className="p-3 border-b border-white/5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-white text-sm truncate flex-1">
            {task.title}
          </h4>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)} font-normal`}>
              {task.priority}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusDropdown(showStatusDropdown === task.id ? null : task.id);
              }}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-gray-700/50 hover:bg-gray-700"
            >
              {getStatusIcon(task.status)}
              <span className="text-white">{task.status}</span>
              <ChevronDown size={12} className="text-white/70" />
            </button>
            {showStatusDropdown === task.id && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowStatusDropdown(null)}
                />
                <div 
                  className="absolute left-0 mt-1 w-40 bg-gray-800 rounded-lg shadow-xl z-50 border border-white/10 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleStatusChange(task.id, 'todo')}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-gray-700 text-white flex items-center gap-2"
                  >
                    <XCircle size={14} className="text-gray-400" />
                    <span>To Do</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(task.id, 'inProgress')}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-gray-700 text-white flex items-center gap-2"
                  >
                    <AlertTriangle size={14} className="text-amber-400" />
                    <span>In Progress</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(task.id, 'done')}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-gray-700 text-white flex items-center gap-2"
                  >
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>Done</span>
                  </button>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center text-amber-400 text-xs font-medium">
            <Award size={12} className="mr-1" />
            <span>{task.points}</span>
          </div>
          
          {isAdmin && (
            <div className="flex gap-1 ml-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(task);
                }}
                className="p-1 bg-gray-700/50 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded transition-colors"
              >
                <Edit size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirmDelete(task.id);
                }}
                className="p-1 bg-gray-700/50 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-3">
        <p className="text-xs text-gray-300 mb-2.5 line-clamp-2">
          {task.description}
        </p>
        
        {Array.isArray(task.tags) && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {task.tags.map(tag => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
          <div className="flex items-center gap-1">
            <Clock size={10} className="text-gray-300" />
            <span className="text-gray-300 truncate">
              {format(new Date(task.dueDate || new Date()), 'MMM d, yyyy')}
            </span>
          </div>
          
          {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 && (
            <div className="flex items-center gap-1">
              <User size={10} className="text-gray-300" />
              <span className="text-gray-300 truncate max-w-[100px]">
                {task.assignedTo.map(id => 
                  users.find(u => u.id === id)?.name.split(' ')[0]
                ).join(', ')}
              </span>
            </div>
          )}
          
          {task.status === 'todo' && new Date(task.dueDate || new Date()) < new Date() && (
            <div className="flex items-center gap-1 text-red-400 ml-auto">
              <AlertCircle size={10} />
              <span>Overdue</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 ml-auto">
            {Array.isArray(task.comments) && task.comments.length > 0 && (
              <div className="flex items-center gap-1 text-gray-400">
                <MessageSquare size={10} />
                <span>{task.comments.length}</span>
              </div>
            )}
            {Array.isArray(task.checklist) && task.checklist.length > 0 && (
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckSquare size={10} />
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
      <div className="flex-1 min-w-0 lg:min-w-[280px] bg-gray-700/50 backdrop-blur-sm rounded-lg border border-white/10 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 p-3 border-b border-white/10 bg-gray-800/50">
          <h3 className="text-base font-medium text-white tracking-wide flex items-center gap-2">
            {status === 'todo' ? (
              <XCircle size={16} className="text-gray-400" />
            ) : status === 'inProgress' ? (
              <AlertTriangle size={16} className="text-amber-400" />
            ) : (
              <CheckCircle2 size={16} className="text-emerald-400" />
            )}
            {title}
          </h3>
          <span className="text-xs text-white/60 font-normal px-2 py-0.5 rounded-full bg-white/10">
            {tasksInColumn.length}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {tasksInColumn.length > 0 ? (
            tasksInColumn.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))
          ) : (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto bg-gray-700/50 rounded-full flex items-center justify-center mb-2">
                  {status === 'todo' ? (
                    <XCircle size={16} className="text-gray-400" />
                  ) : status === 'inProgress' ? (
                    <AlertTriangle size={16} className="text-amber-400" />
                  ) : (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  No {title.toLowerCase()} tasks
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Função para excluir todas as tarefas
  const handleDeleteAllTasks = async () => {
    try {
      setIsLoadingAction(true);
      const success = await deleteAllTasks();
      setIsLoadingAction(false);
      setShowConfirmAllDelete(false);
      
      if (success) {
        // Notificação de sucesso aqui se tiver um sistema de notificações
        console.log('Todas as tarefas foram excluídas com sucesso');
      } else {
        // Notificação de erro aqui se tiver um sistema de notificações
        console.error('Erro ao excluir todas as tarefas');
      }
    } catch (error) {
      console.error('Erro ao excluir todas as tarefas:', error);
      setIsLoadingAction(false);
      setShowConfirmAllDelete(false);
    }
  };

  // Função para limpar tarefas excluídas
  const handleCleanupDeletedTasks = async () => {
    try {
      setIsLoadingAction(true);
      const success = await cleanupDeletedTasks();
      setIsLoadingAction(false);
      setShowConfirmCleanup(false);
      
      if (success) {
        // Notificação de sucesso aqui se tiver um sistema de notificações
        console.log('Limpeza de tarefas excluídas concluída com sucesso');
      } else {
        // Notificação de erro aqui se tiver um sistema de notificações
        console.error('Erro ao limpar tarefas excluídas');
      }
    } catch (error) {
      console.error('Erro ao limpar tarefas excluídas:', error);
      setIsLoadingAction(false);
      setShowConfirmCleanup(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col overflow-auto pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sticky top-0 bg-gray-900/80 backdrop-blur-sm py-2 z-10">
        <h2 className="text-lg xs:text-xl font-extralight text-white">Task Management</h2>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <div className="flex-shrink-0 flex items-center gap-2">
                <button
                  onClick={() => setShowConfirmCleanup(true)}
                  className="h-9 px-2.5 xs:px-3 bg-amber-500 text-white rounded-lg xs:rounded-xl shadow-md hover:bg-amber-600 transition-colors flex items-center gap-1.5 text-xs xs:text-sm font-light"
                  disabled={isLoadingAction}
                >
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Limpar Tarefas Excluídas</span>
                  <span className="sm:hidden">Limpar</span>
                </button>
                <button
                  onClick={() => setShowConfirmAllDelete(true)}
                  className="h-9 px-2.5 xs:px-3 bg-red-500 text-white rounded-lg xs:rounded-xl shadow-md hover:bg-red-600 transition-colors flex items-center gap-1.5 text-xs xs:text-sm font-light"
                  disabled={isLoadingAction}
                >
                  <AlertTriangle size={16} />
                  <span className="hidden sm:inline">Excluir Todas</span>
                  <span className="sm:hidden">Excluir</span>
                </button>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="h-9 px-2.5 xs:px-3 bg-green-500 text-white rounded-lg xs:rounded-xl shadow-md hover:bg-green-600 transition-colors flex items-center gap-1.5 text-xs xs:text-sm font-light"
              >
                <Plus size={16} />
                <span className="hidden xs:inline">Add Task</span>
                <span className="xs:hidden">Add</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Task Columns Container */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 xs:p-4 sm:p-6 flex-1 overflow-auto">
        <div className="flex flex-col lg:flex-row gap-4 min-h-[calc(100%-2rem)]">
          <TaskColumn status="todo" title="To Do" />
          <TaskColumn status="inProgress" title="In Progress" />
          <TaskColumn status="done" title="Done" />
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 xs:p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-4 xs:p-6 w-full max-w-2xl my-4">
            <div className="flex items-center justify-between mb-4 xs:mb-6">
              <h2 className="text-lg xs:text-xl font-semibold text-white">
                {editingTaskId ? 'Edit Task' : 'Add Task'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialFormData);
                  setEditingTaskId(null);
                }}
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 xs:space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
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
                
                <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                      className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Points
                    </label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
                      className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full bg-gray-700/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                      required
                    />
                  </div>
                  
                  <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
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
                
                <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
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
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData(initialFormData);
                    setEditingTaskId(null);
                  }}
                  className="px-3 xs:px-4 py-2 text-white/60 hover:text-white transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 xs:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 xs:p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col my-4">
            <div className="p-4 xs:p-6 border-b border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg xs:text-xl font-medium text-white mb-2">
                    {selectedTask.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Clock size={16} />
                      <span>
                        {format(new Date(selectedTask.dueDate || new Date()), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award size={16} />
                      <span className="text-amber-400">{selectedTask.points} points</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 xs:p-6 overflow-x-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6">
                <div className="space-y-4 xs:space-y-6">
                  <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
                    <h3 className="text-base xs:text-lg font-medium text-white mb-2">Description</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{selectedTask.description}</p>
                  </div>
                </div>

                <div className="space-y-4 xs:space-y-6">
                  {/* Second column contents */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 xs:p-4">
          <div className="bg-gray-800 rounded-lg p-4 xs:p-6 w-full max-w-md">
            <h2 className="text-lg xs:text-xl font-semibold text-white mb-3">
              Delete Task
            </h2>
            <p className="text-sm text-white/80 mb-4 xs:mb-6">
              Are you sure you want to delete this task? This action cannot be undone.
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

      {/* Confirmação para excluir todas as tarefas */}
      {showConfirmAllDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 xs:p-4">
          <div className="bg-gray-800 rounded-lg p-4 xs:p-6 w-full max-w-md">
            <h2 className="text-lg xs:text-xl font-semibold text-white mb-3">
              Excluir Todas as Tarefas
            </h2>
            <p className="text-sm text-white/80 mb-4 xs:mb-6">
              Tem certeza de que deseja excluir <strong>todas</strong> as tarefas? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmAllDelete(false)}
                className="px-3 xs:px-4 py-2 text-white/60 hover:text-white transition-colors text-sm"
                disabled={isLoadingAction}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAllTasks}
                className="px-3 xs:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center gap-2"
                disabled={isLoadingAction}
              >
                {isLoadingAction ? (
                  <>
                    <span className="animate-pulse">Processando...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} />
                    <span>Excluir Todas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmação para limpar tarefas excluídas */}
      {showConfirmCleanup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 xs:p-4">
          <div className="bg-gray-800 rounded-lg p-4 xs:p-6 w-full max-w-md">
            <h2 className="text-lg xs:text-xl font-semibold text-white mb-3">
              Limpar Tarefas Excluídas
            </h2>
            <p className="text-sm text-white/80 mb-4 xs:mb-6">
              Esta ação removerá permanentemente todas as tarefas marcadas como excluídas do banco de dados. Deseja continuar?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmCleanup(false)}
                className="px-3 xs:px-4 py-2 text-white/60 hover:text-white transition-colors text-sm"
                disabled={isLoadingAction}
              >
                Cancelar
              </button>
              <button
                onClick={handleCleanupDeletedTasks}
                className="px-3 xs:px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm flex items-center gap-2"
                disabled={isLoadingAction}
              >
                {isLoadingAction ? (
                  <>
                    <span className="animate-pulse">Processando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Limpar</span>
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