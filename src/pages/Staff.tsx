import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { Plus, Trash2, Edit, Mail, Phone, MapPin, Calendar, Shield, ShieldOff, Users, RefreshCw } from 'lucide-react';
import type { UserData, User } from '../types';
import * as authService from '../services/auth.service';
import SimpleDatePicker from '../components/SimpleDatePicker';

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
  const { loadAllUsers, getUsers } = useAuth();
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
        const registrationData = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          country: formData.country,
          age: formData.age,
          relationshipStatus: 'single' as 'single' | 'dating' | 'married', // Valor padrão
          gender: formData.gender as 'male' | 'female' | 'other',
          phone: formData.phone,
          arrivalDate: formData.arrivalDate.toISOString().split('T')[0],
          departureDate: formData.departureDate.toISOString().split('T')[0]
        };
        
        try {
          // Registrar usuário DESCONECTADO do auth atual
          // NÃO usar async/await para evitar que o Firebase mude o usuário atual
          const registerPromise = authService.registerStaffOnly(registrationData);
          
          registerPromise.then((newUser: User | null) => {
            if (newUser) {
              // Apenas atualizar a lista localmente, sem reload
              const newUserData: UserData = {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                password: '',
                country: newUser.country || '',
                age: String(newUser.age || 0),
                relationshipStatus: newUser.relationshipStatus as string,
                gender: newUser.gender as string,
                phone: newUser.phone || '',
                arrivalDate: newUser.arrivalDate || '',
                departureDate: newUser.departureDate || '',
                isAuthenticated: false,
                role: 'user',
                points: 0
              };
              
              // Atualizar a lista de usuários sem recarregar
              useStore.getState().setUsers([...users, newUserData]);
              
              // Fechar o formulário
              setFormData(initialFormData);
              setShowForm(false);
              setEditingId(null);
              setIsLoading(false);
              
              alert('Usuário registrado com sucesso!');
            } else {
              throw new Error('Falha ao registrar usuário');
            }
          }).catch((error: Error) => {
            console.error('Erro ao registrar usuário:', error);
            setError(error instanceof Error ? error.message : t('error.general'));
            setIsLoading(false);
          });
          
          // Não esperar a promessa terminar para evitar problemas com o auth
          return;
        } catch (error) {
          console.error('Erro ao iniciar registro:', error);
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

  return (
    <div className="space-y-6">
      {/* Staff List */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-white">{t('staff.title')}</h2>
            {isLoading && (
              <div className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full ml-2"></div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadUsers}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-1"
              disabled={isLoading}
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              <span>{t('refresh')}</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  setFormData(initialFormData);
                  setEditingId(null);
                  setShowForm(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus size={16} />
                <span>{t('staff.addUser')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Refresh button */}
        <div className="mb-4 flex justify-between items-center">
          <button 
            onClick={async () => {
              setIsLoading(true);
              try {
                const loadedUsers = await loadAllUsers();
                alert(`Atualizado com sucesso. Total de ${loadedUsers.length} usuários no Firestore.`);
                // Recarregar a página para mostrar os usuários atualizados
                window.location.reload();
              } finally {
                setIsLoading(false);
              }
            }}
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            disabled={isLoading}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar lista
          </button>
          
          <div className="text-white/60 text-sm">
            Total de usuários: {users.length} 
            {isLoading && (
              <span className="inline-block animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full ml-2"></span>
            )}
          </div>
        </div>

        {/* Admins Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Shield className="text-purple-400" size={20} />
            {t('staff.roles.admin')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {admins.map(admin => (
              <div
                key={admin.id}
                className="bg-gray-700/50 rounded-lg p-4 border border-purple-500/20"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-white">{admin.name}</h3>
                  {isAdmin && (
                    <div className="flex gap-2">
                      {admin.id !== currentUser?.id && admins.length > 1 && (
                        <button
                          onClick={() => handleRoleChange(admin.id, 'remove')}
                          className="p-1 text-purple-400 hover:text-purple-300 transition-colors"
                          title={t('staff.alerts.onlyAdminEdit')}
                        >
                          <ShieldOff size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(admin)}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title={t('edit')}
                      >
                        <Edit size={16} />
                      </button>
                      {admin.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title={t('staff.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <StaffInfo staff={admin} />
              </div>
            ))}
          </div>
        </div>

        {/* Staff Section */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Users className="text-blue-400" size={20} />
            {t('staff.roles.volunteer')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {volunteers.map(staff => (
              <div
                key={staff.id}
                className="bg-gray-700/50 rounded-lg p-4 border border-white/10"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-white">{staff.name}</h3>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRoleChange(staff.id, 'make')}
                        className="p-1 text-purple-400 hover:text-purple-300 transition-colors"
                        title={t('staff.alerts.onlyAdminEdit')}
                      >
                        <Shield size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(staff)}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title={t('edit')}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(staff.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title={t('staff.delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <StaffInfo staff={staff} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">
              {t('staff.delete')}
            </h2>
            <p className="text-white/80 mb-6">
              {t('staff.alerts.confirmDelete')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {showConfirmRole && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">
              {showConfirmRole.action === 'make' ? t('staff.makeAdmin') : t('staff.removeAdmin')}
            </h2>
            <p className="text-white/80 mb-6">
              {showConfirmRole.action === 'make'
                ? t('staff.alerts.confirmMakeAdmin')
                : t('staff.alerts.confirmRemoveAdmin')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmRole(null)}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmRoleChange}
                className={`px-4 py-2 text-white rounded-lg transition ${
                  showConfirmRole.action === 'make'
                    ? 'bg-purple-500 hover:bg-purple-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Staff Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-white mb-6">
              {editingId ? t('staff.editUser') : t('staff.addUser')}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('name')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-700/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-700/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('password')}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-gray-700/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                    required={!editingId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('phone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-700/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('country')}
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-gray-700/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('age')}
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-gray-700/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                    min="18"
                    max="100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('gender')}
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={() => setFormData({ ...formData, gender: 'male' })}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 rounded-full border ${formData.gender === 'male' ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-gray-500'} flex items-center justify-center mr-2`}>
                        {formData.gender === 'male' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                      <span className="text-white">{t('male')}</span>
                    </label>
                    
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={() => setFormData({ ...formData, gender: 'female' })}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 rounded-full border ${formData.gender === 'female' ? 'bg-pink-500 border-pink-500' : 'bg-transparent border-gray-500'} flex items-center justify-center mr-2`}>
                        {formData.gender === 'female' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                      <span className="text-white">{t('female')}</span>
                    </label>
                    
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="other"
                        checked={formData.gender === 'other'}
                        onChange={() => setFormData({ ...formData, gender: 'other' })}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 rounded-full border ${formData.gender === 'other' ? 'bg-purple-500 border-purple-500' : 'bg-transparent border-gray-500'} flex items-center justify-center mr-2`}>
                        {formData.gender === 'other' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                      <span className="text-white">{t('other')}</span>
                    </label>
                  </div>
                </div>

                <div>
                  <SimpleDatePicker
                    label={t('arrivalDate')}
                    value={formData.arrivalDate}
                    onChange={(value) => setFormData({ 
                      ...formData, 
                      arrivalDate: value || new Date() 
                    })}
                    required
                  />
                </div>

                <div>
                  <SimpleDatePicker
                    label={t('departureDate')}
                    value={formData.departureDate}
                    onChange={(value) => setFormData({ 
                      ...formData, 
                      departureDate: value || new Date() 
                    })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData(initialFormData);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  {editingId ? t('save') : t('staff.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffInfo({ staff }: { staff: UserData }) {
  // Formatação das datas para exibição
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString; // Fallback para a string original
    }
  };

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2 text-gray-300">
        <Mail size={14} />
        <span>{staff.email}</span>
      </div>
      <div className="flex items-center gap-2 text-gray-300">
        <Phone size={14} />
        <span>{staff.phone}</span>
      </div>
      <div className="flex items-center gap-2 text-gray-300">
        <MapPin size={14} />
        <span>{staff.country}</span>
      </div>
      <div className="flex items-center gap-2 text-gray-300">
        <Calendar size={14} />
        <span>{formatDate(staff.arrivalDate)} - {formatDate(staff.departureDate)}</span>
      </div>
    </div>
  );
}