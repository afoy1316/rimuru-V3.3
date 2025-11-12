import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const ClientEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    phone_number: '',
    company_name: '',
    address: '',
    is_active: true
  });

  useEffect(() => {
    if (id) {
      fetchClientDetail();
    }
  }, [id]);

  const fetchClientDetail = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      setLoading(true);
      const response = await axios.get(`${API}/api/admin/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clientData = response.data;
      setClient(clientData);
      
      // Populate form with client data
      setFormData({
        display_name: clientData.display_name,
        email: clientData.email,
        phone_number: clientData.phone_number,
        company_name: clientData.company_name,
        address: clientData.address,
        is_active: clientData.is_active !== false
      });
      
    } catch (error) {
      console.error('Failed to fetch client detail:', error);
      toast.error(t('failedToLoadClient'));
      if (error.response?.status === 404) {
        navigate('/admin/clients');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    
    try {
      setSaving(true);
      
      // Create update payload (only include changed fields)
      const updateData = {};
      if (formData.display_name !== (client.display_name)) {
        updateData.display_name = formData.display_name;
      }
      if (formData.email !== (client.email)) {
        updateData.email = formData.email;
      }
      if (formData.phone_number !== (client.phone_number)) {
        updateData.phone_number = formData.phone_number;
      }
      if (formData.company_name !== (client.company_name)) {
        updateData.company_name = formData.company_name;
      }
      if (formData.address !== (client.address)) {
        updateData.address = formData.address;
      }
      
      // Update client data
      await axios.put(`${API}/api/admin/clients/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update status if changed
      if (formData.is_active !== (client.is_active !== false)) {
        await axios.put(`${API}/api/admin/clients/${id}/status`, {
          is_active: formData.is_active
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      toast.success(t('clientUpdated'));
      navigate(`/admin/clients/${id}`);
      
    } catch (error) {
      console.error('Failed to update client:', error);
      
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error(t('failedToUpdateClient'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t('clientNotFound')}</p>
        <Link to="/admin/clients" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
          ← {t('backToClients')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Link 
              to={`/admin/clients/${id}`}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← {t('backToDetail')}
            </Link>
            <div className="h-6 border-l border-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="text-xl mr-2">✏️</span>
              {t('editClient')}
            </h1>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {client.display_name?.charAt(0) || client.username?.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                @{client.username}
              </h2>
              <p className="text-sm text-gray-600">
                {t('editingClientProfile')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('clientInformation')}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Display Name */}
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
                {t('displayName')}
              </label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('enterDisplayName')}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('email')} *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('enterEmail')}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                {t('phoneNumber')}
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('enterPhoneNumber')}
              />
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                {t('companyName')}
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('enterCompanyName')}
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                {t('address')}
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('enterAddress')}
              />
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  {t('clientActive')}
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('clientActiveDesc')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200">
            <Link
              to={`/admin/clients/${id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {t('cancel')}
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('saving')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('saveChanges')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientEdit;