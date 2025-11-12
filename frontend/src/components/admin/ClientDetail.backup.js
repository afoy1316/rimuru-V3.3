import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import { 
  ArrowLeft, 
  User, 
  FileText, 
  DollarSign, 
  TrendingUp,
  Facebook,
  Chrome,
  Zap,
  Smartphone,
  CreditCard,
  Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profilePictureBlob, setProfilePictureBlob] = useState(null);
  const [loadingProfilePicture, setLoadingProfilePicture] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClientDetail();
    }
  }, [id]);

  useEffect(() => {
    if (client?.profile_picture) {
      fetchProfilePictureBlob(client.profile_picture);
    }
    return () => {
      // Cleanup blob URL on unmount
      if (profilePictureBlob) {
        URL.revokeObjectURL(profilePictureBlob);
      }
    };
  }, [client?.profile_picture]);

  const fetchClientDetail = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      setLoading(true);
      const response = await axios.get(`${API}/api/admin/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClient(response.data);
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

  const fetchProfilePictureBlob = async (profilePicturePath) => {
    const token = localStorage.getItem('admin_token');
    try {
      console.log('🔍 Fetching profile picture:', profilePicturePath);
      setLoadingProfilePicture(true);
      
      const url = `${API}${profilePicturePath}`;
      console.log('🔍 Full URL:', url);
      
      const response = await axios.get(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        responseType: 'blob',
        timeout: 30000
      });
      
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response size:', response.data.size, 'bytes');
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Create blob URL
      const contentType = response.headers['content-type'] || 'image/jpeg';
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      
      console.log('🔍 Blob URL created:', blobUrl);
      setProfilePictureBlob(blobUrl);
      setLoadingProfilePicture(false);
      
      console.log('✅ Profile picture loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load profile picture:', error);
      console.error('❌ Error details:', error.message, error.response?.status);
      setLoadingProfilePicture(false);
      // Don't show error toast, just use fallback
    }
  };

  const handleStatusToggle = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      setUpdating(true);
      const newStatus = !client.is_active;
      await axios.put(`${API}/api/admin/clients/${id}/status`, {
        is_active: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setClient({ ...client, is_active: newStatus });
      toast.success(t('clientStatusUpdated'));
    } catch (error) {
      console.error('Failed to update client status:', error);
      toast.error(t('failedToUpdateStatus'));
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'facebook': return <Facebook className="h-5 w-5 text-blue-600" />;
      case 'google': return <Chrome className="h-5 w-5 text-red-500" />;
      case 'tiktok': return <Zap className="h-5 w-5 text-black" />;
      default: return <Smartphone className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'topup': return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'withdraw': return <Download className="h-5 w-5 text-red-600" />;
      case 'account_request': return <FileText className="h-5 w-5 text-blue-600" />;
      default: return <CreditCard className="h-5 w-5 text-gray-600" />;
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
        <Link to="/admin/clients" className="text-blue-600 hover:text-blue-800 mt-2 inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('backToClients')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Link 
              to="/admin/clients"
              className="text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('backToClients')}
            </Link>
            <div className="h-6 border-l border-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('clientDetail')}
            </h1>
          </div>
          <button
            onClick={handleStatusToggle}
            disabled={updating}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              client.is_active !== false
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } disabled:opacity-50`}
          >
            {updating ? (
              t('updating')
            ) : client.is_active !== false ? (
              t('deactivate')
            ) : (
              t('activate')
            )}
          </button>
        </div>

        {/* Modern Client Profile Card - Rimuru Theme */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-slate-700 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white bg-opacity-20 rounded-full"></div>
          <div className="absolute -bottom-5 -left-5 w-32 h-32 bg-white bg-opacity-10 rounded-full"></div>
          
          <div className="relative z-10 flex items-start space-x-8">
            {/* Enhanced Avatar */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-full bg-white bg-opacity-20 backdrop-blur-md flex items-center justify-center ring-4 ring-white ring-opacity-30 overflow-hidden">
                {loadingProfilePicture ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : profilePictureBlob ? (
                  <img 
                    src={profilePictureBlob}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : client.profile_picture ? (
                  <div className="flex flex-col items-center justify-center text-center px-2">
                    <User className="h-12 w-12 text-white text-opacity-50 mb-1" />
                    <span className="text-xs text-white text-opacity-70">Memuat...</span>
                  </div>
                ) : (
                  <span className="text-white text-3xl font-bold">
                    {client.name?.charAt(0) || client.display_name?.charAt(0) || client.username?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="mt-4 text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  client.is_active !== false 
                    ? 'bg-cyan-400 bg-opacity-90 text-blue-900' 
                    : 'bg-red-400 bg-opacity-90 text-red-900'
                }`}>
                  {client.is_active !== false ? '● Aktif' : '● Nonaktif'}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {/* Client Name & Title */}
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">
                  {client.name || client.display_name || client.username}
                </h2>
                <p className="text-xl text-white text-opacity-80">@{client.username}</p>
                {client.company_name && (
                  <p className="text-lg text-white text-opacity-70 mt-2">
                    🏢 {client.company_name}
                  </p>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white border-b border-white border-opacity-30 pb-2">
                    📧 Kontak
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-white text-opacity-70 mb-1">Email</p>
                      <p className="font-medium">{client.email}</p>
                    </div>
                    {client.phone_number && (
                      <div>
                        <p className="text-white text-opacity-70 mb-1">Telepon</p>
                        <p className="font-medium">{client.phone_number}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Info */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white border-b border-white border-opacity-30 pb-2">
                    📍 Alamat
                  </h4>
                  <div className="space-y-3 text-sm">
                    {client.address ? (
                      <div>
                        <p className="text-white text-opacity-70 mb-1">Alamat Lengkap</p>
                        <p className="font-medium">{client.address}</p>
                      </div>
                    ) : (
                      <p className="text-white text-opacity-50 italic">Alamat belum diisi</p>
                    )}
                    
                    <div className="flex space-x-4">
                      {client.city && (
                        <div>
                          <p className="text-white text-opacity-70 mb-1">Kota</p>
                          <p className="font-medium">{client.city}</p>
                        </div>
                      )}
                      {client.province && (
                        <div>
                          <p className="text-white text-opacity-70 mb-1">Provinsi</p>
                          <p className="font-medium">{client.province}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Info */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white border-b border-white border-opacity-30 pb-2">
                    💰 Akun
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-white text-opacity-70 mb-1">Saldo Dompet</p>
                      <p className="text-2xl font-bold text-cyan-300">{formatCurrency(client.wallet_balance_idr || 0)}</p>
                    </div>
                    <div>
                      <p className="text-white text-opacity-70 mb-1">Bergabung</p>
                      <p className="font-medium">{new Date(client.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long', 
                        year: 'numeric'
                      })}</p>
                    </div>
                    {client.company_name && (
                      <div>
                        <p className="text-white text-opacity-70 mb-1">Perusahaan</p>
                        <p className="font-medium">{client.company_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('totalRequests')}</p>
              <p className="text-xl font-bold text-gray-900">{client.requests?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('totalTransactions')}</p>
              <p className="text-xl font-bold text-gray-900">{client.transactions?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('totalTopUp')}</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(client.transactions?.filter(t => t.type === 'topup' && t.status === 'completed').reduce((sum, t) => sum + (t.amount || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-lg">⏳</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('pendingRequests')}</p>
              <p className="text-xl font-bold text-gray-900">
                {client.requests?.filter(r => r.status === 'pending').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Requests */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              {t('accountRequests')}
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {client.requests && client.requests.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {client.requests.map((request) => (
                  <div key={request.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getPlatformIcon(request.platform)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.account_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.platform?.toUpperCase()} • {request.gmt} • {request.currency}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(request.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                <p>{t('noRequests')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-6 w-6 mr-2 text-green-600" />
              {t('transactionHistory')}
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {client.transactions && client.transactions.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {client.transactions.map((transaction) => (
                  <div key={transaction.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getTransactionIcon(transaction.type)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transaction.type?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          transaction.type === 'topup' ? 'text-green-600' : 
                          transaction.type === 'withdraw' ? 'text-red-600' : 
                          'text-gray-600'
                        }`}>
                          {transaction.type === 'topup' ? '+' : transaction.type === 'withdraw' ? '-' : ''}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(transaction.created_at)}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <DollarSign className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                <p>{t('noTransactions')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;