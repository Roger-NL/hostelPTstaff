import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { Smile, Send, X, Image, Trash2, ExternalLink, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import toast from 'react-hot-toast';

const EMOJI_LIST = ['👍', '❤️', '😊', '🎉', '👏', '🙌'];

export default function Messages() {
  const { 
    user, 
    users, 
    messages, 
    addMessage, 
    deleteMessage, 
    addReaction, 
    removeReaction,
    markAllMessagesAsRead,
    clearAllMessages
  } = useStore();
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark all messages as read when component mounts
  useEffect(() => {
    markAllMessagesAsRead();
  }, [markAllMessagesAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !sendingMessage) {
      try {
        setSendingMessage(true);
        const toastId = toast.loading(t('messages.sending'));
        
        // Adiciona a mensagem (isso atualiza o estado e salva no Firebase)
        addMessage(newMessage.trim());
        
        // Limpa o input depois de enviado
        setNewMessage('');
        
        // Espera um pouco para simular o tempo de envio
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Atualiza o toast para sucesso
        toast.success(t('messages.sent'), { id: toastId });
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        toast.error(t('messages.sendError'));
      } finally {
        setSendingMessage(false);
      }
    }
  };

  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, 'HH:mm');
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return t('yesterday') + ' ' + format(messageDate, 'HH:mm');
    } else {
      return format(messageDate, 'dd/MM/yyyy HH:mm');
    }
  };

  const getMessageSender = (userId: string) => {
    return users.find(u => u.id === userId)?.name || t('unknownUser');
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('messages.imageTooLarge'));
        return;
      }
      
      try {
        setLoadingImage(true);
        const toastId = toast.loading(t('messages.uploadingImage'));
        
        const reader = new FileReader();
        
        const imagePromise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String);
          };
          reader.onerror = () => {
            reject(new Error(t('messages.imageUploadFailed')));
          };
        });
        
        reader.readAsDataURL(file);
        
        // Aguarda a leitura da imagem
        const base64String = await imagePromise;
        
        // Adiciona a mensagem com a imagem
        addMessage('', [base64String]);
        
        // Atualiza o toast para sucesso
        toast.success(t('messages.imageUploaded'), { id: toastId });
      } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        toast.error(t('messages.imageUploadFailed'));
      } finally {
        setLoadingImage(false);
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const toastId = toast.loading(t('messages.deleting'));
      
      // Exclui a mensagem (isso atualiza o estado e remove do Firebase)
      deleteMessage(messageId);
      
      // Espera um pouco para simular o tempo de exclusão
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Atualiza o toast para sucesso
      toast.success(t('messages.deleted'), { id: toastId });
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
      toast.error(t('messages.deleteError'));
    }
  };

  const handleClearAllMessages = async () => {
    try {
      setShowDeleteConfirm(false);
      
      const toastId = toast.loading(t('messages.clearingAll'));
      
      // Limpa todas as mensagens (isso atualiza o estado e remove do Firebase)
      clearAllMessages();
      
      // Espera um pouco para simular o tempo de exclusão
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Atualiza o toast para sucesso
      toast.success(t('messages.allCleared'), { id: toastId });
    } catch (error) {
      console.error('Erro ao limpar todas as mensagens:', error);
      toast.error(t('messages.clearError'));
    }
  };

  return (
    <div className="bg-gray-900 text-gray-200 min-h-full p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-light text-blue-300 mb-4">{t('messages.title')}</h1>
        
        {/* Lista de mensagens */}
        <div className="space-y-4 mb-6">
          {!messages.length && (
            <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-6 text-center">
              <p className="text-gray-400">{t('messages.noMessages')}</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div 
              key={message.id} 
              className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center font-medium">
                    {getMessageSender(message.userId)[0]}
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-300">{getMessageSender(message.userId)}</h3>
                    <p className="text-xs text-gray-400">
                      {formatMessageDate(message.createdAt)}
                    </p>
                  </div>
                </div>
                
                {(user?.id === message.userId || user?.role === 'admin') && (
                  <button 
                    onClick={() => handleDeleteMessage(message.id)}
                    className="text-gray-500 hover:text-white transition-colors"
                    aria-label={t('messages.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              <div className="pl-10">
                <p className="text-gray-300 whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Formulário para enviar mensagem */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-medium text-blue-300 mb-3">{t('messages.newMessage')}</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm text-gray-400 mb-1">
                {t('messages.messageContent')}
              </label>
              <textarea
                id="message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full min-h-[120px] p-3 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder={t('messages.messagePlaceholder')}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                  !newMessage.trim() || sendingMessage
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                {sendingMessage ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t('messages.sending')}
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    {t('messages.send')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 