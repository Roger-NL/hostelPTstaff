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
    <div className="p-4 h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-light text-orange-700">{t('staff.title')}</h1>
        <div className="flex gap-2">
          <button
            onClick={loadUsers}
            className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => {
              setFormData(initialFormData);
              setEditingId(null);
              setShowForm(true);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg transition-colors flex items-center"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm border border-orange-100">
          <div className="p-4 border-b border-orange-100 flex items-center justify-between">
            <h2 className="text-lg font-medium text-orange-700 flex items-center gap-2">
              <Shield size={18} className="text-orange-600" />
              {t('staff.admins')}
            </h2>
            <span className="bg-orange-100 text-orange-600 text-xs rounded-full px-2 py-0.5">
              {admins.length}
            </span>
          </div>
          <div className="divide-y divide-orange-100">
            {admins.map(admin => (
              <StaffInfo 
                key={admin.id} 
                staff={admin} 
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRoleChange={handleRoleChange}
              />
            ))}
          </div>
        </div>

        {/* Volunteers Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm border border-orange-100">
          <div className="p-4 border-b border-orange-100 flex items-center justify-between">
            <h2 className="text-lg font-medium text-orange-700 flex items-center gap-2">
              <Users size={18} className="text-orange-600" />
              {t('staff.volunteers')}
            </h2>
            <span className="bg-orange-100 text-orange-600 text-xs rounded-full px-2 py-0.5">
              {volunteers.length}
            </span>
          </div>
          <div className="divide-y divide-orange-100">
            {volunteers.map(volunteer => (
              <StaffInfo 
                key={volunteer.id} 
                staff={volunteer} 
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRoleChange={handleRoleChange}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Staff Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-orange-100">
              <h3 className="text-lg font-medium text-orange-700">
                {editingId ? t('staff.editStaff') : t('staff.addStaff')}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-orange-700 mb-1">
                  {t('staff.name')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-orange-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-700 mb-1">
                  {t('staff.email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border border-orange-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required
                  disabled={!!editingId}
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">
                    {t('staff.password')}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2 border border-orange-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required={!editingId}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">
                    {t('staff.country')}
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full p-2 border border-orange-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">
                    {t('staff.age')}
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full p-2 border border-orange-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-700 mb-1">
                  {t('staff.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 border border-orange-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">
                    {t('staff.arrivalDate')}
                  </label>
                  <SimpleDatePicker 
                    value={formData.arrivalDate} 
                    onChange={(date) => setFormData({ ...formData, arrivalDate: date || new Date() })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">
                    {t('staff.departureDate')}
                  </label>
                  <SimpleDatePicker 
                    value={formData.departureDate} 
                    onChange={(date) => setFormData({ ...formData, departureDate: date || new Date() })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? t('loading') : editingId ? t('staff.update') : t('staff.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-4 border-b border-orange-100">
              <h3 className="text-lg font-medium text-orange-700">{t('staff.confirmDelete')}</h3>
            </div>
            <div className="p-4">
              <p className="text-orange-600">{t('staff.deleteWarning')}</p>
            </div>
            <div className="p-4 flex justify-end space-x-2 border-t border-orange-100">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('staff.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {showConfirmRole && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-4 border-b border-orange-100">
              <h3 className="text-lg font-medium text-orange-700">
                {showConfirmRole.action === 'make' ? t('staff.confirmMakeAdmin') : t('staff.confirmRemoveAdmin')}
              </h3>
            </div>
            <div className="p-4">
              <p className="text-orange-600">
                {showConfirmRole.action === 'make' ? t('staff.makeAdminWarning') : t('staff.removeAdminWarning')}
              </p>
            </div>
            <div className="p-4 flex justify-end space-x-2 border-t border-orange-100">
              <button
                onClick={() => setShowConfirmRole(null)}
                className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmRoleChange}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {t('confirm')}
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
              className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
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
                className="p-1.5 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors"
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