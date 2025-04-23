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
    const [showOptions, setShowOptions] = useState(false);

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

    return (
      <div 
        className="bg-white rounded-xl p-3 shadow-sm border border-orange-100 hover:shadow-md transition-shadow group"
        onClick={() => setSelectedTask(task)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-medium text-orange-700 line-clamp-2 group-hover:text-orange-800 transition-colors">{task.title}</h4>
            
            {task.description && (
              <p className="text-sm text-orange-600 my-2 line-clamp-2">{task.description}</p>
            )}
          </div>

          <div className="flex gap-1.5 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(task.id, 
                  task.status === 'todo' ? 'inProgress' : 
                  task.status === 'inProgress' ? 'done' : 'todo'
                );
              }}
              className="p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
              title={
                task.status === 'todo' ? t('tasks.moveToProgress') :
                task.status === 'inProgress' ? t('tasks.moveToComplete') :
                t('tasks.moveToTodo')
              }
            >
              {task.status === 'todo' && (
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100">
                  <Clock size={14} className="text-orange-600" />
                </div>
              )}
              {task.status === 'inProgress' && (
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100">
                  <AlertTriangle size={14} className="text-amber-600" />
                </div>
              )}
              {task.status === 'done' && (
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100">
                  <CheckCircle size={14} className="text-emerald-600" />
                </div>
              )}
            </button>
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptions(!showOptions);
                }}
                className="p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                title={t('tasks.options')}
              >
                <MoreVertical size={16} />
              </button>
              
              {showOptions && (
                <div 
                  className="absolute right-0 mt-1 w-36 rounded-xl bg-white shadow-lg border border-orange-100 overflow-hidden z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(isAdmin || task.createdBy === user?.id) && (
                    <div className="flex flex-col py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOptions(false);
                          handleEdit(task);
                        }}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-orange-50 text-orange-600 text-xs"
                      >
                        <Edit size={14} />
                        <span>{t('tasks.edit')}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOptions(false);
                          setShowConfirmDelete(task.id);
                        }}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 text-xs"
                      >
                        <Trash2 size={14} />
                        <span>{t('tasks.delete')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {task.priority && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                {t(`tasks.priority.${task.priority}`)}
              </span>
            )}
            {task.type && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                task.type === 'hostel' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-purple-100 text-purple-600'
              }`}>
                {task.type === 'hostel' ? t('tasks.hostel') : t('tasks.personal')}
              </span>
            )}
            {task.isPrivate && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                {t('tasks.private')}
              </span>
            )}
          </div>
          
          {task.requirePhoto && (
            <span className="text-xs flex items-center gap-1 text-orange-500">
              <Camera size={12} />
              {task.photo?.approved ? (
                <span className="text-emerald-500">{t('tasks.photoApproved')}</span>
              ) : task.photo ? (
                <span>{t('tasks.photoWaiting')}</span>
              ) : (
                <span>{t('tasks.photoRequired')}</span>
              )}
            </span>
          )}
        </div>
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
      <div className="flex-1 min-w-[300px] bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden flex flex-col border border-orange-100 shadow-sm">
        <div className="p-3 xs:p-4 border-b border-orange-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            {status === 'todo' && (
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                <Clock className="text-orange-600" size={14} />
              </div>
            )}
            {status === 'inProgress' && (
              <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="text-amber-600" size={14} />
              </div>
            )}
            {status === 'done' && (
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="text-emerald-600" size={14} />
              </div>
            )}
            <h3 className="font-medium text-orange-700">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-orange-100 text-orange-600 text-xs rounded-full px-2 py-0.5">
              {filteredTasks.length}
            </span>
            {status === 'todo' && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-orange-50 hover:bg-orange-100 text-orange-600 p-1 rounded-full transition-colors"
                title={t('tasks.addNewToColumn')}
              >
                <Plus size={14} />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto content-scrollable p-3 xs:p-4 space-y-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))
          ) : (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-3">
                  {status === 'todo' ? (
                    <Clock size={18} className="text-orange-400" />
                  ) : status === 'inProgress' ? (
                    <AlertTriangle size={18} className="text-amber-400" />
                  ) : (
                    <CheckCircle size={18} className="text-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-orange-400">
                  {status === 'todo' ? t('tasks.noTodoTasks') : 
                   status === 'inProgress' ? t('tasks.noInProgressTasks') : 
                   t('tasks.noCompletedTasks')}
                </p>
                {status === 'todo' && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-3 bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 mx-auto"
                  >
                    <Plus size={14} />
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

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'hostel' && t.type === 'hostel') return true;
    if (filter === 'personal' && t.type === 'personal') return true;
    return false;
  });

  return (
    <div className="bg-white/90 h-full overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-3 xs:px-4 py-2 xs:py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light text-orange-700">{t('tasks.title')}</h1>
          <div className="flex items-center gap-2">
            <div className="bg-white border border-orange-100 rounded-lg overflow-hidden flex">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm ${
                  filter === 'all' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'text-orange-600 hover:bg-orange-50'
                }`}
              >
                {t('tasks.allTasks')}
              </button>
              <button
                onClick={() => setFilter('hostel')}
                className={`px-3 py-1.5 text-sm ${
                  filter === 'hostel' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'text-orange-600 hover:bg-orange-50'
                }`}
              >
                {t('tasks.hostelTasks')}
              </button>
              <button
                onClick={() => setFilter('personal')}
                className={`px-3 py-1.5 text-sm ${
                  filter === 'personal' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'text-orange-600 hover:bg-orange-50'
                }`}
              >
                {t('tasks.personalTasks')}
              </button>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden xs:inline">{t('tasks.addNew')}</span>
            </button>
          </div>
        </div>
        
        <div className="text-sm text-orange-600 flex items-center gap-2">
          <span>{t('tasks.showing')}: {filteredTasks.length} {t('tasks.tasksCount')}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 xs:gap-4 h-[calc(100vh-150px)] overflow-hidden">
          <TaskColumn status="todo" title="To Do" />
          <TaskColumn status="inProgress" title="In Progress" />
          <TaskColumn status="done" title="Done" />
        </div>
      </div>
      
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 xs:p-4">
          <div className="bg-white rounded-lg p-4 xs:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto content-scrollable">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg xs:text-xl font-semibold text-orange-600">
                {editingTaskId ? t('tasks.editTask') : t('tasks.addNewTask')}
              </h2>
              <button 
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialFormData);
                  setEditingTaskId(null);
                }}
                className="text-orange-500 hover:text-orange-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-orange-50/50 rounded-lg p-3 xs:p-4 border border-orange-100">
                <h3 className="text-md font-medium text-orange-700 mb-3 border-b border-orange-100 pb-2">
                  {t('tasks.basicInfo')}
                </h3>
              
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 xs:gap-4">
                    <div className="bg-white rounded-lg p-3 xs:p-4 border border-orange-100 sm:col-span-2">
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        {t('tasks.form.title')}
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-white border border-orange-100 rounded-lg px-3 py-2 text-orange-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                        placeholder={t('tasks.form.titlePlaceholder')}
                        required
                      />
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 xs:p-4 border border-orange-100">
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        {t('tasks.form.points')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.points}
                        onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
                        className="w-full bg-white border border-orange-100 rounded-lg px-3 py-2 text-orange-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 xs:p-4 border border-orange-100">
                    <label className="block text-sm font-medium text-orange-700 mb-1">
                      {t('tasks.form.description')}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full h-24 bg-white border border-orange-100 rounded-lg px-3 py-2 text-orange-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                      placeholder={t('tasks.form.descriptionPlaceholder')}
                    ></textarea>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50/50 rounded-lg p-3 xs:p-4 border border-orange-100">
                <h3 className="text-md font-medium text-orange-700 mb-3 border-b border-orange-100 pb-2">
                  {t('tasks.configuration')}
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                    <div className="bg-white rounded-lg p-3 xs:p-4 border border-orange-100">
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        {t('tasks.form.priority')}
                      </label>
                      <select
                        value={formData.priority}
                        onChange={e => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                        className="w-full bg-white border border-orange-100 rounded-lg px-3 py-2 text-orange-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                        required
                      >
                        <option value="low">{t('tasks.priority.low')}</option>
                        <option value="medium">{t('tasks.priority.medium')}</option>
                        <option value="high">{t('tasks.priority.high')}</option>
                      </select>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 xs:p-4 border border-orange-100">
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        {t('tasks.form.type')}
                      </label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value as 'hostel' | 'personal' })}
                        className="w-full bg-white border border-orange-100 rounded-lg px-3 py-2 text-orange-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                        required
                      >
                        <option value="hostel">{t('tasks.hostel')}</option>
                        <option value="personal">{t('tasks.personal')}</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                    <div className="bg-white rounded-lg p-3 xs:p-4 border border-orange-100">
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        {t('tasks.form.dueDate')}
                      </label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full bg-white border border-orange-100 rounded-lg px-3 py-2 text-orange-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                        required
                      />
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 xs:p-4 border border-orange-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${formData.isPrivate ? 'bg-red-400' : 'bg-green-400'}`}></div>
                          <label className="block text-sm font-medium text-orange-700">
                            {t('tasks.form.visibility')}
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{formData.isPrivate ? t('tasks.form.private') : t('tasks.form.public')}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!formData.isPrivate}
                              onChange={e => setFormData({ ...formData, isPrivate: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div
                              className={`w-10 h-6 bg-gray-300 rounded-full peer peer-checked:bg-orange-400 
                              peer-focus:ring-2 peer-focus:ring-orange-300`}
                            >
                              <span 
                                className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${
                                  formData.isPrivate ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </div>
                          </label>
                        </div>
                      </div>
                      {formData.isPrivate && (
                        <p className="text-xs text-orange-500 mt-2">
                          <AlertTriangle size={12} className="inline mr-1" />
                          {t('tasks.form.privateHint')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50/50 rounded-lg p-3 xs:p-4 border border-orange-100">
                <h3 className="text-md font-medium text-orange-700 mb-3 border-b border-orange-100 pb-2">
                  {t('tasks.advancedOptions')}
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-3 xs:p-4 border border-orange-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Camera size={16} className="text-orange-600" />
                        <label className="block text-sm font-medium text-orange-700">
                          {t('tasks.form.requirePhoto')}
                        </label>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.requirePhoto}
                          onChange={e => setFormData({ ...formData, requirePhoto: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div
                          className={`w-10 h-6 bg-gray-300 rounded-full peer peer-checked:bg-orange-400 
                          peer-focus:ring-2 peer-focus:ring-orange-300`}
                        >
                          <span 
                            className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${
                              formData.requirePhoto ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </label>
                    </div>
                    {formData.requirePhoto && (
                      <p className="text-xs text-orange-500 mt-2">
                        <AlertTriangle size={12} className="inline mr-1" />
                        {t('tasks.form.requirePhotoHint')}
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 xs:p-4 border border-orange-100">
                    <label className="block text-sm font-medium text-orange-700 mb-1 flex items-center gap-2">
                      <Users size={16} className="text-orange-600" />
                      {t('tasks.form.assignTo')}
                    </label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 mb-2 max-h-20 overflow-y-auto">
                        {formData.assignedTo?.length ? (
                          formData.assignedTo?.map(userId => {
                            const volunteer = volunteers.find(v => v.id === userId);
                            return volunteer ? (
                              <div
                                key={userId}
                                className="flex items-center gap-2 bg-orange-50 rounded-lg p-2"
                              >
                                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-sm">
                                  {volunteer.name[0]}
                                </div>
                                <span className="text-sm text-orange-700">{volunteer.name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newAssignedTo = formData.assignedTo?.filter(id => id !== userId) || [];
                                    setFormData({ ...formData, assignedTo: newAssignedTo });
                                  }}
                                  className="text-red-400 hover:text-red-500 p-1"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : null;
                          })
                        ) : (
                          <p className="text-xs text-orange-400 italic">{t('tasks.form.noAssignees')}</p>
                        )}
                      </div>
                      <select
                        className="w-full bg-white border border-orange-100 rounded-lg px-3 sm:px-4 py-2 text-orange-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20"
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
                        <option value="">{t('tasks.form.addVolunteer')}</option>
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
                  
                  <div className="bg-white rounded-lg p-3 xs:p-4 border border-orange-100">
                    <label className="block text-sm font-medium text-orange-700 mb-1 flex items-center gap-2">
                      <Tag size={16} className="text-orange-600" />
                      {t('tasks.form.tags')}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2 max-h-20 overflow-y-auto">
                      {formData.tags?.length ? formData.tags?.map(tag => (
                        <span
                          key={tag}
                          className="text-xs sm:text-sm px-2 py-1 rounded-full bg-orange-50 text-orange-700 flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              tags: formData.tags?.filter(t => t !== tag)
                            })}
                            className="hover:text-orange-800"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      )) : (
                        <p className="text-xs text-orange-400 italic">{t('tasks.form.noTags')}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        placeholder={t('tasks.form.addTagPlaceholder')}
                        className="flex-1 bg-white border border-orange-100 rounded-lg px-3 sm:px-4 py-2 text-orange-800 text-sm placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
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
                        className="px-3 sm:px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 text-sm"
                      >
                        {t('tasks.form.add')}
                      </button>
                    </div>
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
                  className="px-3 xs:px-4 py-2 text-orange-600 border border-orange-100 rounded-lg hover:bg-orange-50 transition-colors text-sm"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-3 xs:px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm shadow-md shadow-orange-400/10"
                >
                  {editingTaskId ? t('tasks.form.updateTask') : t('tasks.form.createTask')}
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
          <div className="bg-white rounded-lg p-4 xs:p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h2 className="text-lg xs:text-xl font-medium text-gray-700">
                {t('tasks.confirmDelete')}
              </h2>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              {t('tasks.deleteWarning')}
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:text-gray-700 hover:border-gray-300 rounded-lg transition-colors text-sm"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDelete(showConfirmDelete)}
                className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm shadow-sm"
              >
                {t('tasks.confirmDeleteButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmAllDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 xs:p-4">
          <div className="bg-white rounded-lg p-4 xs:p-6 w-full max-w-md">
            <h2 className="text-lg xs:text-xl font-semibold text-orange-600 mb-3">
              Excluir Todas as Tarefas
            </h2>
            <p className="text-sm text-orange-700/80 mb-4 xs:mb-6">
              Tem certeza de que deseja excluir <strong>todas</strong> as tarefas? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmAllDelete(false)}
                className="px-3 xs:px-4 py-2 text-orange-600 hover:text-orange-700 transition-colors text-sm"
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
          <div className="bg-white rounded-lg p-4 xs:p-6 w-full max-w-md">
            <h2 className="text-lg xs:text-xl font-semibold text-orange-600 mb-3">
              Limpar Tarefas Excluídas
            </h2>
            <p className="text-sm text-orange-700/80 mb-4 xs:mb-6">
              Esta ação removerá permanentemente todas as tarefas marcadas como excluídas do banco de dados. Deseja continuar?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmCleanup(false)}
                className="px-3 xs:px-4 py-2 text-orange-600 hover:text-orange-700 transition-colors text-sm"
                disabled={isLoadingAction}
              >
                Cancelar
              </button>
              <button
                onClick={handleCleanupDeletedTasks}
                className="px-3 xs:px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm flex items-center gap-2"
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