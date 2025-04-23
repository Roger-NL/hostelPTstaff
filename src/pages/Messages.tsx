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
    <div className="h-full p-4 flex flex-col">
      <div className="bg-white backdrop-blur-sm rounded-xl p-4 flex-1 border border-orange-100 shadow-sm overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-light text-orange-700">{t('messages.title')}</h1>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              title={t('messages.clearAll')}
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto mb-4 bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100 p-4"
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-orange-400">
              {t('messages.noMessages')}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => {
                const isOwnMessage = message.userId === user?.id;
                const sender = getMessageSender(message.userId);
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`rounded-xl p-3 max-w-[85%] break-words shadow-sm ${
                        isOwnMessage
                          ? 'bg-orange-600 text-white'
                          : 'bg-white border border-orange-100 text-orange-700'
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="text-xs font-medium mb-1">
                          {sender}
                        </div>
                      )}
                      
                      {message.content && (
                        <div className="mb-2">{message.content}</div>
                      )}
                      
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="space-y-2">
                          {message.attachments.map((attachment, index) => (
                            <img
                              key={index}
                              src={attachment}
                              alt={t('messages.imageAlt')}
                              className="rounded-lg max-w-full max-h-64 object-contain"
                            />
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs opacity-75">
                          {formatMessageDate(message.createdAt)}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {message.reactions && Object.keys(message.reactions).length > 0 && (
                            <div className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-orange-100 border border-orange-200">
                              {Object.entries(message.reactions).map(([emoji, users]) => (
                                <div key={emoji} className="flex items-center">
                                  <span>{emoji}</span>
                                  <span className="ml-0.5">{Array.isArray(users) ? users.length : 0}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <button
                            onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                            className="p-1 text-orange-400 hover:text-orange-500 transition-colors"
                          >
                            <Smile size={16} />
                          </button>
                          
                          {isOwnMessage && (
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="p-1 text-orange-400 hover:text-orange-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {showEmojiPicker === message.id && (
                        <div className="absolute mt-2 bg-white rounded-lg shadow-lg border border-orange-100 p-1 flex">
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
                              className="p-1 text-lg hover:bg-orange-50 rounded"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100 p-2">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
              disabled={loadingImage}
            >
              {loadingImage ? <RefreshCw className="animate-spin" size={20} /> : <Image size={20} />}
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={loadingImage}
            />
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('messages.typeMessage')}
              className="flex-1 p-2 bg-transparent text-orange-700 focus:outline-none"
              disabled={sendingMessage}
            />
            
            <button
              type="submit"
              className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
              disabled={!newMessage.trim() || sendingMessage}
            >
              {sendingMessage ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </form>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
              <div className="p-4 border-b border-orange-100">
                <h3 className="text-lg font-medium text-orange-700">{t('messages.clearAllTitle')}</h3>
              </div>
              
              <div className="p-4">
                <p className="text-orange-600 mb-2">{t('messages.clearAllConfirm')}</p>
                <p className="text-orange-600">{t('messages.clearAllWarning')}</p>
              </div>
              
              <div className="p-4 flex justify-end border-t border-orange-100">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors mr-2"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleClearAllMessages}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('messages.clearAllConfirmButton')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 