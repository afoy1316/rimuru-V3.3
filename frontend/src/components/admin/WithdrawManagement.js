import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';
import CustomDropdown from '../ui/CustomDropdown';
import DateRangeFilter from './DateRangeFilter';
import {
  Banknote,
  Search,
  Filter,
  Check,
  X,
  RefreshCw,
  Upload,
  Download,
  DollarSign,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Lock,
  Unlock
} from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';
import { useRequestClaim } from '../../hooks/useRequestClaim';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', { 
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const WithdrawManagement = () => {
  const { t } = useLanguage();
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [paginatedWithdraws, setPaginatedWithdraws] = useState([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  
  // Claim/Lock states
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showForceReleaseModal, setShowForceReleaseModal] = useState(false);
  const [withdrawToForceRelease, setWithdrawToForceRelease] = useState(null);
  const { 
    claimRequest, 
    releaseRequest, 
    forceReleaseRequest,
    isClaimedByMe,
    isClaimedByOther,
    getClaimTimeElapsed
  } = useRequestClaim('withdrawal');
  
  // Modals
  const [selectedWithdraw, setSelectedWithdraw] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);
  const [selectedProofType, setSelectedProofType] = useState(''); // 'actual' or 'after'
  const [proofImageBlob, setProofImageBlob] = useState(null);
  const [loadingProof, setLoadingProof] = useState(false);
  
  // Action modal data (combined approval and file upload)
  const [actionData, setActionData] = useState({
    decision: '', // 'approved' or 'rejected'
    verified_amount: '',
    admin_notes: '',
    // File 1: Bukti saldo aktual
    actual_balance_proof_file: null,
    actual_balance_proof_preview: null,
    actual_balance_proof_uploaded: false,
    // File 2: Bukti saldo setelah ditarik
    after_withdrawal_proof_file: null,
    after_withdrawal_proof_preview: null,
    after_withdrawal_proof_uploaded: false
  });
  const [processing, setProcessing] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);

  // Status options
  const getStatusOptions = () => [
    { value: '', label: t('allStatuses'), icon: Filter, color: 'text-gray-700' },
    { value: 'pending', label: t('pending'), icon: Clock, color: 'text-yellow-700' },
    { value: 'approved', label: t('approved'), icon: CheckCircle, color: 'text-green-700' },
    { value: 'completed', label: t('completed') || 'Selesai', icon: CheckCircle, color: 'text-blue-700' },
    { value: 'rejected', label: t('rejected'), icon: XCircle, color: 'text-red-700' }
  ];

  const getPlatformOptions = () => [
    { value: '', label: t('allPlatforms'), color: 'text-gray-700' },
    { value: 'facebook', label: t('facebook'), color: 'text-blue-700' },
    { value: 'google', label: t('google'), color: 'text-red-700' },
    { value: 'tiktok', label: t('tiktok'), color: 'text-gray-900' }
  ];

  // Initialize Super Admin status on mount
  useEffect(() => {
    const superAdminFlag = localStorage.getItem('is_super_admin') === 'true';
    setIsSuperAdmin(superAdminFlag);
    console.log('🔑 Super Admin status:', superAdminFlag);
  }, []);

  useEffect(() => {
    fetchWithdraws();
  }, [statusFilter, platformFilter]);

  // Auto-refresh every 10 seconds for real-time updates (silent)
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchWithdraws(true); // Silent refresh
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Event-driven refresh instead of polling
  useEffect(() => {
    const handleNotification = (event) => {
      if (event.detail && event.detail.type) {
        const notifType = event.detail.type;
        const title = event.detail.title || '';
        
        // Refresh if notification is related to withdrawals
        if (notifType === 'approval' || 
            notifType === 'completion' ||
            notifType === 'rejection' ||
            title.includes('Penarikan') || 
            title.includes('Withdrawal')) {
          
          console.log('[WithdrawManagement] Notification received, refreshing...', notifType);
          setTimeout(() => fetchWithdraws(), 1000);
        }
      }
    };

    window.addEventListener('newNotification', handleNotification);

    return () => window.removeEventListener('newNotification', handleNotification);
  }, []);

  // Pagination effect
  useEffect(() => {
    let filteredWithdraws = withdraws.filter(withdraw => 
      withdraw.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdraw.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdraw.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdraw.platform?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Date range filter
    if (dateRange.startDate && dateRange.endDate) {
      filteredWithdraws = filteredWithdraws.filter(withdraw => {
        const withdrawDate = new Date(withdraw.created_at);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        return withdrawDate >= startDate && withdrawDate <= endDate;
      });
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredWithdraws.slice(startIndex, endIndex);
    setPaginatedWithdraws(paginated);
  }, [withdraws, searchTerm, statusFilter, platformFilter, currentPage, itemsPerPage, dateRange]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, platformFilter, itemsPerPage, dateRange]);

  const fetchWithdraws = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      
      if (statusFilter) params.append('status', statusFilter);
      if (platformFilter) params.append('platform', platformFilter);
      
      const response = await axios.get(`${API}/api/admin/withdraws?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check if currently viewing request has been force released
      if (selectedWithdraw && showDetailModal) {
        const updatedRequest = response.data.find(r => r.id === selectedWithdraw.id);
        if (updatedRequest) {
          const wasClaimedByMe = isClaimedByMe(selectedWithdraw);
          const stillClaimedByMe = updatedRequest.claimed_by_username === localStorage.getItem('admin_username');
          
          // If was claimed by me but not anymore, it was force released
          if (wasClaimedByMe && !stillClaimedByMe) {
            toast.error('⚠️ Request telah di-force release oleh Super Admin!', { duration: 5000 });
            setSelectedWithdraw(updatedRequest);
          } else {
            setSelectedWithdraw(updatedRequest);
          }
        }
      }
      
      setWithdraws(response.data);
    } catch (error) {
      console.error('Error fetching withdraws:', error);
      toast.error(t('errorFetchingWithdraws'));
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    // SECURITY: Check if request is claimed by current admin
    if (!isClaimedByMe(selectedWithdraw)) {
      toast.error('❌ Anda harus claim request ini terlebih dahulu sebelum approve/reject!');
      return;
    }

    if (!selectedWithdraw || !actionData.decision) {
      toast.error('Pilih keputusan (disetujui atau ditolak)');
      return;
    }

    if (actionData.decision === 'approved' && (!actionData.verified_amount || parseFloat(actionData.verified_amount) <= 0)) {
      toast.error('Jumlah terverifikasi harus diisi untuk approval');
      return;
    }

    if (actionData.decision === 'approved') {
      if (!actionData.actual_balance_proof_file || !actionData.after_withdrawal_proof_file) {
        toast.error('Kedua file bukti harus diupload untuk approval: Bukti Saldo Aktual dan Bukti Saldo Setelah Ditarik');
        return;
      }
    }

    setProcessing(true);
    setUploadingProof(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      // Upload files if approving
      let actualBalanceProofUrl = null;
      let afterWithdrawalProofUrl = null;
      
      if (actionData.decision === 'approved') {
        try {
          actualBalanceProofUrl = await uploadFile('actual');
          afterWithdrawalProofUrl = await uploadFile('after');
        } catch (uploadError) {
          toast.error('Gagal upload file bukti');
          return;
        }
      }
      
      // Send 'approved' first, backend will handle completion automatically
      const finalStatus = actionData.decision === 'approved' ? 'approved' : 'rejected';
      
      const payload = {
        status: finalStatus,
        admin_notes: actionData.admin_notes
      };
      
      if (actionData.decision === 'approved') {
        payload.verified_amount = parseFloat(actionData.verified_amount);
        payload.actual_balance_proof_url = actualBalanceProofUrl;
        payload.after_withdrawal_proof_url = afterWithdrawalProofUrl;
      }
      
      await axios.put(
        `${API}/api/admin/withdraws/${selectedWithdraw.id}/status`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const statusText = finalStatus === 'approved' ? 'disetujui dan diselesaikan' : 'ditolak';
      toast.success(`Permintaan penarikan berhasil ${statusText}`);
      setShowApprovalModal(false);
      resetActionData();
      setSelectedWithdraw(null);
      fetchWithdraws();
    } catch (error) {
      console.error('Error updating withdraw:', error);
      const errorMessage = error.response?.data?.detail || 'Gagal mengupdate status penarikan';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const resetActionData = () => {
    setActionData({
      decision: '',
      verified_amount: '',
      admin_notes: '',
      // File 1: Bukti saldo aktual
      actual_balance_proof_file: null,
      actual_balance_proof_preview: null,
      actual_balance_proof_uploaded: false,
      // File 2: Bukti saldo setelah ditarik
      after_withdrawal_proof_file: null,
      after_withdrawal_proof_preview: null,
      after_withdrawal_proof_uploaded: false
    });
  };

  const handleFileSelect = (file, fileType) => {
    // Update actionData with file and preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      if (fileType === 'actual') {
        setActionData(prev => ({
          ...prev,
          actual_balance_proof_file: file,
          actual_balance_proof_preview: url
        }));
      } else if (fileType === 'after') {
        setActionData(prev => ({
          ...prev,
          after_withdrawal_proof_file: file,
          after_withdrawal_proof_preview: url
        }));
      }
    } else {
      if (fileType === 'actual') {
        setActionData(prev => ({
          ...prev,
          actual_balance_proof_file: file,
          actual_balance_proof_preview: null
        }));
      } else if (fileType === 'after') {
        setActionData(prev => ({
          ...prev,
          after_withdrawal_proof_file: file,
          after_withdrawal_proof_preview: null
        }));
      }
    }
  };

  const uploadFile = async (fileType) => {
    const file = fileType === 'actual' ? actionData.actual_balance_proof_file : actionData.after_withdrawal_proof_file;
    if (!selectedWithdraw || !file) return null;

    try {
      const token = localStorage.getItem('admin_token');
      const formData = new FormData();
      formData.append('file', file);
      
      // Use correct endpoint for withdrawal proofs (not transfer-request endpoint)
      const endpoint = fileType === 'actual' 
        ? `${API}/api/admin/withdraws/${selectedWithdraw.id}/upload-proof`
        : `${API}/api/admin/withdraws/${selectedWithdraw.id}/upload-after-proof`;
      
      const response = await axios.post(
        endpoint,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      // Return the path from response (backend returns it in different format)
      return response.data.file_path || response.data.filename || response.data.file_url;
    } catch (error) {
      console.error(`Error uploading ${fileType} proof:`, error);
      throw error;
    }
  };

  // Claim/Lock Request Handlers
  const handleClaimRequest = async (withdrawId) => {
    console.log('🔵 handleClaimRequest called for:', withdrawId);
    const success = await claimRequest(withdrawId);
    console.log('🔵 Claim result:', success);
    if (success) {
      console.log('🔵 Fetching requests after claim...');
      await fetchWithdraws(false);
      console.log('🔵 Fetch completed');
    }
  };

  const handleReleaseRequest = async (withdrawId) => {
    const success = await releaseRequest(withdrawId);
    if (success) {
      await fetchWithdraws(false);
    }
  };

  const handleForceRelease = async (withdrawId) => {
    setWithdrawToForceRelease(withdrawId);
    setShowForceReleaseModal(true);
  };

  const confirmForceRelease = async () => {
    if (!withdrawToForceRelease) return;
    
    const success = await forceReleaseRequest(withdrawToForceRelease);
    if (success) {
      await fetchWithdraws(false);
      // Close modal if currently viewing this request
      if (selectedWithdraw && selectedWithdraw.id === withdrawToForceRelease) {
        setShowDetailModal(false);
        setSelectedWithdraw(null);
      }
    }
    
    setShowForceReleaseModal(false);
    setWithdrawToForceRelease(null);
  };

  const openProofModal = async (proofUrl, proofType) => {
    if (!selectedWithdraw) return;
    
    const token = localStorage.getItem('admin_token');
    if (!token) {
      toast.error('Sesi berakhir. Silakan login kembali.');
      return;
    }
    
    setSelectedProofType(proofType);
    setShowProofModal(true);
    setLoadingProof(true);
    
    try {
      // Determine which endpoint to use based on proof type
      const endpoint = proofType === 'Bukti Saldo Aktual' 
        ? `/api/admin/withdraws/${selectedWithdraw.id}/actual-balance-proof`
        : `/api/admin/withdraws/${selectedWithdraw.id}/after-withdrawal-proof`;
      
      console.log('🔍 Loading proof:', endpoint);
      
      const response = await axios.get(`${API}${endpoint}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        responseType: 'blob',
        timeout: 30000
      });
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Create blob URL
      const contentType = response.headers['content-type'] || '';
      const isPdf = contentType.includes('pdf');
      const blobType = isPdf ? 'application/pdf' : 'image/jpeg';
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: blobType }));
      
      setProofImageBlob(blobUrl);
      setSelectedProofUrl(proofUrl); // Store original URL for reference
      setLoadingProof(false);
      
      console.log('✅ Proof loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load proof:', error);
      setLoadingProof(false);
      toast.error('Gagal memuat bukti file');
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-purple-100 text-purple-800 border-purple-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const statusIcons = {
      pending: Clock,
      processing: Clock,
      approved: CheckCircle,
      completed: CheckCircle,
      rejected: XCircle
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

  // Calculate filtered withdraws for pagination
  let filteredWithdraws = withdraws.filter(withdraw => 
    withdraw.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    withdraw.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    withdraw.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    withdraw.platform?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Date range filter
  if (dateRange.startDate && dateRange.endDate) {
    filteredWithdraws = filteredWithdraws.filter(withdraw => {
      const withdrawDate = new Date(withdraw.created_at);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      return withdrawDate >= startDate && withdrawDate <= endDate;
    });
  }

  const getWithdrawStats = () => {
    const stats = {
      total: withdraws.length,
      pending: withdraws.filter(w => w.status === 'pending').length,
      approved: withdraws.filter(w => w.status === 'approved').length,
      completed: withdraws.filter(w => w.status === 'completed').length,
      rejected: withdraws.filter(w => w.status === 'rejected').length,
      totalAmountIDR: withdraws
        .filter(w => (w.status === 'approved' || w.status === 'completed') && w.currency === 'IDR')
        .reduce((sum, w) => sum + (w.admin_verified_amount || 0), 0),
      totalAmountUSD: withdraws
        .filter(w => (w.status === 'approved' || w.status === 'completed') && (w.currency === 'USD' || !w.currency))
        .reduce((sum, w) => sum + (w.admin_verified_amount || 0), 0)
    };
    return stats;
  };

  const stats = getWithdrawStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('loadingWithdraws')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <Banknote className="w-5 h-5 sm:w-7 sm:h-7 mr-2 sm:mr-3 text-green-600 flex-shrink-0" />
            <span className="break-words">{t('withdrawManagement')}</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 break-words">{t('manageWithdrawRequests')}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari pengguna, akun..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex gap-3 w-full lg:w-auto">
            <div className="flex-1 lg:min-w-[140px]">
              <CustomDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: '', label: 'Semua Status' },
                  { value: 'pending', label: 'Menunggu' },
                  { value: 'approved', label: 'Disetujui' },
                  { value: 'completed', label: 'Selesai' },
                  { value: 'rejected', label: 'Ditolak' }
                ]}
                placeholder="Semua Status"
                className="w-full"
              />
            </div>
            
            <div className="flex-1 lg:min-w-[140px]">
              <CustomDropdown
                value={platformFilter}
                onChange={setPlatformFilter}
                options={[
                  { value: '', label: 'Semua Platform' },
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'google', label: 'Google' },
                  { value: 'tiktok', label: 'TikTok' }
                ]}
                placeholder="Semua Platform"
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Date Range Filter */}
        <DateRangeFilter onFilterChange={setDateRange} />
      </div>

      {/* Results Info */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-gray-600 break-words">
          Menampilkan {filteredWithdraws.length} dari {withdraws.length} Permintaan
        </p>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center"><div className="flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>Loading...</div></div>
        ) : paginatedWithdraws.length === 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center text-gray-500 text-sm">Tidak ada data</div>
        ) : (
          paginatedWithdraws.map((withdraw) => (
            <div key={withdraw.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <div className="flex items-start gap-3 mb-3 pb-3 border-b border-gray-200">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-500 flex items-center justify-center"><User className="h-5 w-5 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 break-words">{withdraw.user?.username}</div>
                  <div className="text-xs text-gray-500 break-all">{withdraw.user?.email}</div>
                  {getStatusBadge(withdraw.status)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-200">
                <div><div className="text-xs text-gray-500">Akun</div><div className="text-sm font-medium text-gray-900 break-words">{withdraw.account_name}</div></div>
                <div><div className="text-xs text-gray-500">Platform</div><div className="text-sm text-gray-900">{withdraw.platform?.toUpperCase()}</div></div>
                <div><div className="text-xs text-gray-500">Diminta</div><div className="text-sm font-medium text-gray-900">{formatCurrency(withdraw.requested_amount, withdraw.currency)}</div></div>
                <div><div className="text-xs text-gray-500">Verified</div><div className="text-sm font-medium text-gray-900">{withdraw.verified_amount ? formatCurrency(withdraw.verified_amount, withdraw.currency) : '-'}</div></div>
                <div><div className="text-xs text-gray-500">Tanggal</div><div className="text-xs text-gray-900">{formatDate(withdraw.created_at)}</div></div>
              </div>
              {withdraw.claimed_by && !['completed', 'rejected'].includes(withdraw.status) && (
                <div className="mb-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-2">
                  <div className="flex items-center gap-1"><Lock className="h-3 w-3 text-yellow-600 flex-shrink-0" /><div className="text-xs font-bold text-yellow-700 break-words">Diproses: {withdraw.claimed_by_username}</div></div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {/* Tombol Ambil - hanya muncul jika belum di-claim dan status pending/processing */}
                {!withdraw.claimed_by && (withdraw.status === 'pending' || withdraw.status === 'processing') && (
                  <button onClick={() => handleClaimRequest(withdraw.id)} className="flex-1 min-w-[100px] flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"><Unlock className="h-3 w-3" /><span>Ambil</span></button>
                )}
                
                {/* Tombol Detail - selalu muncul */}
                <button onClick={() => {
                  setSelectedWithdraw(withdraw);
                  setShowDetailModal(true);
                }} disabled={isClaimedByOther(withdraw) && !['completed', 'rejected'].includes(withdraw.status)} className={`flex-1 min-w-[100px] flex items-center justify-center gap-1 px-3 py-2 rounded text-xs font-medium ${isClaimedByOther(withdraw) && !['completed', 'rejected'].includes(withdraw.status) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}><Eye className="h-3 w-3" /><span>Detail</span></button>
                
                {/* Tombol Proses dan Lepas - hanya untuk yang di-claim oleh saya dan status pending/processing */}
                {isClaimedByMe(withdraw) && (withdraw.status === 'pending' || withdraw.status === 'processing') && (
                  <>
                    <button onClick={() => {
                      setSelectedWithdraw(withdraw);
                      setActionData({
                        decision: '',
                        verified_amount: withdraw.requested_amount?.toString() || '',
                        admin_notes: '',
                        actual_balance_proof_file: null,
                        actual_balance_proof_preview: null,
                        actual_balance_proof_uploaded: false,
                        after_withdrawal_proof_file: null,
                        after_withdrawal_proof_preview: null,
                        after_withdrawal_proof_uploaded: false
                      });
                      setShowApprovalModal(true);
                    }} className="flex-1 min-w-[100px] flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-medium"><CheckCircle className="h-3 w-3" /><span>Proses</span></button>
                    <button onClick={() => handleReleaseRequest(withdraw.id)} className="flex-1 min-w-[100px] flex items-center justify-center gap-1 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs font-medium"><Unlock className="h-3 w-3" /><span>Lepas</span></button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Withdraws Table - Desktop Only */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="divide-y divide-gray-200" style={{minWidth: '1200px', width: '100%'}}>
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-2 py-3 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap" style={{minWidth: '140px'}}>
                  Pengguna
                </th>
                <th className="px-2 py-3 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap" style={{minWidth: '160px'}}>
                  Akun Iklan
                </th>
                <th className="px-2 py-3 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap" style={{minWidth: '100px'}}>
                  Diminta
                </th>
                <th className="px-2 py-3 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap" style={{minWidth: '100px'}}>
                  Verified
                </th>
                <th className="px-2 py-3 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap" style={{minWidth: '90px'}}>
                  Status
                </th>
                <th className="px-2 py-3 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap" style={{minWidth: '100px'}}>
                  Tanggal
                </th>
                <th className="px-2 py-3 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap" style={{minWidth: '130px'}}>
                  Diproses
                </th>
                <th className="px-2 py-3 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap" style={{minWidth: '220px'}}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWithdraws.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <Banknote className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Tidak ada permintaan penarikan</p>
                    <p className="text-sm">Belum ada permintaan penarikan yang ditemukan</p>
                  </td>
                </tr>
              ) : (
                paginatedWithdraws.map((withdraw) => (
                  <tr key={withdraw.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-2 py-2">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-gray-900 truncate" title={withdraw.user?.name}>
                            {withdraw.user?.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate" title={`@${withdraw.user?.username}`}>
                            @{withdraw.user?.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center space-x-3" style={{maxWidth: '200px'}}>
                        {getPlatformIcon(withdraw.platform)}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-gray-900 truncate" title={withdraw.account_name}>
                            {withdraw.account_name}
                          </div>
                          {withdraw.account_external_id && (
                            <div className="text-xs font-mono text-blue-600 mb-1 truncate" title={withdraw.account_external_id}>
                              ID: {withdraw.account_external_id}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 capitalize truncate">
                            {withdraw.platform}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="text-xs font-semibold text-gray-900">
                        {formatCurrency(withdraw.requested_amount || 0, withdraw.currency || 'USD')}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="text-xs font-semibold text-gray-900">
                        {withdraw.admin_verified_amount ? formatCurrency(withdraw.admin_verified_amount, withdraw.currency || 'USD') : '-'}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      {getStatusBadge(withdraw.status)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="text-xs text-gray-600">
                        {new Date(withdraw.created_at).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      {/* Show claimed badge (orange) for pending/processing requests */}
                      {withdraw.claimed_by && !['approved', 'rejected', 'completed'].includes(withdraw.status) ? (
                        <div className="inline-flex flex-col bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg px-3 py-2 max-w-[140px]">
                          <div className="flex items-center gap-1">
                            <Lock className="h-3 w-3 text-yellow-600" />
                            <div className="text-xs font-bold text-yellow-700 truncate">
                              {withdraw.claimed_by_username}
                            </div>
                          </div>
                          <div className="text-xs text-yellow-600 mt-0.5">
                            {formatDate(withdraw.claimed_at)}
                          </div>
                        </div>
                      ) : (withdraw.status === 'approved' || withdraw.status === 'rejected' || withdraw.status === 'completed') && withdraw.verified_by_admin ? (
                        <div className="inline-flex flex-col bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg px-3 py-2 max-w-[140px]">
                          <div className="text-xs font-bold text-teal-700 truncate">
                            {withdraw.verified_by_admin.name || withdraw.verified_by_admin.username}
                          </div>
                          <div className="text-xs text-teal-600 mt-0.5">
                            {formatDate(withdraw.verified_at)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Claim/Release/Force Release Buttons - Only for pending/processing requests */}
                        {(withdraw.status === 'pending' || withdraw.status === 'processing') && (
                          <>
                            {!withdraw.claimed_by ? (
                              // Ambil button - request not claimed
                              <button
                                onClick={() => handleClaimRequest(withdraw.id)}
                                className="text-purple-600 hover:text-purple-900 p-2 rounded-md hover:bg-purple-50 transition-colors"
                                title="Ambil Request"
                              >
                                <Lock className="w-5 h-5" />
                              </button>
                            ) : isClaimedByMe(withdraw) ? (
                              // Release button - claimed by me
                              <button
                                onClick={() => handleReleaseRequest(withdraw.id)}
                                className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50 transition-colors"
                                title="Release Request"
                              >
                                <Unlock className="w-5 h-5" />
                              </button>
                            ) : isSuperAdmin ? (
                              // Force Release button - claimed by someone else, only for super admin
                              <button
                                onClick={() => handleForceRelease(withdraw.id)}
                                className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 transition-colors"
                                title="Force Release (Super Admin)"
                              >
                                <AlertTriangle className="w-5 h-5" />
                              </button>
                            ) : null}
                            
                            {/* Process button - only show if claimed by me */}
                            {isClaimedByMe(withdraw) && (
                              <button
                                onClick={() => {
                                  setSelectedWithdraw(withdraw);
                                  setActionData({
                                    decision: '',
                                    verified_amount: withdraw.requested_amount?.toString() || '',
                                    admin_notes: '',
                                    actual_balance_proof_file: null,
                                    actual_balance_proof_preview: null,
                                    actual_balance_proof_uploaded: false,
                                    after_withdrawal_proof_file: null,
                                    after_withdrawal_proof_preview: null,
                                    after_withdrawal_proof_uploaded: false
                                  });
                                  setShowApprovalModal(true);
                                }}
                                className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50 transition-colors"
                                title="Proses Permintaan"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                            )}
                          </>
                        )}
                        {withdraw.status !== 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedWithdraw(withdraw);
                              setShowDetailModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                            title="Lihat Detail & Bukti"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Lihat Detail
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls - OUTSIDE desktop table container */}
      {filteredWithdraws.length > 0 && (
        <>
          {/* Desktop Pagination */}
          <div className="hidden md:block bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <p className="text-xs text-gray-700">
                  Menampilkan{' '}
                  <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>
                  {' '}ke{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredWithdraws.length)}
                  </span>
                  {' '}dari{' '}
                  <span className="font-medium">{filteredWithdraws.length}</span> hasil
                </p>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-700">Item per halaman:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Sebelumnya</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {(() => {
                      const totalPages = Math.ceil(filteredWithdraws.length / itemsPerPage);
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
                            className={`relative inline-flex items-center px-4 py-2 border text-xs font-medium ${
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
                      onClick={() => setCurrentPage(Math.min(Math.ceil(filteredWithdraws.length / itemsPerPage), currentPage + 1))}
                      disabled={currentPage === Math.ceil(filteredWithdraws.length / itemsPerPage)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Mobile Pagination */}
          <div className="md:hidden bg-white rounded-lg shadow p-4 mt-4">
            <div className="flex flex-col space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <p className="text-xs text-gray-600">
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredWithdraws.length)} dari {filteredWithdraws.length}
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
                  const totalPages = Math.ceil(filteredWithdraws.length / itemsPerPage);
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
                  onClick={() => setCurrentPage(Math.min(Math.ceil(filteredWithdraws.length / itemsPerPage), currentPage + 1))}
                  disabled={currentPage === Math.ceil(filteredWithdraws.length / itemsPerPage)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Action Modal */}

      {/* Action Modal */}
      {showApprovalModal && selectedWithdraw && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Proses Permintaan Penarikan</h2>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    resetActionData();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* 1. Informasi Permintaan */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-3">
                  1. Informasi Permintaan
                </label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{selectedWithdraw.account_name}</p>
                      {selectedWithdraw.account_external_id && (
                        <p className="text-blue-600 font-mono text-xs mb-1">ID: {selectedWithdraw.account_external_id}</p>
                      )}
                      <p className="text-gray-600">Platform: {selectedWithdraw.platform}</p>
                      <p className="text-gray-600">User: {selectedWithdraw.user?.name} (@{selectedWithdraw.user?.username})</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Jumlah Diminta: {formatCurrency(selectedWithdraw.requested_amount || 0, selectedWithdraw.currency || 'USD')}</p>
                      <p className="text-gray-600">Saldo Akun: {formatCurrency(selectedWithdraw.account_balance || 0, selectedWithdraw.currency || 'USD')}</p>
                      <p className="text-gray-600">Tanggal: {new Date(selectedWithdraw.created_at).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Bukti Saldo - 2 Files Required */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-3">
                  Upload Bukti Saldo (2 File Diperlukan) <span className="text-red-500">*</span>
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File 1: Bukti Saldo Aktual */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      1. Bukti Saldo Aktual <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-2">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleFileSelect(file, 'actual');
                        }}
                        className="hidden"
                        id="actual-balance-upload"
                      />
                      <label
                        htmlFor="actual-balance-upload"
                        className="cursor-pointer flex flex-col items-center justify-center"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-600 text-center">
                          Klik untuk pilih file bukti saldo aktual
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF (max 10MB)</p>
                      </label>
                    </div>
                    
                    {/* Preview File 1 */}
                    {actionData.actual_balance_proof_file && (
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs font-medium text-green-600 break-all">✓ {actionData.actual_balance_proof_file.name}</p>
                        {actionData.actual_balance_proof_preview && (
                          <img 
                            src={actionData.actual_balance_proof_preview} 
                            alt="Preview" 
                            className="mt-2 w-full h-24 object-cover rounded"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* File 2: Bukti Saldo Setelah Ditarik */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      2. Bukti Saldo Setelah Ditarik <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-2">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleFileSelect(file, 'after');
                        }}
                        className="hidden"
                        id="after-withdrawal-upload"
                      />
                      <label
                        htmlFor="after-withdrawal-upload"
                        className="cursor-pointer flex flex-col items-center justify-center"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-600 text-center">
                          Klik untuk pilih file bukti saldo setelah ditarik
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF (max 10MB)</p>
                      </label>
                    </div>
                    
                    {/* Preview File 2 */}
                    {actionData.after_withdrawal_proof_file && (
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs font-medium text-green-600 break-all">✓ {actionData.after_withdrawal_proof_file.name}</p>
                        {actionData.after_withdrawal_proof_preview && (
                          <img 
                            src={actionData.after_withdrawal_proof_preview} 
                            alt="Preview" 
                            className="mt-2 w-full h-24 object-cover rounded"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Keputusan */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-3">
                  3. Keputusan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setActionData(prev => ({...prev, decision: 'approved'}))}
                    className={`p-4 border-2 rounded-lg flex items-center justify-center gap-3 transition-all ${
                      actionData.decision === 'approved' 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Disetujui & Selesai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionData(prev => ({...prev, decision: 'rejected'}))}
                    className={`p-4 border-2 rounded-lg flex items-center justify-center gap-3 transition-all ${
                      actionData.decision === 'rejected' 
                        ? 'bg-red-50 border-red-200 text-red-800' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <X className="w-5 h-5" />
                    <span className="font-medium">Ditolak</span>
                  </button>
                </div>
              </div>

              {/* 4. Jumlah Terverifikasi */}
              {actionData.decision === 'approved' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-3">
                    4. Jumlah Terverifikasi <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 font-medium">
                      Nominal Top-Up <span className="text-red-500">*</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      placeholder="50000"
                      value={actionData.verified_amount}
                      onChange={(e) => {
                        setActionData(prev => ({...prev, verified_amount: e.target.value}));
                      }}
                    />
                    <div className="text-xs text-gray-600">
                      Nominal: {selectedWithdraw?.currency === 'IDR' ? 'Rp' : '$'} {actionData.verified_amount ? parseFloat(actionData.verified_amount).toLocaleString('id-ID', {minimumFractionDigits: selectedWithdraw?.currency === 'USD' ? 2 : 0, maximumFractionDigits: 2}) : '0'}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Masukkan jumlah saldo aktual yang terlihat di akun iklan
                  </p>
                </div>
              )}

              {/* 5. Catatan */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-3">
                  5. Catatan Admin
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Tambahkan catatan untuk user (opsional)"
                  value={actionData.admin_notes}
                  onChange={(e) => setActionData(prev => ({...prev, admin_notes: e.target.value}))}
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowApprovalModal(false);
                  resetActionData();
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                disabled={processing}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAction}
                disabled={processing || !actionData.decision}
                className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Proses Permintaan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedWithdraw && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-blue-600" />
                  {t('withdrawDetails')}
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Request Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getPlatformIcon(selectedWithdraw.platform)}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {selectedWithdraw.account_name}
                        </h4>
                        <p className="text-gray-600 capitalize">
                          {selectedWithdraw.platform} Account
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(selectedWithdraw.status)}
                    </div>
                  </div>
                </div>

                {/* Amount Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('requestedAmount')}
                    </label>
                    <p className="text-xs text-gray-900 bg-gray-50 p-2 rounded">
                      {formatCurrency(selectedWithdraw.requested_amount || 0, selectedWithdraw.currency || 'USD')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('accountBalance')}
                    </label>
                    <p className="text-xs text-gray-900 bg-gray-50 p-2 rounded">
                      {formatCurrency(selectedWithdraw.account_balance || 0, selectedWithdraw.currency || 'USD')}
                    </p>
                  </div>
                </div>

                {selectedWithdraw.admin_verified_amount && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('verifiedAmount')}
                    </label>
                    <p className="text-xs text-gray-900 bg-green-50 p-2 rounded">
                      {formatCurrency(selectedWithdraw.admin_verified_amount, selectedWithdraw.currency || 'USD')}
                    </p>
                  </div>
                )}

                {/* Client Info */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t('client')}
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedWithdraw.user?.name}</p>
                        <p className="text-xs text-gray-500">@{selectedWithdraw.user?.username}</p>
                        <p className="text-xs text-gray-500">{selectedWithdraw.user?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('createdAt')}
                    </label>
                    <p className="text-xs text-gray-900 bg-gray-50 p-2 rounded">
                      {new Date(selectedWithdraw.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Jakarta'
                      })}
                    </p>
                  </div>
                  {selectedWithdraw.processed_at && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Diproses Pada
                      </label>
                      <p className="text-xs text-gray-900 bg-gray-50 p-2 rounded">
                        {new Date(selectedWithdraw.processed_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Asia/Jakarta'
                        })}
                      </p>
                    </div>
                  )}
                  
                  {selectedWithdraw.verified_by_admin && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Diproses Oleh
                      </label>
                      <p className="text-xs text-gray-900 bg-gray-50 p-2 rounded">
                        {selectedWithdraw.verified_by_admin.name} (@{selectedWithdraw.verified_by_admin.username})
                      </p>
                    </div>
                  )}
                </div>

                {/* Admin Notes */}
                {selectedWithdraw.admin_notes && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('adminNotes')}
                    </label>
                    <p className="text-xs text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                      {selectedWithdraw.admin_notes}
                    </p>
                  </div>
                )}

                {/* Display uploaded proofs for approved/rejected/completed withdrawals */}
                {(selectedWithdraw.status === 'approved' || selectedWithdraw.status === 'rejected' || selectedWithdraw.status === 'completed') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Bukti Saldo yang Di-Upload
                    </label>
                    
                    {/* Show message if no proofs found */}
                    {!selectedWithdraw.actual_balance_proof_url && !selectedWithdraw.after_withdrawal_proof_url ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                        <p>⚠️ Tidak ada bukti saldo yang terupload untuk penarikan ini.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* File 1: Bukti Saldo Aktual */}
                        {selectedWithdraw.actual_balance_proof_url && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                              1. Bukti Saldo Aktual
                            </label>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-600">✓ File telah di-upload</span>
                                <button
                                  onClick={() => openProofModal(selectedWithdraw.actual_balance_proof_url, 'Bukti Saldo Aktual')}
                                  disabled={loadingProof}
                                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {loadingProof ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent mr-1"></div>
                                      Loading...
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3 h-3 mr-1" />
                                      Lihat File
                                    </>
                                  )}
                                </button>
                              </div>
                              {selectedWithdraw.actual_balance_proof_url.match(/\.(jpg|jpeg|png|webp)$/i) && (
                                <img 
                                  src={`${API}${selectedWithdraw.actual_balance_proof_url}`}
                                  alt="Bukti Saldo Aktual" 
                                  className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                                  onClick={() => openProofModal(selectedWithdraw.actual_balance_proof_url, 'Bukti Saldo Aktual')}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        )}

                        {/* File 2: Bukti Saldo Setelah Ditarik */}
                        {selectedWithdraw.after_withdrawal_proof_url && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                              2. Bukti Saldo Setelah Ditarik
                            </label>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-600">✓ File telah di-upload</span>
                                <button
                                  onClick={() => openProofModal(selectedWithdraw.after_withdrawal_proof_url, 'Bukti Saldo Setelah Ditarik')}
                                  disabled={loadingProof}
                                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {loadingProof ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent mr-1"></div>
                                      Loading...
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3 h-3 mr-1" />
                                      Lihat File
                                    </>
                                  )}
                                </button>
                              </div>
                              {selectedWithdraw.after_withdrawal_proof_url.match(/\.(jpg|jpeg|png|webp)$/i) && (
                                <img 
                                  src={`${API}${selectedWithdraw.after_withdrawal_proof_url}`}
                                  alt="Bukti Saldo Setelah Ditarik" 
                                  className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                                  onClick={() => openProofModal(selectedWithdraw.after_withdrawal_proof_url, 'Bukti Saldo Setelah Ditarik')}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Balance Proof Upload - 2 Files Required - Only show for admin who claimed */}
                {(selectedWithdraw.status === 'pending' || selectedWithdraw.status === 'processing') && isClaimedByMe(selectedWithdraw) && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Upload Bukti Saldo <span className="text-red-500">*</span>
                    </label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* File 1: Bukti Saldo Aktual */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          1. Bukti Saldo Aktual <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-2">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) handleFileSelect(file, 'actual');
                            }}
                            className="hidden"
                            id="actual-balance-proof-upload"
                          />
                          <label
                            htmlFor="actual-balance-proof-upload"
                            className="cursor-pointer flex flex-col items-center justify-center"
                          >
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <p className="text-xs text-gray-600 text-center">
                              Klik untuk pilih file bukti saldo aktual
                            </p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF (max 10MB)</p>
                          </label>
                        </div>
                        
                        {/* Preview File 1 */}
                        {actionData.actual_balance_proof_file && (
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <p className="font-medium text-green-600 break-all">✓ {actionData.actual_balance_proof_file.name}</p>
                            {actionData.actual_balance_proof_preview && (
                              <img 
                                src={actionData.actual_balance_proof_preview} 
                                alt="Preview" 
                                className="mt-1 w-full h-20 object-cover rounded"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {/* File 2: Bukti Saldo Setelah Ditarik */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          2. Bukti Saldo Setelah Ditarik <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-2">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) handleFileSelect(file, 'after');
                            }}
                            className="hidden"
                            id="after-withdrawal-proof-upload"
                          />
                          <label
                            htmlFor="after-withdrawal-proof-upload"
                            className="cursor-pointer flex flex-col items-center justify-center"
                          >
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <p className="text-xs text-gray-600 text-center">
                              Klik untuk pilih file bukti saldo setelah ditarik
                            </p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF (max 10MB)</p>
                          </label>
                        </div>
                        
                        {/* Preview File 2 */}
                        {actionData.after_withdrawal_proof_file && (
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <p className="font-medium text-green-600 break-all">✓ {actionData.after_withdrawal_proof_file.name}</p>
                            {actionData.after_withdrawal_proof_preview && (
                              <img 
                                src={actionData.after_withdrawal_proof_preview} 
                                alt="Preview" 
                                className="mt-1 w-full h-20 object-cover rounded"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Files uploaded automatically when user clicks process button */}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t('close')}
                </button>
                {(selectedWithdraw.status === 'pending' || selectedWithdraw.status === 'processing') && isClaimedByMe(selectedWithdraw) && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setApprovalData({
                        status: 'approved',
                        verified_amount: selectedWithdraw.requested_amount?.toString(),
                        admin_notes: ''
                      });
                      setShowApprovalModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700"
                  >
                    {t('processRequest')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof Image/PDF Viewer Modal */}
      {showProofModal && selectedProofUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedProofType}
              </h3>
              <button
                onClick={() => {
                  setShowProofModal(false);
                  setSelectedProofUrl(null);
                  setSelectedProofType('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50 min-h-[400px] flex items-center justify-center">
              {loadingProof ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full"></div>
                    </div>
                  </div>
                  <p className="mt-4 text-gray-700 font-medium">Memuat file...</p>
                  <p className="mt-1 text-xs text-gray-500">Mohon tunggu sebentar</p>
                </div>
              ) : proofImageBlob ? (
                <div className="w-full">
                  {selectedProofUrl && selectedProofUrl.match(/\.pdf$/i) ? (
                    <iframe 
                      src={proofImageBlob}
                      className="w-full h-[70vh] rounded shadow-lg"
                      title={selectedProofType}
                    />
                  ) : (
                    <img 
                      src={proofImageBlob}
                      alt={selectedProofType}
                      className="max-w-full h-auto mx-auto rounded shadow-lg"
                      style={{ maxHeight: '70vh' }}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-red-600 font-medium text-lg">Gagal memuat file</p>
                  <p className="text-xs text-gray-500 mt-2">Silakan tutup dan coba lagi</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3 bg-white">
              {!loadingProof && (
                <button
                  onClick={() => {
                    if (proofImageBlob) {
                      const a = document.createElement('a');
                      a.href = proofImageBlob;
                      a.download = selectedProofUrl ? selectedProofUrl.split('/').pop() : 'proof.jpg';
                      a.click();
                      toast.success('File berhasil didownload');
                    }
                  }}
                  disabled={!proofImageBlob || loadingProof}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              )}
              <button
                onClick={() => {
                  if (proofImageBlob) {
                    URL.revokeObjectURL(proofImageBlob);
                  }
                  setShowProofModal(false);
                  setSelectedProofUrl(null);
                  setSelectedProofType('');
                  setProofImageBlob(null);
                  setLoadingProof(false);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md text-xs font-medium hover:bg-gray-700 transition-colors"
              >
                Tutup
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
                    setWithdrawToForceRelease(null);
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
                <p className="text-gray-700 text-xs leading-relaxed">
                  Anda yakin ingin <span className="font-semibold text-red-600">force release</span> request ini?
                </p>
                <p className="text-gray-600 text-xs mt-2 leading-relaxed">
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
                  setWithdrawToForceRelease(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmForceRelease}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs font-medium flex items-center space-x-2"
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

export default WithdrawManagement;