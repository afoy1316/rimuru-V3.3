import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import { toast } from 'sonner';
import CustomDropdown from '../ui/CustomDropdown';
import DateRangeFilter from './DateRangeFilter';
import { 
  DollarSign,
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
  Upload,
  X,
  Edit,
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';
import { useRequestClaim } from '../../hooks/useRequestClaim';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const AdAccountTopUpManagement = () => {
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
  const [proofFileType, setProofFileType] = useState('image');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [uploadingProofs, setUploadingProofs] = useState({});
  
  // Edit Proof states
  const [showEditProofModal, setShowEditProofModal] = useState(false);
  const [editProofFile, setEditProofFile] = useState(null);
  const [editProofNotes, setEditProofNotes] = useState('');
  
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
  } = useRequestClaim('topup_request');
  const [uploadingEditProof, setUploadingEditProof] = useState(false);
  const [selectedProofEdit, setSelectedProofEdit] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [paginatedRequests, setPaginatedRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
    
    // Auto-refresh every 10 seconds for real-time updates (silent)
    const intervalId = setInterval(() => {
      fetchRequests(true); // Silent refresh
    }, 10000); // 10 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Check if current user is super admin
  useEffect(() => {
    const adminRole = localStorage.getItem('admin_role');
    const isSuperAdminFlag = localStorage.getItem('is_super_admin');
    console.log('🔵 Checking super admin status...');
    console.log('🔵 admin_role from localStorage:', adminRole);
    console.log('🔵 is_super_admin from localStorage:', isSuperAdminFlag);
    
    // Use is_super_admin flag directly
    const isSuper = isSuperAdminFlag === 'true';
    console.log('🔵 Setting isSuperAdmin to:', isSuper);
    setIsSuperAdmin(isSuper);
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, dateRange]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredRequests.slice(startIndex, endIndex);
    setPaginatedRequests(paginated);
  }, [filteredRequests, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage, dateRange]);

  const fetchRequests = async (silent = false) => {
    const token = localStorage.getItem('admin_token');
    try {
      if (!silent) {
        setLoading(true);
      }
      
      const response = await axios.get(`${API}/api/admin/payments`, {
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
      console.error('Failed to fetch account top-up requests:', error);
      toast.error('Gagal memuat permintaan top-up akun');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.reference_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.account_name?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleUploadProof = async (accountId, proofType, file) => {
    if (!file) return;

    const uploadKey = `${accountId}-${proofType}`;
    setUploadingProofs(prev => ({ ...prev, [uploadKey]: true }));

    const token = localStorage.getItem('admin_token');
    const formData = new FormData();
    formData.append('account_id', accountId);
    formData.append('proof_type', proofType);
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${API}/api/admin/payments/${selectedRequest.id}/upload-account-proof`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success(`Bukti ${proofType === 'spend_limit_proof' ? 'Batas Pengeluaran' : 'Budget Aspire'} berhasil diupload`);
        
        // Update selectedRequest with new proof URL
        const updatedAccounts = selectedRequest.accounts.map(acc => {
          if (acc.account_id === accountId) {
            return {
              ...acc,
              [`${proofType}_url`]: response.data.file_path
            };
          }
          return acc;
        });
        
        setSelectedRequest({
          ...selectedRequest,
          accounts: updatedAccounts
        });
        
        // Refresh requests list
        fetchRequests(true);
      }
    } catch (error) {
      console.error('Upload proof failed:', error);
      toast.error(error.response?.data?.detail || 'Gagal mengupload bukti');
    } finally {
      setUploadingProofs(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleViewProof = async (proofUrl, proofName = 'Bukti') => {
    setLoadingProof(true);
    setShowProofModal(true);
    
    const token = localStorage.getItem('admin_token');
    try {
      // Handle both old format (uploads/...) and new format (/files/...)
      const fileUrl = proofUrl.startsWith('/') ? proofUrl : `/${proofUrl}`;
      
      const response = await axios.get(`${API}${fileUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const contentType = response.headers['content-type'];
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);

      setProofPreview({
        url: blobUrl,
        name: proofName,
        type: contentType
      });

      if (contentType === 'application/pdf') {
        setProofFileType('pdf');
      } else {
        setProofFileType('image');
      }
    } catch (error) {
      console.error('Failed to load proof:', error);
      toast.error('Gagal memuat bukti');
      setShowProofModal(false);
    } finally {
      setLoadingProof(false);
    }
  };

  const handleDownloadProof = async (proofUrl, filename) => {
    const token = localStorage.getItem('admin_token');
    try {
      const fileUrl = proofUrl.startsWith('/') ? proofUrl : `/${proofUrl}`;
      
      const response = await axios.get(`${API}${fileUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

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

  const handleViewClientPaymentProof = async (requestId) => {
    setLoadingProof(true);
    setShowProofModal(true);

    const token = localStorage.getItem('admin_token');
    try {
      // Add cache busting parameter to force browser to fetch fresh file
      const cacheBuster = `?t=${Date.now()}`;
      const proofUrl = `${API}/api/admin/payments/${requestId}/payment-proof${cacheBuster}`;
      
      const response = await axios.get(proofUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const contentType = response.headers['content-type'];
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);

      setProofPreview({
        url: blobUrl,
        name: 'Bukti Transfer Client',
        type: contentType
      });

      if (contentType === 'application/pdf') {
        setProofFileType('pdf');
      } else {
        setProofFileType('image');
      }
    } catch (error) {
      console.error('Failed to load client payment proof:', error);
      toast.error('Gagal memuat bukti transfer');
      setShowProofModal(false);
    } finally {
      setLoadingProof(false);
    }
  };

  const handleDownloadClientPaymentProof = async (requestId, filename) => {
    const token = localStorage.getItem('admin_token');
    try {
      // Add cache busting parameter to force browser to fetch fresh file
      const cacheBuster = `?t=${Date.now()}`;
      const proofUrl = `${API}/api/admin/payments/${requestId}/payment-proof${cacheBuster}`;
      
      const response = await axios.get(proofUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'payment_proof.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Bukti transfer berhasil didownload');
    } catch (error) {
      console.error('Download client payment proof failed:', error);
      toast.error('Gagal mendownload bukti transfer');
    }
  };

  const handleEditProof = (accountId, proofType) => {
    if (!selectedRequest) return;
    setSelectedProofEdit({
      request_id: selectedRequest.id,
      account_id: accountId,
      proof_type: proofType,
      proof_name: proofType === 'spend_limit' ? 'Bukti Batas Pengeluaran' : 'Bukti Budget Aspire'
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
    formData.append('account_id', selectedProofEdit.account_id);
    formData.append('proof_type', selectedProofEdit.proof_type);

    try {
      setUploadingEditProof(true);
      
      const response = await axios.post(
        `${API}/api/admin/topup-requests/${selectedProofEdit.request_id}/edit-proof`,
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
      const requestId = selectedProofEdit.request_id;
      setSelectedProofEdit(null);
      
      // Force refresh to get updated pending_edit status
      console.log('🔄 Refreshing requests list...');
      await fetchRequests(false);
      
      // If detail modal is open, fetch fresh data from server
      if (selectedRequest && selectedRequest.id === requestId) {
        console.log('🔄 Fetching fresh data for detail modal...');
        try {
          const freshResponse = await axios.get(
            `${API}/api/admin/topup-requests`,
            { headers: { Authorization: `Bearer ${token}` }}
          );
          
          // Find the updated request
          const updatedRequest = freshResponse.data.find(req => req.id === requestId);
          if (updatedRequest) {
            console.log('✅ Detail modal updated with fresh data');
            setSelectedRequest(updatedRequest);
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

  const handleClaimRequest = async (requestId) => {
    console.log('🔵 handleClaimRequest called for:', requestId);
    const success = await claimRequest(requestId);
    console.log('🔵 Claim result:', success);
    if (success) {
      console.log('🔵 Fetching requests after claim...');
      await fetchRequests(false);
      console.log('🔵 Fetch completed');
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
      // Close modal if currently viewing this request
      if (selectedRequest && selectedRequest.id === requestToForceRelease) {
        setShowDetailModal(false);
        setSelectedRequest(null);
      }
    }
    
    setShowForceReleaseModal(false);
    setRequestToForceRelease(null);
  };

  const handleViewAccountProof = async (requestId, accountId, proofType, proofName) => {
    setLoadingProof(true);
    setShowProofModal(true);
    
    const token = localStorage.getItem('admin_token');
    try {
      // Add cache busting parameter to force browser to fetch fresh file
      const cacheBuster = `?t=${Date.now()}`;
      const proofUrl = `${API}/api/admin/payments/${requestId}/account-proof/${accountId}/${proofType}${cacheBuster}`;
      
      const response = await axios.get(proofUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const contentType = response.headers['content-type'];
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);

      setProofPreview({
        url: blobUrl,
        name: proofName,
        type: contentType
      });

      if (contentType === 'application/pdf') {
        setProofFileType('pdf');
      } else {
        setProofFileType('image');
      }
    } catch (error) {
      console.error('Failed to load account proof:', error);
      toast.error('Gagal memuat bukti');
      setShowProofModal(false);
    } finally {
      setLoadingProof(false);
    }
  };

  const handleDownloadAccountProof = async (requestId, accountId, proofType, filename) => {
    const token = localStorage.getItem('admin_token');
    try {
      // Add cache busting parameter to force browser to fetch fresh file
      const cacheBuster = `?t=${Date.now()}`;
      const proofUrl = `${API}/api/admin/payments/${requestId}/account-proof/${accountId}/${proofType}${cacheBuster}`;
      
      const response = await axios.get(proofUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

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
      console.error('Download account proof failed:', error);
      toast.error('Gagal mendownload bukti');
    }
  };

  const handleApprove = async () => {
    // Validate that all accounts have required proofs
    const missingProofs = [];
    
    selectedRequest.accounts.forEach(acc => {
      const platform = acc.account_platform?.toLowerCase();
      
      if (!acc.spend_limit_proof_url) {
        missingProofs.push(`${acc.account_name}: Bukti Batas Pengeluaran`);
      }
      
      if (platform === 'facebook' && !acc.budget_aspire_proof_url) {
        missingProofs.push(`${acc.account_name}: Bukti Budget Aspire`);
      }
    });

    if (missingProofs.length > 0) {
      toast.error(`Bukti belum lengkap:\n${missingProofs.join('\n')}`);
      return;
    }

    setConfirmAction('approve');
    setShowConfirmModal(true);
  };

  const confirmApprove = async () => {
    setShowConfirmModal(false);
    setActionLoading(true);

    const token = localStorage.getItem('admin_token');
    try {
      await axios.put(
        `${API}/api/admin/payments/${selectedRequest.id}/verify`,
        {
          status: 'verified',
          admin_notes: adminNotes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Top-up akun berhasil disetujui!');
      setShowDetailModal(false);
      fetchRequests(false);
    } catch (error) {
      console.error('Approve failed:', error);
      toast.error(error.response?.data?.detail || 'Gagal menyetujui top-up');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      toast.error('Catatan admin wajib diisi untuk reject');
      return;
    }

    setConfirmAction('reject');
    setShowConfirmModal(true);
  };

  const confirmReject = async () => {
    setShowConfirmModal(false);
    setActionLoading(true);

    const token = localStorage.getItem('admin_token');
    try {
      await axios.put(
        `${API}/api/admin/payments/${selectedRequest.id}/verify`,
        {
          status: 'rejected',
          admin_notes: adminNotes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Top-up akun ditolak');
      setShowDetailModal(false);
      fetchRequests(false);
    } catch (error) {
      console.error('Reject failed:', error);
      toast.error(error.response?.data?.detail || 'Gagal menolak top-up');
    } finally {
      setActionLoading(false);
    }
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu' },
      proof_uploaded: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Bukti Diunggah' },
      processing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Sedang Diproses' },
      verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Disetujui' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Dibatalkan' }
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getPlatformBadge = (platform) => {
    const platformConfig = {
      facebook: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Facebook' },
      google: { bg: 'bg-red-100', text: 'text-red-800', label: 'Google' },
      tiktok: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'TikTok' }
    };

    const config = platformConfig[platform?.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800', label: platform };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

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
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
              <span className="break-words">Top Up Akun</span>
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 break-words">
              Kelola dan proses permintaan top-up akun iklan dari client
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="flex items-start gap-3 mb-3 pb-3 border-b border-gray-200">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 break-words">{request.user?.username}</div>
                  <div className="text-xs text-gray-500 break-all">{request.user?.email}</div>
                  {getStatusBadge(request.status)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-200">
                <div><div className="text-xs text-gray-500">Akun</div><div className="text-sm font-medium text-gray-900 break-words">{request.account_name}</div></div>
                <div><div className="text-xs text-gray-500">Platform</div><div className="text-sm text-gray-900">{request.platform?.toUpperCase()}</div></div>
                <div><div className="text-xs text-gray-500">Jumlah</div><div className="text-sm font-medium text-gray-900">{formatCurrency(request.amount, request.currency)}</div></div>
                <div><div className="text-xs text-gray-500">Tanggal</div><div className="text-xs text-gray-900">{formatDate(request.created_at)}</div></div>
              </div>
              {request.claimed_by && !['verified', 'rejected'].includes(request.status) ? (
                <div className="mb-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-2">
                  <div className="flex items-center gap-1"><Lock className="h-3 w-3 text-yellow-600 flex-shrink-0" /><div className="text-xs font-bold text-yellow-700 break-words">Diproses: {request.claimed_by_username}</div></div>
                  <div className="text-xs text-yellow-600 mt-0.5">{formatDate(request.claimed_at)}</div>
                </div>
              ) : (request.status === 'verified' || request.status === 'rejected') && request.verified_by ? (
                <div className="mb-3 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-2">
                  <div className="text-xs font-bold text-teal-700 break-words">Diverifikasi: {request.verified_by.name || request.verified_by.username}</div>
                  <div className="text-xs text-teal-600 mt-0.5">{formatDate(request.verified_at)}</div>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {!request.claimed_by && ['proof_uploaded', 'processing'].includes(request.status) && (
                  <button onClick={() => handleClaimRequest(request.id)} className="flex-1 min-w-[100px] flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"><Unlock className="h-3 w-3" /><span>Ambil</span></button>
                )}
                <button onClick={() => { setSelectedRequest(request); setShowDetailModal(true); setAdminNotes(request.admin_notes || ''); }} disabled={isClaimedByOther(request) && !['verified', 'rejected'].includes(request.status)} className={`flex-1 min-w-[100px] flex items-center justify-center gap-1 px-3 py-2 rounded text-xs font-medium ${isClaimedByOther(request) && !['verified', 'rejected'].includes(request.status) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}><Eye className="h-3 w-3" /><span>Detail</span></button>
                {isClaimedByMe(request) && !['verified', 'rejected', 'completed'].includes(request.status) && (
                  <button onClick={() => handleReleaseRequest(request.id)} className="flex-1 min-w-[100px] flex items-center justify-center gap-1 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs font-medium"><Unlock className="h-3 w-3" /><span>Lepas</span></button>
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
                  Akun Iklan
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Platform
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Jumlah
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
                paginatedRequests.map((request) => {
                  // Debug log
                  console.log('Request:', request.id?.substring(0, 8), 'Status:', request.status, 'Claimed:', request.claimed_by);
                  
                  // Debug super admin state for claimed requests
                  if (request.claimed_by) {
                    console.log('🔴 Request diklaim! isSuperAdmin:', isSuperAdmin, 'localStorage admin_role:', localStorage.getItem('admin_role'));
                  }
                  
                  return (
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
                      <div className="max-w-[150px]">
                        <div className="text-xs font-medium text-gray-900 truncate">
                          {request.account_name || '-'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {request.account_id || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {getPlatformBadge(request.account_type)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-medium text-gray-900">
                        {formatCurrency(request.total_amount || 0, request.currency)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {request.accounts_count} akun
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
                        {/* Proof In Review Badge */}
                        {request.accounts && request.accounts.some(acc => 
                          acc.spend_limit_proof_pending_edit || acc.budget_aspire_proof_pending_edit
                        ) && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs font-medium text-yellow-700">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>Proof In Review</span>
                          </div>
                        )}
                        
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
                            className={`px-2 py-1 rounded text-xs font-medium ${
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
                            Detail
                          </button>
                          
                          {/* Release Button - Only for admin who claimed AND request not yet completed */}
                          {isClaimedByMe(request) && !['verified', 'rejected', 'completed'].includes(request.status) && (
                            <button
                              onClick={() => handleReleaseRequest(request.id)}
                              className="flex items-center space-x-1 px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs font-medium"
                            >
                              <Unlock className="h-3 w-3" />
                              <span>Release</span>
                            </button>
                          )}
                          
                          {/* Force Release Button - Only for super admin if claimed AND not completed */}
                          {(() => {
                            const shouldShowForce = isSuperAdmin && request.claimed_by && !['verified', 'rejected', 'completed'].includes(request.status);
                            if (request.claimed_by) {
                              console.log('🔴 Force button check for request', request.id.substring(0,8), '- isSuperAdmin:', isSuperAdmin, 'claimed_by:', request.claimed_by, 'status:', request.status, 'shouldShow:', shouldShowForce);
                            }
                            return shouldShowForce && (
                            <button
                              onClick={() => handleForceRelease(request.id)}
                              className="flex items-center space-x-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
                              title="Force Release (Super Admin Only)"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              <span>Force</span>
                            </button>
                            );
                          })()}
                        </div>
                      </div>
                    </td>
                  </tr>
                  );
                })
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
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Detail Permintaan Top-Up Akun
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
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
              
              {/* Payment Proof Section - FIRST */}
              {selectedRequest.payment_proof && selectedRequest.payment_proof.uploaded && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <h3 className="text-sm font-bold text-gray-900">Bukti Transfer dari Client</h3>
                    </div>
                    <span className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-100 rounded break-all max-w-full">
                      {selectedRequest.payment_proof.file_name}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewClientPaymentProof(selectedRequest.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Lihat Bukti Transfer</span>
                    </button>
                    <button
                      onClick={() => handleDownloadClientPaymentProof(selectedRequest.id, selectedRequest.payment_proof.file_name)}
                      className="flex items-center space-x-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Client Info - Compact */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <User className="h-5 w-5 text-gray-600 mr-2" />
                  <h3 className="text-sm font-bold text-gray-900">Informasi Client</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">Username</span>
                    <p className="font-semibold text-gray-900">{selectedRequest.user?.username}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Email</span>
                    <p className="font-semibold text-gray-900 truncate">{selectedRequest.user?.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Nama Lengkap</span>
                    <p className="font-semibold text-gray-900">{selectedRequest.user?.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Reference Code</span>
                    <p className="font-semibold text-gray-900">{selectedRequest.reference_code}</p>
                  </div>
                </div>
              </div>

              {/* Financial Summary - Fixed Grid Layout */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-sm font-bold text-gray-900">Ringkasan Keuangan</h3>
                </div>
                
                {/* Main Financial Info - Always 2 columns */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <span className="text-gray-600 text-xs">Total Top-Up + Fee</span>
                    <p className="font-bold text-lg text-gray-900">{formatCurrency(selectedRequest.total_amount || 0, selectedRequest.currency)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs">Fee</span>
                    <p className="font-semibold text-gray-900">{formatCurrency(selectedRequest.total_fee || 0, selectedRequest.currency)}</p>
                  </div>
                </div>

                {/* Unique Code Section - Only if exists */}
                {selectedRequest.unique_code && selectedRequest.unique_code > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4 pt-3 border-t border-green-200">
                    <div className="bg-yellow-50 border border-yellow-300 rounded p-2">
                      <span className="text-gray-600 text-xs block mb-1">Kode Unik</span>
                      <p className="font-bold text-2xl text-yellow-700">{selectedRequest.unique_code}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-300 rounded p-2">
                      <span className="text-gray-600 text-xs block mb-1">Total + Kode Unik</span>
                      <p className="font-bold text-lg text-blue-700">{formatCurrency(selectedRequest.total_with_unique_code || 0, selectedRequest.currency)}</p>
                    </div>
                  </div>
                )}

                {/* Status and Date - Separate grid */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-green-200">
                  <div>
                    <span className="text-gray-600 text-xs">Status</span>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs">Tanggal Request</span>
                    <p className="font-semibold text-gray-900 text-sm">{formatDate(selectedRequest.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Accounts List with Upload */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Akun yang Akan Di Top-Up</h3>
                
                {selectedRequest.accounts?.map((account, index) => (
                  <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-4 space-y-3">
                    {/* Account Header with Platform Badge */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-gray-500">AKUN #{index + 1}</span>
                        {getPlatformBadge(account.account_platform)}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-blue-600 font-medium block">Jumlah Top-Up</span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatCurrency(account.amount, selectedRequest.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Account Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 text-xs block mb-1">Nama Akun</span>
                        <span className="font-semibold text-gray-900">{account.account_name}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 text-xs block mb-1">ID Akun</span>
                        <span className="font-semibold text-gray-900 font-mono text-xs">{account.platform_account_id || account.account_id || '-'}</span>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <span className="text-blue-600 text-xs block mb-1">Jumlah Top-Up</span>
                        <span className="font-bold text-blue-900">{formatCurrency(account.amount, selectedRequest.currency)}</span>
                      </div>
                      <div className="bg-orange-50 p-2 rounded">
                        <span className="text-orange-600 text-xs block mb-1">Fee ({account.fee_percentage || 0}%)</span>
                        <span className="font-bold text-orange-900">{formatCurrency(account.fee_amount || 0, selectedRequest.currency)}</span>
                      </div>
                    </div>

                    {/* Total for this account */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-2 rounded flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Total (Jumlah + Fee):</span>
                      <span className="text-sm font-bold text-green-700">
                        {formatCurrency((account.amount + (account.fee_amount || 0)), selectedRequest.currency)}
                      </span>
                    </div>

                    {/* Proof Upload Section - Only show for proof_uploaded or processing status */}
                    {(selectedRequest.status === 'proof_uploaded' || selectedRequest.status === 'processing') && (
                      <div className="space-y-3 pt-3 border-t border-gray-200">
                        {/* Spend Limit Proof */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bukti Update Batas Pengeluaran Akun *
                          </label>
                          {account.spend_limit_proof_url ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewAccountProof(selectedRequest.id, account.account_id, 'spend_limit', 'Bukti Batas Pengeluaran')}
                                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                              >
                                <Eye className="h-4 w-4" />
                                <span>Lihat</span>
                              </button>
                              <button
                                onClick={() => handleDownloadAccountProof(selectedRequest.id, account.account_id, 'spend_limit', `spend_limit_${account.account_name}.jpg`)}
                                className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                              >
                                <Download className="h-4 w-4" />
                                <span>Download</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    handleUploadProof(account.account_id, 'spend_limit_proof', file);
                                  }
                                }}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                disabled={uploadingProofs[`${account.account_id}-spend_limit_proof`]}
                              />
                              {uploadingProofs[`${account.account_id}-spend_limit_proof`] && (
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Budget Aspire Proof - Only for Facebook */}
                        {account.account_platform?.toLowerCase() === 'facebook' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bukti Update Limit Budget Aspire *
                            </label>
                            {account.budget_aspire_proof_url ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewAccountProof(selectedRequest.id, account.account_id, 'budget_aspire', 'Bukti Budget Aspire')}
                                  className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>Lihat</span>
                                </button>
                                <button
                                  onClick={() => handleDownloadAccountProof(selectedRequest.id, account.account_id, 'budget_aspire', `budget_aspire_${account.account_name}.jpg`)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                                >
                                  <Download className="h-4 w-4" />
                                  <span>Download</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      handleUploadProof(account.account_id, 'budget_aspire_proof', file);
                                    }
                                  }}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                  disabled={uploadingProofs[`${account.account_id}-budget_aspire_proof`]}
                                />
                                {uploadingProofs[`${account.account_id}-budget_aspire_proof`] && (
                                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* View Proofs - For verified/rejected status */}
                    {(selectedRequest.status === 'verified' || selectedRequest.status === 'rejected') && (
                      <div className="space-y-3 pt-3 border-t border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase">Bukti yang Sudah Diupload</h4>
                        {account.spend_limit_proof_url && (
                          <div className="bg-blue-50 p-3 rounded space-y-2">
                            <span className="text-sm font-medium text-gray-700 block">Bukti Batas Pengeluaran</span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleViewAccountProof(selectedRequest.id, account.account_id, 'spend_limit', 'Bukti Batas Pengeluaran')}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Lihat</span>
                              </button>
                              <button
                                onClick={() => handleDownloadAccountProof(selectedRequest.id, account.account_id, 'spend_limit', `spend_limit_${account.account_name}.jpg`)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs font-medium"
                              >
                                <Download className="h-3 w-3" />
                                <span>Download</span>
                              </button>
                              {account.spend_limit_proof_pending_edit ? (
                                <div className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-100 border border-yellow-300 rounded text-xs font-medium text-yellow-800">
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  <span>In Review</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEditProof(account.account_id, 'spend_limit')}
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
                        {account.budget_aspire_proof_url && (
                          <div className="bg-purple-50 p-3 rounded space-y-2">
                            <span className="text-sm font-medium text-gray-700 block">Bukti Budget Aspire</span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleViewAccountProof(selectedRequest.id, account.account_id, 'budget_aspire', 'Bukti Budget Aspire')}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-medium"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Lihat</span>
                              </button>
                              <button
                                onClick={() => handleDownloadAccountProof(selectedRequest.id, account.account_id, 'budget_aspire', `budget_aspire_${account.account_name}.jpg`)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs font-medium"
                              >
                                <Download className="h-3 w-3" />
                                <span>Download</span>
                              </button>
                              {account.budget_aspire_proof_pending_edit ? (
                                <div className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-100 border border-yellow-300 rounded text-xs font-medium text-yellow-800">
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  <span>In Review</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEditProof(account.account_id, 'budget_aspire')}
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
                    )}
                  </div>
                ))}
              </div>

              {/* Admin Notes */}
              {(selectedRequest.status === 'verified' || selectedRequest.status === 'rejected') && selectedRequest.admin_notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Catatan Admin</h3>
                  <p className="text-sm text-gray-700">{selectedRequest.admin_notes}</p>
                </div>
              )}

              {/* Processed By */}
              {selectedRequest.verified_by && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Diproses Oleh</h3>
                  <div className="text-sm">
                    <span className="text-gray-600">Admin:</span>
                    <span className="ml-2 font-medium">{selectedRequest.verified_by.username}</span>
                    <span className="ml-4 text-gray-600">Tanggal:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedRequest.verified_at)}</span>
                  </div>
                </div>
              )}

              {/* Admin Actions - Only show for proof_uploaded or processing status */}
              {(selectedRequest.status === 'proof_uploaded' || selectedRequest.status === 'processing') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catatan Admin {selectedRequest.status === 'rejected' && '(Wajib untuk reject)'}
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Masukkan catatan untuk client..."
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

                  <div className="flex space-x-3">
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading || !isClaimedByMe(selectedRequest)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      title={!isClaimedByMe(selectedRequest) ? 'Klik "Ambil" terlebih dahulu' : 'Approve request'}
                    >
                      {actionLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          <span>Approve</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleReject}
                      disabled={actionLoading || !isClaimedByMe(selectedRequest)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      title={!isClaimedByMe(selectedRequest) ? 'Klik "Ambil" terlebih dahulu' : 'Reject request'}
                    >
                      {actionLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5" />
                          <span>Reject</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Proof Preview Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">{proofPreview?.name || 'Bukti Transfer'}</h3>
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
                proofFileType === 'pdf' ? (
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Konfirmasi {confirmAction === 'approve' ? 'Approve' : 'Reject'}
            </h3>
            <p className="text-gray-700 mb-6">
              {confirmAction === 'approve' 
                ? 'Apakah Anda yakin ingin menyetujui permintaan top-up ini? Saldo akan otomatis ditambahkan ke akun iklan.'
                : 'Apakah Anda yakin ingin menolak permintaan top-up ini?'
              }
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={confirmAction === 'approve' ? confirmApprove : confirmReject}
                className={`flex-1 px-4 py-2 rounded-lg text-white ${
                  confirmAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Ya, {confirmAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Proof Modal */}
      {showEditProofModal && selectedProofEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center space-x-3">
                <Edit className="h-6 w-6" />
                <h3 className="text-xl font-bold">Edit {selectedProofEdit.proof_name}</h3>
              </div>
              <button
                onClick={() => setShowEditProofModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Edit bukti memerlukan <strong>approval super admin</strong>. File lama akan disimpan sebagai backup.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Bukti Baru <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setEditProofFile(e.target.files[0])}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                />
                {editProofFile && (
                  <p className="mt-1 text-sm text-gray-600 break-all">
                    File: {editProofFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alasan Edit (Optional)
                </label>
                <textarea
                  value={editProofNotes}
                  onChange={(e) => setEditProofNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="Mengapa bukti perlu diedit? (opsional)"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowEditProofModal(false)}
                  disabled={uploadingEditProof}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitEditProof}
                  disabled={uploadingEditProof || !editProofFile}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {uploadingEditProof ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Kirim Request</span>
                    </>
                  )}
                </button>
              </div>
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

export default AdAccountTopUpManagement;
