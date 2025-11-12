import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import ResetPasswordModal from './ResetPasswordModal';
import { 
  Users, 
  Eye, 
  MoreVertical,
  Search,
  Filter,
  UserCheck,
  UserX,
  Edit,
  FileText,
  Key,
  CheckCircle
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const ClientManagement = () => {
  const { t } = useLanguage();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resetPasswordModal, setResetPasswordModal] = useState({
    isOpen: false,
    clientId: null,
    clientUsername: '',
    loading: false
  });
  const [failureCount, setFailureCount] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [paginatedClients, setPaginatedClients] = useState([]);

  useEffect(() => {
    fetchClients();

    // Auto-refresh clients every 10 seconds for real-time updates (silent)
    // Only if not too many consecutive failures
    const intervalId = setInterval(() => {
      if (failureCount < 3) {
        fetchClients(true); // Silent refresh
      }
    }, 10000); // 10 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [failureCount]);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, statusFilter]);

  // Pagination effect
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredClients.slice(startIndex, endIndex);
    setPaginatedClients(paginated);
  }, [filteredClients, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-menu') && !event.target.closest('[data-dropdown-toggle]')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
          menu.classList.add('hidden');
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchClients = async (silent = false) => {
    const token = localStorage.getItem('admin_token');
    
    // Check if token exists
    if (!token) {
      console.error('No admin token found');
      toast.error('Session expired. Please login again.');
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 1500);
      setLoading(false);
      setFailureCount(prev => prev + 1);
      return;
    }
    
    try {
      if (!silent) {
        setLoading(true);
      }
      
      const response = await axios.get(`${API}/api/admin/clients`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000 // 30 seconds timeout
      });
      
      setClients(response.data);
      setFailureCount(0); // Reset failure count on success
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      setFailureCount(prev => prev + 1); // Increment failure count
      
      // Handle authentication errors
      if (error.response && error.response.status === 401) {
        if (!silent) {
          toast.error('Session expired. Please login again.');
        }
        localStorage.removeItem('admin_token');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1500);
      } else if (error.code === 'ECONNABORTED') {
        if (!silent) {
          toast.error('Request timeout. Please try again.');
        }
      } else {
        if (!silent) {
          toast.error(t('failedToLoadClients'));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.display_name && client.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.company_name && client.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(client => client.is_active !== false);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(client => client.is_active === false);
      }
    }

    setFilteredClients(filtered);
  };

  const handleStatusToggle = async (clientId, currentStatus) => {
    const token = localStorage.getItem('admin_token');
    try {
      await axios.put(`${API}/api/admin/clients/${clientId}/status`, {
        is_active: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setClients(clients.map(client =>
        client.id === clientId
          ? { ...client, is_active: !currentStatus }
          : client
      ));

      toast.success(t('clientStatusUpdated'));
    } catch (error) {
      console.error('Failed to update client status:', error);
      toast.error(t('failedToUpdateStatus'));
    }
  };

  const handleResetPassword = (clientId, clientUsername) => {
    setResetPasswordModal({
      isOpen: true,
      clientId,
      clientUsername,
      loading: false
    });
  };

  const confirmResetPassword = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      setResetPasswordModal(prev => ({ ...prev, loading: true }));
      
      const response = await axios.post(`${API}/api/admin/clients/${resetPasswordModal.clientId}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { new_password, username } = response.data;
      
      // Close modal
      setResetPasswordModal({
        isOpen: false,
        clientId: null,
        clientUsername: '',
        loading: false
      });

      // Show success message with new password
      toast.success(
        <div>
          <p className="font-semibold">Password reset successful!</p>
          <p className="text-sm mt-1">Username: <span className="font-mono bg-gray-100 px-1 rounded">{username}</span></p>
          <p className="text-sm">New Password: <span className="font-mono bg-gray-100 px-1 rounded">{new_password}</span></p>
          <p className="text-xs text-gray-600 mt-1">Save this information securely!</p>
        </div>,
        { duration: 10000 }
      );

    } catch (error) {
      console.error('Failed to reset password:', error);
      toast.error(t('failedToResetPassword'));
    } finally {
      setResetPasswordModal(prev => ({ ...prev, loading: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount || 0);
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

  return (
    <div className="space-y-4 sm:space-y-6 overflow-visible">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
              <span className="break-words">{t('clientManagement')}</span>
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 break-words">
              {t('clientManagementDesc')}
            </p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="text-left sm:text-right">
              <div className="text-sm font-medium text-gray-900">{clients.length}</div>
              <div className="text-xs text-gray-500">{t('totalClients')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="break-words">{t('searchClients')}</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('searchPlaceholder')}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="break-words">{t('status')}</span>
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('allClients')}</option>
              <option value="active">{t('activeOnly')}</option>
              <option value="inactive">{t('inactiveOnly')}</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="text-xs sm:text-sm text-gray-600 break-words">
              {t('showingResults')}: {filteredClients.length} {t('of')} {clients.length}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedClients.length > 0 ? (
          paginatedClients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
              {/* Client Info */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {client.display_name?.charAt(0) || client.username?.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 break-words">
                    {client.display_name || client.username}
                  </h3>
                  <p className="text-xs text-gray-500 break-words">@{client.username}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    client.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {client.is_active !== false ? t('active') : t('inactive')}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-1 mb-3 pb-3 border-b border-gray-200">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 flex-shrink-0">📧</span>
                  <span className="text-xs text-gray-700 break-all">{client.email}</span>
                </div>
                {client.phone_number && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 flex-shrink-0">📱</span>
                    <span className="text-xs text-gray-700 break-words">{client.phone_number}</span>
                  </div>
                )}
                {client.company_name && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 flex-shrink-0">🏢</span>
                    <span className="text-xs text-gray-700 break-words">{client.company_name}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-gray-200">
                <div>
                  <div className="text-xs text-gray-500">{t('requests')}</div>
                  <div className="text-sm font-medium text-gray-900">{client.total_requests || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t('balance')}</div>
                  <div className="text-sm font-medium text-gray-900">{formatCurrency(client.wallet_balance_idr || 0)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t('topup')}</div>
                  <div className="text-sm font-medium text-gray-900">{formatCurrency(client.total_topup || 0)}</div>
                </div>
              </div>

              {/* Date */}
              <div className="text-xs text-gray-500 mb-3">
                {t('registeredDate')}: {formatDate(client.created_at)}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/admin/clients/${client.id}`}
                  className="flex-1 min-w-[100px] inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {t('view')}
                </Link>
                <button
                  onClick={() => handleStatusToggle(client.id, client.is_active !== false)}
                  className={`flex-1 min-w-[100px] inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md ${
                    client.is_active !== false
                      ? 'text-white bg-red-600 hover:bg-red-700'
                      : 'text-white bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {client.is_active !== false ? (
                    <><UserX className="w-3 h-3 mr-1" />{t('deactivate')}</>
                  ) : (
                    <><UserCheck className="w-3 h-3 mr-1" />{t('activate')}</>
                  )}
                </button>
                
                {/* Dropdown Menu */}
                <div className="relative">
                  <button
                    data-dropdown-toggle
                    className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Close all other dropdowns
                      document.querySelectorAll('.dropdown-menu').forEach(menu => {
                        if (menu !== e.currentTarget.nextElementSibling) {
                          menu.classList.add('hidden');
                        }
                      });
                      // Toggle current dropdown
                      const dropdown = e.currentTarget.nextElementSibling;
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {/* Dropdown Menu Content */}
                  <div className="dropdown-menu hidden absolute right-0 z-[9999] mt-1 w-44 origin-top-right rounded-md bg-white shadow-xl ring-1 ring-black ring-opacity-5 border border-gray-100">
                    <div className="py-1">
                      <Link
                        to={`/admin/clients/${client.id}/edit`}
                        className="flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="w-3 h-3 mr-2" />
                        {t('editClient')}
                      </Link>
                      <Link
                        to={`/admin/clients/${client.id}`}
                        className="flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        <FileText className="w-3 h-3 mr-2" />
                        {t('viewHistory')}
                      </Link>
                      <button
                        onClick={() => {
                          // Close dropdown
                          document.querySelectorAll('.dropdown-menu').forEach(menu => {
                            menu.classList.add('hidden');
                          });
                          // Show reset password modal
                          handleResetPassword(client.id, client.username);
                        }}
                        className="flex items-center w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 text-left"
                      >
                        <Key className="w-3 h-3 mr-2" />
                        {t('resetPassword')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center text-gray-500 text-sm">
            {searchTerm || statusFilter !== 'all'
              ? t('noClientsMatchFilter')
              : t('noClientsFound')
            }
          </div>
        )}

        {/* Mobile Pagination */}
        {filteredClients.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-xs font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('previous')}
              </button>
              <span className="text-xs text-gray-600">
                Hal {currentPage} / {Math.ceil(filteredClients.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(Math.ceil(filteredClients.length / itemsPerPage), currentPage + 1))}
                disabled={currentPage === Math.ceil(filteredClients.length / itemsPerPage)}
                className="px-3 py-2 text-xs font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clients Table - Desktop Only */}
      <div className="hidden md:block bg-white shadow-lg rounded-xl border border-gray-200 overflow-visible" style={{overflow: 'visible'}}>
        <div className="overflow-x-auto" style={{overflow: 'visible', overflowX: 'auto'}}>
          <table className="min-w-full divide-y divide-gray-200 table-fixed" style={{marginBottom: '120px'}}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                  {t('client')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  {t('contact')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  {t('stats')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                  {t('registeredDate')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  {t('status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedClients.length > 0 ? (
                paginatedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {client.display_name?.charAt(0) || client.username?.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {client.display_name || client.username}
                          </div>
                          <div className="text-xs text-gray-500">
                            @{client.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 break-words max-w-xs">{client.email}</div>
                      {client.phone_number && (
                        <div className="text-xs text-gray-500 break-words">{client.phone_number}</div>
                      )}
                      {client.company_name && (
                        <div className="text-xs text-gray-500 break-words max-w-xs">{client.company_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {t('requests')}: {client.total_requests || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('balance')}: {formatCurrency(client.wallet_balance_idr || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('topup')}: {formatCurrency(client.total_topup || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                      <div>{formatDate(client.created_at)}</div>
                      {client.updated_by_admin && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <CheckCircle className="w-3 h-3 text-blue-500" />
                          Diubah: {client.updated_by_admin.name || client.updated_by_admin.username}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        client.is_active !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.is_active !== false ? (t('active')) : (t('inactive'))}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap relative w-80">
                      <div className="flex items-center space-x-2">
                        {/* View Button */}
                        <Link
                          to={`/admin/clients/${client.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          {t('view')}
                        </Link>

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleStatusToggle(client.id, client.is_active !== false)}
                          className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                            client.is_active !== false
                              ? 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500'
                              : 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          }`}
                        >
                          {client.is_active !== false ? (
                            <>
                              <UserX className="w-3 h-3 mr-1" />
                              {t('deactivate')}
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3 mr-1" />
                              {t('activate')}
                            </>
                          )}
                        </button>

                        {/* Dropdown Menu for More Actions */}
                        <div className="relative inline-block text-left">
                          <button
                            data-dropdown-toggle
                            className="inline-flex items-center px-2 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Close all other dropdowns first
                              document.querySelectorAll('.dropdown-menu').forEach(menu => {
                                if (menu !== e.target.closest('td').querySelector('.dropdown-menu')) {
                                  menu.classList.add('hidden');
                                }
                              });
                              // Toggle current dropdown
                              const dropdown = e.target.closest('td').querySelector('.dropdown-menu');
                              if (dropdown) {
                                dropdown.classList.toggle('hidden');
                              }
                            }}
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          <div className="dropdown-menu hidden absolute right-0 z-[9999] top-full mt-1 w-44 origin-top-right rounded-md bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100">
                            <div className="py-1">
                              <Link
                                to={`/admin/clients/${client.id}/edit`}
                                className="flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                              >
                                <Edit className="w-3 h-3 mr-2" />
                                {t('editClient')}
                              </Link>
                              <Link
                                to={`/admin/clients/${client.id}`}
                                className="flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                              >
                                <FileText className="w-3 h-3 mr-2" />
                                {t('viewHistory')}
                              </Link>
                              <button
                                onClick={() => {
                                  // Close dropdown first
                                  document.querySelectorAll('.dropdown-menu').forEach(menu => {
                                    menu.classList.add('hidden');
                                  });
                                  // Show reset password modal
                                  handleResetPassword(client.id, client.username);
                                }}
                                className="flex items-center w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 text-left"
                              >
                                <Key className="w-3 h-3 mr-2" />
                                {t('resetPassword')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all'
                      ? (t('noClientsMatchFilter'))
                      : (t('noClientsFound'))
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls - Desktop Only */}
        {filteredClients.length > 0 && (
          <div className="hidden md:block bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-xl">
            <div className="flex items-center justify-between">
              
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-700">
                    {t('showing')}{' '}
                    <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>
                    {' '}{t('to')}{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredClients.length)}
                    </span>
                    {' '}{t('of')}{' '}
                    <span className="font-medium">{filteredClients.length}</span> {t('results')}
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">{t('itemsPerPage')}:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {/* Previous button */}
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">{t('previous')}</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {(() => {
                      const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
                      const pages = [];
                      const maxVisiblePages = 5;
                      
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                      
                      if (endPage - startPage < maxVisiblePages - 1) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              i === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      
                      return pages;
                    })()}
                    
                    {/* Next button */}
                    <button
                      onClick={() => setCurrentPage(Math.min(Math.ceil(filteredClients.length / itemsPerPage), currentPage + 1))}
                      disabled={currentPage === Math.ceil(filteredClients.length / itemsPerPage)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">{t('next')}</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={resetPasswordModal.isOpen}
        onClose={() => setResetPasswordModal({
          isOpen: false,
          clientId: null,
          clientUsername: '',
          loading: false
        })}
        onConfirm={confirmResetPassword}
        clientUsername={resetPasswordModal.clientUsername}
        loading={resetPasswordModal.loading}
      />
    </div>
  );
};

export default ClientManagement;