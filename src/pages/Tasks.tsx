import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { translations } from '../i18n/translations';
import {
  Clock,
  Tag,
  CheckCircle,
  Edit,
  Trash2,
  MoreVertical,
  Plus,
  PlusCircle,
  Users,
  AlertTriangle,
  Send,
  X,
  ChevronDown,
  Camera,
  Award,
  User,
  AlertCircle,
  MessageSquare,
  CheckSquare,
  XCircle,
  ClipboardList,
  Loader,
  ArrowRightCircle,
  Filter,
  Play,
  Check,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import type { Task, TaskComment, TaskChecklistItem, User as UserType } from '../types';
import PhotoCapture from '../components/PhotoCapture';
import { toast } from 'react-hot-toast';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';
import { uploadTaskPhoto } from '../services/task.service';

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
  requirePhoto: boolean;
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
  isPrivate: false,
  requirePhoto: false
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
    cleanupDeletedTasks,
    approveTaskPhoto,
    rejectPhoto
  } = useStore();
  
  const { t } = useTranslation();
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
  const [filter, setFilter] = useState<Task['type'] | 'all'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [activeColumn, setActiveColumn] = useState<Task['status']>('todo');

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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    if (newStatus === 'done' && task.requirePhoto) {
      if (!task.photo || !task.photo.approved) {
        toast.error(t('approvals.cannotComplete'));
        return;
      }
    }
    
    moveTask(taskId, newStatus);
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
      description: task.description || '',
      points: task.points || 10,
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : new Date().toISOString().split('T')[0],
      assignedTo: task.assignedTo || [],
      tags: Array.isArray(task.tags) ? [...task.tags] : [],
      type: task.type,
      isPrivate: task.isPrivate || false,
      requirePhoto: task.requirePhoto || false
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
        return <CheckCircle className="text-emerald-400" />;
      case 'inProgress':
        return <AlertTriangle className="text-amber-400" />;
      default:
        return <AlertCircle className="text-gray-400" />;
    }
  };

  const TaskCard = ({ task, index }: { task: Task; index: number }) => {
    const [isCapturing, setIsCapturing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stream = useRef<MediaStream | null>(null);
    
    const startCapture = async () => {
      try {
        setIsCapturing(true);
        const constraints = {
          video: { facingMode: 'environment' }
        };
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.current = mediaStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setIsCapturing(false);
      }
    };
    
    const capturePhoto = () => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const photoData = canvas.toDataURL('image/jpeg');
          
          if (stream.current) {
            stream.current.getTracks().forEach(track => track.stop());
            stream.current = null;
          }
          
          setIsCapturing(false);
          submitPhoto(photoData);
        }
      }
    };
    
    const submitPhoto = async (photoData?: string) => {
      if (!photoData) return;
      
      try {
        setIsSubmitting(true);
        await uploadTaskPhoto(task.id, photoData, user?.id || '');
        setIsSubmitting(false);
      } catch (error) {
        console.error('Error uploading photo:', error);
        setIsSubmitting(false);
      }
    };
    
    const cancelCapture = () => {
      if (stream.current) {
        stream.current.getTracks().forEach(track => track.stop());
        stream.current = null;
      }
      
      setIsCapturing(false);
    };
    
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (optionsRef.current && !optionsRef.current.contains(event.target as Node) &&
            buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setShowOptions(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
    
    return (
      <div 
        className="group relative bg-gray-900 rounded-xl p-3 border border-gray-700 hover:border-gray-600 hover:shadow-lg transition-all duration-300 animate-fadeIn"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {isCapturing && (
          <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center rounded-xl animate-fadeIn">
            <video ref={videoRef} className="w-full h-auto rounded-lg" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute bottom-4 w-full flex items-center justify-center space-x-4">
              <button
                onClick={cancelCapture}
                className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <button
                onClick={capturePhoto}
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full transition-colors"
              >
                <Camera size={28} />
              </button>
            </div>
          </div>
        )}
        
        {isSubmitting && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl animate-fadeIn">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
        
        <div 
          className="flex items-center justify-between mb-3"
          onClick={() => setSelectedTask(task)}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              task.priority === 'high' ? 'bg-orange-500' :
              task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'
            }`} />
            <span className={`text-xs font-medium ${
              task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-300'
            }`}>
              {task.type === 'hostel' ? t('tasks.hostel') : t('tasks.personal')}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            {task.requirePhoto && (
              <div className={`p-1 rounded-full ${
                task.photo?.approved ? 'bg-green-500/20 text-green-400' : 
                task.photo ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                <Camera size={14} />
              </div>
            )}
            <div 
              ref={buttonRef}
              className="relative cursor-pointer p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions(!showOptions);
              }}
            >
              <MoreVertical size={16} />
            </div>
          </div>
        </div>
        
        <div 
          className="mb-3 cursor-pointer" 
          onClick={() => setSelectedTask(task)}
        >
          <h3 className={`font-medium text-sm ${
            task.status === 'done' ? 'line-through text-gray-500' : 'text-white'
          }`}>
            {task.title}
          </h3>
          {task.description && task.description.length > 0 && (
            <p className={`text-xs mt-1 line-clamp-2 ${
              task.status === 'done' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {task.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <div className="bg-gray-800 px-2 py-0.5 rounded-full flex items-center text-blue-300 gap-1">
              <Award size={12} />
              <span className="text-xs font-medium">{task.points}</span>
            </div>
            {task.dueDate && (
              <div className="bg-gray-800 px-2 py-0.5 rounded-full flex items-center text-orange-300 gap-1">
                <Clock size={12} />
                <span className="text-xs">
                  {format(new Date(task.dueDate), 'MMM d')}
                </span>
              </div>
            )}
          </div>
          
          {task.status !== 'done' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(task.id, task.status === 'todo' ? 'inProgress' : 'done');
              }}
              className={`p-1.5 rounded-full transition-all ${
                task.status === 'todo'
                  ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                  : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
              }`}
            >
              {task.status === 'todo' ? (
                <Play size={14} />
              ) : (
                <Check size={14} />
              )}
            </button>
          )}
        </div>
        
        {showOptions && (
          <div
            ref={optionsRef}
            className="absolute top-8 right-3 z-20 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[150px] animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {task.status !== 'done' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(task.id, task.status === 'todo' ? 'inProgress' : 'done');
                  setShowOptions(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                {task.status === 'todo' ? (
                  <>
                    <Play size={14} className="text-blue-400" />
                    <span>{t('tasks.startTask')}</span>
                  </>
                ) : (
                  <>
                    <Check size={14} className="text-green-400" />
                    <span>{t('tasks.completeTask')}</span>
                  </>
                )}
              </button>
            )}
            
            {task.requirePhoto && task.status !== 'done' && !task.photo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startCapture();
                  setShowOptions(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Camera size={14} className="text-blue-400" />
                <span>{t('tasks.capturePhoto')}</span>
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(task);
                setShowOptions(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Edit size={14} className="text-amber-400" />
              <span>{t('common.edit')}</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(task.id);
                setShowOptions(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Trash2 size={14} className="text-red-400" />
              <span>{t('common.delete')}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const TaskColumn = ({ status, title }: { status: Task['status'], title: string }) => {
    const filteredTasks = tasks.filter(t => 
      t.status === status && 
      (filter === 'all' || t.type === filter) &&
      (isAdmin || !t.isPrivate) && 
      (!t.assignedTo || t.assignedTo.length === 0 || t.assignedTo.includes(user?.id || ''))
    );
    
    return (
      <div className="flex-1 min-w-0 md:min-w-[250px] bg-gray-900/90 backdrop-blur-md rounded-xl overflow-hidden flex flex-col border border-gray-700 shadow-lg">
        <div className="p-3 xs:p-4 border-b border-gray-700/80 flex items-center justify-between sticky top-0 bg-gray-900/95 backdrop-blur-lg z-10">
          <div className="flex items-center gap-2">
            {status === 'todo' && (
              <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                <Clock className="text-blue-400" size={14} />
              </div>
            )}
            {status === 'inProgress' && (
              <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                <ArrowRightCircle className="text-orange-400" size={14} />
              </div>
            )}
            {status === 'done' && (
              <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                <CheckCircle className="text-green-400" size={14} />
              </div>
            )}
            <h3 className="font-medium text-white">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-gray-800 text-blue-300 text-xs rounded-full px-2.5 py-1 font-medium">
              {filteredTasks.length}
            </span>
            {status === 'todo' && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full transition-colors"
                title={t('tasks.addNewToColumn')}
              >
                <Plus size={14} />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent p-3 xs:p-4 space-y-3 overscroll-contain -webkit-overflow-scrolling-touch">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))
          ) : (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  {status === 'todo' ? (
                    <Clock size={20} className="text-blue-400" />
                  ) : status === 'inProgress' ? (
                    <ArrowRightCircle size={20} className="text-orange-400" />
                  ) : (
                    <CheckCircle size={20} className="text-green-400" />
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-1">
                  {status === 'todo' ? t('tasks.noTodoTasks') : 
                   status === 'inProgress' ? t('tasks.noInProgressTasks') : 
                   t('tasks.noCompletedTasks')}
                </p>
                {status === 'todo' && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 mx-auto transition-colors"
                  >
                    <Plus size={16} />
                    {t('tasks.addNew')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleDeleteAllTasks = async () => {
    try {
      setIsLoadingAction(true);
      const success = await deleteAllTasks();
      setIsLoadingAction(false);
      setShowConfirmAllDelete(false);
      
      if (success) {
        console.log('Todas as tarefas foram excluídas com sucesso');
      } else {
        console.error('Erro ao excluir todas as tarefas');
      }
    } catch (error) {
      console.error('Erro ao excluir todas as tarefas:', error);
      setIsLoadingAction(false);
      setShowConfirmAllDelete(false);
    }
  };

  const handleCleanupDeletedTasks = async () => {
    try {
      setIsLoadingAction(true);
      const success = await cleanupDeletedTasks();
      setIsLoadingAction(false);
      setShowConfirmCleanup(false);
      
      if (success) {
        console.log('Limpeza de tarefas excluídas concluída com sucesso');
      } else {
        console.error('Erro ao limpar tarefas excluídas');
      }
    } catch (error) {
      console.error('Erro ao limpar tarefas excluídas:', error);
      setIsLoadingAction(false);
      setShowConfirmCleanup(false);
    }
  };

  const TaskDetail = () => {
    if (!selectedTask) return null;
    
    if (!user) return null;

    const canCompleteTask = () => {
      if (!selectedTask.requirePhoto) return true;
      
      return selectedTask.photo && selectedTask.photo.approved;
    };

    const handleCompleteTask = () => {
      if (selectedTask.requirePhoto && (!selectedTask.photo || !selectedTask.photo.approved)) {
        return;
      }
      
      moveTask(selectedTask.id, 'done');
      setSelectedTask({ ...selectedTask, status: 'done' });
    };

    const handlePhotoUploaded = () => {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    };

    const isTaskAdmin = user.role === 'admin';

    const handleRejectPhoto = () => {
      if (!selectedTask.photo) return;
      rejectPhoto(selectedTask.id, user.id);
      setSelectedTask({
        ...selectedTask,
        photo: undefined
      });
    };

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 xs:p-4 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch">
        <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] md:max-h-[80vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                selectedTask.status === 'todo' ? 'bg-gray-400' :
                selectedTask.status === 'inProgress' ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
              <h3 className="text-lg font-medium text-white">{selectedTask.title}</h3>
            </div>
            <button
              onClick={() => setSelectedTask(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent p-3 xs:p-4 content-scrollable space-y-3 overscroll-contain -webkit-overflow-scrolling-touch">
            <div className="bg-gray-700 rounded-lg p-3 xs:p-4 border border-gray-600">
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Clock size={16} className="text-amber-400" />
                {format(new Date(selectedTask.dueDate || new Date()), 'MMM d, yyyy')}
              </h4>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3 xs:p-4 border border-gray-600">
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Award size={16} className="text-amber-400" />
                {selectedTask.points} points
              </h4>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3 xs:p-4 border border-gray-600">
              <h3 className="text-base xs:text-lg font-medium text-white mb-2">Description</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{selectedTask.description}</p>
            </div>
            
            {selectedTask.requirePhoto && (
              <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Camera size={16} className="text-amber-400" />
                  Foto necessária para conclusão
                </h4>
                
                {selectedTask.photo ? (
                  <div>
                    <img 
                      src={selectedTask.photo.url} 
                      alt="Foto da tarefa" 
                      className="w-full h-auto rounded-lg mb-3"
                    />
                    
                    <div className="text-xs text-gray-300 space-y-1">
                      <p>Enviada por: {users.find(u => u.id === selectedTask.photo?.uploadedBy)?.name || 'Desconhecido'}</p>
                      <p>Data: {selectedTask.photo.uploadedAt ? new Date(selectedTask.photo.uploadedAt).toLocaleString() : '-'}</p>
                      
                      {selectedTask.photo.approved ? (
                        <div className="bg-green-500/20 text-green-400 p-2 rounded-lg mt-2 flex items-center gap-2">
                          <CheckCircle size={14} />
                          Foto aprovada por {users.find(u => u.id === selectedTask.photo?.approvedBy)?.name || 'Administrador'}
                        </div>
                      ) : (
                        <div className="bg-amber-500/20 text-amber-400 p-2 rounded-lg mt-2 flex items-center gap-2">
                          <AlertTriangle size={14} />
                          Aguardando aprovação de administrador
                        </div>
                      )}
                      
                      {isTaskAdmin && !selectedTask.photo.approved && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => {
                              if(!selectedTask.photo) return;
                              approveTaskPhoto(selectedTask.id, user.id);
                              const updatedPhoto = {
                                ...selectedTask.photo,
                                approved: true,
                                approvedBy: user.id,
                                approvedAt: new Date().toISOString()
                              };
                              setSelectedTask({
                                ...selectedTask,
                                photo: updatedPhoto
                              });
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg text-xs"
                          >
                            Aprovar Foto
                          </button>
                          
                          <button
                            onClick={handleRejectPhoto}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg text-xs"
                          >
                            Rejeitar Foto
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-400 mb-4">
                      Esta tarefa requer uma foto tirada diretamente da câmera para ser marcada como concluída.
                    </p>
                    
                    {selectedTask.status !== 'done' && (
                      <PhotoCapture 
                        task={selectedTask}
                        currentUser={user as unknown as UserType}
                        onPhotoUploaded={handlePhotoUploaded}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="p-3 xs:p-4 border-t border-gray-700 flex flex-wrap xs:flex-nowrap items-center justify-end gap-2">
            {selectedTask.status !== 'done' && (
              <button
                onClick={handleCompleteTask}
                disabled={!canCompleteTask()}
                className={`w-full xs:w-auto px-4 py-2.5 rounded-lg text-white mb-2 xs:mb-0 ${
                  canCompleteTask() 
                    ? 'bg-green-500 hover:bg-green-600 active:bg-green-700' 
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                {selectedTask.requirePhoto && (!selectedTask.photo || !selectedTask.photo.approved)
                  ? 'Aguardando Foto Aprovada'
                  : 'Marcar como Concluída'
                }
              </button>
            )}
            <div className="flex gap-2 w-full xs:w-auto">
              <button
                onClick={handleEdit.bind(null, selectedTask)}
                className="flex-1 xs:flex-initial px-4 py-2.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-lg"
              >
                Editar
              </button>
              <button
                onClick={() => setShowConfirmDelete(selectedTask.id)}
                className="flex-1 xs:flex-initial px-4 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'hostel' && t.type === 'hostel') return true;
    if (filter === 'personal' && t.type === 'personal') return true;
    return false;
  });

  const TasksPage: React.FC = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white flex flex-col">
        <div className="p-4 pb-0 sm:p-6 sm:pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">{t('tasks.tasks')}</h1>
              <p className="text-gray-400 text-sm">{t('tasks.manageYourTasks')}</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {t('tasks.all')}
                </button>
                <button
                  onClick={() => setFilter('hostel')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    filter === 'hostel'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {t('tasks.hostel')}
                </button>
                <button
                  onClick={() => setFilter('personal')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    filter === 'personal'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {t('tasks.personal')}
                </button>
              </div>
              
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                <Plus size={16} />
                {t('tasks.addNew')}
              </button>
              
              {isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    <Settings size={16} />
                    <span className="hidden sm:inline">{t('common.manage')}</span>
                  </button>
                  
                  {showAdminMenu && (
                    <div className="absolute right-0 top-full mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 w-48 z-20">
                      <button
                        onClick={() => {
                          handleDeleteAllTasks();
                          setShowAdminMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 text-red-400"
                      >
                        <Trash2 size={14} />
                        <span>{t('tasks.deleteAll')}</span>
                      </button>
                      <button
                        onClick={() => {
                          handleCleanupDeletedTasks();
                          setShowAdminMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 text-orange-400"
                      >
                        <Trash2 size={14} />
                        <span>{t('tasks.cleanup')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Column Navigation */}
        <div className="md:hidden overflow-x-auto whitespace-nowrap p-2 pb-0">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setActiveColumn('todo');
                document.getElementById('todo-column')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`px-4 py-2 rounded-lg text-sm ${
                activeColumn === 'todo'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>{t('tasks.todo')}</span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveColumn('inProgress');
                document.getElementById('inProgress-column')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`px-4 py-2 rounded-lg text-sm ${
                activeColumn === 'inProgress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <ArrowRightCircle size={14} />
                <span>{t('tasks.inProgress')}</span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveColumn('done');
                document.getElementById('done-column')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`px-4 py-2 rounded-lg text-sm ${
                activeColumn === 'done'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={14} />
                <span>{t('tasks.done')}</span>
              </div>
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4 sm:p-6 pt-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 min-h-[70vh] pb-4 md:pb-6 md:h-full">
            <div id="todo-column" className="md:h-full snap-start md:snap-align-none">
              <TaskColumn status="todo" title={t('tasks.todo')} />
            </div>
            <div id="inProgress-column" className="md:h-full snap-start md:snap-align-none">
              <TaskColumn status="inProgress" title={t('tasks.inProgress')} />
            </div>
            <div id="done-column" className="md:h-full snap-start md:snap-align-none">
              <TaskColumn status="done" title={t('tasks.done')} />
            </div>
          </div>
        </div>
        
        {showForm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {editingTaskId ? t('tasks.editTask') : t('tasks.addTask')}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingTaskId(null);
                    setFormData(initialFormData);
                  }}
                  className="p-1 rounded-full hover:bg-gray-800"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-4">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                      {t('tasks.title')} *
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                      {t('tasks.description')}
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="points" className="block text-sm font-medium text-gray-300 mb-1">
                        {t('tasks.points')}
                      </label>
                      <input
                        id="points"
                        type="number"
                        min="1"
                        value={formData.points}
                        onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-1">
                        {t('tasks.priority.label')}
                      </label>
                      <select
                        id="priority"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="low">{t('tasks.priority.low')}</option>
                        <option value="medium">{t('tasks.priority.medium')}</option>
                        <option value="high">{t('tasks.priority.high')}</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-1">
                        {t('tasks.dueDate')}
                      </label>
                      <input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
                        {t('tasks.type')} *
                      </label>
                      <select
                        id="type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as Task['type'] })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="hostel">{t('tasks.hostel')}</option>
                        <option value="personal">{t('tasks.personal')}</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        id="isPrivate"
                        type="checkbox"
                        checked={formData.isPrivate}
                        onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600"
                      />
                      <label htmlFor="isPrivate" className="ml-2 text-sm font-medium text-gray-300">
                        {t('tasks.privateTask')}
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="requirePhoto"
                        type="checkbox"
                        checked={formData.requirePhoto}
                        onChange={(e) => setFormData({ ...formData, requirePhoto: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600"
                      />
                      <label htmlFor="requirePhoto" className="ml-2 text-sm font-medium text-gray-300">
                        {t('tasks.requirePhoto')}
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {editingTaskId ? t('common.update') : t('common.create')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {selectedTask && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <TaskDetail />
            </div>
          </div>
        )}
        
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{t('tasks.confirmDelete')}</h2>
              <p className="text-gray-300 mb-6">{t('tasks.confirmDeleteText')}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmDelete(null)}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => handleDelete(showConfirmDelete)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
  `;

  // Add the animation styles to the document
  if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);
  }

  return (
    <TasksPage />
  );
}