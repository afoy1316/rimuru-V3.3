import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Settings, 
  Users, 
  UserPlus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  RefreshCw,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const AdminManagement = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    whatsapp_number: '',
    is_super_admin: false
  });

  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    full_name: '',
    whatsapp_number: '',
    is_super_admin: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState(null);

  useEffect(() => {
    fetchAdmins(true); // Initial load with loading indicator
    fetchCurrentUser();

    // Silent auto-refresh admins and current user every 10 seconds
    const intervalId = setInterval(() => {
      fetchAdmins(false); // Silent refresh without loading indicator
      fetchCurrentUser();
    }, 10000); // 10 seconds for consistency with other admin pages

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchAdmins = async (showLoading = true) => {
    const token = localStorage.getItem('admin_token');
    try {
      if (showLoading) setLoading(true);
      const response = await axios.get(`${API}/api/admin/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      // Only show error toast on initial load, not during silent refresh
      if (showLoading) {
        toast.error(t('failedToLoadAdmins'));
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await axios.get(`${API}/api/admin/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    if (createForm.password.length < 6) {
      toast.error(t('passwordTooShort'));
      return;
    }

    try {
      setSaving(true);
      await axios.post(`${API}/api/admin/admins`, createForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(t('adminCreated'));
      setShowCreateModal(false);
      setCreateForm({
        username: '',
        email: '',
        password: '',
        full_name: '',
        whatsapp_number: '',
        is_super_admin: false
      });
      fetchAdmins();
    } catch (error) {
      console.error('Failed to create admin:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message;
      toast.error(t('failedToCreateAdmin') || errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    try {
      setSaving(true);
      await axios.put(`${API}/api/admin/admins/${editingAdmin.id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(t('adminUpdated'));
      setShowEditModal(false);
      setEditingAdmin(null);
      fetchAdmins();
    } catch (error) {
      console.error('Failed to update admin:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message;
      toast.error(t('failedToUpdateAdmin') || errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (admin) => {
    setDeletingAdmin(admin);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deletingAdmin) return;

    const token = localStorage.getItem('admin_token');
    try {
      setSaving(true);
      await axios.delete(`${API}/api/admin/admins/${deletingAdmin.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(t('adminDeleted') || 'Admin deleted successfully');
      setShowDeleteConfirm(false);
      setDeletingAdmin(null);
      fetchAdmins();
    } catch (error) {
      console.error('Failed to delete admin:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message;
      toast.error(errorMessage || t('failedToDeleteAdmin') || 'Failed to delete admin');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (adminId, currentStatus) => {
    const token = localStorage.getItem('admin_token');
    try {
      await axios.put(`${API}/api/admin/admins/${adminId}/status`, {
        is_active: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(t('adminStatusUpdated'));
      fetchAdmins();
    } catch (error) {
      console.error('Failed to update admin status:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message;
      toast.error(t('failedToUpdateStatus') || errorMessage);
    }
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setEditForm({
      username: admin.username,
      email: admin.email,
      full_name: admin.full_name,
      whatsapp_number: admin.whatsapp_number,
      is_super_admin: admin.is_super_admin
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 flex items-center break-words">
              <Settings className="h-6 w-6 md:h-8 md:w-8 mr-2 md:mr-3 text-purple-600 flex-shrink-0" />
              <span className="break-words">{t('adminManagement')}</span>
            </h1>
            <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600 break-words">
              {t('manageAdminUsers')}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm md:text-base rounded-md transition-colors flex-shrink-0 self-start md:self-auto"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            <span className="whitespace-nowrap">{t('createAdmin')}</span>
          </button>
        </div>
      </div>

      {/* Admin List */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 md:h-6 md:w-6 mr-2 text-purple-600 flex-shrink-0" />
            <span className="break-words">{t('adminList')}</span>
            <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
              {admins.length}
            </span>
          </h3>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full divide-y divide-gray-200" style={{tableLayout: 'fixed'}}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '200px'}}>
                  ADMIN
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '200px'}}>
                  KONTAK
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '130px'}}>
                  WHATSAPP
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '120px'}}>
                  PERAN
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '100px'}}>
                  DIBUAT
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '100px'}}>
                  STATUS
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '150px'}}>
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4" style={{width: '200px'}}>
                    <div className="flex items-center min-w-0">
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-purple-600">
                          {admin.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate" title={admin.full_name || admin.username}>
                          {admin.full_name || admin.username}
                        </div>
                        <div className="text-xs text-gray-500 truncate" title={`@${admin.username}`}>
                          @{admin.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4" style={{width: '200px'}}>
                    <div className="text-sm text-gray-900 truncate" title={admin.email}>{admin.email}</div>
                  </td>
                  <td className="px-3 py-4" style={{width: '130px'}}>
                    <div className="text-sm text-gray-900 truncate" title={admin.whatsapp_number || '-'}>
                      {admin.whatsapp_number || (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4" style={{width: '120px'}}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      admin.is_super_admin
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      <Shield className="h-3 w-3 mr-1" />
                      {admin.is_super_admin 
                        ? 'Super Admin'
                        : 'Admin'
                      }
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500" style={{width: '100px'}}>
                    {new Date(admin.created_at).toLocaleDateString('id-ID', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric',
                      timeZone: 'Asia/Jakarta'
                    })}
                  </td>
                  <td className="px-3 py-4" style={{width: '100px'}}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      admin.is_active !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.is_active !== false ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-3 py-4" style={{width: '150px'}}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => openEditModal(admin)}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </button>

                      {currentUser?.id !== admin.id && (
                        <>
                          <button
                            onClick={() => handleStatusToggle(admin.id, admin.is_active !== false)}
                            className={`inline-flex items-center px-2 py-1 border border-transparent rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                              admin.is_active !== false
                                ? 'text-white bg-red-600 hover:bg-red-700'
                                : 'text-white bg-green-600 hover:bg-green-700'
                            }`}
                            title={admin.is_active !== false ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {admin.is_active !== false ? (
                              <>
                                <UserX className="h-3 w-3 mr-1" />
                                Nonaktifkan
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3 w-3 mr-1" />
                                Aktifkan
                              </>
                            )}
                          </button>

                          {currentUser?.is_super_admin && (
                            <button
                              onClick={() => openDeleteModal(admin)}
                              className="inline-flex items-center px-2 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-200">
          {admins.map((admin) => (
            <div key={admin.id} className="p-4 hover:bg-gray-50">
              {/* Admin Info Header */}
              <div className="flex items-start space-x-3 mb-3">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-base font-medium text-purple-600">
                    {admin.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900 break-words">
                    {admin.full_name || admin.username}
                  </div>
                  <div className="text-xs text-gray-500 break-all">
                    @{admin.username}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      admin.is_super_admin
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      <Shield className="h-3 w-3 mr-1" />
                      {admin.is_super_admin ? 'Super Admin' : 'Admin'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      admin.is_active !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.is_active !== false ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Details */}
              <div className="space-y-2 mb-3 bg-gray-50 rounded-lg p-3">
                <div className="flex items-start">
                  <span className="text-xs text-gray-500 w-24 flex-shrink-0">Email:</span>
                  <span className="text-sm text-gray-900 break-all min-w-0 flex-1">{admin.email}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-xs text-gray-500 w-24 flex-shrink-0">WhatsApp:</span>
                  <span className="text-sm text-gray-900 break-words min-w-0 flex-1">
                    {admin.whatsapp_number || <span className="text-gray-400 italic">-</span>}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-xs text-gray-500 w-24 flex-shrink-0">Dibuat:</span>
                  <span className="text-xs text-gray-600 break-words min-w-0 flex-1">
                    {new Date(admin.created_at).toLocaleDateString('id-ID', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric',
                      timeZone: 'Asia/Jakarta'
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => openEditModal(admin)}
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Admin
                </button>

                {currentUser?.id !== admin.id && (
                  <>
                    <button
                      onClick={() => handleStatusToggle(admin.id, admin.is_active !== false)}
                      className={`w-full inline-flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        admin.is_active !== false
                          ? 'text-white bg-red-600 hover:bg-red-700'
                          : 'text-white bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {admin.is_active !== false ? (
                        <>
                          <UserX className="h-4 w-4 mr-2" />
                          Nonaktifkan Admin
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Aktifkan Admin
                        </>
                      )}
                    </button>

                    {currentUser?.is_super_admin && (
                      <button
                        onClick={() => openDeleteModal(admin)}
                        className="w-full inline-flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus Admin
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {admins.length === 0 && (
          <div className="text-center py-8 px-4 text-gray-500">
            <Users className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-gray-400" />
            <p className="text-sm md:text-base">{t('noAdmins')}</p>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-2 md:px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg px-3 md:px-4 pt-4 md:pt-5 pb-3 md:pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-base md:text-lg leading-6 font-medium text-gray-900 break-words min-w-0 flex-1 mr-2">
                  {t('createNewAdmin')}
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    {t('username')} *
                  </label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    {t('email')} *
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    {t('fullName')}
                  </label>
                  <input
                    type="text"
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({...createForm, full_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    {t('whatsappNumber')}
                  </label>
                  <input
                    type="tel"
                    value={createForm.whatsapp_number}
                    onChange={(e) => setCreateForm({...createForm, whatsapp_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
                    placeholder={t('enterWhatsappNumber')}
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    {t('password')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={createForm.password}
                      onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
                      required
                      minLength="6"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_super_admin"
                    checked={createForm.is_super_admin}
                    onChange={(e) => setCreateForm({...createForm, is_super_admin: e.target.checked})}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded flex-shrink-0"
                  />
                  <label htmlFor="is_super_admin" className="ml-2 block text-xs md:text-sm text-gray-900 break-words">
                    {t('makeSuperAdmin')}
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 md:pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="w-full sm:w-auto px-3 md:px-4 py-2 border border-gray-300 rounded-md text-sm md:text-base text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto flex items-center justify-center px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm md:text-base rounded-md transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {t('creating')}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t('createAdmin')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-2 md:px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg px-3 md:px-4 pt-4 md:pt-5 pb-3 md:pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-base md:text-lg leading-6 font-medium text-gray-900 break-words min-w-0 flex-1 mr-2">
                  {t('editAdmin')}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    {t('username')} *
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    {t('email')} *
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    {t('fullName')}
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    {t('whatsappNumber')}
                  </label>
                  <input
                    type="tel"
                    value={editForm.whatsapp_number}
                    onChange={(e) => setEditForm({...editForm, whatsapp_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
                    placeholder={t('enterWhatsappNumber')}
                  />
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="edit_is_super_admin"
                    checked={editForm.is_super_admin}
                    onChange={(e) => setEditForm({...editForm, is_super_admin: e.target.checked})}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded flex-shrink-0 mt-0.5"
                    disabled={currentUser?.id === editingAdmin?.id}
                  />
                  <div className="ml-2 min-w-0 flex-1">
                    <label htmlFor="edit_is_super_admin" className="block text-xs md:text-sm text-gray-900 break-words">
                      {t('superAdmin')}
                    </label>
                    {currentUser?.id === editingAdmin?.id && (
                      <span className="text-xs text-gray-500 break-words">
                        {t('cannotChangeOwnRole')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 md:pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="w-full sm:w-auto px-3 md:px-4 py-2 border border-gray-300 rounded-md text-sm md:text-base text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto flex items-center justify-center px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm md:text-base rounded-md transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {t('updating')}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t('updateAdmin')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingAdmin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-2 md:p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-2 md:mx-4">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 mx-auto bg-red-100 rounded-full mb-3 md:mb-4">
                <Trash2 className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
              </div>
              
              <h3 className="text-base md:text-lg font-semibold text-gray-900 text-center mb-2 break-words px-2">
                {t('confirmDeleteAdmin') || 'Delete Admin Account'}
              </h3>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                <p className="text-xs md:text-sm text-red-800 mb-2 break-words">
                  Are you sure you want to delete this admin account?
                </p>
                <div className="bg-white rounded p-2 md:p-3 space-y-1">
                  <p className="text-xs md:text-sm break-words"><strong>Username:</strong> {deletingAdmin.username}</p>
                  <p className="text-xs md:text-sm break-all"><strong>Email:</strong> {deletingAdmin.email}</p>
                  <p className="text-xs md:text-sm break-words"><strong>Name:</strong> {deletingAdmin.full_name || '-'}</p>
                  <p className="text-xs md:text-sm break-words">
                    <strong>Role:</strong>{' '}
                    <span className={deletingAdmin.is_super_admin ? 'text-purple-600 font-semibold' : 'text-blue-600'}>
                      {deletingAdmin.is_super_admin ? 'Super Admin' : 'Admin'}
                    </span>
                  </p>
                </div>
              </div>

              <p className="text-xs md:text-sm text-gray-600 text-center mb-4 md:mb-6 break-words px-2">
                ⚠️ This action cannot be undone. All admin data will be permanently deleted.
              </p>

              <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingAdmin(null);
                  }}
                  disabled={saving}
                  className="w-full sm:flex-1 px-3 md:px-4 py-2 bg-gray-200 text-gray-800 text-sm md:text-base rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="w-full sm:flex-1 px-3 md:px-4 py-2 bg-red-600 text-white text-sm md:text-base rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('delete') || 'Delete'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;