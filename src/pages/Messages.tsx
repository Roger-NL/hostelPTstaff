import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { Smile, Send, X, Image, Paperclip, Trash2 } from 'lucide-react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      addMessage(newMessage.trim());
      setNewMessage('');
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
      return 'Ontem ' + format(messageDate, 'HH:mm');
    } else {
      return format(messageDate, 'dd/MM/yyyy HH:mm');
    }
  };

  const getMessageSender = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown';
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        addMessage('', [base64String]);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
      {/* Header with Clear Button for Admins */}
      {user?.role === 'admin' && (
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-white font-light">Mensagens</h2>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 size={18} />
            <span className="text-sm">Limpar todas</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-white text-lg font-light mb-4">Confirmar exclusão</h3>
            <p className="text-white/70 mb-6">
              Tem certeza que deseja excluir todas as mensagens? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-white/70 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  clearAllMessages();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Excluir todas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${user?.role !== 'admin' ? 'pt-0' : ''}`}>
        {messages.map(message => (
          <div key={message.id} className="group relative">
            <div className={`flex items-start gap-3 ${message.userId === user?.id ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">{getMessageSender(message.userId).charAt(0)}</span>
              </div>
              <div className={`flex flex-col ${message.userId === user?.id ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/60 text-xs">{getMessageSender(message.userId)}</span>
                  <span className="text-white/40 text-xs">{formatMessageDate(message.createdAt)}</span>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className={`relative group ${message.userId === user?.id ? 'bg-blue-500/20' : 'bg-gray-700/50'} rounded-lg px-4 py-2 text-white text-sm max-w-[80%]`}>
                  {message.content && <div className="mb-2">{message.content}</div>}
                  {message.attachments?.map((attachment, index) => (
                    <div key={index} className="rounded-lg overflow-hidden mb-2">
                      <img src={attachment} alt="Attachment" className="max-w-full h-auto" />
                    </div>
                  ))}
                  {/* Reactions */}
                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {Object.entries(message.reactions).map(([emoji, users]) => (
                        <button
                          key={emoji}
                          onClick={() => users.includes(user?.id || '') ? removeReaction(message.id, emoji) : addReaction(message.id, emoji)}
                          className={`text-xs px-2 py-0.5 rounded-full ${users.includes(user?.id || '') ? 'bg-blue-500/30' : 'bg-gray-700/50'} hover:bg-blue-500/20 transition-colors`}
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
            <div className={`absolute top-0 ${message.userId === user?.id ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2`}>
              <button
                onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white/80"
              >
                <Smile size={16} />
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => deleteMessage(message.id)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-red-400 hover:text-red-300"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {/* Emoji Picker */}
            {showEmojiPicker === message.id && (
              <div className={`absolute ${message.userId === user?.id ? 'left-0' : 'right-0'} mt-2 bg-gray-800 rounded-lg shadow-xl p-2 flex gap-1 z-10`}>
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
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-700/50 rounded-lg">
            <div className="flex items-end">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-transparent border-none p-3 text-white placeholder-white/40 text-sm resize-none focus:ring-0 min-h-[44px] max-h-[120px]"
                style={{ height: '44px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <div className="flex items-center gap-2 p-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white/80"
                >
                  <Image size={18} />
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
} 