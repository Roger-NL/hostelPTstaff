import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { Smile, Send, X, Image, Trash2, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';
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
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-3 xs:p-4 border-b border-white/10 flex justify-between items-center bg-gray-700/50 sticky top-0">
        <h2 className="text-base xs:text-lg font-medium text-white flex items-center gap-2">
          <ExternalLink size={16} className="text-blue-400" />
          {t('messages.title')}
        </h2>
        
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-colors flex items-center gap-1.5 text-xs"
            title={t('messages.clearAll')}
          >
            <Trash2 size={16} />
            <span className="hidden xs:inline">{t('messages.clearAll')}</span>
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 xs:p-4">
          <div className="bg-gray-800 rounded-lg p-4 xs:p-6 max-w-md w-full">
            <div className="flex items-center gap-2 mb-3 text-red-500">
              <AlertTriangle size={20} />
              <h3 className="text-lg font-medium text-white">{t('confirm')}</h3>
            </div>
            <p className="text-sm text-white/80 mb-4">
              {t('messages.confirmDeleteAll')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-2 text-white/70 hover:text-white transition-colors text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleClearAllMessages}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 xs:p-4 space-y-3 xs:space-y-4"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center mb-3">
              <ExternalLink size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-400 text-sm mb-2">{t('messages.noMessages')}</p>
            <p className="text-gray-500 text-xs max-w-xs">{t('messages.startConversation')}</p>
          </div>
        )}
        
        {messages.map(message => (
          <div key={message.id} className="group relative">
            <div className={`flex items-start gap-3 ${message.userId === user?.id ? 'flex-row-reverse' : ''}`}>
              <div 
                className={`w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0
                  ${message.userId === user?.id ? 'bg-blue-500/30' : 'bg-gray-700'}`}
              >
                <span className="text-white text-sm">{getMessageSender(message.userId).charAt(0)}</span>
              </div>
              <div className={`flex flex-col ${message.userId === user?.id ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/70 text-xs font-medium">{getMessageSender(message.userId)}</span>
                  <span className="text-white/40 text-xs">{formatMessageDate(message.createdAt)}</span>
                </div>
                <div 
                  className={`relative rounded-lg px-3 py-2 text-white text-sm
                    ${message.userId === user?.id 
                      ? 'bg-blue-500/20 rounded-tr-none' 
                      : 'bg-gray-700/70 rounded-tl-none'}`}
                >
                  {message.content && <div className="mb-2 break-words">{message.content}</div>}
                  {message.attachments?.map((attachment, index) => (
                    <div key={index} className="rounded-lg overflow-hidden mb-2">
                      <img 
                        src={attachment} 
                        alt={t('messages.attachment')} 
                        className="max-w-full h-auto" 
                        loading="lazy" 
                      />
                    </div>
                  ))}
                  {/* Reactions */}
                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(message.reactions).map(([emoji, users]) => (
                        <button
                          key={emoji}
                          onClick={() => users.includes(user?.id || '') 
                            ? removeReaction(message.id, emoji) 
                            : addReaction(message.id, emoji)}
                          className={`text-xs px-2 py-0.5 rounded-full 
                            ${users.includes(user?.id || '') 
                              ? 'bg-blue-500/30' 
                              : 'bg-gray-700/50'} 
                            hover:bg-blue-500/20 transition-colors`}
                        >
                          {emoji} {users.length}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Message Actions */}
            <div 
              className={`absolute top-0 ${message.userId === user?.id ? 'left-0' : 'right-0'} 
                opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}
            >
              <button
                onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white/90"
                title={t('messages.addReaction')}
              >
                <Smile size={14} />
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => handleDeleteMessage(message.id)}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-400 hover:text-red-300"
                  title={t('delete')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Emoji Picker */}
            {showEmojiPicker === message.id && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowEmojiPicker(null)}
                />
                <div 
                  className={`absolute ${message.userId === user?.id ? 'left-0' : 'right-0'} 
                    mt-6 bg-gray-800 rounded shadow-xl p-2 flex gap-1 z-50`}
                >
                  {EMOJI_LIST.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        const reactions = message.reactions || {};
                        const users = reactions[emoji] || [];
                        if (users.includes(user?.id || '')) {
                          removeReaction(message.id, emoji);
                        } else {
                          addReaction(message.id, emoji);
                        }
                        setShowEmojiPicker(null);
                      }}
                      className="p-1.5 hover:bg-white/10 rounded transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-3 xs:p-4 border-t border-white/10">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-700/50 rounded">
            <div className="flex items-end">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('messages.typePlaceholder')}
                disabled={loadingImage || sendingMessage}
                className="flex-1 bg-transparent border-none p-2 xs:p-3 text-white placeholder-white/40 text-sm resize-none focus:ring-0 min-h-[40px] max-h-[120px]"
                style={{ height: '40px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <div className="flex items-center p-1 xs:p-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                  disabled={loadingImage || sendingMessage}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loadingImage || sendingMessage}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white/90 disabled:opacity-50"
                  title={t('messages.addImage')}
                >
                  {loadingImage ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Image size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loadingImage || sendingMessage || !newMessage.trim()}
            className="p-2 xs:p-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex-shrink-0 disabled:opacity-50 disabled:bg-gray-500"
          >
            {sendingMessage ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 