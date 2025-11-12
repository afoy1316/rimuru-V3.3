import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import { toast } from 'sonner';
import CustomDropdown from '../ui/CustomDropdown';
import DateRangeFilter from './DateRangeFilter';
import { 
  Wallet,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Clock,
  User,
  FileText,
  CreditCard,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';
import { useRequestClaim } from '../../hooks/useRequestClaim';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const WalletTopUpManagement = () => {
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [proofPreview, setProofPreview] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofFileType, setProofFileType] = useState('image'); // 'image' or 'pdf'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [cancelRetry, setCancelRetry] = useState(false);
  
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
  } = useRequestClaim('wallet_topup');

  // Add global style for hiding scrollbar
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [paginatedRequests, setPaginatedRequests] = useState([]);

  useEffect(() => {
    fetchRequests(); // Initial fetch
    
    // Auto-refresh every 10 seconds for real-time updates (silent)
    const intervalId = setInterval(() => {
      fetchRequests(true); // Silent auto-refresh
    }, 10000); // 10 seconds
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Check if current user is super admin
  useEffect(() => {
    const isSuperAdminFlag = localStorage.getItem('is_super_admin');
    setIsSuperAdmin(isSuperAdminFlag === 'true');
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, dateRange]);

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
  }, [searchTerm, statusFilter, itemsPerPage, dateRange]);

  const fetchRequests = async (silent = false) => {
    const token = localStorage.getItem('admin_token');
    try {
      if (!silent) {
        setLoading(true);
      }
      
      const response = await axios.get(`${API}/api/admin/wallet-topup-requests`, {
        headers: { Authorization: `Bearer ${token}` }
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
      
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch wallet top-up requests:', error);
      toast.error('Gagal memuat permintaan top-up wallet');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.reference_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(req => {
        const requestDate = new Date(req.created_at);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        return requestDate >= startDate && requestDate <= endDate;
      });
    }

    setFilteredRequests(filtered);
  };

  const handleViewDetail = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setShowDetailModal(true);
  };

  const handleApprove = async () => {
    setConfirmAction('approve');
    setShowConfirmModal(true);
  };

  const confirmApprove = async () => {
    setShowConfirmModal(false);
    
    const token = localStorage.getItem('admin_token');
    try {
      setActionLoading(true);
      await axios.put(
        `${API}/api/admin/wallet-topup-requests/${selectedRequest.id}/status`,
        {
          status: 'verified',
          admin_notes: adminNotes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Permintaan top-up berhasil disetujui');
      setShowDetailModal(false);
      fetchRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error(error.response?.data?.detail || 'Gagal menyetujui permintaan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      toast.error('Mohon berikan alasan penolakan');
      return;
    }

    setConfirmAction('reject');
    setShowConfirmModal(true);
  };

  const confirmReject = async () => {
    setShowConfirmModal(false);
    
    const token = localStorage.getItem('admin_token');
    try {
      setActionLoading(true);
      await axios.put(
        `${API}/api/admin/wallet-topup-requests/${selectedRequest.id}/status`,
        {
          status: 'rejected',
          admin_notes: adminNotes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Permintaan top-up berhasil ditolak');
      setShowDetailModal(false);
      fetchRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error(error.response?.data?.detail || 'Gagal menolak permintaan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewProof = async (requestId, retryCount = 0) => {
    const token = localStorage.getItem('admin_token');
    const maxRetries = 15; // Auto retry up to 15 times
    
    // Validation - only show critical errors
    if (!token) {
      toast.error('Sesi berakhir. Silakan login kembali.');
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 1500);
      return;
    }
    
    if (!requestId) {
      return; // Silent fail for invalid ID
    }
    
    const fullUrl = `${API}/api/admin/wallet-topup-requests/${requestId}/payment-proof?t=${Date.now()}`;
    
    if (retryCount === 0) {
      console.log('🔍 Viewing proof:', {
        requestId,
        url: fullUrl
      });
    } else {
      console.log(`🔄 Retry attempt ${retryCount}/${maxRetries}`);
    }
    
    try {
      setLoadingProof(true);
      
      const response = await axios.get(fullUrl, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        responseType: 'blob',
        timeout: 30000,
        validateStatus: (status) => status < 500
      });
      
      // Check status - retry on 404 if under max retries
      if (response.status === 404) {
        if (retryCount < maxRetries) {
          console.log(`⏳ Got 404, retrying in ${(retryCount + 1) * 500}ms...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 500)); // Exponential backoff
          return handleViewProof(requestId, retryCount + 1); // Recursive retry
        } else {
          console.error('❌ Max retries reached - File not found');
          setLoadingProof(false);
          toast.error('Bukti tidak ditemukan. Silakan refresh halaman dan coba lagi.');
          return;
        }
      }
      
      if (response.status !== 200) {
        console.error('❌ Non-200 status:', response.status);
        setLoadingProof(false);
        toast.error('Gagal memuat bukti. Silakan coba lagi.');
        return;
      }
      
      // SUCCESS! Detect file type from response
      const contentType = response.headers['content-type'] || '';
      const isPdf = contentType.includes('pdf') || response.data.type === 'application/pdf';
      
      console.log(`✅ Proof loaded successfully${retryCount > 0 ? ` (after ${retryCount} retries)` : ''}:`, {
        contentType,
        size: response.data.size,
        isPdf
      });
      
      // Create blob URL for preview
      const blobType = isPdf ? 'application/pdf' : 'image/jpeg';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: blobType }));
      
      setProofFileType(isPdf ? 'pdf' : 'image');
      setProofPreview(url);
      setShowProofModal(true);
      setLoadingProof(false);
      
      // No toast - smooth modal opening
    } catch (error) {
      console.error('❌ Failed to view proof:', error);
      
      // Retry on network errors or 404
      if (retryCount < maxRetries && (error.response?.status === 404 || error.code === 'ERR_NETWORK')) {
        console.log(`⏳ Error occurred, retrying in ${(retryCount + 1) * 500}ms...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 500));
        return handleViewProof(requestId, retryCount + 1);
      }
      
      setLoadingProof(false);
      
      // Only show error for authentication or after max retries
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Sesi berakhir. Silakan login kembali.');
        localStorage.removeItem('admin_token');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1500);
        return;
      }
      
      // Show error only after all retries exhausted
      if (retryCount >= maxRetries) {
        toast.error('Gagal memuat bukti setelah beberapa percobaan. Silakan refresh halaman.');
      }
      
      console.error('Error details:', {
        status: error.response?.status,
        message: error.message,
        retries: retryCount
      });
    }
  };

  const handleDownloadProof = async (requestId, retryCount = 0) => {
    const token = localStorage.getItem('admin_token');
    const maxRetries = 15;
    
    if (!token) {
      toast.error('Sesi berakhir. Silakan login kembali.');
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 1500);
      return;
    }
    
    try {
      setLoadingProof(true);
      
      const response = await axios.get(
        `${API}/api/admin/wallet-topup-requests/${requestId}/payment-proof`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          responseType: 'blob',
          timeout: 30000,
          validateStatus: (status) => status < 500
        }
      );
      
      // Retry on 404
      if (response.status === 404) {
        if (retryCount < maxRetries) {
          console.log(`⏳ Download: Got 404, retrying ${retryCount + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 500));
          return handleDownloadProof(requestId, retryCount + 1);
        } else {
          setLoadingProof(false);
          toast.error('Bukti tidak ditemukan. Silakan refresh halaman.');
          return;
        }
      }
      
      if (response.status !== 200) {
        setLoadingProof(false);
        toast.error('Gagal mengunduh bukti.');
        return;
      }
      
      // SUCCESS! Download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Detect file extension from content-type
      const contentType = response.headers['content-type'] || '';
      const extension = contentType.includes('pdf') ? 'pdf' : 'jpg';
      link.setAttribute('download', `wallet_topup_proof_${requestId}.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setLoadingProof(false);
      console.log(`✅ Download successful${retryCount > 0 ? ` (after ${retryCount} retries)` : ''}`);
      // No toast - download starts automatically
    } catch (error) {
      console.error('Failed to download proof:', error);
      
      // Retry on network errors or 404
      if (retryCount < maxRetries && (error.response?.status === 404 || error.code === 'ERR_NETWORK')) {
        console.log(`⏳ Download error, retrying ${retryCount + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 500));
        return handleDownloadProof(requestId, retryCount + 1);
      }
      
      setLoadingProof(false);
      toast.error('Gagal mendownload bukti');
    }
  };

  const handleClaimRequest = async (requestId) => {
    const success = await claimRequest(requestId);
    if (success) {
      await fetchRequests(false);
    }
  };

  const handleReleaseRequest = async (requestId) => {
    const success = await releaseRequest(requestId);
    if (success) {
      await fetchRequests(false);
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
      await fetchRequests(false);
      if (selectedRequest && selectedRequest.id === requestToForceRelease) {
        setShowDetailModal(false);
        setSelectedRequest(null);
      }
    }
    
    setShowForceReleaseModal(false);
    setRequestToForceRelease(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu' },
      proof_uploaded: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Bukti Diunggah' },
      processing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Sedang Diproses' },
      verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Disetujui' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Dibatalkan' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

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

  const formatPaymentMethod = (method) => {
    if (!method) return '-';
    
    // Format payment method display
    const methodMap = {
      'bank_bca': 'Bank BCA',
      'bank_bri': 'Bank BRI',
      'bank_mandiri': 'Bank Mandiri',
      'bank_bni': 'Bank BNI',
      'bank_cimb': 'Bank CIMB Niaga',
      'bank_permata': 'Bank Permata',
      'usdt_trc20': 'USDT (TRC20)',
      'usdt_erc20': 'USDT (ERC20)',
      'crypto': 'Cryptocurrency',
      'other': 'Lainnya'
    };
    
    return methodMap[method] || method.replace(/_/g, ' ').toUpperCase();
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredRequests.length);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-1 rounded ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }

    // Desktop Pagination
    const desktopPagination = (
      <div className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Menampilkan {startIndex} - {endIndex} dari {filteredRequests.length} data
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="ml-4 border border-gray-300 rounded px-2 py-1"
          >
            <option value={10}>10 per halaman</option>
            <option value={25}>25 per halaman</option>
            <option value={50}>50 per halaman</option>
            <option value={100}>100 per halaman</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ««
          </button>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            «
          </button>
          
          {pages}
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            »
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            »»
          </button>
        </div>
      </div>
    );

    // Mobile Pagination
    const mobilePages = [];
    const maxMobilePages = 3;
    let mobileStartPage = Math.max(1, currentPage - Math.floor(maxMobilePages / 2));
    let mobileEndPage = Math.min(totalPages, mobileStartPage + maxMobilePages - 1);

    if (mobileEndPage - mobileStartPage + 1 < maxMobilePages) {
      mobileStartPage = Math.max(1, mobileEndPage - maxMobilePages + 1);
    }

    for (let i = mobileStartPage; i <= mobileEndPage; i++) {
      mobilePages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
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

    const mobilePagination = (
      <div className="md:hidden bg-white rounded-lg shadow p-4 mt-4">
        <div className="flex flex-col space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <p className="text-xs text-gray-600">
              Menampilkan {startIndex} - {endIndex} dari {filteredRequests.length}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">Per halaman:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            
            {mobilePages}
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    );

    return (
      <>
        {desktopPagination}
        {mobilePagination}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center">
              <Wallet className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
              <span className="break-words">Wallet Top Up Management</span>
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 break-words">
              Kelola dan proses permintaan top-up wallet dari client
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
            <input
              type="text"
              placeholder="Cari username, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg shadow-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <CustomDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'pending', label: 'Menunggu' },
              { value: 'proof_uploaded', label: 'Bukti Diunggah' },
              { value: 'verified', label: 'Disetujui' },
              { value: 'rejected', label: 'Ditolak' }
            ]}
            placeholder="Semua Status"
            className="w-full"
          />
        </div>
        
        {/* Date Range Filter */}
        <DateRangeFilter onFilterChange={setDateRange} />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center text-gray-500 text-sm">
            Tidak ada data
          </div>
        ) : (
          paginatedRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
              {/* User Info */}
              <div className="flex items-start gap-3 mb-3 pb-3 border-b border-gray-200">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 break-words">
                    {request.user?.username}
                  </div>
                  <div className="text-xs text-gray-500 break-all">
                    {request.user?.email}
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-200">
                <div>
                  <div className="text-xs text-gray-500">Wallet</div>
                  <div className="text-sm font-medium text-gray-900">
                    {request.wallet_type === 'main' ? 'Main' : 'Withdrawal'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Jumlah</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(request.amount, request.currency)}
                  </div>
                  {request.currency === 'IDR' && request.unique_code && (
                    <div className="text-xs text-gray-500">+{request.unique_code}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500">Metode</div>
                  <div className="text-xs text-gray-900 break-words">
                    {formatPaymentMethod(request.payment_method)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Tanggal</div>
                  <div className="text-xs text-gray-900">
                    {formatDate(request.created_at)}
                  </div>
                </div>
              </div>

              {/* Claimed/Verified By */}
              {request.claimed_by && !['verified', 'rejected', 'completed'].includes(request.status) ? (
                <div className="mb-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-2">
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                    <div className="text-xs font-bold text-yellow-700 break-words">
                      Diproses: {request.claimed_by_username}
                    </div>
                  </div>
                  <div className="text-xs text-yellow-600 mt-0.5">
                    {formatDate(request.claimed_at)}
                  </div>
                </div>
              ) : (request.status === 'verified' || request.status === 'rejected') && request.verified_by ? (
                <div className="mb-3 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-2">
                  <div className="text-xs font-bold text-teal-700 break-words">
                    Diverifikasi: {request.verified_by.name || request.verified_by.username}
                  </div>
                  <div className="text-xs text-teal-600 mt-0.5">
                    {formatDate(request.verified_at)}
                  </div>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {/* Claim Button */}
                {!request.claimed_by && ['proof_uploaded', 'processing'].includes(request.status) && (
                  <button
                    onClick={() => handleClaimRequest(request.id)}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                  >
                    <Unlock className="h-3 w-3" />
                    <span>Ambil</span>
                  </button>
                )}
                
                {/* View Detail Button */}
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowDetailModal(true);
                    setAdminNotes(request.admin_notes || '');
                  }}
                  disabled={isClaimedByOther(request) && !['verified', 'rejected', 'cancelled', 'completed'].includes(request.status)}
                  className={`flex-1 min-w-[100px] flex items-center justify-center gap-1 px-3 py-2 rounded text-xs font-medium ${
                    isClaimedByOther(request) && !['verified', 'rejected', 'cancelled', 'completed'].includes(request.status)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  <span>Detail</span>
                </button>

                {/* Release Button */}
                {isClaimedByMe(request) && !['verified', 'rejected', 'completed'].includes(request.status) && (
                  <button
                    onClick={() => handleReleaseRequest(request.id)}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs font-medium"
                  >
                    <Unlock className="h-3 w-3" />
                    <span>Lepas</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Requests Table - Desktop Only */}
      <div className="hidden md:block bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Wallet
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Jumlah
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Metode
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Tanggal
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Diproses Oleh
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-3 text-center text-sm text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="max-w-[120px]">
                        <div className="text-xs font-medium text-gray-900 truncate">
                          {request.user?.username}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {request.user?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        {request.wallet_type === 'main' ? 'Main' : 'Withdrawal'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-medium text-gray-900">
                        {formatCurrency(request.amount, request.currency)}
                      </div>
                      {request.currency === 'IDR' && request.unique_code && (
                        <div className="text-xs text-gray-500">
                          +{request.unique_code}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        {formatPaymentMethod(request.payment_method)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-500 max-w-[100px]">
                        {formatDate(request.created_at)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {/* Show who is processing (claimed) for pending/proof_uploaded */}
                      {request.claimed_by && !['verified', 'rejected', 'completed'].includes(request.status) ? (
                        <div className="inline-flex flex-col bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg px-3 py-2 max-w-[140px]">
                          <div className="flex items-center gap-1">
                            <Lock className="h-3 w-3 text-yellow-600" />
                            <div className="text-xs font-bold text-yellow-700 truncate">
                              {request.claimed_by_username}
                            </div>
                          </div>
                          <div className="text-xs text-yellow-600 mt-0.5">
                            {formatDate(request.claimed_at)}
                          </div>
                        </div>
                      ) : (request.status === 'verified' || request.status === 'rejected') && request.verified_by ? (
                        <div className="inline-flex flex-col bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg px-3 py-2 max-w-[140px]">
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
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col space-y-1">
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-1">
                          {/* Claim Button - Only show for proof_uploaded or processing status */}
                          {!request.claimed_by && ['proof_uploaded', 'processing'].includes(request.status) && (
                            <button
                              onClick={() => handleClaimRequest(request.id)}
                              className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                            >
                              <Unlock className="h-3 w-3" />
                              <span>Ambil</span>
                            </button>
                          )}
                          
                          {/* Disabled Claim Button for Cancelled Status */}
                          {!request.claimed_by && request.status === 'cancelled' && (
                            <button
                              disabled
                              className="flex items-center space-x-1 px-2 py-1 bg-gray-300 text-gray-500 rounded cursor-not-allowed text-xs font-medium"
                              title="Request sudah dibatalkan"
                            >
                              <Unlock className="h-3 w-3" />
                              <span>Ambil</span>
                            </button>
                          )}
                          
                          {/* View Detail Button - Disabled only if claimed by other AND not yet completed */}
                          <button
                            onClick={() => !isClaimedByOther(request) || ['verified', 'rejected', 'completed'].includes(request.status) ? handleViewDetail(request) : null}
                            disabled={isClaimedByOther(request) && !['verified', 'rejected', 'completed'].includes(request.status)}
                            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                              isClaimedByOther(request) && !['verified', 'rejected', 'completed'].includes(request.status)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                            title={
                              isClaimedByOther(request) && !['verified', 'rejected', 'completed'].includes(request.status)
                                ? 'Request sedang dikerjakan admin lain' 
                                : 'Lihat Detail'
                            }
                          >
                            <Eye className="h-3 w-3" />
                            <span>Detail</span>
                          </button>
                          
                          {/* Release Button */}
                          {isClaimedByMe(request) && !['verified', 'rejected', 'completed'].includes(request.status) && (
                            <button
                              onClick={() => handleReleaseRequest(request.id)}
                              className="flex items-center space-x-1 px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs font-medium"
                            >
                              <Unlock className="h-3 w-3" />
                              <span>Release</span>
                            </button>
                          )}
                          
                          {/* Force Release Button - Super Admin Only */}
                          {isSuperAdmin && request.claimed_by && !['verified', 'rejected', 'completed'].includes(request.status) && (
                            <button
                              onClick={() => handleForceRelease(request.id)}
                              className="flex items-center space-x-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
                              title="Force Release (Super Admin Only)"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              <span>Force</span>
                            </button>
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

      {/* Pagination - Outside desktop/mobile divs so both can render */}
      {filteredRequests.length > 0 && renderPagination()}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto hide-scrollbar" style={{
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none'  /* IE and Edge */
          }}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center">
                  <Wallet className="h-6 w-6 mr-2" />
                  Detail Permintaan Top-Up
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Warning if claimed by other admin AND still pending */}
              {isClaimedByOther(selectedRequest) && !['verified', 'rejected', 'completed'].includes(selectedRequest.status) && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900">
                        ⚠️ Request Sedang Dikerjakan Admin Lain
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Request ini sedang dikerjakan oleh <strong>{selectedRequest.claimed_by_username}</strong> sejak {getClaimTimeElapsed(selectedRequest.claimed_at)}.
                        Anda tidak dapat melakukan approve/reject pada request ini.
                      </p>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleForceRelease(selectedRequest.id)}
                          className="mt-2 flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          <span>Force Release Request Ini</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Client Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Informasi Client
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="text-sm font-medium text-gray-900">{selectedRequest.user?.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{selectedRequest.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nama</p>
                    <p className="text-sm font-medium text-gray-900">{selectedRequest.user?.name || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Top-Up Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                  Rincian Top-Up
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Reference Code</p>
                    <p className="text-sm font-medium text-gray-900">{selectedRequest.reference_code || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Wallet Type</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedRequest.wallet_type === 'main' ? 'Main Wallet' : 'Withdrawal Wallet'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mata Uang</p>
                    <p className="text-sm font-medium text-gray-900">{selectedRequest.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Jumlah</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(selectedRequest.amount, selectedRequest.currency)}
                    </p>
                  </div>
                  {selectedRequest.currency === 'IDR' && selectedRequest.unique_code && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Kode Unik</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRequest.unique_code}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Transfer</p>
                        <p className="text-sm font-bold text-blue-600">
                          {formatCurrency(selectedRequest.total_with_unique_code, selectedRequest.currency)}
                        </p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Metode Pembayaran</p>
                    <p className="text-sm font-medium text-gray-900">{formatPaymentMethod(selectedRequest.payment_method)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div>{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                </div>

                {/* Bank/Wallet Details */}
                {selectedRequest.bank_name && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-2">Detail Transfer Bank:</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Bank</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRequest.bank_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Nomor Rekening</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRequest.bank_account}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Nama Pemilik</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRequest.bank_holder}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.wallet_address && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-2">Detail Wallet Crypto:</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Wallet Name</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRequest.wallet_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Network</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRequest.network}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Wallet Address</p>
                        <p className="text-sm font-medium text-gray-900 break-all">{selectedRequest.wallet_address}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">Catatan Client</p>
                    <p className="text-sm text-gray-900">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>

              {/* Payment Proof */}
              {selectedRequest.payment_proof && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Bukti Transfer
                  </h3>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleViewProof(selectedRequest.id)}
                      disabled={loadingProof}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loadingProof ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          <span>Lihat Bukti</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDownloadProof(selectedRequest.id)}
                      disabled={loadingProof}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loadingProof ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Processed By Detail - Show for verified/rejected */}
              {(selectedRequest.status === 'verified' || selectedRequest.status === 'rejected') && selectedRequest.verified_by && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Diproses Oleh</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Admin</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedRequest.verified_by.name || selectedRequest.verified_by.username}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Waktu</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(selectedRequest.verified_at)}
                      </p>
                    </div>
                  </div>
                  {selectedRequest.admin_notes && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500">Catatan Admin</p>
                      <p className="text-sm text-gray-900">{selectedRequest.admin_notes}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Action Section - Only show for pending/proof_uploaded/processing requests */}
              {(selectedRequest.status === 'pending' || selectedRequest.status === 'proof_uploaded' || selectedRequest.status === 'processing') && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tindakan Admin</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catatan Admin (Opsional untuk Approve, Wajib untuk Reject)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan catatan..."
                      />
                    </div>
                    
                    {/* Warning jika belum claim */}
                    {!isClaimedByMe(selectedRequest) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-yellow-900">Request Belum Diklaim</p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Anda harus klik tombol "Ambil" terlebih dahulu sebelum bisa approve/reject request ini.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-4">
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading || !isClaimedByMe(selectedRequest)}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title={!isClaimedByMe(selectedRequest) ? 'Klik "Ambil" terlebih dahulu' : 'Approve request'}
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span>{actionLoading ? 'Processing...' : 'Setujui'}</span>
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={actionLoading || !isClaimedByMe(selectedRequest)}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title={!isClaimedByMe(selectedRequest) ? 'Klik "Ambil" terlebih dahulu' : 'Reject request'}
                      >
                        <XCircle className="h-5 w-5" />
                        <span>{actionLoading ? 'Processing...' : 'Tolak'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Preview Modal */}
      {showProofModal && proofPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full bg-white rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-100 border-b">
              <div>
                <h3 className="text-lg font-semibold">Bukti Transfer</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {proofFileType === 'pdf' ? 'Format: PDF' : 'Format: Image (JPG/PNG)'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowProofModal(false);
                  setProofPreview(null);
                  window.URL.revokeObjectURL(proofPreview);
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            {/* Content - Image or PDF */}
            <div className="p-4 max-h-[80vh] overflow-auto bg-gray-50">
              {proofFileType === 'pdf' ? (
                <div className="w-full" style={{ height: '70vh' }}>
                  <iframe
                    src={proofPreview}
                    className="w-full h-full border-0 rounded"
                    title="Bukti Transfer PDF"
                  />
                </div>
              ) : (
                <img 
                  src={proofPreview} 
                  alt="Bukti Transfer" 
                  className="w-full h-auto rounded"
                />
              )}
            </div>
            
            {/* Footer with Download button */}
            <div className="p-4 bg-gray-100 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowProofModal(false);
                  setProofPreview(null);
                  window.URL.revokeObjectURL(proofPreview);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                Tutup
              </button>
              <button
                onClick={() => handleDownloadProof(selectedRequest.id)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirmModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className={`p-6 ${confirmAction === 'approve' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'} text-white`}>
              <div className="flex items-center space-x-3">
                {confirmAction === 'approve' ? (
                  <CheckCircle className="h-8 w-8" />
                ) : (
                  <XCircle className="h-8 w-8" />
                )}
                <div>
                  <h3 className="text-xl font-bold">
                    {confirmAction === 'approve' ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan'}
                  </h3>
                  <p className="text-sm text-white/90 mt-1">
                    {confirmAction === 'approve' ? 'Verifikasi detail sebelum menyetujui' : 'Pastikan Anda ingin menolak permintaan ini'}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Client:</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedRequest.user?.username}</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Wallet Type:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedRequest.wallet_type === 'main' ? 'Main Wallet' : 'Withdrawal Wallet'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Mata Uang:</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedRequest.currency}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Jumlah:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(selectedRequest.amount, selectedRequest.currency)}
                  </span>
                </div>
                
                {selectedRequest.unique_code && selectedRequest.currency === 'IDR' && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Total Transfer:</span>
                    <span className="text-base font-bold text-green-600">
                      {formatCurrency(selectedRequest.total_with_unique_code, selectedRequest.currency)}
                    </span>
                  </div>
                )}
              </div>

              <div className={`p-4 rounded-lg ${confirmAction === 'approve' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className="text-sm text-gray-700">
                  {confirmAction === 'approve' ? (
                    <>
                      <span className="font-semibold">Perhatian:</span> Setelah disetujui, saldo <span className="font-bold">{formatCurrency(selectedRequest.amount, selectedRequest.currency)}</span> akan <span className="font-bold text-green-700">ditambahkan ke {selectedRequest.wallet_type === 'main' ? 'Main Wallet' : 'Withdrawal Wallet'} {selectedRequest.currency}</span> milik client.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">Perhatian:</span> Setelah ditolak, permintaan top-up ini akan dibatalkan dan <span className="font-bold text-red-700">tidak ada saldo yang ditambahkan</span> ke wallet client.
                    </>
                  )}
                </p>
              </div>

              {adminNotes && confirmAction === 'reject' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 mb-1">Alasan Penolakan:</p>
                  <p className="text-sm text-gray-800">{adminNotes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmAction === 'approve' ? confirmApprove : confirmReject}
                disabled={actionLoading}
                className={`flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors ${
                  confirmAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                {actionLoading ? 'Processing...' : confirmAction === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Release Confirmation Modal */}
      {showForceReleaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-xl font-bold">Force Release Request</h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Peringatan</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Anda akan men-force release request ini dari admin yang sedang mengerjakannya. 
                      Admin tersebut akan menerima notifikasi.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 text-sm">
                Apakah Anda yakin ingin force release request ini?
              </p>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowForceReleaseModal(false);
                  setRequestToForceRelease(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmForceRelease}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Ya, Force Release</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletTopUpManagement;
