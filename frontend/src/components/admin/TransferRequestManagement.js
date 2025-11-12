/* Updated: 2025-11-10 05:42 - Fixed Proof In Review badge animation */
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';
import CustomDropdown from '../ui/CustomDropdown';
import DateRangeFilter from './DateRangeFilter';
import {
  ArrowRightLeft,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Calendar,
  User,
  Globe,
  MessageSquare,
  CheckCheck,
  AlertTriangle,
  DollarSign,
  Building,
  Mail,
  Hash,
  Copy,
  Download,
  X,
  Edit,
  RefreshCw,
  Lock,
  Unlock
} from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';
import { useRequestClaim } from '../../hooks/useRequestClaim';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const TransferRequestManagement = () => {
  const { language, t } = useLanguage();
  const [transferRequests, setTransferRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    admin_notes: ''
  });
  
  // Claim/Lock states
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showForceReleaseModal, setShowForceReleaseModal] = useState(false);
  const [requestToForceRelease, setRequestToForceRelease] = useState(null);
  const { 
    claimRequest, 
    releaseRequest, 
    forceReleaseRequest,
    isClaimedByMe,
    isClaimedByOther,
    getClaimTimeElapsed
  } = useRequestClaim('wallet_transfer');

  // File upload states for approval
  const [spendLimitProof, setSpendLimitProof] = useState(null);
  const [budgetAspireProof, setBudgetAspireProof] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Proof viewer states
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofPreview, setProofPreview] = useState(null);
  const [loadingProof, setLoadingProof] = useState(false);

  // Edit proof states
  const [showEditProofModal, setShowEditProofModal] = useState(false);
  const [selectedProofEdit, setSelectedProofEdit] = useState(null);
  const [editProofFile, setEditProofFile] = useState(null);
  const [editProofNotes, setEditProofNotes] = useState('');
  const [uploadingEditProof, setUploadingEditProof] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [paginatedRequests, setPaginatedRequests] = useState([]);

  // Initialize Super Admin status on mount
  useEffect(() => {
    const superAdminFlag = localStorage.getItem('is_super_admin') === 'true';
    setIsSuperAdmin(superAdminFlag);
    console.log('🔑 Super Admin status:', superAdminFlag);
  }, []);

  // Auto-refresh effect for filter changes
  useEffect(() => {
    fetchTransferRequests();
  }, [statusFilter, dateFilter]);

  // Auto-refresh polling - every 10 seconds for real-time updates (silent)
  useEffect(() => {
    fetchTransferRequests();
    
    const intervalId = setInterval(() => {
      fetchTransferRequests(true); // Silent refresh
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Status options for filters and modals
  const getStatusOptions = () => [
    { value: '', label: 'Semua Status', icon: Filter, color: 'text-gray-700' },
    { value: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-700' },
    { value: 'approved', label: 'Approved', icon: CheckCircle, color: 'text-green-700' },
    { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-700' },
    { value: 'completed', label: 'Completed', icon: CheckCheck, color: 'text-purple-700' },
    { value: 'failed', label: 'Failed', icon: AlertTriangle, color: 'text-gray-700' }
  ];

  const getModalStatusOptions = () => [
    { value: 'approved', label: 'Approve', icon: CheckCircle, color: 'text-green-700' },
    { value: 'rejected', label: 'Reject', icon: XCircle, color: 'text-red-700' }
  ];

  const getDateFilterOptions = () => [
    { value: 'all', label: 'Semua Tanggal', icon: Calendar, color: 'text-gray-700' },
    { value: 'today', label: 'Hari Ini', icon: Calendar, color: 'text-blue-700' },
    { value: 'week', label: '7 Hari Terakhir', icon: Calendar, color: 'text-green-700' },
    { value: 'month', label: '30 Hari Terakhir', icon: Calendar, color: 'text-purple-700' }
  ];

  const fetchTransferRequests = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const token = localStorage.getItem('admin_token');
      
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await axios.get(`${API}/api/admin/wallet-transfer-requests?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Check if currently viewing request has been force released
      if (selectedRequest && showDetailModal) {
        const updatedRequest = response.data.find(r => r.id === selectedRequest.id);
        if (updatedRequest) {
          const wasClaimedByMe = isClaimedByMe(selectedRequest);
          const stillClaimedByMe = updatedRequest.claimed_by_username === localStorage.getItem('admin_username');
          
          // If was claimed by me but not anymore, it was force released
          if (wasClaimedByMe && !stillClaimedByMe) {
            toast.error('⚠️ Request telah di-force release oleh Super Admin!', { duration: 5000 });
            setSelectedRequest(updatedRequest);
          } else {
            setSelectedRequest(updatedRequest);
          }
        }
      }
      
      setTransferRequests(response.data);
    } catch (error) {
      console.error('Error fetching transfer requests:', error);
      toast.error('Failed to fetch transfer requests');
    } finally {
      setLoading(false);
    }
  };

  const updateTransferRequestStatus = async () => {
    try {
      // SECURITY: Check if request is claimed by current admin
      if (!isClaimedByMe(selectedRequest)) {
        toast.error('❌ Anda harus claim request ini terlebih dahulu sebelum approve/reject!');
        return;
      }

      // Validate files if status is approved
      if (statusUpdate.status === 'approved') {
        if (!spendLimitProof || !budgetAspireProof) {
          toast.error('Kedua file wajib diupload untuk approve transfer request');
          return;
        }
      }

      setUploadingFiles(true);
      
      let spendLimitProofUrl = null;
      let budgetAspireProofUrl = null;
      
      // Upload files if approving
      if (statusUpdate.status === 'approved') {
        try {
          spendLimitProofUrl = await handleFileUpload(spendLimitProof, 'spend_limit_proof');
          budgetAspireProofUrl = await handleFileUpload(budgetAspireProof, 'budget_aspire_proof');
        } catch (uploadError) {
          toast.error('Gagal upload file bukti');
          setUploadingFiles(false);
          return;
        }
      }

      const token = localStorage.getItem('admin_token');
      
      const requestData = {
        status: statusUpdate.status,
        admin_notes: statusUpdate.admin_notes
      };

      // Add file URLs if approving
      if (statusUpdate.status === 'approved') {
        requestData.spend_limit_proof_path = spendLimitProofUrl;
        requestData.budget_aspire_proof_path = budgetAspireProofUrl;
      }
      
      await axios.put(`${API}/api/admin/wallet-transfer-requests/${selectedRequest.id}/status`, requestData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast.success(`Transfer request ${statusUpdate.status} successfully`);
      setShowStatusModal(false);
      setStatusUpdate({ status: '', admin_notes: '' });
      setSpendLimitProof(null);
      setBudgetAspireProof(null);
      fetchTransferRequests();
      
    } catch (error) {
      console.error('Error updating transfer request:', error);
      toast.error('Failed to update transfer request status');
    } finally {
      setUploadingFiles(false);
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
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

  // File upload handler
  const handleFileUpload = async (file, type) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(`${API}/api/admin/upload-proof`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.file_url;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const handleViewProof = async (transferId, proofType, proofName = 'Bukti') => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      toast.error('Sesi berakhir. Silakan login kembali.');
      return;
    }
    
    setLoadingProof(true);
    setShowProofModal(true);
    
    try {
      const response = await axios.get(
        `${API}/api/admin/wallet-transfers/${transferId}/proof/${proofType}`,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          responseType: 'blob',
          timeout: 30000
        }
      );

      const contentType = response.headers['content-type'];
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);

      setProofPreview({
        url: blobUrl,
        name: proofName,
        type: contentType
      });
    } catch (error) {
      console.error('Failed to load proof:', error);
      console.error('Error details:', error.response?.data, error.response?.status);
      toast.error(`Gagal memuat bukti: ${error.response?.status || 'Network error'}`);
      setShowProofModal(false);
    } finally {
      setLoadingProof(false);
    }
  };

  const handleDownloadProof = async (transferId, proofType, filename) => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      toast.error('Sesi berakhir. Silakan login kembali.');
      return;
    }
    
    try {
      const response = await axios.get(
        `${API}/api/admin/wallet-transfers/${transferId}/proof/${proofType}`,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          responseType: 'blob',
          timeout: 30000
        }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'proof.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Bukti berhasil didownload');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Gagal mendownload bukti');
    }
  };

  const handleEditProof = (transferId, targetAccountId, proofType) => {
    setSelectedProofEdit({
      transfer_id: transferId,
      target_account_id: targetAccountId,
      proof_type: proofType
    });
    setShowEditProofModal(true);
    setEditProofFile(null);
    setEditProofNotes('');
  };

  const handleSubmitEditProof = async () => {
    if (!editProofFile || !selectedProofEdit) {
      toast.error('Pilih file bukti baru');
      return;
    }

    const token = localStorage.getItem('admin_token');
    const formData = new FormData();
    formData.append('file', editProofFile);
    formData.append('notes', editProofNotes);
    formData.append('transfer_id', selectedProofEdit.transfer_id);
    formData.append('target_account_id', selectedProofEdit.target_account_id);
    formData.append('proof_type', selectedProofEdit.proof_type);

    try {
      setUploadingEditProof(true);
      
      const response = await axios.post(
        `${API}/api/admin/wallet-transfers/${selectedProofEdit.transfer_id}/edit-proof`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Request edit bukti berhasil dikirim. Menunggu approval super admin.');
      
      // Close edit modal
      setShowEditProofModal(false);
      setEditProofFile(null);
      setEditProofNotes('');
      const transferId = selectedProofEdit.transfer_id;
      setSelectedProofEdit(null);
      
      // Force refresh to get updated pending_edit status
      console.log('🔄 Refreshing transfer requests...');
      await fetchTransferRequests();
      
      // If detail modal is open, fetch fresh data
      if (selectedRequest && selectedRequest.id === transferId) {
        console.log('🔄 Fetching fresh data for detail modal...');
        try {
          const freshResponse = await axios.get(
            `${API}/api/admin/wallet-transfers`,
            { headers: { Authorization: `Bearer ${token}` }}
          );
          
          // Find the updated transfer
          const updatedTransfer = freshResponse.data.find(req => req.id === transferId);
          if (updatedTransfer) {
            console.log('✅ Detail modal updated with fresh data');
            setSelectedRequest(updatedTransfer);
          }
        } catch (err) {
          console.error('Failed to refresh detail modal:', err);
        }
      }
      
    } catch (error) {
      console.error('Failed to request proof edit:', error);
      toast.error(error.response?.data?.detail || 'Gagal mengirim request edit bukti');
    } finally {
      setUploadingEditProof(false);
    }
  };

  // Claim/Lock Request Handlers
  const handleClaimRequest = async (requestId) => {
    console.log('🔵 handleClaimRequest called for:', requestId);
    const success = await claimRequest(requestId);
    console.log('🔵 Claim result:', success);
    if (success) {
      console.log('🔵 Fetching requests after claim...');
      await fetchTransferRequests(true); // Silent refresh to avoid loading spinner
      console.log('🔵 Fetch completed');
    }
  };

  const handleReleaseRequest = async (requestId) => {
    const success = await releaseRequest(requestId);
    if (success) {
      await fetchTransferRequests(true); // Silent refresh to avoid loading spinner
    }
  };

  const handleForceRelease = async (requestId) => {
    setRequestToForceRelease(requestId);
    setShowForceReleaseModal(true);
  };

  const confirmForceRelease = async () => {
    if (!requestToForceRelease) return;
    
    const success = await forceReleaseRequest(requestToForceRelease);
    if (success) {
      await fetchTransferRequests(false);
      // Close modal if currently viewing this request
      if (selectedRequest && selectedRequest.id === requestToForceRelease) {
        setShowDetailModal(false);
        setSelectedRequest(null);
      }
    }
    
    setShowForceReleaseModal(false);
    setRequestToForceRelease(null);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-purple-100 text-purple-800 border-purple-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      failed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const statusIcons = {
      pending: Clock,
      processing: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      completed: CheckCheck,
      failed: AlertTriangle
    };

    const IconComponent = statusIcons[status] || Clock;
    const statusClass = statusStyles[status] || statusStyles.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusClass}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      console.log('formatDate input dateString:', dateString);
      // Parse the date string
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date:', dateString);
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

  // Filter requests based on search term, status, and date range - memoized
  const filteredRequests = useMemo(() => {
    return transferRequests.filter(request => {
      const matchesSearch = 
        request.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.account?.account_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "" || request.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter !== "all") {
        const requestDate = new Date(request.created_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (dateFilter) {
          case "today":
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            matchesDate = requestDate >= today && requestDate < tomorrow;
            break;
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            matchesDate = requestDate >= weekAgo;
            break;
          case "month":
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            matchesDate = requestDate >= monthAgo;
            break;
        }
      }
      
      // Custom date range filter
      let matchesDateRange = true;
      if (dateRange.startDate && dateRange.endDate) {
        const requestDate = new Date(request.created_at);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        matchesDateRange = requestDate >= startDate && requestDate <= endDate;
      }
      
      return matchesSearch && matchesStatus && matchesDate && matchesDateRange;
    });
  }, [transferRequests, searchTerm, statusFilter, dateFilter, dateRange]);

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
  }, [searchTerm, statusFilter, dateFilter, itemsPerPage]);

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
          <ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600 flex-shrink-0" />
          <span className="break-words">Manajemen Transfer Saldo</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 break-words">Kelola permintaan transfer saldo dari client ke akun iklan</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow mb-4 sm:mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Cari username, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 w-full text-sm border border-gray-300 rounded-lg shadow-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <CustomDropdown
            options={getStatusOptions()}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Filter Status"
            className="w-full"
          />

          <CustomDropdown
            options={getDateFilterOptions()}
            value={dateFilter}
            onChange={setDateFilter}
            placeholder="Filter Tanggal"
            className="w-full"
          />

          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="break-words">Total: {filteredRequests.length} permintaan</span>
          </div>
        </div>
        
        {/* Date Range Filter */}
        <DateRangeFilter onFilterChange={setDateRange} />
      </div>
      {/* Transfer Requests - Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200" style={{tableLayout: 'fixed'}}>
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{width: '100px'}}>
                  ID AKUN
                </th>
                <th className="px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{width: '180px'}}>
                  AKUN TARGET
                </th>
                <th className="px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{width: '150px'}}>
                  KLIEN
                </th>
                <th className="px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{width: '110px'}}>
                  <div className="flex justify-end pr-2">NOMINAL</div>
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{width: '100px'}}>
                  STATUS
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{width: '80px'}}>
                  TANGGAL
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{width: '180px'}}>
                  DIPROSES OLEH
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{width: '150px'}}>
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                      Loading transfer requests...
                    </div>
                  </td>
                </tr>
              ) : paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <p className="text-lg">Tidak ada permintaan transfer ditemukan</p>
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <td className="px-2 py-3" style={{width: '100px'}}>
                      <div 
                        className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => copyToClipboard(request.target_account?.account_id || 'N/A', 'Account ID')}
                        title={`Click to copy: ${request.target_account?.account_id || 'N/A'}`}
                      >
                        <span className="truncate block">
                          {request.target_account?.account_id ? 
                            (request.target_account.account_id.length > 8 ? 
                              request.target_account.account_id.substring(0, 8) + '...' : 
                              request.target_account.account_id
                            ) : 'N/A'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3" style={{width: '180px'}}>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-100">
                          {getPlatformIcon(request.target_account?.platform)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-gray-900 truncate" title={request.target_account?.name || request.target_account_name}>
                            {request.target_account?.name || request.target_account_name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 capitalize truncate">
                            {request.target_account?.platform || 'Unknown'} Ads
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3" style={{width: '150px'}}>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-900 truncate" title={request.user?.username}>
                          {request.user?.username}
                        </div>
                        <div className="text-xs text-gray-500 truncate" title={request.user?.email}>
                          {request.user?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3" style={{width: '110px'}}>
                      <div className="flex justify-end">
                        <div 
                          className="cursor-pointer hover:bg-green-50 px-2 py-1 rounded transition-colors"
                          onClick={() => copyToClipboard(request.amount.toString(), 'Nominal')}
                          title={`Click to copy: ${formatCurrency(request.amount, request.currency)}`}
                        >
                          <div className="text-xs font-bold text-gray-900">
                            {formatCurrency(request.amount, request.currency)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center" style={{width: '100px'}}>
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-2 py-3 text-center" style={{width: '80px'}}>
                      <div className="text-xs font-medium text-gray-700">
                        {new Date(request.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta' })}
                      </div>
                    </td>
                    <td className="px-2 py-3" style={{width: '180px'}}>
                      <div className="flex justify-center">
                        {/* Show claimed badge (orange) for pending/processing requests */}
                        {request.claimed_by && !['approved', 'rejected'].includes(request.status) ? (
                          <div className="inline-flex flex-col bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg px-2 py-1.5 w-full max-w-[170px]">
                            <div className="flex items-center gap-1">
                              <Lock className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                              <div className="text-xs font-bold text-yellow-700 truncate">
                                {request.claimed_by_username}
                              </div>
                            </div>
                            <div className="text-xs text-yellow-600 mt-0.5">
                              {formatDate(request.claimed_at)}
                            </div>
                          </div>
                        ) : request.verified_by ? (
                          <div className="inline-flex flex-col bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg px-2 py-1.5 w-full max-w-[170px]">
                            <div className="text-xs font-bold text-teal-700 truncate">
                              {request.verified_by.name || request.verified_by.username}
                            </div>
                            <div className="text-xs text-teal-600 mt-0.5">
                              {formatDate(request.verified_at)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3" style={{width: '150px'}}>
                      <div className="flex flex-col space-y-1">
                        {/* Proof In Review Badge */}
                        {(request.spend_limit_proof_pending_edit || request.budget_aspire_proof_pending_edit) && (
                          <div className="flex items-center justify-center space-x-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs font-medium text-yellow-700">
                            <svg className="h-3 w-3 animate-spin text-yellow-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="whitespace-nowrap">Proof In Review</span>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex items-center justify-center space-x-1">
                          {/* View Detail Button */}
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        
                        {/* Claim/Release/Force Release Buttons - Only for pending/processing requests */}
                        {(request.status === 'pending' || request.status === 'processing') && (
                          <>
                            {!request.claimed_by ? (
                              // Ambil button - request not claimed
                              <button
                                onClick={() => handleClaimRequest(request.id)}
                                className="text-purple-600 hover:text-purple-900 p-1 rounded transition-colors"
                                title="Ambil Request"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            ) : isClaimedByMe(request) ? (
                              // Release button - claimed by me
                              <button
                                onClick={() => handleReleaseRequest(request.id)}
                                className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                                title="Release Request"
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            ) : isSuperAdmin ? (
                              // Force Release button - claimed by someone else, only for super admin
                              <button
                                onClick={() => handleForceRelease(request.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                                title="Force Release (Super Admin)"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            ) : null}
                            
                            {/* Update Status button - only show if claimed by me */}
                            {isClaimedByMe(request) && (
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setStatusUpdate({ status: '', admin_notes: '' });
                                  setShowStatusModal(true);
                                }}
                                className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                                title="Update Status"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls for Desktop */}
      {filteredRequests.length > 0 && (
        <div className="hidden md:block bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-xl">
          <div className="flex items-center justify-between">
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
      )}

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 mb-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
            <div className="flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>Loading...</div>
          </div>
        ) : paginatedRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center text-gray-500 text-sm">Tidak ada data</div>
        ) : (
          paginatedRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <div className="flex items-start gap-3 mb-3 pb-3 border-b border-gray-200">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center"><User className="h-5 w-5 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 break-words">{request.user?.username}</div>
                  <div className="text-xs text-gray-500 break-all">{request.user?.email}</div>
                  {getStatusBadge(request.status)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-200">
                <div><div className="text-xs text-gray-500">Akun Target</div><div className="text-sm font-medium text-gray-900 break-words">{request.target_account?.name || request.target_account_name || 'N/A'}</div></div>
                <div><div className="text-xs text-gray-500">Nominal</div><div className="text-sm font-bold text-green-700">{formatCurrency(request.amount || 0, request.currency)}</div></div>
                <div><div className="text-xs text-gray-500">Tanggal</div><div className="text-xs text-gray-900">{formatDate(request.created_at)}</div></div>
                <div><div className="text-xs text-gray-500">ID Akun</div><div className="text-xs text-gray-900 break-all font-mono">{request.target_account?.account_id || 'N/A'}</div></div>
              </div>
              {request.claimed_by && !['verified', 'rejected'].includes(request.status) && (
                <div className="mb-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-2">
                  <div className="flex items-center gap-1"><Lock className="h-3 w-3 text-yellow-600 flex-shrink-0" /><div className="text-xs font-bold text-yellow-700 break-words">Diproses: {request.claimed_by_username}</div></div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {!request.claimed_by && ['pending', 'processing'].includes(request.status) && (
                  <button onClick={() => handleClaimRequest(request.id)} className="flex-1 min-w-[100px] flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"><Unlock className="h-3 w-3" /><span>Ambil</span></button>
                )}
                <button onClick={() => {
                  setSelectedRequest(request);
                  setShowDetailModal(true);
                }} disabled={isClaimedByOther(request) && !['approved', 'verified', 'rejected', 'cancelled'].includes(request.status)} className={`flex-1 min-w-[100px] flex items-center justify-center gap-1 px-3 py-2 rounded text-xs font-medium ${isClaimedByOther(request) && !['approved', 'verified', 'rejected', 'cancelled'].includes(request.status) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}><Eye className="h-3 w-3" /><span>Detail</span></button>
                {isClaimedByMe(request) && ['pending', 'processing'].includes(request.status) && (
                  <>
                    <button onClick={() => {
                      setSelectedRequest(request);
                      setStatusUpdate({ status: '', admin_notes: '' });
                      setShowStatusModal(true);
                    }} className="flex-1 min-w-[100px] flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-medium"><CheckCircle className="h-3 w-3" /><span>Proses</span></button>
                    <button onClick={() => handleReleaseRequest(request.id)} className="flex-1 min-w-[100px] flex items-center justify-center gap-1 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs font-medium"><Unlock className="h-3 w-3" /><span>Lepas</span></button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls for Mobile */}
      {filteredRequests.length > 0 && (
        <div className="md:hidden bg-white rounded-lg shadow p-4 mt-4">
          <div className="flex flex-col space-y-3">
            {/* Info & Items per page */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <p className="text-xs text-gray-600">
                Menampilkan{' '}
                <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>
                {' '}-{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredRequests.length)}
                </span>
                {' '}dari{' '}
                <span className="font-medium">{filteredRequests.length}</span>
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

            {/* Page Navigation */}
            <div className="flex items-center justify-center space-x-1">
              {/* Previous button */}
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              
              {/* Page numbers */}
              {(() => {
                const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
                const pages = [];
                const maxVisiblePages = 3; // Reduced for mobile
                
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
              
              {/* Next button */}
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
      )}

      {/* Transfer Request Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Sticky Header with Close Button */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between z-10 shadow-md">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <ArrowRightLeft className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Detail Transfer Request</h3>
                  <p className="text-blue-100 text-sm">ID: {selectedRequest.id.slice(0, 8)}...</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg p-2 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Akun Target - Modern Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Akun Target</h4>
                  {getPlatformIcon(selectedRequest.target_account?.platform)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      {getPlatformIcon(selectedRequest.target_account?.platform)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{selectedRequest.target_account?.name || selectedRequest.target_account_name}</p>
                      <p className="text-sm text-gray-600 capitalize">{selectedRequest.target_account?.platform} Ads</p>
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-70 px-3 py-2 rounded-lg">
                    <p className="text-xs text-gray-500">ID Akun Platform</p>
                    <p className="text-sm font-mono font-medium text-gray-800">{selectedRequest.target_account?.account_id || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Sumber Wallet & Rincian Keuangan - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sumber Wallet */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Sumber Wallet</h4>
                  <div className="bg-purple-100 border border-purple-300 px-4 py-3 rounded-lg text-center">
                    <p className="text-lg font-bold text-purple-900 capitalize">
                      {selectedRequest.source_wallet_type} Wallet
                    </p>
                  </div>
                </div>

                {/* Rincian Keuangan */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Rincian Keuangan</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Nominal:</span>
                      <span className="font-bold text-gray-900">{formatCurrency(selectedRequest.amount, selectedRequest.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Fee ({selectedRequest.target_account?.fee_percentage || 0}%):</span>
                      <span className="font-semibold text-orange-600">{formatCurrency(selectedRequest.fee || 0, selectedRequest.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t-2 border-green-300">
                      <span className="font-bold text-gray-900">Total:</span>
                      <span className="font-bold text-green-700 text-lg">{formatCurrency(selectedRequest.total || (selectedRequest.amount + (selectedRequest.fee || 0)), selectedRequest.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informasi Client */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-gray-700 mb-3">Informasi Client</h4>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-full">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{selectedRequest.user?.username}</p>
                    <p className="text-sm text-gray-600">{selectedRequest.user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Detail Permintaan */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-gray-700 mb-3">Detail Permintaan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Status:</span>
                    <div>{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Tanggal Permintaan:</span>
                    <span className="font-medium text-gray-900">{(() => {
                      const date = new Date(selectedRequest.created_at);
                      const formatted = date.toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        timeZone: 'Asia/Jakarta'
                      });
                      return formatted;
                    })()}</span>
                  </div>
                </div>
              </div>

                {/* Processed By - Only show if processed */}
                {(selectedRequest.status === 'approved' || selectedRequest.status === 'rejected') && selectedRequest.verified_by && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diproses Oleh
                    </label>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <User className="w-8 h-8 p-1.5 bg-blue-600 text-white rounded-full mr-3" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {selectedRequest.verified_by?.username || selectedRequest.verified_by?.name || 'Admin'}
                            </p>
                            <p className="text-xs text-gray-600">Admin</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Tanggal Proses:</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedRequest.processed_at ? (() => {
                              const date = new Date(selectedRequest.processed_at);
                              const formatted = date.toLocaleString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                                timeZone: 'Asia/Jakarta'
                              });
                              return formatted;
                            })() : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Uploaded Proofs - Only show if approved */}
                {selectedRequest.status === 'approved' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bukti Upload
                    </label>
                    {(selectedRequest.spend_limit_proof_url || selectedRequest.budget_aspire_proof_url) ? (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        {selectedRequest.spend_limit_proof_url && (
                          <div className="bg-blue-50 p-3 rounded space-y-2">
                            <span className="text-sm font-medium text-gray-700 block">Bukti Update Batas Pengeluaran</span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleViewProof(selectedRequest.id, 'spend_limit', 'Bukti Batas Pengeluaran')}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Lihat</span>
                              </button>
                              <button
                                onClick={() => handleDownloadProof(selectedRequest.id, 'spend_limit', `spend_limit_${selectedRequest.target_account_name}.jpg`)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs font-medium"
                              >
                                <Download className="h-3 w-3" />
                                <span>Download</span>
                              </button>
                              {selectedRequest.spend_limit_proof_pending_edit ? (
                                <div className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-100 border border-yellow-300 rounded text-xs font-medium text-yellow-800">
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  <span>In Review</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEditProof(selectedRequest.id, selectedRequest.target_account_id, 'spend_limit')}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs font-medium"
                                  title="Edit Bukti (Perlu Approval Super Admin)"
                                >
                                  <Edit className="h-3 w-3" />
                                  <span>Edit</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        {selectedRequest.budget_aspire_proof_url && (
                          <div className="bg-purple-50 p-3 rounded space-y-2">
                            <span className="text-sm font-medium text-gray-700 block">Bukti Update Budget Aspire</span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleViewProof(selectedRequest.id, 'budget_aspire', 'Bukti Budget Aspire')}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-medium"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Lihat</span>
                              </button>
                              <button
                                onClick={() => handleDownloadProof(selectedRequest.id, 'budget_aspire', `budget_aspire_${selectedRequest.target_account_name}.jpg`)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs font-medium"
                              >
                                <Download className="h-3 w-3" />
                                <span>Download</span>
                              </button>
                              {selectedRequest.budget_aspire_proof_pending_edit ? (
                                <div className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-100 border border-yellow-300 rounded text-xs font-medium text-yellow-800">
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  <span>In Review</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEditProof(selectedRequest.id, selectedRequest.target_account_id, 'budget_aspire')}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs font-medium"
                                  title="Edit Bukti (Perlu Approval Super Admin)"
                                >
                                  <Edit className="h-3 w-3" />
                                  <span>Edit</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-yellow-900">Tidak Ada Bukti Upload</p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Request ini di-approve tanpa upload bukti. Untuk menambahkan bukti, silakan reject request ini dan approve ulang dengan upload file.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Notes */}
                {selectedRequest.admin_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catatan Admin
                    </label>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-900">{selectedRequest.admin_notes}</p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Update Status Transfer</h3>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusUpdate({ status: '', admin_notes: '' });
                    setSpendLimitProof(null);
                    setBudgetAspireProof(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <CustomDropdown
                    options={getModalStatusOptions()}
                    value={statusUpdate.status}
                    onChange={(value) => setStatusUpdate({ ...statusUpdate, status: value })}
                    placeholder="Pilih status..."
                    className="w-full"
                  />
                </div>

                {/* File Upload Section - Only show when approving */}
                {statusUpdate.status === 'approved' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Building className="w-5 h-5 text-blue-600 mr-2" />
                      <h4 className="text-sm font-medium text-blue-800">Dokumen Wajib untuk Approve</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bukti Update Batas Pengeluaran Akun Iklan *
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setSpendLimitProof(e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {spendLimitProof && (
                          <p className="text-xs text-green-600 mt-1">✓ {spendLimitProof.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bukti Update Budget Aspire *
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setBudgetAspireProof(e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {budgetAspireProof && (
                          <p className="text-xs text-green-600 mt-1">✓ {budgetAspireProof.name}</p>
                        )}
                      </div>

                      {(!spendLimitProof || !budgetAspireProof) && (
                        <div className="bg-orange-50 border border-orange-200 rounded p-3">
                          <p className="text-xs text-orange-700">
                            ⚠️ Kedua file wajib diupload untuk approve transfer request
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Admin</label>
                  <textarea
                    value={statusUpdate.admin_notes}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, admin_notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tambahkan catatan (opsional)..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setStatusUpdate({ status: '', admin_notes: '' });
                      setSpendLimitProof(null);
                      setBudgetAspireProof(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={updateTransferRequestStatus}
                    disabled={
                      !statusUpdate.status || 
                      uploadingFiles ||
                      (statusUpdate.status === 'approved' && (!spendLimitProof || !budgetAspireProof))
                    }
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {uploadingFiles ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      'Update Status'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof Preview Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">{proofPreview?.name || 'Bukti'}</h3>
              <button
                onClick={() => {
                  setShowProofModal(false);
                  if (proofPreview?.url) {
                    URL.revokeObjectURL(proofPreview.url);
                  }
                  setProofPreview(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center" style={{ backgroundColor: loadingProof ? 'white' : '#f3f4f6' }}>
              {loadingProof ? (
                <div className="text-center">
                  {/* Modern 3-dot loading animation */}
                  <div className="flex items-center justify-center space-x-2 mb-6">
                    <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  {/* Pulse ring animation */}
                  <div className="relative inline-flex mb-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full opacity-75 animate-ping absolute"></div>
                    <div className="w-16 h-16 bg-blue-600 rounded-full opacity-50 animate-pulse"></div>
                  </div>
                  <p className="text-lg font-semibold text-gray-800 mb-2">Memuat Bukti</p>
                  <p className="text-sm text-gray-500">Mohon tunggu sebentar...</p>
                </div>
              ) : proofPreview ? (
                proofPreview.type === 'application/pdf' ? (
                  <iframe
                    src={proofPreview.url}
                    className="w-full h-full min-h-[600px]"
                    title="Proof PDF"
                  />
                ) : (
                  <img
                    src={proofPreview.url}
                    alt="Proof"
                    className="max-w-full max-h-full object-contain"
                  />
                )
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Edit Proof Modal */}
      {showEditProofModal && selectedProofEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center space-x-3">
                <Edit className="h-6 w-6" />
                <div>
                  <h3 className="text-xl font-bold">Edit Bukti</h3>
                  <p className="text-sm text-orange-100">
                    {selectedProofEdit.proof_type === 'spend_limit' ? 'Batas Pengeluaran' : 'Budget Aspire'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditProofModal(false);
                  setEditProofFile(null);
                  setEditProofNotes('');
                  setSelectedProofEdit(null);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Perlu Approval Super Admin</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Setelah Anda submit, bukti baru akan di-review oleh Super Admin sebelum disetujui.
                    </p>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Bukti Baru <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setEditProofFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {editProofFile && (
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="break-all">File terpilih: {editProofFile.name}</span>
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (Optional)
                </label>
                <textarea
                  value={editProofNotes}
                  onChange={(e) => setEditProofNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Masukkan alasan atau catatan untuk edit bukti..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowEditProofModal(false);
                  setEditProofFile(null);
                  setEditProofNotes('');
                  setSelectedProofEdit(null);
                }}
                disabled={uploadingEditProof}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEditProof}
                disabled={uploadingEditProof || !editProofFile}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {uploadingEditProof ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Release Modal */}
      {showForceReleaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="bg-red-600 text-white px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Force Release Request
                </h3>
                <button
                  onClick={() => {
                    setShowForceReleaseModal(false);
                    setRequestToForceRelease(null);
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                  Anda yakin ingin <span className="font-semibold text-red-600">force release</span> request ini?
                </p>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                  Request sedang dikerjakan oleh admin lain. Force release akan membatalkan klaim mereka dan membuat request tersedia untuk admin lain.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-800 ml-2">
                    <span className="font-semibold">Peringatan:</span> Tindakan ini hanya boleh digunakan dalam situasi darurat atau jika admin tidak responsif.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowForceReleaseModal(false);
                  setRequestToForceRelease(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmForceRelease}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium flex items-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Force Release</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferRequestManagement;