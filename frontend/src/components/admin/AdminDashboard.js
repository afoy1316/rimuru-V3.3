import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Facebook,
  Chrome,
  Zap
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    recentRequests: [],
    recentClients: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      fetchDashboardStats(true); // Silent refresh
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async (silent = false) => {
    const token = localStorage.getItem('admin_token');
    try {
      if (!silent) {
        setLoading(true);
      }
      
      // Fetch clients
      const clientsResponse = await axios.get(`${API}/api/admin/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clients = clientsResponse.data;
      
      // Fetch requests
      const requestsResponse = await axios.get(`${API}/api/admin/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const requests = requestsResponse.data;

      // Calculate stats
      const totalClients = clients.length;
      const activeClients = clients.filter(client => client.is_active !== false).length;
      const totalRequests = requests.length;
      const pendingRequests = requests.filter(req => req.status === 'pending').length;
      const approvedRequests = requests.filter(req => req.status === 'approved').length;
      const rejectedRequests = requests.filter(req => req.status === 'rejected').length;
      
      // Get recent items (last 5)
      const recentRequests = requests
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      
      const recentClients = clients
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setStats({
        totalClients,
        activeClients,
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        recentRequests,
        recentClients
      });

    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error(t('failedToLoadData'));
    } finally {
      setLoading(false);
    }
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
      default: return <FileText className="h-5 w-5 text-gray-600" />;
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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
              <span className="break-words">{t('adminDashboard')}</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 break-words">
              {t('adminDashboardDesc')}
            </p>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <p className="text-sm text-gray-500 break-words">
              {new Date().toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                timeZone: 'Asia/Jakarta'
              })}
            </p>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleTimeString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Clients */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 overflow-hidden shadow-lg rounded-xl text-white">
          <div className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-blue-100 uppercase tracking-wide break-words">
                  {t('totalClients')}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {stats.totalClients}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Clients */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 overflow-hidden shadow-lg rounded-xl text-white">
          <div className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <UserCheck className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-green-100 uppercase tracking-wide break-words">
                  {t('activeClients')}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {stats.activeClients}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Requests */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 overflow-hidden shadow-lg rounded-xl text-white">
          <div className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-purple-100 uppercase tracking-wide break-words">
                  {t('totalRequests')}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {stats.totalRequests}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 overflow-hidden shadow-lg rounded-xl text-white">
          <div className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-orange-100 uppercase tracking-wide break-words">
                  {t('pendingRequests')}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {stats.pendingRequests}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Status Summary */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-gray-700 flex-shrink-0" />
            <span className="break-words">{t('requestStatusSummary')}</span>
          </h3>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-700">{stats.pendingRequests}</div>
              <div className="text-sm font-medium text-yellow-600 mt-1 break-words">{t('pending')}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl sm:text-3xl font-bold text-green-700">{stats.approvedRequests}</div>
              <div className="text-sm font-medium text-green-600 mt-1 break-words">{t('approved')}</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl sm:text-3xl font-bold text-red-700">{stats.rejectedRequests}</div>
              <div className="text-sm font-medium text-red-600 mt-1 break-words">{t('rejected')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600 flex-shrink-0" />
              <span className="break-words">{t('recentRequests')}</span>
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentRequests.length > 0 ? (
              stats.recentRequests.map((request) => (
                <div key={request.id} className="px-4 sm:px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">{getPlatformIcon(request.platform)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {request.account_name}
                        </p>
                        <p className="text-xs text-gray-500 break-words">
                          {request.user?.username}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)} flex-shrink-0`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 sm:px-6 py-4 text-center text-gray-500">
                {t('noRecentRequests')}
              </div>
            )}
          </div>
        </div>

        {/* Recent Clients */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-green-600 flex-shrink-0" />
              <span className="break-words">{t('recentClients')}</span>
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentClients.length > 0 ? (
              stats.recentClients.map((client) => (
                <div key={client.id} className="px-4 sm:px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 break-words">
                        {client.username}
                      </p>
                      <p className="text-xs text-gray-500 break-words">
                        {client.email}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">
                        {t('requests')}: {client.total_requests || 0}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        client.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {client.is_active !== false ? (t('active')) : (t('inactive'))}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 sm:px-6 py-4 text-center text-gray-500">
                {t('noRecentClients')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;