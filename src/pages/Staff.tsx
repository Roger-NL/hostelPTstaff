import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { Plus, Trash2, Edit, Mail, Phone, MapPin, Calendar, Shield, ShieldOff, Users, RefreshCw, X, User as UserIcon, Award, Clock } from 'lucide-react';
import type { UserData, User } from '../types';
import * as authService from '../services/auth.service';
import SimpleDatePicker from '../components/SimpleDatePicker';
import BackButton from '../components/BackButton';

interface StaffFormData {
  name: string;
  email: string;
  password: string;
  country: string;
  age: string;
  phone: string;
  arrivalDate: Date;
  departureDate: Date;
  gender: string;
}

// Interfaces para tipagem
interface UserRegistrationDataWithDateObjects {
  email: string;
  password: string;
  name: string;
  country?: string;
  age: string;
  relationshipStatus?: 'single' | 'dating' | 'married';
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  arrivalDate?: Date;
  departureDate?: Date;
}

const initialFormData: StaffFormData = {
  name: '',
  email: '',
  password: '',
  country: '',
  age: '',
  phone: '',
  arrivalDate: new Date(),
  departureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
  gender: 'other'
};

export default function Staff() {
  const { t } = useTranslation();
  const { users, addStaff, removeStaff, updateStaff, makeAdmin, removeAdmin, user: currentUser } = useStore();
  const { loadAllUsers, getUsers, register } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<StaffFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [showConfirmRole, setShowConfirmRole] = useState<{id: string, action: 'make' | 'remove'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar todos os usuários quando o componente for montado
  useEffect(() => {
    // Verifica se já temos usuários em cache
    const cachedUsers = getUsers();
    if (cachedUsers.length > 0) {
      console.log(`Usando ${cachedUsers.length} usuários já carregados no cache`);
      setIsLoading(false);
    } else {
      // Só carrega do Firestore se não houver usuários no cache
      loadUsers();
    }
  }, [getUsers]);

  const loadUsers = async () => {
    // Verifica se há usuários em cache primeiro
    const cachedUsers = getUsers();
    if (cachedUsers.length > 0) {
      console.log(`Usando ${cachedUsers.length} usuários do cache em vez de carregar do Firestore`);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const loadedUsers = await loadAllUsers();
      console.log(`${loadedUsers.length} usuários carregados`);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setError('Não foi possível carregar a lista de usuários.');
    } finally {
      setIsLoading(false);
    }
  };

  const volunteers = users.filter(user => user.role === 'user');
  const admins = users.filter(user => user.role === 'admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        // Converter datas para strings para editar funcionário existente
        const formDataForUpdate = {
          ...formData,
          arrivalDate: formData.arrivalDate.toISOString().split('T')[0],
          departureDate: formData.departureDate.toISOString().split('T')[0],
          relationshipStatus: 'single' // Valor padrão para manter compatibilidade
        };
        
        // Editar funcionário existente
        updateStaff(editingId, formDataForUpdate);
      } else {
        // Adicionar novo funcionário diretamente no Firebase
        setIsLoading(true);
        
        // Preparar dados para registro, convertendo Date para string
        const userData: Partial<User> = {
          name: formData.name,
          country: formData.country,
          age: parseInt(formData.age),
          relationshipStatus: 'single',
          gender: formData.gender as 'male' | 'female' | 'other',
          phone: formData.phone,
          arrivalDate: formData.arrivalDate.toISOString().split('T')[0],
          departureDate: formData.departureDate.toISOString().split('T')[0],
          role: 'user',
          points: 0
        };
        
        try {
          // Usar o método register do hook useAuth
          const newUser = await register(formData.email, formData.password, userData);

          if (newUser) {
            // Após o registro bem-sucedido, recarregar a lista de usuários
            await loadAllUsers();
            
            // Fechar o formulário
            setFormData(initialFormData);
            setShowForm(false);
            setEditingId(null);
            setIsLoading(false);
            
            alert(t('staff.userRegistered'));
          } else {
            throw new Error(t('staff.registerFailed'));
          }
        } catch (error) {
          console.error('Erro ao registrar usuário:', error);
          throw error;
        }
      }
      
      setFormData(initialFormData);
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.general'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (staff: UserData) => {
    // Converter strings de data para objetos Date
    const arrivalDate = staff.arrivalDate ? new Date(staff.arrivalDate) : new Date();
    const departureDate = staff.departureDate ? new Date(staff.departureDate) : new Date();
    
    setFormData({
      name: staff.name,
      email: staff.email,
      password: staff.password || '',
      country: staff.country || '',
      age: staff.age?.toString() || '',
      phone: staff.phone || '',
      arrivalDate,
      departureDate,
      gender: staff.gender || 'other',
    });
    setEditingId(staff.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setShowConfirmDelete(id);
  };

  const confirmDelete = () => {
    if (showConfirmDelete) {
      removeStaff(showConfirmDelete);
      setShowConfirmDelete(null);
    }
  };

  const handleRoleChange = (userId: string, action: 'make' | 'remove') => {
    setShowConfirmRole({ id: userId, action });
  };

  const confirmRoleChange = () => {
    if (!showConfirmRole) return;

    if (showConfirmRole.action === 'make') {
      makeAdmin(showConfirmRole.id);
    } else {
      removeAdmin(showConfirmRole.id);
    }

    setShowConfirmRole(null);
  };

  const isAdmin = currentUser?.role === 'admin';

  // Formatação das datas para exibição
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString; // Fallback para a string original
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-900/80">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-gray-800/90 backdrop-blur-sm bg-gray-900/60 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <BackButton variant="icon-only" />
          <h1 className="text-xl font-medium text-white tracking-tight">{t('staff.title')}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button 
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData(initialFormData);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
              aria-label="Add user"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">{t('addUser')}</span>
            </button>
          )}
          
          <button 
            onClick={loadUsers} 
            className="p-2 bg-gray-800 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white transition-all flex items-center justify-center"
            disabled={isLoading}
            aria-label="Refresh"
          >
            <RefreshCw size={18} className={`transition-transform duration-300 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto px-5 py-5 pb-24">
        {/* User stats summary */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="px-4 py-3 bg-gray-800/60 rounded-xl border border-gray-700/40 flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Total Users</h3>
              <p className="text-xl font-semibold text-white">{users.length}</p>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-800/60 rounded-xl border border-gray-700/40 flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Admins</h3>
              <p className="text-xl font-semibold text-white">{admins.length}</p>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-800/60 rounded-xl border border-gray-700/40 flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="p-2.5 rounded-lg bg-teal-500/20 text-teal-400">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Total Points</h3>
              <p className="text-xl font-semibold text-white">
                {users.reduce((sum, user) => sum + (user.points || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center my-6">
            <div className="bg-indigo-500/20 border border-indigo-500/30 px-5 py-2.5 rounded-full text-indigo-300 text-sm font-medium flex items-center gap-2.5 shadow-lg">
              <RefreshCw size={16} className="animate-spin" />
              <span>Loading user data...</span>
            </div>
          </div>
        )}
        
        {/* Staff members list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          {users.map((staffMember) => (
            <div
              key={staffMember.id}
              className="group bg-gray-800/80 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-indigo-500/30 transition-all duration-300 shadow-lg"
            >
              {/* Card Header with Avatar and Role */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-700/50">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <UserIcon size={22} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-base truncate">{staffMember.name}</h3>
                  <p className="text-gray-400 text-xs truncate">{staffMember.email}</p>
                </div>
                <div>
                  <span 
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      staffMember.role === 'admin' 
                        ? 'bg-indigo-500/20 text-indigo-300' 
                        : 'bg-gray-700/70 text-gray-300'
                    }`}
                  >
                    {staffMember.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </div>
              </div>
              
              {/* Card Body with User Info */}
              <div className="p-4 pb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm truncate">{staffMember.phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-red-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm truncate">{staffMember.country || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm truncate">{formatDate(staffMember.arrivalDate || '')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-yellow-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{staffMember.points || 0} pts</span>
                  </div>
                </div>
              </div>
              
              {/* Card Footer with Actions */}
              <div className="flex items-center justify-end gap-1 p-2 border-t border-gray-700/50 bg-gray-800/90">
                {isAdmin && (
                  <>
                    {currentUser?.id !== staffMember.id && (
                      <button
                        onClick={() => handleDelete(staffMember.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleEdit(staffMember)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title={t('edit')}
                    >
                      <Edit size={18} />
                    </button>
                    
                    {staffMember.role === 'admin' ? (
                      <button
                        onClick={() => handleRoleChange(staffMember.id, 'remove')}
                        className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                        title={t('staff.removeAdmin')}
                      >
                        <Shield size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRoleChange(staffMember.id, 'make')}
                        className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                        title={t('staff.makeAdmin')}
                      >
                        <ShieldOff size={18} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {users.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-800/40 rounded-2xl border border-gray-700/40">
            <Users size={48} className="text-gray-500 mb-4" />
            <p className="text-gray-300 mb-2 text-lg font-medium">{t('staff.noUsers')}</p>
            <p className="text-gray-500 text-sm max-w-md">{t('staff.addUserPrompt')}</p>
            {isAdmin && (
              <button 
                onClick={() => {
                  setShowForm(true);
                  setEditingId(null);
                  setFormData(initialFormData);
                }}
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <Plus size={18} />
                <span>{t('addUser')}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl overflow-hidden w-full max-w-md border border-gray-700/60 shadow-2xl animate-fade-up">
            <div className="bg-red-500/10 p-6 border-b border-gray-700/60">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500/20 rounded-full text-red-400">
                  <Trash2 size={20} />
                </div>
                <h3 className="text-xl font-medium text-white">
                  {t('staff.confirmDelete')}
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-300 mb-6">
                {t('staff.confirmDeleteMessage')}
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmDelete(null)}
                  className="px-4 py-2.5 text-gray-300 hover:text-white transition-colors font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg shadow-red-900/30"
                >
                  {t('confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role change confirmation */}
      {showConfirmRole && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl overflow-hidden w-full max-w-md border border-gray-700/60 shadow-2xl animate-fade-up">
            <div className={`p-6 border-b border-gray-700/60 ${
              showConfirmRole.action === 'make' ? 'bg-indigo-500/10' : 'bg-gray-700/50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${
                  showConfirmRole.action === 'make' 
                    ? 'bg-indigo-500/20 text-indigo-400' 
                    : 'bg-gray-600/50 text-gray-300'
                }`}>
                  {showConfirmRole.action === 'make' ? <Shield size={20} /> : <ShieldOff size={20} />}
                </div>
                <h3 className="text-xl font-medium text-white">
                  {showConfirmRole.action === 'make' ? t('staff.confirmMakeAdmin') : t('staff.confirmRemoveAdmin')}
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-300 mb-6">
                {showConfirmRole.action === 'make' 
                  ? t('staff.confirmMakeAdminMessage') 
                  : t('staff.confirmRemoveAdminMessage')}
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmRole(null)}
                  className="px-4 py-2.5 text-gray-300 hover:text-white transition-colors font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={confirmRoleChange}
                  className={`px-4 py-2.5 rounded-lg font-medium shadow-lg ${
                    showConfirmRole.action === 'make' 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/30' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white shadow-gray-900/20'
                  }`}
                >
                  {t('confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit user form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl overflow-hidden w-full max-w-md my-2 border border-gray-700/60 shadow-2xl animate-fade-up">
            {/* Form Header */}
            <div className="bg-gray-700/30 p-4 border-b border-gray-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/20 rounded-full text-indigo-400">
                  {editingId ? <Edit size={18} /> : <Plus size={18} />}
                </div>
                <h2 className="text-lg font-medium text-white">
                  {editingId ? t('staff.editUser') : t('staff.addUser')}
                </h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white p-1.5 hover:bg-gray-700/70 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <div className="px-4 py-3 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-start gap-2">
                  <div className="p-1 bg-red-500/20 rounded-full text-red-400 mt-0.5 flex-shrink-0">
                    <X size={10} />
                  </div>
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-300">
                      {t('name')}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-gray-700/50 border border-gray-600/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-300">
                      {t('email')}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-gray-700/50 border border-gray-600/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-300">
                      {t('password')}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-gray-700/50 border border-gray-600/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors"
                      required={!editingId}
                      placeholder={editingId ? "••••••••••" : ""}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-300">
                      {t('phone')}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-gray-700/50 border border-gray-600/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-300">
                      {t('country')}
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                      className="w-full bg-gray-700/50 border border-gray-600/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-300">
                      {t('age')}
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={e => setFormData({ ...formData, age: e.target.value })}
                      className="w-full bg-gray-700/50 border border-gray-600/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-300">
                      {t('arrivalDate')}
                    </label>
                    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg">
                      <SimpleDatePicker
                        value={formData.arrivalDate}
                        onChange={(date) => setFormData({ ...formData, arrivalDate: date || new Date() })}
                        className="border-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-300">
                      {t('departureDate')}
                    </label>
                    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg">
                      <SimpleDatePicker
                        value={formData.departureDate}
                        onChange={(date) => setFormData({ ...formData, departureDate: date || new Date() })}
                        className="border-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Footer */}
                <div className="pt-3 border-t border-gray-700/60 flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-3 py-2 text-gray-300 hover:text-white transition-colors font-medium text-sm"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-900/30 flex items-center gap-2 text-sm"
                  >
                    {isLoading && <RefreshCw size={14} className="animate-spin" />}
                    {editingId ? t('update') : t('add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}