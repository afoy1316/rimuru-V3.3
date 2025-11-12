import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';
import CustomDropdown from '../ui/CustomDropdown';
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  Ban,
  Trash2,
  MoreVertical,
  RefreshCw,
  Calendar,
  User,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Users
} from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const AccountManagement = () => {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [noTopupFilter, setNoTopupFilter] = useState(''); // '' | '7' | '14' | '30'
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [paginatedAccounts, setPaginatedAccounts] = useState([]);
  
  // Modals
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showEditAccountIdModal, setShowEditAccountIdModal] = useState(false);
  
  // Status update
  const [statusUpdate, setStatusUpdate] = useState({
    status: ''
  });
  const [updating, setUpdating] = useState(false);
  
  // Fee update
  const [feeUpdate, setFeeUpdate] = useState({
    fee_percentage: 0
  });
  const [updatingFee, setUpdatingFee] = useState(false);
  
  // Name update
  const [nameUpdate, setNameUpdate] = useState({
    account_name: ''
  });
  const [updatingName, setUpdatingName] = useState(false);
  
  // Account ID update
  const [accountIdUpdate, setAccountIdUpdate] = useState({
    new_account_id: ''
  });
  const [updatingAccountId, setUpdatingAccountId] = useState(false);
  
  // Balance transfer on delete
  const [balanceTransferData, setBalanceTransferData] = useState({
    balance_amount: '',
    balance_proof: null,
    withdraw_proof: null,
    aspire_proof: null
  });

  // Calculate total balance by currency
  const getTotalBalancesByCurrency = () => {
    const balances = { IDR: 0, USD: 0 };
    
    accounts.forEach(account => {
      const currency = account.currency || 'USD'; // Default to USD if no currency specified
      if (balances.hasOwnProperty(currency)) {
        balances[currency] += (account.balance || 0);
      } else {
        // For any unknown currency, default to USD
        balances.USD += (account.balance || 0);
      }
    });
    
    return balances;
  };

  // Status options
  const getStatusOptions = () => [
    { value: '', label: t('allStatuses'), icon: Filter, color: 'text-gray-700' },
    { value: 'active', label: t('active'), icon: CheckCircle, color: 'text-green-700' },
    { value: 'suspended', label: t('suspended'), icon: AlertTriangle, color: 'text-yellow-700' },
    { value: 'disabled', label: t('disabled'), icon: XCircle, color: 'text-red-700' }
  ];

  const getPlatformOptions = () => [
    { value: '', label: t('allPlatforms'), icon: Globe, color: 'text-gray-700' },
    { value: 'facebook', label: t('facebook'), color: 'text-blue-700' },
    { value: 'google', label: t('google'), color: 'text-red-700' },
    { value: 'tiktok', label: t('tiktok'), color: 'text-gray-900' }
  ];

  const getModalStatusOptions = () => [
    { value: 'active', label: t('active'), icon: CheckCircle, color: 'text-green-700' },
    { value: 'suspended', label: t('suspended'), icon: AlertTriangle, color: 'text-yellow-700' },
    { value: 'disabled', label: t('disabled'), icon: XCircle, color: 'text-red-700' }
  ];

  // Fetch accounts when filters change
  useEffect(() => {
    fetchAccounts();
  }, [statusFilter, platformFilter, noTopupFilter]);

  // Auto-refresh every 30 seconds for real-time updates (silent)
  useEffect(() => {
    // Auto-refresh in background (silent)
    const interval = setInterval(() => {
      fetchAccounts(true); // Silent refresh
    }, 30000); // 30 seconds (increased from 10 to reduce load)
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [statusFilter, platformFilter, noTopupFilter]); // Add dependencies so interval uses current filter values

  // Pagination effect
  useEffect(() => {
    const filteredAccounts = accounts.filter(account => 
      account.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.user_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.platform?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredAccounts.slice(startIndex, endIndex);
    setPaginatedAccounts(paginated);
  }, [accounts, searchTerm, statusFilter, platformFilter, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, platformFilter, noTopupFilter, itemsPerPage]);

  const fetchAccounts = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      
      if (statusFilter) params.append('status', statusFilter);
      if (platformFilter) params.append('platform', platformFilter);
      if (noTopupFilter) params.append('no_topup_days', noTopupFilter);
      
      const response = await axios.get(`${API}/api/admin/accounts?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error(t('errorFetchingAccounts'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedAccount || !statusUpdate.status) {
      toast.error(t('pleaseSelectStatus'));
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      await axios.put(
        `${API}/api/admin/accounts/${selectedAccount.id}/status`,
        { status: statusUpdate.status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(t('accountStatusUpdated'));
      setShowStatusModal(false);
      setStatusUpdate({ status: '' });
      setSelectedAccount(null);
      fetchAccounts();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('errorUpdatingStatus'));
    } finally {
      setUpdating(false);
    }
  };

  const handleFeeUpdate = async () => {
    if (!selectedAccount) {
      toast.error('Akun tidak ditemukan');
      return;
    }

    if (feeUpdate.fee_percentage < 0 || feeUpdate.fee_percentage > 100) {
      toast.error('Fee harus antara 0% - 100%');
      return;
    }

    setUpdatingFee(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      await axios.put(
        `${API}/api/admin/accounts/${selectedAccount.id}/fee`,
        { fee_percentage: parseFloat(feeUpdate.fee_percentage) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Fee akun berhasil diperbarui');
      setShowFeeModal(false);
      setFeeUpdate({ fee_percentage: 0 });
      setSelectedAccount(null);
      fetchAccounts();
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.response?.data?.detail || t('errorUpdatingStatus');
      toast.error(errorMessage);
    } finally {
      setUpdatingFee(false);
    }
  };

  const handleNameUpdate = async () => {
    if (!selectedAccount) {
      toast.error('Akun tidak ditemukan');
      return;
    }

    if (!nameUpdate.account_name?.trim()) {
      toast.error('Nama akun tidak boleh kosong');
      return;
    }

    setUpdatingName(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      await axios.put(
        `${API}/api/admin/accounts/${selectedAccount.id}/name`,
        { account_name: nameUpdate.account_name.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Nama akun berhasil diperbarui');
      setShowEditNameModal(false);
      setNameUpdate({ account_name: '' });
      setSelectedAccount(null);
      fetchAccounts();
    } catch (error) {
      console.error('Error updating name:', error);
      const errorMessage = error.response?.data?.detail || 'Gagal memperbarui nama akun';
      toast.error(errorMessage);
    } finally {
      setUpdatingName(false);
    }
  };

  const handleAccountIdUpdate = async () => {
    if (!selectedAccount) {
      toast.error('Akun tidak ditemukan');
      return;
    }

    if (!accountIdUpdate.new_account_id?.trim()) {
      toast.error('ID Akun tidak boleh kosong');
      return;
    }

    setUpdatingAccountId(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      const response = await axios.put(
        `${API}/api/admin/accounts/${selectedAccount.id}/account-id`,
        { new_account_id: accountIdUpdate.new_account_id.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message || 'ID Akun berhasil diperbarui');
      setShowEditAccountIdModal(false);
      setAccountIdUpdate({ new_account_id: '' });
      setSelectedAccount(null);
      fetchAccounts();
    } catch (error) {
      console.error('Error updating account ID:', error);
      const errorMessage = error.response?.data?.detail || 'Gagal memperbarui ID akun';
      toast.error(errorMessage);
    } finally {
      setUpdatingAccountId(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    // Check if account has balance
    const hasBalance = selectedAccount.balance && selectedAccount.balance > 0;
    
    if (hasBalance) {
      // Validate balance transfer data
      if (!balanceTransferData.balance_amount || balanceTransferData.balance_amount <= 0) {
        toast.error('Masukkan nominal saldo yang akan ditransfer');
        return;
      }
      if (!balanceTransferData.balance_proof) {
        toast.error('Upload bukti saldo real di akun');
        return;
      }
      if (!balanceTransferData.withdraw_proof) {
        toast.error('Upload bukti setelah saldo di-withdraw');
        return;
      }
      if (!balanceTransferData.aspire_proof) {
        toast.error('Upload bukti update limit aspire = 0');
        return;
      }
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      if (hasBalance) {
        // Delete with balance transfer - use axios.request for DELETE with multipart/form-data
        const formData = new FormData();
        formData.append('balance_amount', balanceTransferData.balance_amount);
        formData.append('balance_proof', balanceTransferData.balance_proof);
        formData.append('withdraw_proof', balanceTransferData.withdraw_proof);
        formData.append('aspire_proof', balanceTransferData.aspire_proof);
        
        await axios.request({
          method: 'DELETE',
          url: `${API}/api/admin/accounts/${selectedAccount.id}/with-balance-transfer`,
          data: formData,
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        toast.success('Akun berhasil dihapus dan saldo ditransfer ke withdrawal wallet');
      } else {
        // Regular delete without balance
        await axios.delete(
          `${API}/api/admin/accounts/${selectedAccount.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        toast.success(t('accountDeleted'));
      }

      setShowDeleteModal(false);
      setSelectedAccount(null);
      setBalanceTransferData({
        balance_amount: '',
        balance_proof: null,
        withdraw_proof: null,
        aspire_proof: null
      });
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      const errorMessage = error.response?.data?.detail || t('errorDeletingAccount');
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      disabled: 'bg-red-100 text-red-800 border-red-200'
    };

    const statusIcons = {
      active: CheckCircle,
      suspended: AlertTriangle,
      disabled: XCircle
    };

    const Icon = statusIcons[status] || CheckCircle;
    const style = statusStyles[status] || statusStyles.active;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${style}`}>
        <Icon className="w-3 h-3 mr-1" />
        {t(status) || status}
      </span>
    );
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: (
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-blue-600 font-bold text-sm">f</span>
        </div>
      ),
      google: (
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <span className="text-red-600 font-bold text-sm">G</span>
        </div>
      ),
      tiktok: (
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-gray-600 font-bold text-sm">T</span>
        </div>
      )
    };
    return icons[platform] || icons.facebook;
  };

  // Calculate filtered accounts for pagination
  const filteredAccounts = accounts.filter(account => 
    account.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.user_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.platform?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.account_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAccountStats = () => {
    const stats = {
      total: accounts.length,
      active: accounts.filter(a => a.status === 'active').length,
      suspended: accounts.filter(a => a.status === 'suspended').length,
      disabled: accounts.filter(a => a.status === 'disabled').length,
      totalBalance: accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
    };
    return stats;
  };

  const stats = getAccountStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('loadingAccounts')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <CreditCard className="w-7 h-7 mr-3 text-blue-600" />
            {t('accountManagement')}
          </h1>
          <p className="text-gray-600 mt-1">{t('manageAdAccounts')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 break-words">{t('totalAccounts')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 break-words">{t('active')}</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 break-words">{t('suspended')}</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.suspended}</p>
            </div>
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 break-words">{t('disabled')}</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.disabled}</p>
            </div>
            <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 flex-shrink-0 ml-2" />
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 break-words">{t('totalBalance')}</p>
              {(() => {
                const balances = getTotalBalancesByCurrency();
                return (
                  <div className="space-y-1">
                    <p className="text-base sm:text-lg font-bold text-purple-600 break-all">
                      {formatCurrency(balances.IDR, 'IDR')}
                    </p>
                    <p className="text-base sm:text-lg font-bold text-green-600 break-all">
                      {formatCurrency(balances.USD, 'USD')}
                    </p>
                  </div>
                );
              })()}
            </div>
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow">
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="w-full">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchAccounts')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filter Dropdowns - Stack on mobile, horizontal on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            <CustomDropdown
              options={getStatusOptions()}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder={t('filterByStatus')}
              className="w-full"
            />
            
            <CustomDropdown
              options={getPlatformOptions()}
              value={platformFilter}
              onChange={setPlatformFilter}
              placeholder={t('filterByPlatform')}
              className="w-full"
            />
            
            <CustomDropdown
              options={[
                { value: '', label: 'Semua Akun' },
                { value: '7', label: '⚠️ Tidak Top-up 7 Hari' },
                { value: '14', label: '⚠️ Tidak Top-up 14 Hari' },
                { value: '30', label: '🔴 Tidak Top-up 30 Hari' }
              ]}
              value={noTopupFilter}
              onChange={setNoTopupFilter}
              placeholder="Filter Aktivitas"
              className="w-full"
            />
          </div>
          
          {/* Results Count */}
          <div className="text-sm text-gray-600 flex items-center justify-between pt-2 border-t">
            <span>{t('showing')} {filteredAccounts.length} {t('of')} {accounts.length} {t('accounts')}</span>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredAccounts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-base text-gray-500">{t('noAccountsFound')}</p>
            <p className="text-sm text-gray-400">{t('noAccountsMessage')}</p>
          </div>
        ) : (
          paginatedAccounts.map((account) => (
            <div key={account.id} className="bg-white rounded-lg shadow border border-gray-200 p-3">
              {/* Header */}
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getPlatformIcon(account.platform)}
                  <span className="text-sm font-medium text-gray-900 capitalize break-words">{account.platform}</span>
                </div>
                {getStatusBadge(account.status)}
              </div>

              {/* Content */}
              <div className="space-y-2 mb-3">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs text-gray-500">Nama Akun</p>
                    <button
                      onClick={() => {
                        setSelectedAccount(account);
                        setNameUpdate({ account_name: account.account_name });
                        setShowEditNameModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-0.5 flex-shrink-0"
                      title="Edit Nama"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm font-medium text-gray-900 break-words">{account.account_name}</p>
                </div>
                
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs text-gray-500">ID Akun</p>
                    <button
                      onClick={() => {
                        setSelectedAccount(account);
                        setAccountIdUpdate({ new_account_id: account.account_id });
                        setShowEditAccountIdModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-0.5 flex-shrink-0"
                      title="Edit ID"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs font-mono text-gray-900 break-all">{account.account_id}</p>
                </div>

                {account.days_since_last_topup !== undefined && (
                  <div>
                    {account.never_topped_up ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        ❌ Belum pernah top-up
                      </span>
                    ) : account.days_since_last_topup >= 30 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        🔴 {account.days_since_last_topup} hari tidak top-up
                      </span>
                    ) : account.days_since_last_topup >= 14 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        ⚠️ {account.days_since_last_topup} hari tidak top-up
                      </span>
                    ) : account.days_since_last_topup >= 7 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⚠️ {account.days_since_last_topup} hari tidak top-up
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        ✅ Top-up {account.days_since_last_topup} hari lalu
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Klien</p>
                    <p className="text-sm font-medium text-gray-900 break-words">{account.user_name}</p>
                    <p className="text-xs text-gray-500 break-words">@{account.user_username}</p>
                  </div>
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs text-gray-500">Biaya</p>
                      <button
                        onClick={() => {
                          setSelectedAccount(account);
                          setFeeUpdate({ fee_percentage: account.fee_percentage || 0 });
                          setShowFeeModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-0.5 flex-shrink-0"
                        title="Edit Fee"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{account.fee_percentage || 0}%</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Saldo</p>
                  <p className="text-sm font-medium text-gray-900 break-all">
                    {formatCurrency(account.balance, account.currency || 'USD')}
                  </p>
                  <p className="text-xs text-gray-500">{account.currency || 'USD'}</p>
                </div>
              </div>

              {/* Tanggal Dibuat */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Tanggal Dibuat</p>
                <p className="text-sm text-gray-900">
                  {new Date(account.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'Asia/Jakarta'
                  })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => {
                    setSelectedAccount(account);
                    setShowDetailModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
                >
                  <Eye className="h-3 w-3" />
                  <span>Detail</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedAccount(account);
                    setStatusUpdate({ status: account.status });
                    setShowStatusModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                >
                  <MoreVertical className="h-3 w-3" />
                  <span>Status</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedAccount(account);
                    setShowDeleteModal(true);
                  }}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Platform
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[220px]">
                  Akun & ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Klien
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Saldo
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Biaya
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Tanggal Dibuat
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">{t('noAccountsFound')}</p>
                    <p className="text-sm">{t('noAccountsMessage')}</p>
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {getPlatformIcon(account.platform)}
                        <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                          {account.platform}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[180px]" title={account.account_name}>
                            {account.account_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="text-xs text-gray-500 font-mono truncate max-w-[150px]" title={account.account_id}>
                              {account.account_id}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedAccount(account);
                                setAccountIdUpdate({ new_account_id: account.account_id });
                                setShowEditAccountIdModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-0.5"
                              title="Edit ID Akun"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                          {account.days_since_last_topup !== undefined && (
                            <div className="mt-1">
                              {account.never_topped_up ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  ❌ Belum pernah top-up
                                </span>
                              ) : account.days_since_last_topup >= 30 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  🔴 {account.days_since_last_topup} hari tidak top-up
                                </span>
                              ) : account.days_since_last_topup >= 14 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                  ⚠️ {account.days_since_last_topup} hari tidak top-up
                                </span>
                              ) : account.days_since_last_topup >= 7 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  ⚠️ {account.days_since_last_topup} hari tidak top-up
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  ✅ Top-up {account.days_since_last_topup} hari lalu
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAccount(account);
                            setNameUpdate({ account_name: account.account_name });
                            setShowEditNameModal(true);
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800 p-1"
                          title="Edit Nama Akun"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]" title={account.user_name}>
                        {account.user_name}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[120px]" title={account.user_username}>
                        @{account.user_username}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {getStatusBadge(account.status)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(account.balance, account.currency || 'USD')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {account.currency || 'USD'}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-gray-600">
                            {account.fee_percentage || 0}%
                          </span>
                          <button
                            onClick={() => {
                              setSelectedAccount(account);
                              setFeeUpdate({ fee_percentage: account.fee_percentage || 0 });
                              setShowFeeModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit Fee"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                        {account.fee_updated_by_admin && (
                          <div className="text-xs text-gray-500 truncate max-w-[80px]" title={`Diubah: ${account.fee_updated_by_admin.name || account.fee_updated_by_admin.username}`}>
                            <CheckCircle className="w-3 h-3 text-blue-500 inline mr-1" />
                            {(account.fee_updated_by_admin.name || account.fee_updated_by_admin.username).substring(0, 8)}...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-xs text-gray-600">
                        {new Date(account.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          timeZone: 'Asia/Jakarta'
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-0.5">
                        <button
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAccount(account);
                            setStatusUpdate({ status: account.status });
                            setShowStatusModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Update Status"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
      </div>

      {/* Pagination Controls */}
      {filteredAccounts.length > 0 && (
        <>
          {/* Desktop Pagination */}
          <div className="hidden md:block bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-700">
                    Menampilkan{' '}
                    <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>
                    {' '}ke{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredAccounts.length)}
                    </span>
                    {' '}dari{' '}
                    <span className="font-medium">{filteredAccounts.length}</span> hasil
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Item per halaman:</span>
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
                      <span className="sr-only">Sebelumnya</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {(() => {
                      const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
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
                      onClick={() => setCurrentPage(Math.min(Math.ceil(filteredAccounts.length / itemsPerPage), currentPage + 1))}
                      disabled={currentPage === Math.ceil(filteredAccounts.length / itemsPerPage)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Lanjutkan</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Pagination */}
          <div className="md:hidden bg-white rounded-lg shadow p-4 mt-4">
            <div className="flex flex-col space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <p className="text-xs text-gray-600">
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAccounts.length)} dari {filteredAccounts.length}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">Per halaman:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ‹
                </button>
                
                {(() => {
                  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
                  const pages = [];
                  const maxMobilePages = 3;
                  
                  let startPage = Math.max(1, currentPage - Math.floor(maxMobilePages / 2));
                  let endPage = Math.min(totalPages, startPage + maxMobilePages - 1);
                  
                  if (endPage - startPage < maxMobilePages - 1) {
                    startPage = Math.max(1, endPage - maxMobilePages + 1);
                  }
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-3 py-1 border text-xs font-medium rounded ${
                          i === currentPage
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  
                  return pages;
                })()}
                
                <button
                  onClick={() => setCurrentPage(Math.min(Math.ceil(filteredAccounts.length / itemsPerPage), currentPage + 1))}
                  disabled={currentPage === Math.ceil(filteredAccounts.length / itemsPerPage)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Account Detail Modal */}
      {showDetailModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span className="break-words">{t('accountDetails')}</span>
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl flex-shrink-0 ml-2"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex-shrink-0">{getPlatformIcon(selectedAccount.platform)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg font-medium text-gray-900 break-words">
                        {selectedAccount.account_name}
                      </h4>
                      <p className="text-sm sm:text-base text-gray-600 capitalize break-words">
                        {selectedAccount.platform} Ads Account
                      </p>
                    </div>
                    <div className="self-start sm:ml-auto">
                      {getStatusBadge(selectedAccount.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t('accountId')}
                    </label>
                    <p className="text-xs sm:text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded break-all">
                      {selectedAccount.account_id}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t('balance')}
                    </label>
                    <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 p-2 rounded break-all">
                      {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t('feePercentage')}
                    </label>
                    <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {selectedAccount.fee_percentage || 0}%
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t('createdAt')}
                    </label>
                    <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 p-2 rounded break-words">
                      {new Date(selectedAccount.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    {t('client')}
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-gray-900 break-words">{selectedAccount.user_name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 break-words">@{selectedAccount.user_username}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform-specific details */}
                {selectedAccount.platform === 'facebook' && (
                  <div className="space-y-3 sm:space-y-4">
                    <h5 className="text-sm sm:text-base font-medium text-gray-900">Facebook Ads Details</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {selectedAccount.gmt && (
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">GMT</label>
                          <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 p-2 rounded break-words">{selectedAccount.gmt}</p>
                        </div>
                      )}
                      {selectedAccount.currency && (
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Currency</label>
                          <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedAccount.currency}</p>
                        </div>
                      )}
                      {selectedAccount.delivery_method && (
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
                          <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 p-2 rounded break-words">{selectedAccount.delivery_method}</p>
                        </div>
                      )}
                      {selectedAccount.bm_id_or_email && (
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">BM ID/Email</label>
                          <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 p-2 rounded break-all">{selectedAccount.bm_id_or_email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedAccount.platform === 'google' && (
                  <div className="space-y-3 sm:space-y-4">
                    <h5 className="text-sm sm:text-base font-medium text-gray-900">Google Ads Details</h5>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {selectedAccount.email && (
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 p-2 rounded break-all">{selectedAccount.email}</p>
                        </div>
                      )}
                      {selectedAccount.website && (
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Website</label>
                          <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 p-2 rounded break-all">{selectedAccount.website}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedAccount.platform === 'tiktok' && selectedAccount.bc_id && (
                  <div className="space-y-3 sm:space-y-4">
                    <h5 className="text-sm sm:text-base font-medium text-gray-900">TikTok Ads Details</h5>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">BC ID</label>
                      <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 p-2 rounded break-all">{selectedAccount.bc_id}</p>
                    </div>
                  </div>
                )}

                {selectedAccount.notes && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t('notes')}
                    </label>
                    <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap break-words">
                      {selectedAccount.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t('close')}
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setStatusUpdate({ status: selectedAccount.status });
                    setShowStatusModal(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  {t('updateStatus')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Ban className="w-5 h-5 mr-2 text-green-600" />
                  {t('updateAccountStatus')}
                </h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('accountInfo')}
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p className="font-medium">{selectedAccount.account_name}</p>
                    <p className="text-gray-600 capitalize">{selectedAccount.platform} - {selectedAccount.user_name}</p>
                    <p className="text-gray-500 font-mono text-xs">{selectedAccount.account_id}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('newStatus')} <span className="text-red-500">*</span>
                  </label>
                  <CustomDropdown
                    options={getModalStatusOptions()}
                    value={statusUpdate.status}
                    onChange={(value) => setStatusUpdate({ ...statusUpdate, status: value })}
                    placeholder={t('selectStatus')}
                    className="w-full"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">{t('statusChangeWarning')}</p>
                      <p className="text-yellow-700 mt-1">
                        {statusUpdate.status === 'disabled' && (t('disableWarning'))}
                        {statusUpdate.status === 'suspended' && (t('suspendWarning'))}
                        {statusUpdate.status === 'active' && (t('activateWarning'))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={updating}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center"
                  disabled={updating || !statusUpdate.status}
                >
                  {updating && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {updating ? (t('updating')) : (t('updateStatus'))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8">
            <div className="p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Trash2 className="w-5 h-5 mr-2 text-red-600" />
                  {selectedAccount.balance > 0 ? 'Hapus Akun & Transfer Saldo' : t('deleteAccount')}
                </h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setBalanceTransferData({
                      balance_amount: '',
                      balance_proof: null,
                      withdraw_proof: null,
                      aspire_proof: null
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Informasi Akun
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-200">
                    <p className="font-medium text-gray-900">{selectedAccount.account_name}</p>
                    <p className="text-gray-700 capitalize">{selectedAccount.platform} - {selectedAccount.user_name}</p>
                    <p className="text-gray-600 font-mono text-xs">{selectedAccount.account_id}</p>
                    <p className="text-lg font-bold text-teal-600 mt-2">
                      Saldo: {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
                    </p>
                  </div>
                </div>

                {selectedAccount.balance > 0 ? (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex">
                        <AlertTriangle className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-800">Akun ini masih memiliki saldo</p>
                          <p className="text-blue-700 mt-1">
                            Saldo akan otomatis ditransfer ke withdrawal wallet client setelah Anda upload bukti-bukti berikut:
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Nominal Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nominal Saldo Real <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Masukkan nominal saldo real"
                          value={balanceTransferData.balance_amount}
                          onChange={(e) => setBalanceTransferData({
                            ...balanceTransferData,
                            balance_amount: e.target.value
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>

                      {/* Balance Proof */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bukti Saldo Real di Akun <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setBalanceTransferData({
                            ...balanceTransferData,
                            balance_proof: e.target.files[0]
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        {balanceTransferData.balance_proof && (
                          <p className="text-xs text-green-600 mt-1">✓ {balanceTransferData.balance_proof.name}</p>
                        )}
                      </div>

                      {/* Withdraw Proof */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bukti Setelah Saldo Di-Withdraw <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setBalanceTransferData({
                            ...balanceTransferData,
                            withdraw_proof: e.target.files[0]
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        {balanceTransferData.withdraw_proof && (
                          <p className="text-xs text-green-600 mt-1">✓ {balanceTransferData.withdraw_proof.name}</p>
                        )}
                      </div>

                      {/* Aspire Proof */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bukti Update Limit Aspire = 0 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setBalanceTransferData({
                            ...balanceTransferData,
                            aspire_proof: e.target.files[0]
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        {balanceTransferData.aspire_proof && (
                          <p className="text-xs text-green-600 mt-1">✓ {balanceTransferData.aspire_proof.name}</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <AlertTriangle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-red-800">Peringatan: Tindakan Permanen</p>
                        <p className="text-red-700 mt-1">
                          Akun ini tidak memiliki saldo dan akan dihapus secara permanen dari sistem.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setBalanceTransferData({
                      balance_amount: '',
                      balance_proof: null,
                      withdraw_proof: null,
                      aspire_proof: null
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={updating}
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 flex items-center"
                  disabled={updating}
                >
                  {updating && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {updating ? (t('deleting')) : (t('deleteAccount'))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Fee Modal */}
      {showFeeModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                  Edit Fee Akun
                </h3>
                <button
                  onClick={() => setShowFeeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Informasi Akun
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p className="font-medium">{selectedAccount.account_name}</p>
                    <p className="text-gray-600 capitalize">{selectedAccount.platform} - {selectedAccount.user_name}</p>
                    <p className="text-gray-500 font-mono text-xs">{selectedAccount.account_id}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fee Saat Ini
                  </label>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedAccount.fee_percentage || 0}%
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fee Baru (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={feeUpdate.fee_percentage}
                    onChange={(e) => setFeeUpdate({ fee_percentage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan fee baru (0-100)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Masukkan nilai antara 0% hingga 100%
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Peringatan Perubahan Fee</p>
                      <p className="text-yellow-700 mt-1">
                        Perubahan fee akan berlaku untuk semua transaksi top-up berikutnya pada akun ini.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowFeeModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={updatingFee}
                >
                  Batal
                </button>
                <button
                  onClick={handleFeeUpdate}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center"
                  disabled={updatingFee}
                >
                  {updatingFee && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {updatingFee ? 'Memperbarui...' : 'Perbarui Fee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Name Modal */}
      {showEditNameModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Edit Nama Akun
                </h3>
                <button
                  onClick={() => setShowEditNameModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={updatingName}
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Informasi Akun
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p className="text-gray-600 capitalize">{selectedAccount.platform} Ads</p>
                    <p className="text-gray-500 font-mono text-xs">{selectedAccount.account_id}</p>
                    <p className="text-gray-600 mt-1">Client: {selectedAccount.user_name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Akun Saat Ini
                  </label>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-900">
                      {selectedAccount.account_name}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Akun Baru <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameUpdate.account_name}
                    onChange={(e) => setNameUpdate({ account_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan nama akun baru"
                    maxLength="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nama akun akan diupdate di semua sistem
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowEditNameModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={updatingName}
                >
                  Batal
                </button>
                <button
                  onClick={handleNameUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
                  disabled={updatingName}
                >
                  {updatingName && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {updatingName ? 'Memperbarui...' : 'Perbarui Nama'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account ID Modal */}
      {showEditAccountIdModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Edit ID Akun Iklan
                </h3>
                <button
                  onClick={() => setShowEditAccountIdModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Informasi Akun
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p className="text-gray-600 capitalize font-medium">{selectedAccount.platform} Ads</p>
                    <p className="text-gray-600 mt-1">{selectedAccount.account_name}</p>
                    <p className="text-gray-500 mt-1">Client: {selectedAccount.user_name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Akun Saat Ini
                  </label>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-mono text-sm text-blue-900 break-all">
                      {selectedAccount.account_id}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Akun Baru <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountIdUpdate.new_account_id}
                    onChange={(e) => setAccountIdUpdate({ new_account_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder={`Masukkan ID akun ${selectedAccount.platform.toUpperCase()} yang baru`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ ID akun akan diupdate di seluruh sistem. Pastikan ID sudah benar!
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Contoh: 
                    {selectedAccount.platform === 'facebook' && ' 123456789012345'}
                    {selectedAccount.platform === 'google' && ' 123-456-7890'}
                    {selectedAccount.platform === 'tiktok' && ' 1234567890123456'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowEditAccountIdModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={updatingAccountId}
                >
                  Batal
                </button>
                <button
                  onClick={handleAccountIdUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
                  disabled={updatingAccountId}
                >
                  {updatingAccountId && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {updatingAccountId ? 'Memperbarui...' : 'Perbarui ID Akun'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;