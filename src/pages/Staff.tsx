import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { Plus, Trash2, Edit, Mail, Phone, MapPin, Calendar, Shield, ShieldOff, Users, RefreshCw, Search, PlusCircle, X, CheckCircle, AlertTriangle, Loader2, UserPlus, UserCog } from 'lucide-react';
import type { UserData, User } from '../types';
import * as authService from '../services/auth.service';
import SimpleDatePicker from '../components/SimpleDatePicker';
import toast from 'react-hot-toast';

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
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

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
            
            toast.success(t('staff.userRegistered'));
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
      password: staff.password,
      country: staff.country,
      age: staff.age,
      phone: staff.phone,
      arrivalDate,
      departureDate,
      gender: staff.gender,
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

  // Filtrar usuários baseado na pesquisa
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone && u.phone.toLowerCase().includes(search.toLowerCase()))
  );

  // Ordenar usuários: administradores primeiro, depois por nome
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    return a.name.localeCompare(b.name);
  });

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'staff',
      password: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '', // Não preenchemos a senha ao editar
    });
    setShowForm(true);
  };

  const handleOpenDeleteConfirm = (user: any) => {
    setSelectedUser(user);
    setShowConfirmDelete(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error(t('staff.fillRequiredFields'));
      return;
    }

    try {
      setIsLoading(true);
      const toastId = toast.loading(t('staff.addingUser'));

      await addStaff({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role as 'admin' | 'staff',
        password: formData.password,
      });

      toast.success(t('staff.userAdded'), { id: toastId });
      setShowAddModal(false);
    } catch (error: any) {
      toast.error(error.message || t('staff.errorAddingUser'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error(t('staff.fillRequiredFields'));
      return;
    }

    try {
      setIsLoading(true);
      const toastId = toast.loading(t('staff.updatingUser'));

      const updateData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role as 'admin' | 'staff',
      };

      // Apenas incluir a senha se foi fornecida
      if (formData.password) {
        updateData.password = formData.password;
      }

      await updateStaff(selectedUser.id, updateData);

      toast.success(t('staff.userUpdated'), { id: toastId });
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message || t('staff.errorUpdatingUser'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setIsLoading(true);
      const toastId = toast.loading(t('staff.removingUser'));

      await removeStaff(selectedUser.id);

      toast.success(t('staff.userRemoved'), { id: toastId });
      setShowConfirmDelete(false);
    } catch (error: any) {
      toast.error(error.message || t('staff.errorRemovingUser'));
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return t('staff.admin');
      case 'staff': return t('staff.staff');
      default: return role;
    }
  };

  return (
    <div className="bg-gray-900 min-h-full p-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-light text-blue-300 mb-4">{t('staff.title')}</h1>
        
        {/* Barra de ferramentas */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 focus:border-blue-500 block w-full pl-10 pr-3 py-2 rounded-lg text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleOpenAddModal}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <UserPlus size={18} />
            <span>{t('staff.addUser')}</span>
          </button>
        </div>
        
        {/* Lista de usuários */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center gap-2">
            <Users size={18} className="text-blue-400" />
            <h2 className="font-medium text-blue-300">
              {t('staff.allUsers')} ({sortedUsers.length})
            </h2>
          </div>
          
          {sortedUsers.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              {search ? t('staff.noUsersFound') : t('staff.noUsers')}
            </div>
          ) : (
            <ul className="divide-y divide-gray-700">
              {sortedUsers.map(user => (
                <li key={user.id} className="p-4 hover:bg-gray-750 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-gray-200 font-medium">{user.name}</h3>
                      <div className="text-sm text-gray-400">{user.email}</div>
                      {user.phone && (
                        <div className="text-sm text-gray-400">{user.phone}</div>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50' 
                          : 'bg-gray-700 text-gray-300'
                      } mr-4`}>
                        {getRoleText(user.role)}
                      </span>
                      
                      <div className="flex gap-2">
                        {/* Não permitir editar o próprio usuário */}
                        {user.id !== currentUser?.id && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="p-1.5 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white"
                              aria-label={t('edit')}
                            >
                              <Edit size={18} />
                            </button>
                            
                            <button
                              onClick={() => handleOpenDeleteConfirm(user)}
                              className="p-1.5 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white"
                              aria-label={t('remove')}
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        
                        {user.id === currentUser?.id && (
                          <span className="p-1.5 rounded-full text-white">
                            <UserCog size={18} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Modal de adicionar usuário */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-lg font-medium text-blue-300">{t('staff.addUser')}</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t('staff.name')} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t('staff.email')} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t('staff.phone')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t('staff.role')}
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="staff">{t('staff.staff')}</option>
                  <option value="admin">{t('staff.admin')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t('staff.password')} *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('saving')}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      {t('save')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de editar usuário */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-lg font-medium text-blue-300">{t('staff.editUser')}</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t('staff.name')} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t('staff.email')} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t('staff.phone')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t('staff.role')}
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="staff">{t('staff.staff')}</option>
                  <option value="admin">{t('staff.admin')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t('staff.password')} *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('saving')}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      {t('save')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de confirmação para excluir */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 p-4 border-b border-gray-700">
              <AlertTriangle className="text-orange-500" size={20} />
              <h2 className="text-lg font-medium text-orange-300">{t('staff.confirmDelete')}</h2>
            </div>
            
            <div className="p-4">
              <p className="text-gray-300 mb-2">
                {t('staff.confirmDeleteText', { name: selectedUser?.name })}
              </p>
              <p className="text-sm text-gray-400">{t('staff.cantBeUndone')}</p>
            </div>
            
            <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isLoading}
                className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t('removing')}
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    {t('remove')}
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

function StaffInfo({ staff, onEdit, onDelete, onRoleChange }: { 
  staff: UserData; 
  onEdit?: (staff: UserData) => void;
  onDelete?: (id: string) => void;
  onRoleChange?: (id: string, action: 'make' | 'remove') => void;
}) {
  const { t } = useTranslation();
  const { user } = useStore();

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  const isCurrentUserAdmin = user?.role === 'admin';
  const isCurrentUser = user?.id === staff.id;

  return (
    <div className="relative p-4 hover:bg-orange-50 transition-colors group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium">
          {staff.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-orange-700 flex items-center gap-1">
            {staff.name}
            {staff.gender === 'male' && <span className="text-blue-400 text-xs">♂</span>}
            {staff.gender === 'female' && <span className="text-pink-400 text-xs">♀</span>}
          </h3>
          <div className="flex flex-col text-xs gap-1 text-orange-600">
            <div className="flex items-center gap-1">
              <Mail size={12} className="text-orange-400" />
              <span>{staff.email}</span>
            </div>
            {staff.phone && (
              <div className="flex items-center gap-1">
                <Phone size={12} className="text-orange-400" />
                <span>{staff.phone}</span>
              </div>
            )}
            {staff.country && (
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-orange-400" />
                <span>{staff.country}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar size={12} className="text-orange-400" />
              <span>
                {formatDate(staff.arrivalDate)} - {formatDate(staff.departureDate)}
              </span>
            </div>
          </div>
        </div>
        
        {isCurrentUserAdmin && !isCurrentUser && onEdit && onDelete && onRoleChange && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 absolute right-4 top-4">
            <button
              onClick={() => onEdit(staff)}
              className="p-1.5 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
              title={t('staff.edit')}
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(staff.id)}
              className="p-1.5 bg-red-100 text-white rounded-lg hover:bg-red-200 transition-colors"
              title={t('staff.delete')}
            >
              <Trash2 size={16} />
            </button>
            {staff.role === 'user' ? (
              <button
                onClick={() => onRoleChange(staff.id, 'make')}
                className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                title={t('staff.makeAdmin')}
              >
                <Shield size={16} />
              </button>
            ) : (
              <button
                onClick={() => onRoleChange(staff.id, 'remove')}
                className="p-1.5 bg-amber-100 text-white rounded-lg hover:bg-amber-200 transition-colors"
                title={t('staff.removeAdmin')}
              >
                <ShieldOff size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}