import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  User, 
  Settings,
  Eye, 
  EyeOff,
  Save,
  RefreshCw
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const AdminProfile = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminData, setAdminData] = useState({
    username: '',
    email: '',
    full_name: '',
    is_super_admin: false,
    created_at: ''
  });

  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    full_name: '',
    whatsapp_number: '',
    current_password: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      setLoading(true);
      const response = await axios.get(`${API}/api/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAdminData(response.data);
      setProfileForm({
        username: response.data.username,
        email: response.data.email,
        full_name: response.data.full_name,
        whatsapp_number: response.data.whatsapp_number,
        current_password: ''
      });
    } catch (error) {
      console.error('Failed to fetch admin profile:', error);
      toast.error(t('failedToLoadProfile'));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    try {
      setSaving(true);

      const response = await axios.put(`${API}/api/admin/profile`, profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAdminData({ ...adminData, ...response.data });
      toast.success(t('profileUpdated'));
    } catch (error) {
      console.error('Failed to update profile:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message;
      toast.error(t('failedToUpdateProfile') || errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast.error(t('passwordTooShort'));
      return;
    }

    const token = localStorage.getItem('admin_token');

    try {
      setSaving(true);

      await axios.put(`${API}/api/admin/change-password`, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

      toast.success(t('passwordChanged'));
    } catch (error) {
      console.error('Failed to change password:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message;
      toast.error(t('failedToChangePassword') || errorMessage);
    } finally {
      setSaving(false);
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <User className="h-8 w-8 mr-3 text-blue-600" />
              {t('adminProfile')}
            </h1>
            <p className="mt-2 text-gray-600">
              {t('manageAdminAccount')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-6 w-6 mr-2 text-blue-600" />
              {t('profileInformation')}
            </h3>
          </div>
          <div className="p-6">
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('username')}
                </label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('enterFullName')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('whatsappNumber')}
                </label>
                <input
                  type="tel"
                  value={profileForm.whatsapp_number}
                  onChange={(e) => setProfileForm({...profileForm, whatsapp_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('enterWhatsappNumber')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('whatsappNumberHint')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('currentPassword')} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword.profileCurrent ? "text" : "password"}
                    value={profileForm.current_password}
                    onChange={(e) => setProfileForm({...profileForm, current_password: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('enterCurrentPassword')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({...showPassword, profileCurrent: !showPassword.profileCurrent})}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword.profileCurrent ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('passwordRequired')}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {t('accountType')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    adminData.is_super_admin 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {adminData.is_super_admin 
                      ? (t('superAdmin'))
                      : (t('admin'))
                    }
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('memberSince')}: {new Date(adminData.created_at).toLocaleDateString()}
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t('updating')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('updateProfile')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Settings className="h-6 w-6 mr-2 text-green-600" />
              {t('changePassword')}
            </h3>
          </div>
          <div className="p-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('currentPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('newPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('confirmNewPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Settings className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      {t('passwordRequirements')}
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>{t('minSixChars')}</li>
                        <li>{t('includeLettersNumbers')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t('changing')}
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    {t('changePassword')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;