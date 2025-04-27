import React, { useState } from 'react';
import { User, UserPlus, X, Trash2, Award, Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';

const StaffManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user, users = [], addStaff, updateStaff, removeStaff, makeAdmin, removeAdmin } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{show: boolean; userId: string | null}>({
    show: false,
    userId: null
  });
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'volunteer' as 'admin' | 'volunteer',
  });

  const showAlertMessage = (message: string, type: 'success' | 'error') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!user || user.role !== 'admin') {
      showAlertMessage(t('staff.alerts.onlyAdminEdit'), 'error');
      return;
    }

    let success = false;
    if (newRole === 'admin') {
      success = makeAdmin(userId);
    } else {
      success = removeAdmin(userId);
    }

    if (success) {
      showAlertMessage(t('staff.alerts.roleUpdated'), 'success');
    } else {
      showAlertMessage(t('staff.alerts.roleUpdateFailed'), 'error');
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmation.userId) {
      removeStaff(deleteConfirmation.userId);
    }
    setDeleteConfirmation({ show: false, userId: null });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!user || user.role !== 'admin') {
      showAlertMessage(t('staff.alerts.onlyAdminDelete'), 'error');
      return;
    }

    setDeleteConfirmation({ show: true, userId });
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    addStaff({
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      country: '',
      age: '',
      relationshipStatus: 'single',
      phone: '',
      arrivalDate: '',
      departureDate: '',
      gender: 'other',
      shifts: []
    });
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'volunteer',
    });
    setIsAddModalOpen(false);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6 relative">
      {/* Alert Message */}
      {showAlert && (
        <div className={`fixed top-4 right-4 ${alertType === 'error' ? 'bg-red-500/90' : 'bg-green-500/90'} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in`}>
          <AlertCircle size={20} />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-light text-white mb-4">{t('staff.delete')}</h3>
            <p className="text-white/60 mb-6">{t('staff.alerts.confirmDelete')}</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteConfirmation({ show: false, userId: null })}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors duration-300"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light text-white">{t('staff.title')}</h2>
        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition-colors duration-300 flex items-center gap-2"
          >
            <UserPlus size={20} />
            {t('staff.addUser')}
          </button>
        )}
      </div>

      {/* Staff List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((staffMember) => (
          <div
            key={staffMember.id}
            className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 transition-all duration-500 hover:bg-gray-800/70 hover:shadow-2xl hover:shadow-yellow-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{staffMember.name}</h3>
                  <p className="text-white/60 text-sm">{staffMember.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <>
                    <select
                      value={staffMember.role}
                      onChange={(e) => handleRoleChange(staffMember.id, e.target.value as 'admin' | 'volunteer')}
                      className="bg-gray-700 text-white text-sm rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="volunteer">{t('staff.roles.volunteer')}</option>
                      <option value="admin">{t('staff.roles.admin')}</option>
                    </select>
                    {user?.id !== staffMember.id && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteUser(staffMember.id);
                        }}
                        className="text-white hover:text-white transition-colors duration-300"
                        title={t('staff.delete')}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-white/60 text-sm px-2 py-1">
                    {staffMember.role === 'admin' ? t('staff.roles.admin') : t('staff.roles.volunteer')}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-white/60">
                <Award size={16} />
                <span>{staffMember.points || 0} {t('points')}</span>
              </div>
              <div className="flex items-center gap-1 text-white/60">
                <Clock size={16} />
                <span>{staffMember.shifts?.length || 0} {t('staff.shifts')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-light text-white">{t('staff.addUser')}</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/60 hover:text-white transition-colors duration-300"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">{t('staff.name')}</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">{t('staff.email')}</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">{t('staff.password')}</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">{t('staff.role')}</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'volunteer' })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="volunteer">{t('staff.roles.volunteer')}</option>
                  <option value="admin">{t('staff.roles.admin')}</option>
                </select>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-white/60 hover:text-white transition-colors duration-300"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition-colors duration-300"
                >
                  {t('staff.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement; 