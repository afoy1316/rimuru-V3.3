import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';
import CustomDropdown from '../ui/CustomDropdown';
import DateRangeFilter from './DateRangeFilter';
import {
  Share,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  RefreshCw,
  Calendar,
  User,
  Globe,
  MessageSquare,
  CheckCheck,
  AlertTriangle,
  ArrowRight,
  Mail,
  Building,
  Hash,
  Copy
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const ShareRequestManagement = () => {
  const { t } = useLanguage();
  const [shareRequests, setShareRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    admin_notes: ''
  });
  const [updating, setUpdating] = useState(false);

  // Bulk update states
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkUpdate, setBulkUpdate] = useState({
    status: '',
    admin_notes: ''
  });
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [paginatedRequests, setPaginatedRequests] = useState([]);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      // Parse the date string
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '-';
      }
      
      // Manually add 7 hours for Jakarta timezone (GMT+7)
      const jakartaTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
      
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      
      const day = jakartaTime.getUTCDate();
      const month = months[jakartaTime.getUTCMonth()];
      const year = jakartaTime.getUTCFullYear();
      const hours = String(jakartaTime.getUTCHours()).padStart(2, '0');
      const minutes = String(jakartaTime.getUTCMinutes()).padStart(2, '0');
      
      return `${day} ${month} ${year} pukul ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return '-';
    }
  };

  // Auto-refresh effect for filter changes
  useEffect(() => {
    fetchShareRequests();
  }, [statusFilter, platformFilter]);

  // Auto-refresh every 10 seconds for real-time updates (silent)
  useEffect(() => {
    // Initial fetch
    fetchShareRequests();
    
    // Auto-refresh in background (silent)
    const intervalId = setInterval(() => {
      fetchShareRequests(true); // Silent refresh
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Status options for filters and modals
  const getStatusOptions = () => [
    { value: '', label: t('allStatuses'), icon: Filter, color: 'text-gray-700' },
    { value: 'pending', label: t('pending'), icon: Clock, color: 'text-yellow-700' },
    { value: 'approved', label: t('approved'), icon: CheckCircle, color: 'text-green-700' },
    { value: 'rejected', label: t('rejected'), icon: XCircle, color: 'text-red-700' },
    { value: 'completed', label: t('completed'), icon: CheckCheck, color: 'text-purple-700' },
    { value: 'failed', label: t('failed'), icon: AlertTriangle, color: 'text-gray-700' }
  ];

  const getPlatformOptions = () => [
    { value: '', label: t('allPlatforms'), icon: Globe, color: 'text-gray-700' },
    { value: 'facebook', label: t('facebook'), color: 'text-blue-700' },
    { value: 'google', label: t('google'), color: 'text-red-700' },
    { value: 'tiktok', label: t('tiktok'), color: 'text-gray-900' }
  ];

  const getModalStatusOptions = () => [
    { value: 'pending', label: t('pending'), icon: Clock, color: 'text-yellow-700' },
    { value: 'approved', label: t('approved'), icon: CheckCircle, color: 'text-green-700' },
    { value: 'rejected', label: t('rejected'), icon: XCircle, color: 'text-red-700' },
    { value: 'completed', label: t('completed'), icon: CheckCheck, color: 'text-purple-700' },
    { value: 'failed', label: t('failed'), icon: AlertTriangle, color: 'text-gray-700' }
  ];

  const fetchShareRequests = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      
      if (statusFilter) params.append('status', statusFilter);
      if (platformFilter) params.append('platform', platformFilter);
      
      const response = await axios.get(`${API}/api/admin/share-requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShareRequests(response.data);
    } catch (error) {
      console.error('Error fetching share requests:', error);
      toast.error(t('errorFetchingShareRequests'));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest || !statusUpdate.status) {
      toast.error(t('pleaseSelectStatus'));
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      const payload = {
        status: statusUpdate.status,
        admin_notes: statusUpdate.admin_notes
      };
      
      await axios.put(
        `${API}/api/admin/share-requests/${selectedRequest.id}/status`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(t('shareRequestStatusUpdated'));
      setShowStatusModal(false);
      setStatusUpdate({ status: '', admin_notes: '' });
      setSelectedRequest(null);
      fetchShareRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.response?.data?.detail || t('errorUpdatingStatus');
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  // Bulk selection functions
  const handleSelectRequest = (requestId) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRequests.length === paginatedRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(paginatedRequests.map(req => req.id));
    }
  };

  // Bulk update function
  const handleBulkUpdate = async () => {
    if (selectedRequests.length === 0) {
      toast.error(t('pleaseSelectRequests') || 'Please select requests');
      return;
    }

    if (!bulkUpdate.status) {
      toast.error(t('pleaseSelectStatus') || 'Please select status');
      return;
    }

    setBulkUpdating(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      const payload = {
        request_ids: selectedRequests,
        status: bulkUpdate.status,
        admin_notes: bulkUpdate.admin_notes
      };
      
      const response = await axios.put(
        `${API}/api/admin/share-requests/bulk-update`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message);
      
      // Show failed updates if any
      if (response.data.failed_updates && response.data.failed_updates.length > 0) {
        setTimeout(() => {
          response.data.failed_updates.forEach(error => {
            toast.warning(error);
          });
        }, 1000);
      }
      
      setShowBulkModal(false);
      setBulkUpdate({ status: '', admin_notes: '' });
      setSelectedRequests([]);
      fetchShareRequests();
    } catch (error) {
      console.error('Error bulk updating:', error);
      const errorMessage = error.response?.data?.detail || t('errorUpdatingStatus') || 'Error updating status';
      toast.error(errorMessage);
    } finally {
      setBulkUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-purple-100 text-purple-800 border-purple-200',
      failed: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const statusIcons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      completed: CheckCheck,
      failed: AlertTriangle
    };

    const Icon = statusIcons[status] || Clock;
    const style = statusStyles[status] || statusStyles.pending;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${style}`}>
        <Icon className="w-3 h-3 mr-1" />
        {t(status) || status}
      </span>
    );
  };

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">F</div>;
      case 'google':
        return <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white font-bold text-sm">G</div>;
      case 'tiktok':
        return <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-sm">T</div>;
      default:
        return <Globe className="w-8 h-8 text-gray-500" />;
    }
  };

  const getTargetInfo = (request) => {
    if (request.platform === 'facebook' && request.target_bm_email) {
      const targets = Array.isArray(request.target_bm_email) ? request.target_bm_email : [request.target_bm_email];
      return (
        <div className="space-y-1">
          {targets.map((target, idx) => (
            <div key={idx} className="flex items-center text-sm text-gray-900">
              <Building className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
              <span className="break-all">{target}</span>
            </div>
          ))}
        </div>
      );
    }
    if (request.platform === 'google' && request.target_email) {
      const targets = Array.isArray(request.target_email) ? request.target_email : [request.target_email];
      return (
        <div className="space-y-1">
          {targets.map((target, idx) => (
            <div key={idx} className="flex items-center text-sm text-gray-900">
              <Mail className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
              <span className="break-all">{target}</span>
            </div>
          ))}
        </div>
      );
    }
    if (request.platform === 'tiktok' && request.target_bc_id) {
      const targets = Array.isArray(request.target_bc_id) ? request.target_bc_id : [request.target_bc_id];
      return (
        <div className="space-y-1">
          {targets.map((target, idx) => (
            <div key={idx} className="flex items-center text-sm text-gray-900">
              <Hash className="w-4 h-4 mr-2 text-gray-600 flex-shrink-0" />
              <span className="break-all">{target}</span>
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-gray-400">-</span>;
  };

  const copyToClipboard = async (text, label) => {
    if (!text || text === 'N/A') {
      toast.error(`${label} tidak tersedia untuk di-copy`);
      return;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`✅ ${label} berhasil di-copy!`);
      
    } catch (error) {
      console.error('Failed to copy text: ', error);
      toast.error(`❌ Gagal copy ${label}: ${error.message}`);
    }
  };

  const copyTargetInfo = (request) => {
    let targetText = '';
    let label = 'Target Share';
    
    if (request.platform === 'facebook' && request.target_bm_email) {
      const targets = Array.isArray(request.target_bm_email) ? request.target_bm_email : [request.target_bm_email];
      targetText = targets.join(', ');
      label = 'BM Email(s)';
    } else if (request.platform === 'google' && request.target_email) {
      const targets = Array.isArray(request.target_email) ? request.target_email : [request.target_email];
      targetText = targets.join(', ');
      label = 'Target Email(s)';
    } else if (request.platform === 'tiktok' && request.target_bc_id) {
      const targets = Array.isArray(request.target_bc_id) ? request.target_bc_id : [request.target_bc_id];
      targetText = targets.join(', ');
      label = 'BC ID(s)';
    }
    
    copyToClipboard(targetText, label);
  };

  const filteredRequests = useMemo(() => {
    return shareRequests.filter(request => {
      // Search filter
      const searchMatch = 
        request.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.platform?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(request.target_bm_email) ? request.target_bm_email.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) : request.target_bm_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (Array.isArray(request.target_email) ? request.target_email.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) : request.target_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (Array.isArray(request.target_bc_id) ? request.target_bc_id.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) : request.target_bc_id?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status filter
      const statusMatch = !statusFilter || request.status === statusFilter;
      
      // Platform filter
      const platformMatch = !platformFilter || request.platform === platformFilter;
      
      // Date range filter
      let dateMatch = true;
      if (dateRange.startDate && dateRange.endDate) {
        const requestDate = new Date(request.created_at);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        dateMatch = requestDate >= startDate && requestDate <= endDate;
      }
      
      return searchMatch && statusMatch && platformMatch && dateMatch;
    });
  }, [shareRequests, searchTerm, statusFilter, platformFilter, dateRange]);

  // Pagination effect
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredRequests.slice(startIndex, endIndex);
    setPaginatedRequests(paginated);
  }, [filteredRequests, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, platformFilter, itemsPerPage]);

  // Memoize stats calculation to prevent infinite re-renders
  const stats = useMemo(() => {
    return {
      total: shareRequests.length,
      pending: shareRequests.filter(r => r.status === 'pending').length,
      approved: shareRequests.filter(r => r.status === 'approved').length,
      rejected: shareRequests.filter(r => r.status === 'rejected').length,
      completed: shareRequests.filter(r => r.status === 'completed').length
    };
  }, [shareRequests]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Share className="mr-3 text-blue-600" />
            {t('shareRequestManagement')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('manageShareRequests')}
          </p>
        </div>
        {/* Auto refresh runs in background */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 break-words">{t('totalShareRequests')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Share className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 flex-shrink-0 ml-2" />
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 break-words">{t('pending')}</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 flex-shrink-0 ml-2" />
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 break-words">{t('approved')}</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 flex-shrink-0 ml-2" />
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 break-words">{t('rejected')}</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 flex-shrink-0 ml-2" />
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 break-words">{t('completed')}</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.completed}</p>
            </div>
            <CheckCheck className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow border space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('searchShareRequests')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <CustomDropdown
            options={getStatusOptions()}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder={t('allStatuses')}
            className="w-full"
          />
          <CustomDropdown
            options={getPlatformOptions()}
            value={platformFilter}
            onChange={setPlatformFilter}
            placeholder={t('allPlatforms')}
            className="w-full"
          />
          <div className="text-xs sm:text-sm text-gray-600 flex items-center break-words">
            <span>{t('showing')} {filteredRequests.length} {t('of')} {shareRequests.length} {t('shareRequests')}</span>
          </div>
        </div>
        
        {/* Date Range Filter */}
        <DateRangeFilter onFilterChange={setDateRange} />
      </div>

      {/* Bulk Actions Bar */}
      {filteredRequests.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedRequests.length === paginatedRequests.length && paginatedRequests.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  {selectedRequests.length === paginatedRequests.length && paginatedRequests.length > 0
                    ? t('deselectAll') || 'Deselect All'
                    : t('selectAll') || 'Select All'
                  }
                  {selectedRequests.length > 0 && ` (${selectedRequests.length})`}
                </label>
              </div>
            </div>

            {selectedRequests.length > 0 && (
              <button
                onClick={() => setShowBulkModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                {t('bulkUpdate') || `Bulk Update (${selectedRequests.length})`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <Share className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-base text-gray-500">{t('noShareRequestsFound')}</p>
            <p className="text-sm text-gray-400">{t('noShareRequestsMessage')}</p>
          </div>
        ) : (
          paginatedRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow border border-gray-200 p-3">
              {/* Header */}
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedRequests.includes(request.id)}
                    onChange={() => handleSelectRequest(request.id)}
                    className="rounded border-gray-300 text-blue-600 flex-shrink-0"
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getPlatformIcon(request.platform)}
                    <span className="text-sm font-medium text-gray-900 capitalize break-words">{request.platform} Ads</span>
                  </div>
                </div>
                {getStatusBadge(request.status)}
              </div>

              {/* Content */}
              <div className="space-y-2 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Nama Akun</p>
                  <p className="text-sm font-medium text-gray-900 break-words">{request.account_name}</p>
                </div>
                <div 
                  className="cursor-pointer hover:bg-gray-50 p-2 rounded"
                  onClick={() => copyToClipboard(request.ad_account?.real_account_id, 'ID Akun')}
                >
                  <p className="text-xs text-gray-500 mb-1">ID Akun (klik untuk copy)</p>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-mono text-gray-900 break-all flex-1">{request.ad_account?.real_account_id || 'N/A'}</p>
                    <Copy className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Client</p>
                    <p className="text-sm font-medium text-gray-900 break-words">{request.user?.username}</p>
                    <p className="text-xs text-gray-500 break-all">{request.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tanggal</p>
                    <p className="text-xs text-gray-900">
                      {new Date(request.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div 
                  className="cursor-pointer hover:bg-gray-50 p-2 rounded"
                  onClick={() => copyTargetInfo(request)}
                >
                  <p className="text-xs text-gray-500 mb-1">Target Share (klik untuk copy)</p>
                  <div className="flex items-center gap-1">
                    <div className="text-xs text-gray-900 break-all flex-1">{getTargetInfo(request)}</div>
                    <Copy className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
                {request.processed_by && (
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-2">
                    <p className="text-xs text-teal-600 mb-1">Diproses oleh</p>
                    <p className="text-xs font-bold text-teal-700 break-words">{request.processed_by.name || request.processed_by.username}</p>
                    {request.processed_at && (
                      <p className="text-xs text-teal-600 mt-0.5">{formatDate(request.processed_at)}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowDetailModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
                >
                  <Eye className="h-3 w-3" />
                  <span>Detail</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setStatusUpdate({ 
                      status: request.status, 
                      admin_notes: request.admin_notes 
                    });
                    setShowStatusModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                >
                  <MoreVertical className="h-3 w-3" />
                  <span>Update</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '50px' }}>
                  <input
                    type="checkbox"
                    checked={selectedRequests.length === paginatedRequests.length && paginatedRequests.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '90px' }}>
                  ID AKUN
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '150px' }}>
                  {t('account')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '130px' }}>
                  {t('client')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '130px' }}>
                  {t('shareTarget')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '110px' }}>
                  {t('status')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px' }}>
                  {t('requestDate')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '180px' }}>
                  PROSES OLEH
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '100px' }}>
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    <Share className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">{t('noShareRequestsFound')}</p>
                    <p className="text-sm">{t('noShareRequestsMessage')}</p>
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 whitespace-nowrap" style={{ width: '50px' }}>
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => handleSelectRequest(request.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-3" style={{ width: '90px' }}>
                      <div 
                        className="text-xs font-mono text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded group relative overflow-hidden text-ellipsis"
                        onClick={() => copyToClipboard(request.ad_account?.real_account_id, 'ID Akun')}
                        title={`Click to copy: ${request.ad_account?.real_account_id || 'N/A'}`}
                      >
                        <div className="flex items-center">
                          <span className="truncate">{request.ad_account?.real_account_id ? request.ad_account.real_account_id.toString().substring(0, 7) : 'N/A'}</span>
                          <Copy className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3" style={{ width: '150px' }}>
                      <div className="flex items-center overflow-hidden">
                        <div className="flex-shrink-0">
                          {getPlatformIcon(request.platform)}
                        </div>
                        <div className="ml-2 overflow-hidden">
                          <div className="text-xs font-medium text-gray-900 truncate" title={request.account_name}>
                            {request.account_name}
                          </div>
                          <div className="text-xs text-gray-500 capitalize truncate">
                            {request.platform} Ads
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3" style={{ width: '130px' }}>
                      <div className="overflow-hidden">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate" title={request.user?.username}>
                            {request.user?.username}
                          </div>
                          <div className="text-xs text-gray-500 truncate" title={request.user?.email}>
                            {request.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3" style={{ width: '130px' }}>
                      <div 
                        className="cursor-pointer hover:bg-gray-50 p-1 rounded group relative overflow-hidden"
                        onClick={() => copyTargetInfo(request)}
                        title={`Click to copy: ${
                          Array.isArray(request.target_bm_email) ? request.target_bm_email.join(', ') :
                          Array.isArray(request.target_email) ? request.target_email.join(', ') :
                          Array.isArray(request.target_bc_id) ? request.target_bc_id.join(', ') :
                          request.target_bm_email || request.target_email || request.target_bc_id || 'N/A'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 overflow-hidden text-ellipsis">
                            {getTargetInfo(request)}
                          </div>
                          <Copy className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap" style={{ width: '110px' }}>
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap" style={{ width: '120px' }}>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                        <span className="text-xs truncate">
                          {new Date(request.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3" style={{ width: '180px' }}>
                      {request.processed_by ? (
                        <div className="inline-flex flex-col bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg px-2 py-1.5 w-full">
                          <div className="text-xs font-bold text-teal-700 truncate" title={request.processed_by.name || request.processed_by.username}>
                            {request.processed_by.name || request.processed_by.username}
                          </div>
                          {request.processed_at && (
                            <div className="text-[10px] text-teal-600 mt-0.5 leading-tight">
                              {formatDate(request.processed_at)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right" style={{ width: '100px' }}>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1.5 rounded hover:bg-blue-50 transition-colors"
                          title={t('viewDetails')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setStatusUpdate({ status: request.status, admin_notes: request.admin_notes });
                            setShowStatusModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 p-1.5 rounded hover:bg-green-50 transition-colors"
                          title={t('updateStatus')}
                        >
                          <MoreVertical className="w-4 h-4" />
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
      {filteredRequests.length > 0 && (
        <>
          {/* Desktop Pagination */}
          <div className="hidden md:block bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-700">
                    {t('showing')}{' '}
                    <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>
                    {' '}{t('to')}{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredRequests.length)}
                    </span>
                    {' '}{t('of')}{' '}
                    <span className="font-medium">{filteredRequests.length}</span> {t('results')}
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
                      const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
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
                      onClick={() => setCurrentPage(Math.min(Math.ceil(filteredRequests.length / itemsPerPage), currentPage + 1))}
                      disabled={currentPage === Math.ceil(filteredRequests.length / itemsPerPage)}
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

          {/* Mobile Pagination */}
          <div className="md:hidden bg-white rounded-lg shadow p-4 mt-4">
            <div className="flex flex-col space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <p className="text-xs text-gray-600">
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredRequests.length)} dari {filteredRequests.length}
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
                  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
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
                  onClick={() => setCurrentPage(Math.min(Math.ceil(filteredRequests.length / itemsPerPage), currentPage + 1))}
                  disabled={currentPage === Math.ceil(filteredRequests.length / itemsPerPage)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Share Request Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
                  <Share className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span className="break-words">{t('shareRequestDetails')}</span>
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl flex-shrink-0 ml-2"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Account Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t('account')}
                    </label>
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0">{getPlatformIcon(selectedRequest.platform)}</div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm sm:text-base break-words">{selectedRequest.account_name}</span>
                        <p className="text-xs sm:text-sm text-gray-500 capitalize">{selectedRequest.platform} Ads</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t('shareTarget')}
                    </label>
                    <div className="text-sm break-all">{getTargetInfo(selectedRequest)}</div>
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    {t('clientInformation')}
                  </label>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base text-gray-900 break-words">{selectedRequest.user?.username}</p>
                        <p className="text-xs sm:text-sm text-gray-600 break-all">{selectedRequest.user?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t('currentStatus')}
                    </label>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t('requestDate')}
                    </label>
                    <p className="text-xs sm:text-sm text-gray-900 flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{new Date(selectedRequest.created_at).toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                {/* Client Notes */}
                {selectedRequest.notes && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      {t('clientNotes')}
                    </label>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-900 break-words">{selectedRequest.notes}</p>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedRequest.admin_notes && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      {t('adminNotes')}
                    </label>
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-900 break-words">{selectedRequest.admin_notes}</p>
                    </div>
                  </div>
                )}

                {/* Processed Info */}
                {selectedRequest.processed_by && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      {t('processedBy')}
                    </label>
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm sm:text-base text-gray-900 break-words">{selectedRequest.processed_by.name || selectedRequest.processed_by.username}</p>
                          <p className="text-xs sm:text-sm text-gray-600 break-words">@{selectedRequest.processed_by.username}</p>
                          {selectedRequest.processed_at && (
                            <p className="text-xs text-gray-500 mt-1 break-words">
                              {new Date(selectedRequest.processed_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
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
                    setStatusUpdate({ status: selectedRequest.status, admin_notes: selectedRequest.admin_notes });
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
      {showStatusModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                  {t('updateShareRequestStatus')}
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
                    {t('shareRequestInfo')}
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p className="font-medium">{selectedRequest.account_name}</p>
                    <p className="text-gray-600 capitalize">{selectedRequest.platform} Ads - {selectedRequest.user?.username}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('newStatus')}
                  </label>
                  <CustomDropdown
                    options={getModalStatusOptions()}
                    value={statusUpdate.status}
                    onChange={(value) => setStatusUpdate({ ...statusUpdate, status: value })}
                    placeholder={t('selectStatus')}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('adminNotes')}
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder={t('addNotesOptional')}
                    value={statusUpdate.admin_notes}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, admin_notes: e.target.value })}
                  />
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
                  disabled={updating}
                >
                  {updating && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {updating ? (t('updating')) : (t('updateStatus'))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <CheckCheck className="w-5 h-5 mr-2 text-blue-600" />
                  {t('bulkUpdateShareRequests') || `Bulk Update (${selectedRequests.length} items)`}
                </h3>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={bulkUpdating}
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('newStatus')}
                  </label>
                  <CustomDropdown
                    options={getModalStatusOptions()}
                    value={bulkUpdate.status}
                    onChange={(value) => setBulkUpdate(prev => ({ ...prev, status: value }))}
                    placeholder={t('selectStatus')}
                    className="w-full"
                  />
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('adminNotes')}
                  </label>
                  <textarea
                    value={bulkUpdate.admin_notes}
                    onChange={(e) => setBulkUpdate(prev => ({ ...prev, admin_notes: e.target.value }))}
                    placeholder={t('addAdminNotes')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCheck className="w-5 h-5 text-blue-600 mr-2" />
                    <div className="text-sm text-blue-900">
                      <strong>{selectedRequests.length}</strong> {t('shareRequestsSelected')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={bulkUpdating}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleBulkUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
                  disabled={bulkUpdating || !bulkUpdate.status}
                >
                  {bulkUpdating && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {bulkUpdating ? (t('updating') || 'Updating...') : (t('updateSelected') || 'Update Selected')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareRequestManagement;