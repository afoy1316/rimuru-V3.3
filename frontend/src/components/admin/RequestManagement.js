import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';
import CustomDropdown from '../ui/CustomDropdown';
import { Badge } from '../ui/badge.js';
import DateRangeFilter from './DateRangeFilter';
import {
  FileText,
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
  Copy,
  CreditCard,
  MessageSquare,
  CheckCheck,
  AlertTriangle,
  Ban,
  Trash2
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'processing', label: 'Processing', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'purple' },
  { value: 'failed', label: 'Failed', color: 'gray' },
  { value: 'disabled', label: 'Disabled', color: 'orange' },
  { value: 'deleted', label: 'Deleted', color: 'black' }
];

const RequestManagement = () => {
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Status options with translations and icons
  const getStatusOptions = () => [
    { value: '', label: t('allStatuses'), icon: Filter, color: 'text-gray-700' },
    { value: 'pending', label: t('pending'), icon: Clock, color: 'text-yellow-700' },
    { value: 'approved', label: t('approved'), icon: CheckCircle, color: 'text-green-700' },
    { value: 'rejected', label: t('rejected'), icon: XCircle, color: 'text-red-700' },
    { value: 'processing', label: t('processing'), icon: RefreshCw, color: 'text-blue-700' },
    { value: 'completed', label: t('completed'), icon: CheckCheck, color: 'text-purple-700' },
    { value: 'failed', label: t('failed'), icon: AlertTriangle, color: 'text-gray-700' },
    { value: 'disabled', label: t('disabled'), icon: Ban, color: 'text-orange-700' },
    { value: 'deleted', label: t('deleted'), icon: Trash2, color: 'text-black' }
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
    { value: 'processing', label: t('processing'), icon: RefreshCw, color: 'text-blue-700' },
    { value: 'completed', label: t('completed'), icon: CheckCheck, color: 'text-purple-700' },
    { value: 'failed', label: t('failed'), icon: AlertTriangle, color: 'text-gray-700' },
    { value: 'disabled', label: t('disabled'), icon: Ban, color: 'text-orange-700' },
    { value: 'deleted', label: t('deleted'), icon: Trash2, color: 'text-black' }
  ];
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    admin_notes: '',
    account_id: '',
    account_name: '',
    fee_percentage: ''
  });
  const [updating, setUpdating] = useState(false);
  
  // Bulk update states
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkUpdate, setBulkUpdate] = useState({
    status: '',
    admin_notes: '',
    fee_percentage: ''
  });
  const [bulkUpdating, setBulkUpdating] = useState(false);
  
  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRequestForDelete, setSelectedRequestForDelete] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [paginatedRequests, setPaginatedRequests] = useState([]);
  
  // Copy to clipboard function
  const copyToClipboard = (text, label) => {
    if (!text) {
      toast.error('Tidak ada data untuk dicopy');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} berhasil dicopy!`);
    }).catch(() => {
      toast.error('Gagal copy ke clipboard');
    });
  };
  
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
    fetchRequests();
  }, [statusFilter, platformFilter]);

  // Event-driven refresh and auto-refresh (silent)
  useEffect(() => {
    // Initial fetch
    fetchRequests();
    
    // Auto-refresh every 10 seconds for real-time updates (silent)
    const intervalId = setInterval(() => {
      fetchRequests(true); // Silent refresh
    }, 10000); // 10 seconds
    
    // Listen for notification events for smart refresh
    const handleNotification = (event) => {
      if (event.detail && event.detail.type) {
        const notifType = event.detail.type;
        const title = event.detail.title || '';
        
        // Refresh if notification is related to account requests
        if (notifType === 'account_request' || 
            notifType === 'request_approved' ||
            notifType === 'request_rejected' ||
            title.includes('Request') || 
            title.includes('Account')) {
          
          console.log('[RequestManagement] Notification received, refreshing...', notifType);
          setTimeout(() => fetchRequests(true), 1000); // Silent refresh
        }
      }
    };

    window.addEventListener('newNotification', handleNotification);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('newNotification', handleNotification);
    };
  }, []);

  const fetchRequests = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      
      if (statusFilter) params.append('status', statusFilter);
      if (platformFilter) params.append('platform', platformFilter);
      
      const response = await axios.get(`${API}/api/admin/requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error(t('errorFetchingRequests'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest || !statusUpdate.status) {
      toast.error(t('pleaseSelectStatus'));
      return;
    }

    // Show confirmation modal for delete status
    if (statusUpdate.status === 'deleted') {
      setSelectedRequestForDelete(selectedRequest);
      setShowDeleteModal(true);
      setShowStatusModal(false);
      return;
    }

    // Validate account ID for ALL platforms when approving
    if (statusUpdate.status === 'approved' && !statusUpdate.account_id?.trim()) {
      const platformName = selectedRequest.platform === 'facebook' ? 'Facebook' :
                          selectedRequest.platform === 'google' ? 'Google Ads' :
                          selectedRequest.platform === 'tiktok' ? 'TikTok' : 'Platform';
      toast.error(`${platformName} Account ID wajib diisi saat approve`);
      return;
    }

    // Validate fee percentage when approving
    if (statusUpdate.status === 'approved') {
      const feePercentage = parseFloat(statusUpdate.fee_percentage);
      if (isNaN(feePercentage) || feePercentage < 0 || feePercentage > 100) {
        toast.error(t('feePercentageRequired'));
        return;
      }
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      // Update ad account status based on request status (if account exists)
      if (selectedRequest.account_id) {
        try {
          let adAccountStatus;
          
          // Map request status to ad account status - each status should match exactly per user requirements
          switch (statusUpdate.status) {
            case 'completed':
              adAccountStatus = 'active'; // Completed requests = active accounts (special case)
              break;
            case 'disabled':
              adAccountStatus = 'disabled';
              break;
            case 'pending':
              adAccountStatus = 'pending'; // Pending should stay pending
              break;
            case 'approved':
              adAccountStatus = 'approved'; // Approved should stay approved
              break;
            case 'processing':
              adAccountStatus = 'processing'; // Processing should stay processing
              break;
            case 'rejected':
            case 'failed':
              adAccountStatus = 'suspended'; // Failed/rejected = suspended
              break;
            default:
              adAccountStatus = null; // Don't update ad account for other statuses
          }

          if (adAccountStatus) {
            await axios.put(
              `${API}/api/admin/accounts/${selectedRequest.account_id}/status`,
              { status: adAccountStatus },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        } catch (accountError) {
          // If account not found, just update request status without ad account
          console.warn('Ad account not found, updating request status only:', accountError);
          if (accountError.response?.status !== 404) {
            // If it's not a 404, show error to user
            throw accountError;
          }
        }
      }
      
      // Prepare payload - only include account_id if it's provided
      const payload = {
        status: statusUpdate.status,
        admin_notes: statusUpdate.admin_notes
      };
      
      if (statusUpdate.account_id?.trim()) {
        payload.account_id = statusUpdate.account_id.trim();
      }
      
      if (statusUpdate.account_name?.trim()) {
        payload.account_name = statusUpdate.account_name.trim();
      }
      
      if (statusUpdate.status === 'approved' && statusUpdate.fee_percentage) {
        payload.fee_percentage = parseFloat(statusUpdate.fee_percentage);
      }
      
      // Update request status
      await axios.put(
        `${API}/api/admin/requests/${selectedRequest.id}/status`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Show appropriate success message
      let successMessage = t('requestStatusUpdated');
      if (statusUpdate.status === 'completed') {
        successMessage = t('accountCompletedSuccess');
      } else if (statusUpdate.status === 'disabled') {
        successMessage = selectedRequest.account_id ? 
          (t('accountDisabledSuccess')) : 
          (t('requestMarkedDisabled'));
      } else if (statusUpdate.status === 'rejected') {
        successMessage = t('requestRejectedSuccess');
      } else if (statusUpdate.status === 'approved') {
        successMessage = t('requestApprovedSuccess');
      }

      toast.success(successMessage);
      setShowStatusModal(false);
      setStatusUpdate({ status: '', admin_notes: '', account_id: '', account_name: '', fee_percentage: '' });
      setSelectedRequest(null);
      fetchRequests();
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
      toast.error(t('pleaseSelectRequests'));
      return;
    }

    if (!bulkUpdate.status) {
      toast.error(t('pleaseSelectStatus'));
      return;
    }

    // Validate fee percentage for bulk approval
    if (bulkUpdate.status === 'approved') {
      const feePercentage = parseFloat(bulkUpdate.fee_percentage);
      if (isNaN(feePercentage) || feePercentage < 0 || feePercentage > 100) {
        toast.error(t('feePercentageRequired'));
        return;
      }
    }

    setBulkUpdating(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      const payload = {
        request_ids: selectedRequests,
        status: bulkUpdate.status,
        admin_notes: bulkUpdate.admin_notes
      };
      
      if (bulkUpdate.status === 'approved' && bulkUpdate.fee_percentage) {
        payload.fee_percentage = parseFloat(bulkUpdate.fee_percentage);
      }
      
      const response = await axios.put(
        `${API}/api/admin/requests/bulk-update`,
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
      setBulkUpdate({ status: '', admin_notes: '', fee_percentage: '' });
      setSelectedRequests([]);
      fetchRequests();
    } catch (error) {
      console.error('Error bulk updating:', error);
      const errorMessage = error.response?.data?.detail || t('errorUpdatingStatus');
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
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-purple-100 text-purple-800 border-purple-200',
      failed: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const statusIcons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      processing: RefreshCw,
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

  // Memoize filtered requests to prevent infinite re-renders
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      // Search filter
      const searchMatch = 
        request.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.platform?.toLowerCase().includes(searchTerm.toLowerCase());
      
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
  }, [requests, searchTerm, statusFilter, platformFilter, dateRange]);

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
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      processing: requests.filter(r => r.status === 'processing').length
    };
  }, [requests]);

  // Handle delete account function - deletes the actual ad account
  const handleDeleteAccount = async () => {
    if (!selectedRequestForDelete) return;

    setDeleteSubmitting(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      if (selectedRequestForDelete.account_id) {
        // If there's an actual ad account, delete it
        await axios.delete(
          `${API}/api/admin/accounts/${selectedRequestForDelete.account_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success(t('accountDeletedSuccess'));
      } else {
        // If no ad account exists yet, just mark the request as deleted
        await axios.put(
          `${API}/api/admin/requests/${selectedRequestForDelete.id}/status`,
          { 
            status: 'deleted',
            admin_notes: `Request deleted by admin on ${new Date().toLocaleString()}`
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success(t('requestDeletedSuccess'));
      }

      setShowDeleteModal(false);
      setSelectedRequestForDelete(null);
      fetchRequests();
    } catch (error) {
      console.error('Error deleting account:', error);
      const errorMessage = error.response?.data?.detail || t('errorDeletingAccount');
      toast.error(errorMessage);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // These functions are no longer needed as disable/enable is handled through status modal

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
            <FileText className="mr-3 text-blue-600" />
            {t('requestManagement')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('manageAccountRequests')}
          </p>
        </div>
        <div className="flex space-x-2">
          {selectedRequests.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{t('bulkUpdate')} ({selectedRequests.length})</span>
            </button>
          )}
          {/* Auto refresh runs in background */}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 break-words">{t('totalRequests')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 flex-shrink-0 ml-2" />
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
              <p className="text-xs sm:text-sm font-medium text-gray-600 break-words">{t('processing')}</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.processing}</p>
            </div>
            <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 flex-shrink-0 ml-2" />
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
              placeholder={t('searchRequests')}
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
            <span>{t('showing')} {filteredRequests.length} {t('of')} {requests.length} {t('requests')}</span>
          </div>
        </div>
        
        {/* Date Range Filter */}
        <DateRangeFilter onFilterChange={setDateRange} />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-base text-gray-500">{t('noRequestsFound')}</p>
            <p className="text-sm text-gray-400">{t('noRequestsMessage')}</p>
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
                    <span className="text-sm font-medium text-gray-900 capitalize break-words">{request.platform}</span>
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
                {request.verified_by_admin && (
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-2">
                    <p className="text-xs text-teal-600 mb-1">Diproses oleh</p>
                    <p className="text-xs font-bold text-teal-700 break-words">{request.verified_by_admin.name || request.verified_by_admin.username}</p>
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
                      admin_notes: request.admin_notes, 
                      account_id: request.account_id,
                      account_name: request.account_name, 
                      fee_percentage: request.fee_percentage 
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '50px' }}>
                  <input
                    type="checkbox"
                    checked={selectedRequests.length === paginatedRequests.length && paginatedRequests.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '100px' }}>
                  {t('platform')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '180px' }}>
                  {t('accountName')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '150px' }}>
                  {t('client')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px' }}>
                  {t('status')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '110px' }}>
                  {t('requestDate')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '180px' }}>
                  {t('processedBy')}
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '100px' }}>
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">{t('noRequestsFound')}</p>
                    <p className="text-sm">{t('noRequestsMessage')}</p>
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-2 py-3 whitespace-nowrap" style={{ width: '50px' }}>
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => handleSelectRequest(request.id)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap" style={{ width: '100px' }}>
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0">
                          {getPlatformIcon(request.platform)}
                        </div>
                        <div className="text-xs font-medium text-gray-900 capitalize overflow-hidden text-ellipsis whitespace-nowrap">
                          {request.platform}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3" style={{ width: '180px' }}>
                      <div className="text-sm font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap" title={request.account_name}>
                        {request.account_name}
                      </div>
                    </td>
                    <td className="px-3 py-3" style={{ width: '150px' }}>
                      <div className="overflow-hidden">
                        <div className="text-sm font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap" title={request.user?.username}>
                          {request.user?.username}
                        </div>
                        <div className="text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap" title={request.user?.email}>
                          {request.user?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap" style={{ width: '120px' }}>
                      <div className="overflow-hidden">
                        {getStatusBadge(request.status)}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900" style={{ width: '110px' }}>
                      <div className="overflow-hidden text-ellipsis">
                        {new Date(request.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-3" style={{ width: '180px' }}>
                      {request.verified_by_admin ? (
                        <div className="inline-flex flex-col bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg px-2 py-1.5 w-full">
                          <div className="text-xs font-bold text-teal-700 truncate" title={request.verified_by_admin.name || request.verified_by_admin.username}>
                            {request.verified_by_admin.name || request.verified_by_admin.username}
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
                            setStatusUpdate({ 
                              status: request.status, 
                              admin_notes: request.admin_notes, 
                              account_id: request.account_id,
                              account_name: request.account_name, 
                              fee_percentage: request.fee_percentage 
                            });
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

      {/* Modals */}

      {/* Request Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  {t('requestDetails')}
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('platform')}
                    </label>
                    <div className="flex items-center">
                      {getPlatformIcon(selectedRequest.platform)}
                      <span className="ml-2 capitalize font-medium">{selectedRequest.platform} Ads</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('accountName')}
                    </label>
                    <p className="text-gray-900">{selectedRequest.account_name}</p>
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('clientInformation')}
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <User className="w-8 h-8 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedRequest.user?.username}</p>
                        <p className="text-sm text-gray-600">{selectedRequest.user?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform-Specific Fields */}
                {selectedRequest.platform === 'facebook' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook Ads Settings
                    </label>
                    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">GMT:</span>
                          <span className="ml-2 text-gray-900">{selectedRequest.gmt || '-'}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Currency:</span>
                          <span className="ml-2 text-gray-900">{selectedRequest.currency || '-'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Delivery Method:</span>
                        <span className="ml-2 text-gray-900">{selectedRequest.delivery_method || '-'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">BM ID/Email:</span>
                        {/* Show multiple BM IDs if available, otherwise show single */}
                        {selectedRequest.bm_ids && selectedRequest.bm_ids.length > 0 ? (
                          <div className="ml-2 mt-1 space-y-1">
                            {selectedRequest.bm_ids.map((bmId, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {index + 1}. {bmId}
                                </Badge>
                                <button
                                  onClick={() => copyToClipboard(bmId, 'BM ID')}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  title="Copy BM ID"
                                >
                                  <Copy className="h-3 w-3 text-gray-600" />
                                </button>
                              </div>
                            ))}
                            <span className="text-xs text-gray-500 block mt-1">
                              Total: {selectedRequest.bm_ids.length} BM ID(s)
                            </span>
                          </div>
                        ) : (
                          <div className="ml-2 inline-flex items-center gap-2">
                            <span className="text-gray-900">{selectedRequest.bm_id_or_email || '-'}</span>
                            {selectedRequest.bm_id_or_email && (
                              <button
                                onClick={() => copyToClipboard(selectedRequest.bm_id_or_email, 'BM ID/Email')}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Copy BM ID/Email"
                              >
                                <Copy className="h-3 w-3 text-gray-600" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.platform === 'google' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Ads Settings
                    </label>
                    <div className="bg-red-50 p-4 rounded-lg space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">GMT:</span>
                          <span className="ml-2 text-gray-900">{selectedRequest.gmt || '-'}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Currency:</span>
                          <span className="ml-2 text-gray-900">{selectedRequest.currency || '-'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Email:</span>
                        <div className="ml-2 inline-flex items-center gap-2">
                          <span className="text-gray-900">{selectedRequest.email || '-'}</span>
                          {selectedRequest.email && (
                            <button
                              onClick={() => copyToClipboard(selectedRequest.email, 'Email')}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                              title="Copy Email"
                            >
                              <Copy className="h-3 w-3 text-red-600" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Website:</span>
                        <div className="ml-2 inline-flex items-center gap-2">
                          <span className="text-gray-900">{selectedRequest.website || '-'}</span>
                          {selectedRequest.website && (
                            <button
                              onClick={() => copyToClipboard(selectedRequest.website, 'Website')}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                              title="Copy Website"
                            >
                              <Copy className="h-3 w-3 text-red-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.platform === 'tiktok' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TikTok Ads Settings
                    </label>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">GMT:</span>
                          <span className="ml-2 text-gray-900">{selectedRequest.gmt || '-'}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Currency:</span>
                          <span className="ml-2 text-gray-900">{selectedRequest.currency || '-'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">BC ID:</span>
                        <div className="ml-2 inline-flex items-center gap-2">
                          <span className="text-gray-900">{selectedRequest.bc_id || '-'}</span>
                          {selectedRequest.bc_id && (
                            <button
                              onClick={() => copyToClipboard(selectedRequest.bc_id, 'BC ID')}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="Copy BC ID"
                            >
                              <Copy className="h-3 w-3 text-gray-600" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Website:</span>
                        <div className="ml-2 inline-flex items-center gap-2">
                          <span className="text-gray-900">{selectedRequest.website || '-'}</span>
                          {selectedRequest.website && (
                            <button
                              onClick={() => copyToClipboard(selectedRequest.website, 'Website')}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="Copy Website"
                            >
                              <Copy className="h-3 w-3 text-gray-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status and Notes */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('currentStatus')}
                    </label>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('requestDate')}
                    </label>
                    <p className="text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(selectedRequest.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {selectedRequest.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('clientNotes')}
                    </label>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-900">{selectedRequest.notes}</p>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedRequest.admin_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('adminNotes')}
                    </label>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-900">{selectedRequest.admin_notes}</p>
                    </div>
                  </div>
                )}

                {/* Processed Info */}
                {selectedRequest.processed_by && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('processedBy')}
                    </label>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <User className="w-6 h-6 text-gray-400 mr-2" />
                        <div>
                          <p className="font-medium text-gray-900">{selectedRequest.processed_by.full_name}</p>
                          <p className="text-sm text-gray-600">@{selectedRequest.processed_by.username}</p>
                          {selectedRequest.processed_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(selectedRequest.processed_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t('close')}
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setStatusUpdate({ 
                      status: selectedRequest.status, 
                      admin_notes: selectedRequest.admin_notes, 
                      account_id: selectedRequest.account_id,
                      account_name: selectedRequest.account_name, 
                      fee_percentage: selectedRequest.fee_percentage 
                    });
                    setShowStatusModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
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
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                  {t('updateRequestStatus')}
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
                    {t('requestInfo')}
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

                {/* Warning message for delete status */}
                {statusUpdate.status === 'deleted' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800 mb-1">
                          {t('deleteWarningTitle')}
                        </p>
                        <p className="text-sm text-red-700">
                          {t('deleteAccountWarning')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning message for disable status */}
                {statusUpdate.status === 'disabled' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Ban className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-800 mb-1">
                          {selectedRequest.account_id 
                            ? (t('disableWarningTitle'))
                            : (t('requestWillBeMarkedDisabled'))
                          }
                        </p>
                        <p className="text-sm text-orange-700">
                          {selectedRequest.account_id 
                            ? (t('disableAccountWarning'))
                            : (t('disableRequestWarning'))
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account ID field for ALL platforms when approving */}
                {statusUpdate.status === 'approved' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Akun <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan nama akun iklan"
                        value={statusUpdate.account_name || selectedRequest.account_name}
                        onChange={(e) => setStatusUpdate({ ...statusUpdate, account_name: e.target.value })}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Nama akun iklan yang akan ditampilkan (bisa diedit)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {selectedRequest.platform === 'facebook' && 'Facebook Account ID'}
                        {selectedRequest.platform === 'google' && 'Google Ads Customer ID'}
                        {selectedRequest.platform === 'tiktok' && 'TikTok Advertiser ID'}
                        {!['facebook', 'google', 'tiktok'].includes(selectedRequest.platform) && 'Account ID'}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={
                          selectedRequest.platform === 'facebook' ? 'Contoh: 1234567890123456' :
                          selectedRequest.platform === 'google' ? 'Contoh: 123-456-7890' :
                          selectedRequest.platform === 'tiktok' ? 'Contoh: 1234567890123456789' :
                          'Masukkan ID Akun Iklan'
                        }
                        value={statusUpdate.account_id}
                        onChange={(e) => setStatusUpdate({ ...statusUpdate, account_id: e.target.value })}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {selectedRequest.platform === 'facebook' && 'ID akun iklan Facebook (16 digit angka)'}
                        {selectedRequest.platform === 'google' && 'Customer ID dari Google Ads (format: XXX-XXX-XXXX)'}
                        {selectedRequest.platform === 'tiktok' && 'Advertiser ID dari TikTok Ads Manager'}
                        {!['facebook', 'google', 'tiktok'].includes(selectedRequest.platform) && 'Masukkan ID akun iklan dari platform'}
                      </p>
                    </div>
                  </>
                )}

                {/* Fee Percentage field when approving */}
                {statusUpdate.status === 'approved' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('feePercentage')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t('enterFeePercentage')}
                        value={statusUpdate.fee_percentage}
                        onChange={(e) => setStatusUpdate({ ...statusUpdate, fee_percentage: e.target.value })}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {t('feePercentageHint')}
                    </p>
                  </div>
                )}

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
      {showBulkModal && selectedRequests.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <CheckCheck className="w-5 h-5 mr-2 text-green-600" />
                  {t('bulkUpdateRequests')}
                </h3>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('selectedRequests')}
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm max-h-32 overflow-y-auto">
                    <p className="font-medium mb-2">{selectedRequests.length} {t('requestsSelected')}</p>
                    <div className="space-y-1">
                      {filteredRequests
                        .filter(req => selectedRequests.includes(req.id))
                        .slice(0, 5)
                        .map(req => (
                          <p key={req.id} className="text-gray-600 text-xs">
                            {req.account_name} - {req.platform} ({req.user?.username})
                          </p>
                        ))}
                      {selectedRequests.length > 5 && (
                        <p className="text-gray-500 text-xs italic">
                          +{selectedRequests.length - 5} {t('moreRequests')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('newStatus')} <span className="text-red-500">*</span>
                  </label>
                  <CustomDropdown
                    options={getModalStatusOptions()}
                    value={bulkUpdate.status}
                    onChange={(value) => setBulkUpdate({ ...bulkUpdate, status: value })}
                    placeholder={t('selectStatus')}
                    className="w-full"
                  />
                </div>

                {/* Fee Percentage field for bulk approval */}
                {bulkUpdate.status === 'approved' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('feePercentage')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t('enterFeePercentage')}
                        value={bulkUpdate.fee_percentage}
                        onChange={(e) => setBulkUpdate({ ...bulkUpdate, fee_percentage: e.target.value })}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                    </div>
                    <p className="mt-1 text-xs text-orange-600">
                      ⚠️ {t('bulkApprovalWarning')}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {t('feePercentageHint')}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('adminNotes')}
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder={t('addBulkNotesOptional')}
                    value={bulkUpdate.admin_notes}
                    onChange={(e) => setBulkUpdate({ ...bulkUpdate, admin_notes: e.target.value })}
                  />
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
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center"
                  disabled={bulkUpdating}
                >
                  {bulkUpdating && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {bulkUpdating ? (t('updating')) : (t('bulkUpdate'))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRequestForDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Trash2 className="w-5 h-5 mr-2 text-red-600" />
                  {t('deleteAccount')}
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={deleteSubmitting}
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800 mb-1">
                        {t('deleteWarningTitle')}
                      </p>
                      <p className="text-sm text-red-700">
                        {t('deleteWarningMessage')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <User className="w-8 h-8 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedRequestForDelete.account_name}</p>
                      <p className="text-sm text-gray-600 capitalize">{selectedRequestForDelete.platform} Ads - {selectedRequestForDelete.user?.username}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={deleteSubmitting}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 flex items-center"
                  disabled={deleteSubmitting}
                >
                  {deleteSubmitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {deleteSubmitting ? (t('deleting')) : (t('deleteAccount'))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestManagement;