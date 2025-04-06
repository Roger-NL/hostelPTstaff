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
  Loader
} from 'lucide-react';
import { format } from 'date-fns';
import type { Task, TaskComment, TaskChecklistItem } from '../types';
import usePerformanceOptimizer from '../hooks/usePerformanceOptimizer';
import PhotoCapture from '../components/PhotoCapture';
import { toast } from 'react-hot-toast';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';

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
    rejectTaskPhoto,
    uploadTaskPhoto
  } = useStore();
  
  // Aplica otimizações de performance
  const { 
    shouldVirtualize, 
    isLowEndDevice, 
    shouldSimplifyUI 
  } = usePerformanceOptimizer();
  
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
    const { t } = useTranslation();
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [photoUrl, setPhotoUrl] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const startCapture = async () => {
      setIsCapturing(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Erro ao acessar a câmera:', err);
        setIsCapturing(false);
      }
    };

    const capturePhoto = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas) {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const photo = canvas.toDataURL('image/jpeg');
        setPhotoUrl(photo);
        
        const stream = video.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
        }
        setIsCapturing(false);
      }
    };

    const submitPhoto = async () => {
      if (!photoUrl) return;
      
      setUploadingPhoto(true);
      try {
        await uploadTaskPhoto(task.id, photoUrl, user.id);
        toast.success(t('approvals.photoUploaded'));
        setShowPhotoModal(false);
      } catch (err) {
        console.error('Erro ao enviar foto:', err);
        toast.error(t('error.general'));
      } finally {
        setUploadingPhoto(false);
      }
    };

    const cancelCapture = () => {
      if (isCapturing && videoRef.current) {
        const stream = videoRef.current.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
        }
      }
      setIsCapturing(false);
      setPhotoUrl('');
      setShowPhotoModal(false);
    };

    return (
      <div
        className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/20 transition-all shadow-sm hover:shadow-md cursor-pointer"
        onClick={() => setSelectedTask(task)}
      >
        <div className="p-3 border-b border-white/5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-medium text-white text-sm truncate flex-1">
              {task.title}
              {task.requirePhoto && (
                <span className="ml-2 inline-flex items-center" title={t('approvals.photoRequired')}>
                  <Camera size={14} className="text-amber-400" />
                </span>
              )}
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
                <span className="text-white">{task.status === 'todo' ? t('todo') : task.status === 'inProgress' ? t('inProgress') : t('done')}</span>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(task.id, 'todo');
                        setShowStatusDropdown(null);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-gray-700 text-white flex items-center gap-2"
                    >
                      <ClipboardList size={14} className="text-gray-400" />
                      <span>{t('todo')}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(task.id, 'inProgress');
                        setShowStatusDropdown(null);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-gray-700 text-white flex items-center gap-2"
                    >
                      <Loader size={14} className="text-amber-400" />
                      <span>{t('inProgress')}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (task.requirePhoto && (!task.photo || !task.photo.approved)) {
                          setShowPhotoModal(true);
                          setShowStatusDropdown(null);
                        } else {
                          handleStatusChange(task.id, 'done');
                          setShowStatusDropdown(null);
                        }
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-gray-700 text-white flex items-center gap-2"
                    >
                      <CheckSquare size={14} className="text-emerald-400" />
                      <span>{t('done')}</span>
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

        {task.requirePhoto && task.photo && (
          <div className="mt-2 text-xs px-3 pb-3">
            {task.photo.approved === true ? (
              <span className="flex items-center text-green-400">
                <CheckCircle size={12} className="mr-1" />
                {t('approvals.photoApproved')}
              </span>
            ) : task.photo.approved === false ? (
              <span className="flex items-center text-red-400">
                <XCircle size={12} className="mr-1" />
                {t('approvals.rejected')}
              </span>
            ) : (
              <span className="flex items-center text-amber-400">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                {t('approvals.waitingApproval')}
              </span>
            )}
          </div>
        )}

        {task.requirePhoto && !task.photo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPhotoModal(true);
            }}
            className="mt-2 mx-3 mb-3 w-auto py-1 px-2 text-xs bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors flex items-center justify-center"
          >
            <Camera size={12} className="mr-1" />
            {t('approvals.takePhoto')}
          </button>
        )}

        {showPhotoModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-xl font-medium">{t('approvals.takePhoto')}</h3>
              </div>
              
              <div className="p-4">
                {isCapturing ? (
                  <div className="relative w-full aspect-[4/3] bg-black overflow-hidden rounded-lg">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                ) : photoUrl ? (
                  <div className="w-full aspect-[4/3] bg-black overflow-hidden rounded-lg">
                    <img 
                      src={photoUrl} 
                      alt="Capturada" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[4/3] bg-gray-900 rounded-lg flex items-center justify-center">
                    <button
                      onClick={startCapture}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                    >
                      <Camera className="inline-block mr-2" size={18} />
                      {t('approvals.takePhoto')}
                    </button>
                  </div>
                )}
                
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <div className="p-4 border-t border-gray-700 flex justify-between">
                <button
                  onClick={cancelCapture}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  {t('cancel')}
                </button>
                
                {isCapturing ? (
                  <button
                    onClick={capturePhoto}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                  >
                    {t('approvals.takePhoto')}
                  </button>
                ) : photoUrl ? (
                  <button
                    onClick={submitPhoto}
                    disabled={uploadingPhoto}
                    className={`px-4 py-2 rounded-lg ${
                      uploadingPhoto 
                        ? 'bg-gray-600 text-gray-400' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {uploadingPhoto ? t('approvals.uploadingPhoto') : t('send')}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const TaskColumn = ({ status, title }: { status: Task['status'], title: string }) => {
    const tasksInColumn = tasks.filter(t => t.status === status);
    
    return (
      <div className="flex-1 min-w-0 lg:min-w-[280px] bg-gray-700/50 backdrop-blur-sm rounded-lg border border-white/10 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 p-3 border-b border-white/10 bg-gray-800/50">
          <h3 className="text-base font-medium text-white tracking-wide flex items-center gap-2">
            {status === 'todo' ? (
              <AlertCircle size={16} className="text-gray-400" />
            ) : status === 'inProgress' ? (
              <AlertTriangle size={16} className="text-amber-400" />
            ) : (
              <CheckCircle size={16} className="text-emerald-400" />
            )}
            {title}
          </h3>
          <span className="text-xs text-white/60 font-normal px-2 py-0.5 rounded-full bg-white/10">
            {tasksInColumn.length}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto content-scrollable p-3 space-y-3">
          {tasksInColumn.length > 0 ? (
            tasksInColumn.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))
          ) : (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto bg-gray-700/50 rounded-full flex items-center justify-center mb-2">
                  {status === 'todo' ? (
                    <AlertCircle size={16} className="text-gray-400" />
                  ) : status === 'inProgress' ? (
                    <AlertTriangle size={16} className="text-amber-400" />
                  ) : (
                    <CheckCircle size={16} className="text-emerald-400" />
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

    const approvePhoto = () => {
      if (!selectedTask.photo) return;
      
      approveTaskPhoto(selectedTask.id, user.id);
      
      const updatedPhoto: typeof selectedTask.photo = {
        ...selectedTask.photo,
        approved: true,
        approvedBy: user.id,
        approvedAt: new Date().toISOString()
      };
      
      setSelectedTask({
        ...selectedTask,
        photo: updatedPhoto
      });
    };
    
    const rejectPhoto = () => {
      rejectTaskPhoto(selectedTask.id);
      setSelectedTask({
        ...selectedTask,
        photo: undefined
      });
    };

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-gray-800 rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
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
          
          <div className="flex-1 overflow-y-auto p-4 content-scrollable space-y-4">
            <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Clock size={16} className="text-amber-400" />
                {format(new Date(selectedTask.dueDate || new Date()), 'MMM d, yyyy')}
              </h4>
            </div>
            
            <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Award size={16} className="text-amber-400" />
                {selectedTask.points} points
              </h4>
            </div>
            
            <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
              <h3 className="text-base xs:text-lg font-medium text-white mb-2">Description</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{selectedTask.description}</p>
            </div>
            
            {selectedTask.requirePhoto && (
              <div className="bg-gray-700/30 rounded-lg p-4 border border-white/10">
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
                            onClick={approvePhoto}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg text-xs"
                          >
                            Aprovar Foto
                          </button>
                          
                          <button
                            onClick={rejectPhoto}
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
                        currentUser={user}
                        onPhotoUploaded={handlePhotoUploaded}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-white/10 flex items-center justify-end gap-2">
            {selectedTask.status !== 'done' && (
              <button
                onClick={handleCompleteTask}
                disabled={!canCompleteTask()}
                className={`px-4 py-2 rounded-lg text-white ${
                  canCompleteTask() 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                {selectedTask.requirePhoto && (!selectedTask.photo || !selectedTask.photo.approved)
                  ? 'Aguardando Foto Aprovada'
                  : 'Marcar como Concluída'
                }
              </button>
            )}
            <button
              onClick={handleEdit.bind(null, selectedTask)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Editar
            </button>
            <button
              onClick={() => setShowConfirmDelete(selectedTask.id)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container flex flex-col">
      <div className="page-header flex flex-wrap items-center justify-between gap-2 mb-4 py-2 z-10 bg-gray-900/80 backdrop-blur-sm">
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

      <div className="page-content bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 xs:p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 h-full">
          <TaskColumn status="todo" title="To Do" />
          <TaskColumn status="inProgress" title="In Progress" />
          <TaskColumn status="done" title="Done" />
        </div>
      </div>

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
                
                <div className="bg-gray-700/50 rounded-lg p-3 xs:p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">
                      Foto necessária para conclusão
                    </label>
                    <div className="relative inline-block w-10 align-middle select-none">
                      <input 
                        type="checkbox" 
                        id="requirePhoto"
                        checked={formData.requirePhoto} 
                        onChange={() => setFormData({ ...formData, requirePhoto: !formData.requirePhoto })}
                        className="sr-only"
                      />
                      <label 
                        htmlFor="requirePhoto"
                        className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                          formData.requirePhoto ? 'bg-green-500' : 'bg-gray-600'
                        }`}
                      >
                        <span 
                          className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${
                            formData.requirePhoto ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                  {formData.requirePhoto && (
                    <p className="text-xs text-amber-400 mt-2">
                      <AlertTriangle size={12} className="inline mr-1" />
                      A tarefa só poderá ser concluída se o usuário enviar uma foto tirada pela câmera e esta for aprovada por um administrador.
                    </p>
                  )}
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
                          e.target.value = '';
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

      {selectedTask && (
        <TaskDetail />
      )}

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