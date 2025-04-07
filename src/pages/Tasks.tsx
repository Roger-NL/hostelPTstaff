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
  Menu
} from 'lucide-react';
import { format } from 'date-fns';
import type { Task, TaskComment, TaskChecklistItem, User as UserType } from '../types';
import PhotoCapture from '../components/PhotoCapture';
import { toast } from 'react-hot-toast';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';
import { uploadTaskPhoto } from '../services/task.service';
import PageHeader from '../components/PageHeader';

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

  // New state for mobile tab navigation
  const [activeTab, setActiveTab] = useState<'todo' | 'inProgress' | 'done'>('todo');

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
    
    // Validação mais completa
    if (!formData.title.trim()) {
      toast.error(t('error.required'));
      return;
    }
    
    if (formData.title.trim().length < 3) {
      toast.error(t('error.titleTooShort') || 'Title must be at least 3 characters');
      return;
    }
    
    if (formData.points < 0) {
      toast.error(t('error.invalidPoints') || 'Points must be a positive number');
      return;
    }
    
    if (!formData.dueDate) {
      toast.error(t('error.dueDateRequired') || 'Due date is required');
      return;
    }

    try {
      if (editingTaskId) {
        updateTask(editingTaskId, formData);
        toast.success(t('taskUpdated') || 'Task updated successfully');
      } else {
        addTask(formData);
        toast.success(t('taskAdded') || 'Task added successfully');
      }
      
      setFormData(initialFormData);
      setEditingTaskId(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error in task operation:', error);
      toast.error(t('error.general'));
    }
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
        if (context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const photo = canvas.toDataURL('image/jpeg');
          setPhotoUrl(photo);
          
          const stream = video.srcObject as MediaStream;
          if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach((track: MediaStreamTrack) => track.stop());
          }
          setIsCapturing(false);
        }
      }
    };

    const submitPhoto = async () => {
      if (!photoUrl || !user) return;
      
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
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach((track: MediaStreamTrack) => track.stop());
        }
      }
      setIsCapturing(false);
      setPhotoUrl('');
      setShowPhotoModal(false);
    };

    const getCardStyle = () => {
      switch(task.status) {
        case 'todo':
          return 'border-blue-500/30 hover:border-blue-400/50';
        case 'inProgress':
          return 'border-amber-500/30 hover:border-amber-400/50';
        case 'done':
          return 'border-emerald-500/30 hover:border-emerald-400/50';
        default:
          return 'border-gray-500/30 hover:border-gray-400/50';
      }
    };

    return (
      <div
        className="bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700 hover:border-white/20 hover:bg-gray-800/90 transition-all shadow-sm cursor-pointer"
        onClick={() => setSelectedTask(task)}
      >
        <div className="p-2.5 flex flex-col">
          {/* Header with title and priority */}
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-white text-sm flex-1 line-clamp-1 pr-2">
              {task.title}
            </h4>
            <div className={`text-xs px-1.5 py-0.5 rounded-full ${getPriorityColor(task.priority)} shrink-0`}>
              {task.priority === 'high' ? 'H' : task.priority === 'medium' ? 'M' : 'L'}
            </div>
          </div>
          
          {/* Status and points in one row */}
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusDropdown(showStatusDropdown === task.id ? null : task.id);
              }}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg flex-1 ${
                task.status === 'todo' 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : task.status === 'inProgress' 
                  ? 'bg-amber-500/20 text-amber-300' 
                  : 'bg-emerald-500/20 text-emerald-300'
              } border border-white/5`}
            >
              {task.status === 'todo' ? (
                <ClipboardList size={10} />
              ) : task.status === 'inProgress' ? (
                <Loader size={10} />
              ) : (
                <CheckCircle size={10} />
              )}
              <span className="whitespace-nowrap text-[10px]">{task.status === 'todo' ? 'To Do' : task.status === 'inProgress' ? 'In Progress' : 'Done'}</span>
            </button>
            
            {showStatusDropdown === task.id && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowStatusDropdown(null)}
                />
                <div 
                  className="absolute top-0 left-0 mt-8 w-32 bg-gray-800 rounded-lg shadow-xl z-50 border border-white/10 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(task.id, 'todo');
                      setShowStatusDropdown(null);
                    }}
                    className="w-full p-2 text-left text-xs hover:bg-blue-500/20 text-white flex items-center gap-2"
                  >
                    <ClipboardList size={12} className="text-blue-400" />
                    <span>To Do</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(task.id, 'inProgress');
                      setShowStatusDropdown(null);
                    }}
                    className="w-full p-2 text-left text-xs hover:bg-amber-500/20 text-white flex items-center gap-2"
                  >
                    <Loader size={12} className="text-amber-400" />
                    <span>In Progress</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(task.id, 'done');
                      setShowStatusDropdown(null);
                    }}
                    className="w-full p-2 text-left text-xs hover:bg-emerald-500/20 text-white flex items-center gap-2"
                  >
                    <CheckSquare size={12} className="text-emerald-400" />
                    <span>Done</span>
                  </button>
                </div>
              </>
            )}
            
            <div className="flex items-center text-amber-300 text-xs px-1.5 py-1 bg-amber-500/20 rounded-md shrink-0">
              <Award size={10} className="mr-1" />
              <span>{task.points}</span>
            </div>
          </div>
          
          {/* Bottom info row */}
          <div className="flex items-center justify-between text-[10px] text-gray-400 mt-auto">
            <div className="flex items-center gap-1">
              <Clock size={10} className="text-gray-300" />
              <span className="truncate">{format(new Date(task.dueDate || new Date()), 'MMM d')}</span>
            </div>
            
            {task.requirePhoto && (
              <div className="flex items-center">
                <Camera size={10} className="text-amber-400" />
              </div>
            )}
            
            {isAdmin && (
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(task);
                  }}
                  className="p-1 bg-blue-500/20 text-blue-300 rounded-md"
                >
                  <Edit size={10} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfirmDelete(task.id);
                  }}
                  className="p-1 bg-red-500/20 text-red-300 rounded-md"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TaskColumn = ({ status, title, isVisible = true }: { status: Task['status']; title: string; isVisible?: boolean }) => {
    const filteredTasks = tasks.filter(task => task.status === status);
    
    const getColumnStyle = () => {
      switch(status) {
        case 'todo':
          return 'from-blue-900/30 to-blue-800/10 border-blue-500/30';
        case 'inProgress':
          return 'from-amber-900/30 to-amber-800/10 border-amber-500/30';
        case 'done':
          return 'from-emerald-900/30 to-emerald-800/10 border-emerald-500/30';
        default:
          return 'from-gray-900/30 to-gray-800/10 border-gray-500/30';
      }
    };
    
    const getHeaderStyle = () => {
      switch(status) {
        case 'todo':
          return 'bg-blue-900/50 border-blue-500/30 text-blue-100';
        case 'inProgress':
          return 'bg-amber-900/50 border-amber-500/30 text-amber-100';
        case 'done':
          return 'bg-emerald-900/50 border-emerald-500/30 text-emerald-100';
        default:
          return 'bg-gray-900/50 border-gray-500/30 text-gray-100';
      }
    };
    
    const getIconStyle = () => {
      switch(status) {
        case 'todo':
          return 'text-blue-400';
        case 'inProgress':
          return 'text-amber-400';
        case 'done':
          return 'text-emerald-400';
        default:
          return 'text-gray-400';
      }
    };
    
    if (!isVisible) return null;
    
    return (
      <div className={`flex-1 min-w-0 flex flex-col bg-gradient-to-b ${getColumnStyle()} backdrop-blur-sm rounded-xl border shadow-lg overflow-hidden`}>
        <div className={`p-2 border-b flex items-center justify-between sticky top-0 backdrop-blur-sm ${getHeaderStyle()} z-10 rounded-t-xl`}>
          <h3 className="font-medium text-white flex items-center gap-1.5">
            {status === 'todo' ? (
              <ClipboardList size={14} className={getIconStyle()} />
            ) : status === 'inProgress' ? (
              <Loader size={14} className={getIconStyle()} />
            ) : (
              <CheckCircle size={14} className={getIconStyle()} />
            )}
            {title}
            <span className={`text-xs font-normal ${status === 'todo' ? 'bg-blue-500/20 text-blue-300' : status === 'inProgress' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'} rounded-full h-5 min-w-5 px-1.5 inline-flex items-center justify-center`}>
              {filteredTasks.length}
            </span>
          </h3>
        </div>
        <div className="p-2 flex-1 overflow-y-auto grid gap-2 auto-rows-max">
          {filteredTasks.length === 0 ? (
            <div className="h-24 md:h-32 flex flex-col items-center justify-center text-gray-500 p-2">
              <div className={`w-8 h-8 rounded-full ${status === 'todo' ? 'bg-blue-500/10' : status === 'inProgress' ? 'bg-amber-500/10' : 'bg-emerald-500/10'} flex items-center justify-center mb-2`}>
                {status === 'todo' ? (
                  <ClipboardList size={14} className={getIconStyle()} />
                ) : status === 'inProgress' ? (
                  <Loader size={14} className={getIconStyle()} />
                ) : (
                  <CheckCircle size={14} className={getIconStyle()} />
                )}
              </div>
              <p className={`text-xs font-medium ${status === 'todo' ? 'text-blue-400' : status === 'inProgress' ? 'text-amber-400' : 'text-emerald-400'}`}>No tasks</p>
            </div>
          ) : (
            filteredTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))
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
      <PageHeader 
        title={t('tasks.title')} 
        onAddItem={isAdmin ? () => setShowForm(true) : undefined}
        addItemLabel={t('tasks.addTask')}
        showBackButton={true}
        actions={
          isAdmin && (
            <div className="flex-shrink-0 flex items-center">
              <button
                onClick={() => setShowConfirmAllDelete(true)}
                className="h-9 px-3 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg shadow-lg hover:shadow-red-500/30 transition-all flex items-center gap-1.5 text-xs font-medium"
                disabled={isLoadingAction}
                title={t('tasks.deleteAll')}
              >
                <AlertTriangle size={16} />
                <span className="hidden xs:inline">{t('tasks.deleteAll')}</span>
              </button>
            </div>
          )
        }
      />

      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex rounded-t-xl overflow-hidden mb-1">
        <button
          onClick={() => setActiveTab('todo')}
          className={`flex-1 py-2 px-1 flex items-center justify-center gap-1 text-xs font-medium ${
            activeTab === 'todo' 
              ? 'bg-blue-900/50 text-blue-300 border-b-2 border-blue-400' 
              : 'bg-gray-800/50 text-gray-400'
          }`}
        >
          <ClipboardList size={14} />
          <span>To Do</span>
          <span className="bg-blue-500/20 text-blue-300 rounded-full h-5 min-w-5 px-1.5 inline-flex items-center justify-center ml-1">
            {tasks.filter(t => t.status === 'todo').length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('inProgress')}
          className={`flex-1 py-2 px-1 flex items-center justify-center gap-1 text-xs font-medium ${
            activeTab === 'inProgress' 
              ? 'bg-amber-900/50 text-amber-300 border-b-2 border-amber-400' 
              : 'bg-gray-800/50 text-gray-400'
          }`}
        >
          <Loader size={14} />
          <span>In Progress</span>
          <span className="bg-amber-500/20 text-amber-300 rounded-full h-5 min-w-5 px-1.5 inline-flex items-center justify-center ml-1">
            {tasks.filter(t => t.status === 'inProgress').length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('done')}
          className={`flex-1 py-2 px-1 flex items-center justify-center gap-1 text-xs font-medium ${
            activeTab === 'done' 
              ? 'bg-emerald-900/50 text-emerald-300 border-b-2 border-emerald-400' 
              : 'bg-gray-800/50 text-gray-400'
          }`}
        >
          <CheckCircle size={14} />
          <span>Done</span>
          <span className="bg-emerald-500/20 text-emerald-300 rounded-full h-5 min-w-5 px-1.5 inline-flex items-center justify-center ml-1">
            {tasks.filter(t => t.status === 'done').length}
          </span>
        </button>
      </div>

      {/* Mobile View: Single Column */}
      <div className="page-content bg-gradient-to-b from-gray-800 to-gray-900 backdrop-blur-sm rounded-xl border border-indigo-500/20 shadow-xl p-3">
        {/* Mobile View: Shows only active tab */}
        <div className="md:hidden">
          <TaskColumn status="todo" title="To Do" isVisible={activeTab === 'todo'} />
          <TaskColumn status="inProgress" title="In Progress" isVisible={activeTab === 'inProgress'} />
          <TaskColumn status="done" title="Done" isVisible={activeTab === 'done'} />
        </div>
        
        {/* Desktop View: Shows all columns */}
        <div className="hidden md:flex flex-row gap-4 h-full">
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
                    onBlur={e => setFormData({ ...formData, title: e.target.value.trim() })}
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
                    onBlur={e => setFormData({ ...formData, description: e.target.value.trim() })}
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
                  className={`px-3 xs:px-4 py-2 ${formData.title.trim().length >= 3 ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 cursor-not-allowed'} text-white rounded-lg transition-colors text-sm`}
                  disabled={formData.title.trim().length < 3}
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
    </div>
  );
}