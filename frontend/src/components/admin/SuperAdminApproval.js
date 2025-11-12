/* Updated: 2025-11-10 04:35 - Fixed handleViewDetail reference */
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  Wallet,
  ArrowRightLeft,
  DollarSign,
  Download,
  FileText,
  Edit,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const SuperAdminApproval = () => {
  const { t } = useLanguage();
  const [pendingActions, setPendingActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  
  // Proof Edit states
  const [pendingProofEdits, setPendingProofEdits] = useState([]);
  const [loadingProofEdits, setLoadingProofEdits] = useState(true);
  const [selectedProofEdit, setSelectedProofEdit] = useState(null);
  const [showProofEditModal, setShowProofEditModal] = useState(false);
  const [proofEditNotes, setProofEditNotes] = useState('');
  const [processingProofEdit, setProcessingProofEdit] = useState(false);
  
  // Wallet Deduction states
  const [pendingDeductions, setPendingDeductions] = useState([]);
  const [loadingDeductions, setLoadingDeductions] = useState(true);
  const [selectedDeduction, setSelectedDeduction] = useState(null);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [deductionNotes, setDeductionNotes] = useState('');
  const [processingDeduction, setProcessingDeduction] = useState(false);
  
  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHistory, setTotalHistory] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState(''); // '', 'approved', 'rejected'
  
  // Proof viewing states
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofBlob, setProofBlob] = useState(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [proofType, setProofType] = useState('');

  useEffect(() => {
    fetchPendingActions();
    fetchHistory();
    fetchPendingProofEdits();
    fetchPendingDeductions();
    
    // Auto-refresh every 10 seconds for real-time updates (silent)
    const interval = setInterval(() => {
      fetchPendingActions(true); // Silent refresh
      fetchHistory(true); // Silent refresh
      fetchPendingProofEdits(true); // Silent refresh
      fetchPendingDeductions(true); // Silent refresh
    }, 10000); // 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [currentPage, itemsPerPage, statusFilter]);

  const fetchPendingActions = async (silent = false) => {
    const token = localStorage.getItem('admin_token');
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await axios.get(`${API}/api/super-admin/pending-actions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingActions(response.data);
    } catch (error) {
      console.error('Failed to fetch pending actions:', error);
      if (error.response?.status === 403) {
        toast.error('Super Admin access required');
      } else {
        toast.error('Gagal memuat pending actions');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (silent = false) => {
    const token = localStorage.getItem('admin_token');
    try {
      if (!silent) {
        setHistoryLoading(true);
      }
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage
      });
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      const response = await axios.get(`${API}/api/super-admin/actions-history?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setHistory(response.data.actions);
      setTotalHistory(response.data.total);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error('Failed to fetch actions history:', error);
      if (error.response?.status !== 403) {
        toast.error('Gagal memuat riwayat actions');
      }
    } finally {
      if (!silent) {
        setHistoryLoading(false);
      }
    }
  };

  const fetchPendingProofEdits = async (silent = false) => {
    const token = localStorage.getItem('admin_token');
    try {
      if (!silent) {
        setLoadingProofEdits(true);
      }
      const response = await axios.get(`${API}/api/super-admin/pending-proof-edits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingProofEdits(response.data);
    } catch (error) {
      console.error('Failed to fetch pending proof edits:', error);
      if (error.response?.status !== 403) {
        toast.error('Gagal memuat pending proof edits');
      }
    } finally {
      if (!silent) {
        setLoadingProofEdits(false);
      }
    }
  };

  const fetchPendingDeductions = async (silent = false) => {
    const token = localStorage.getItem('admin_token');
    try {
      if (!silent) {
        setLoadingDeductions(true);
      }
      const response = await axios.get(`${API}/api/super-admin/pending-wallet-deductions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingDeductions(response.data);
    } catch (error) {
      console.error('Failed to fetch pending deductions:', error);
      if (error.response?.status !== 403) {
        toast.error('Gagal memuat pending wallet deductions');
      }
    } finally {
      if (!silent) {
        setLoadingDeductions(false);
      }
    }
  };

  const handleViewDetails = (action) => {
    setSelectedAction(action);
    setShowDetailModal(true);
    setApprovalNotes('');
  };
  
  // Alias for backward compatibility
  const handleViewDetail = handleViewDetails;

  const handleViewProof = async (gcsPath, type) => {
    // Validate gcsPath
    if (!gcsPath || gcsPath.trim() === '') {
      toast.error('Path file tidak tersedia');
      return;
    }
    
    const token = localStorage.getItem('admin_token');
    try {
      setLoadingProof(true);
      setProofType(type);
      setShowProofModal(true);
      
      // Construct GCS file URL
      const fileUrl = `${API}/api/files/${gcsPath}`;
      
      const response = await axios.get(fileUrl, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
        responseType: 'blob',
        timeout: 30000
      });
      
      const contentType = response.headers['content-type'] || '';
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      
      setProofBlob(blobUrl);
      setLoadingProof(false);
      
    } catch (error) {
      console.error('Failed to load proof:', error);
      setLoadingProof(false);
      toast.error('Gagal memuat bukti file');
    }
  };

  const handleApprove = async () => {
    if (!selectedAction) return;
    
    const token = localStorage.getItem('admin_token');
    try {
      setProcessing(true);
      
      await axios.put(
        `${API}/api/super-admin/actions/${selectedAction.id}/approve`,
        { action: 'approve', notes: approvalNotes },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success('Action berhasil diapprove dan diproses');
      setShowDetailModal(false);
      fetchPendingActions();
      fetchHistory(); // Refresh history
      
    } catch (error) {
      console.error('Failed to approve action:', error);
      toast.error(error.response?.data?.detail || 'Gagal approve action');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAction) return;
    if (!approvalNotes.trim()) {
      toast.error('Alasan reject wajib diisi');
      return;
    }
    
    const token = localStorage.getItem('admin_token');
    try {
      setProcessing(true);
      
      await axios.put(
        `${API}/api/super-admin/actions/${selectedAction.id}/approve`,
        { action: 'reject', notes: approvalNotes },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success('Action berhasil direject');
      setShowDetailModal(false);
      fetchPendingActions();
      fetchHistory(); // Refresh history
      
    } catch (error) {
      console.error('Failed to reject action:', error);
      toast.error(error.response?.data?.detail || 'Gagal reject action');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewProofEditDetails = (proofEdit) => {
    setSelectedProofEdit(proofEdit);
    setShowProofEditModal(true);
    setProofEditNotes('');
  };

  const handleApproveProofEdit = async () => {
    if (!selectedProofEdit) return;
    
    const token = localStorage.getItem('admin_token');
    try {
      setProcessingProofEdit(true);
      
      await axios.put(
        `${API}/api/super-admin/proof-edits/${selectedProofEdit.proof_id}/approve`,
        { notes: proofEditNotes },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success('Proof edit berhasil diapprove');
      setShowProofEditModal(false);
      fetchPendingProofEdits();
      
    } catch (error) {
      console.error('Failed to approve proof edit:', error);
      toast.error(error.response?.data?.detail || 'Gagal approve proof edit');
    } finally {
      setProcessingProofEdit(false);
    }
  };

  const handleRejectProofEdit = async () => {
    if (!selectedProofEdit) return;
    
    if (!proofEditNotes.trim()) {
      toast.error('Catatan wajib diisi untuk reject');
      return;
    }
    
    const token = localStorage.getItem('admin_token');
    try {
      setProcessingProofEdit(true);
      
      await axios.put(
        `${API}/api/super-admin/proof-edits/${selectedProofEdit.proof_id}/reject`,
        { notes: proofEditNotes },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success('Proof edit berhasil direject');
      setShowProofEditModal(false);
      fetchPendingProofEdits();
      
    } catch (error) {
      console.error('Failed to reject proof edit:', error);
      toast.error(error.response?.data?.detail || 'Gagal reject proof edit');
    } finally {
      setProcessingProofEdit(false);
    }
  };

  // Wallet Deduction Handlers
  const handleViewDeduction = (deduction) => {
    setSelectedDeduction(deduction);
    setShowDeductionModal(true);
    setDeductionNotes('');
  };

  const handleApproveDeduction = async () => {
    if (!selectedDeduction) return;
    
    const token = localStorage.getItem('admin_token');
    try {
      setProcessingDeduction(true);
      
      await axios.put(
        `${API}/api/super-admin/wallet-deductions/${selectedDeduction.id}/approve`,
        { notes: deductionNotes },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success('Wallet deduction berhasil diapprove');
      setShowDeductionModal(false);
      fetchPendingDeductions();
      
    } catch (error) {
      console.error('Failed to approve deduction:', error);
      toast.error(error.response?.data?.detail || 'Gagal approve wallet deduction');
    } finally {
      setProcessingDeduction(false);
    }
  };

  const handleRejectDeduction = async () => {
    if (!selectedDeduction) return;
    
    if (!deductionNotes.trim()) {
      toast.error('Catatan wajib diisi untuk reject');
      return;
    }
    
    const token = localStorage.getItem('admin_token');
    try {
      setProcessingDeduction(true);
      
      await axios.put(
        `${API}/api/super-admin/wallet-deductions/${selectedDeduction.id}/reject`,
        { notes: deductionNotes },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success('Wallet deduction berhasil direject');
      setShowDeductionModal(false);
      fetchPendingDeductions();
      
    } catch (error) {
      console.error('Failed to reject deduction:', error);
      toast.error(error.response?.data?.detail || 'Gagal reject wallet deduction');
    } finally {
      setProcessingDeduction(false);
    }
  };

  const getActionTypeLabel = (type) => {
    const labels = {
      'topup_wallet': 'Top Up Wallet',
      'withdraw_account': 'Withdraw Akun',
      'transfer_wallet_to_account': 'Transfer Wallet ke Akun',
      'proof_edit': 'Edit Bukti Akun',
      'wallet_deduction': 'Kurangi Saldo Wallet'
    };
    return labels[type] || type;
  };

  const getActionIcon = (type) => {
    const icons = {
      'topup_wallet': <Wallet className="h-5 w-5" />,
      'withdraw_account': <Download className="h-5 w-5" />,
      'transfer_wallet_to_account': <ArrowRightLeft className="h-5 w-5" />,
      'proof_edit': <Edit className="h-5 w-5" />,
      'wallet_deduction': <Wallet className="h-5 w-5 text-red-600" />
    };
    return icons[type] || <FileText className="h-5 w-5" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 break-words">Super Admin Approval</h1>
              <p className="text-xs md:text-sm text-gray-600 break-words">Review dan approve admin actions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-blue-50 px-3 md:px-4 py-2 rounded-lg flex-shrink-0 self-start md:self-auto">
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            <span className="text-base md:text-lg font-semibold text-blue-600">{pendingActions.length}</span>
            <span className="text-xs md:text-sm text-gray-600">Pending</span>
          </div>
        </div>
      </div>

      {/* Pending Actions List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">Pending Actions</h2>
        </div>

        {pendingActions.length === 0 ? (
          <div className="text-center py-8 md:py-12 px-4">
            <CheckCircle className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 text-gray-400" />
            <p className="text-sm md:text-base text-gray-500">Tidak ada pending actions</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingActions.map((action) => (
                    <tr key={action.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getActionIcon(action.action_type)}
                          <span className="text-sm font-medium text-gray-900">
                            {getActionTypeLabel(action.action_type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{action.client_name || action.client_username}</div>
                          <div className="text-gray-500">@{action.client_username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{action.admin_username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(action.amount, action.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(action.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(action)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {pendingActions.map((action) => (
                <div key={action.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      {getActionIcon(action.action_type)}
                      <span className="text-sm font-semibold text-gray-900 break-words">
                        {getActionTypeLabel(action.action_type)}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-blue-600 ml-2 flex-shrink-0">
                      {formatCurrency(action.amount, action.currency)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-20 flex-shrink-0">Client:</span>
                      <div className="text-sm min-w-0 flex-1">
                        <div className="font-medium text-gray-900 break-words">{action.client_name || action.client_username}</div>
                        <div className="text-xs text-gray-500 break-all">@{action.client_username}</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-20 flex-shrink-0">Admin:</span>
                      <span className="text-sm text-gray-900 break-words min-w-0 flex-1">{action.admin_username}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-20 flex-shrink-0">Created:</span>
                      <span className="text-xs text-gray-600 break-words min-w-0 flex-1">{formatDate(action.created_at)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewDetails(action)}
                    className="w-full inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                {getActionIcon(selectedAction.action_type)}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base md:text-xl font-bold break-words">{getActionTypeLabel(selectedAction.action_type)}</h3>
                  <p className="text-xs md:text-sm text-blue-100 break-words">Review Request Detail</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1.5 md:p-2 transition-colors flex-shrink-0 ml-2"
              >
                <XCircle className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Client Info */}
              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3 flex items-center">
                  <User className="h-4 w-4 md:h-5 md:w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span className="break-words">Client Information</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Name</p>
                    <p className="text-sm md:text-base font-medium break-words">{selectedAction.client_name || selectedAction.client_username}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Username</p>
                    <p className="text-sm md:text-base font-medium break-all">@{selectedAction.client_username}</p>
                  </div>
                </div>
              </div>

              {/* Admin Info */}
              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3 break-words">Requesting Admin</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Admin</p>
                    <p className="text-sm md:text-base font-medium break-words">{selectedAction.admin_username}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Request Time</p>
                    <p className="text-sm md:text-base font-medium break-words">{formatDate(selectedAction.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="bg-blue-50 rounded-lg p-3 md:p-4">
                <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 md:h-5 md:w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span className="break-words">Transaction Details</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Amount</p>
                    <p className="text-xl md:text-2xl font-bold text-blue-600 break-words">
                      {formatCurrency(selectedAction.amount, selectedAction.currency)}
                    </p>
                  </div>
                  {selectedAction.wallet_type && (
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-500">Wallet Type</p>
                      <p className="text-sm md:text-base font-medium break-words">{selectedAction.wallet_type.replace('_', ' ').toUpperCase()}</p>
                    </div>
                  )}
                  {selectedAction.account_name && (
                    <div className="min-w-0 md:col-span-2">
                      <p className="text-xs md:text-sm text-gray-500">Account</p>
                      <p className="text-sm md:text-base font-medium break-words">{selectedAction.account_name} ({selectedAction.platform?.toUpperCase()})</p>
                    </div>
                  )}
                  {selectedAction.from_wallet && (
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-500">From Wallet</p>
                      <p className="text-sm md:text-base font-medium break-words">{selectedAction.from_wallet.replace('_', ' ').toUpperCase()}</p>
                    </div>
                  )}
                </div>
                {selectedAction.notes && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs md:text-sm text-gray-500">Notes</p>
                    <p className="text-sm md:text-base break-words">{selectedAction.notes}</p>
                  </div>
                )}
              </div>

              {/* Proofs */}
              <div className="space-y-2 md:space-y-3">
                <h4 className="text-sm md:text-base font-semibold text-gray-900">Bukti Upload</h4>
                
                {selectedAction.payment_proof_gcs && (
                  <button
                    onClick={() => handleViewProof(selectedAction.payment_proof_gcs, 'Payment Proof')}
                    className="w-full flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg p-3 md:p-4 hover:border-blue-500 hover:bg-blue-50 transition-all min-w-0"
                  >
                    <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                      <FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-600 flex-shrink-0" />
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-sm md:text-base font-medium text-gray-900 break-words">Bukti Pembayaran</p>
                        <p className="text-xs md:text-sm text-gray-500">Click to view</p>
                      </div>
                    </div>
                    <Eye className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0 ml-2" />
                  </button>
                )}
                
                {selectedAction.real_balance_proof_gcs && (
                  <button
                    onClick={() => handleViewProof(selectedAction.real_balance_proof_gcs, 'Real Balance Proof')}
                    className="w-full flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg p-3 md:p-4 hover:border-blue-500 hover:bg-blue-50 transition-all min-w-0"
                  >
                    <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                      <FileText className="h-5 w-5 md:h-6 md:w-6 text-green-600 flex-shrink-0" />
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-sm md:text-base font-medium text-gray-900 break-words">Bukti Saldo Real</p>
                        <p className="text-xs md:text-sm text-gray-500">Click to view</p>
                      </div>
                    </div>
                    <Eye className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0 ml-2" />
                  </button>
                )}
                
                {selectedAction.spending_limit_proof_gcs && (
                  <button
                    onClick={() => handleViewProof(selectedAction.spending_limit_proof_gcs, 'Spending Limit Proof')}
                    className="w-full flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg p-3 md:p-4 hover:border-blue-500 hover:bg-blue-50 transition-all min-w-0"
                  >
                    <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                      <FileText className="h-5 w-5 md:h-6 md:w-6 text-purple-600 flex-shrink-0" />
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-sm md:text-base font-medium text-gray-900 break-words">Bukti Update Batas Pengeluaran</p>
                        <p className="text-xs md:text-sm text-gray-500">Click to view</p>
                      </div>
                    </div>
                    <Eye className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0 ml-2" />
                  </button>
                )}
                
                {selectedAction.budget_aspire_proof_gcs && (
                  <button
                    onClick={() => handleViewProof(selectedAction.budget_aspire_proof_gcs, 'Budget Aspire Proof')}
                    className="w-full flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg p-3 md:p-4 hover:border-blue-500 hover:bg-blue-50 transition-all min-w-0"
                  >
                    <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                      <FileText className="h-5 w-5 md:h-6 md:w-6 text-orange-600 flex-shrink-0" />
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-sm md:text-base font-medium text-gray-900 break-words">Bukti Update Limit Budget Aspire</p>
                        <p className="text-xs md:text-sm text-gray-500">Click to view</p>
                      </div>
                    </div>
                    <Eye className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0 ml-2" />
                  </button>
                )}
              </div>

              {/* Display Processed Info for completed actions */}
              {selectedAction?.status !== 'pending' && (
                <div className={`rounded-lg p-3 md:p-4 ${
                  selectedAction?.status === 'approved' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3 flex items-center">
                    {selectedAction?.status === 'approved' ? (
                      <>
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 mr-2 text-green-600 flex-shrink-0" />
                        <span className="text-green-700 break-words">Action Approved</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 md:h-5 md:w-5 mr-2 text-red-600 flex-shrink-0" />
                        <span className="text-red-700 break-words">Action Rejected</span>
                      </>
                    )}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-600">Processed By</p>
                      <p className="text-sm md:text-base font-medium text-gray-900 break-words">{selectedAction?.processed_by_name || selectedAction?.super_admin_username || 'Unknown'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-600">Processed At</p>
                      <p className="text-sm md:text-base font-medium text-gray-900 break-words">{formatDate(selectedAction?.processed_at)}</p>
                    </div>
                    {selectedAction?.approval_notes && (
                      <div className="col-span-1 md:col-span-2 min-w-0">
                        <p className="text-xs md:text-sm text-gray-600">Notes</p>
                        <p className="text-sm md:text-base font-medium text-gray-900 mt-1 break-words">{selectedAction?.approval_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Approval Notes - Only show for pending actions */}
              {selectedAction?.status === 'pending' && (
                <div className="min-w-0">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional untuk approve, wajib untuk reject)
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    placeholder="Tambahkan catatan jika diperlukan..."
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-gray-50 px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 border-t">
              <button
                onClick={() => setShowDetailModal(false)}
                disabled={processing}
                className="px-4 md:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm md:text-base"
              >
                {selectedAction?.status === 'pending' ? 'Cancel' : 'Close'}
              </button>
              
              {/* Only show Approve/Reject buttons for pending actions */}
              {selectedAction?.status === 'pending' && (
                <>
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="px-4 md:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center text-sm md:text-base"
                  >
                    {processing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="px-4 md:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center text-sm md:text-base"
                  >
                    {processing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Proof Viewer Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-2 md:p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gray-800 text-white px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
              <h3 className="text-base md:text-xl font-bold break-words min-w-0 flex-1 mr-2">{proofType}</h3>
              <button
                onClick={() => {
                  setShowProofModal(false);
                  if (proofBlob) URL.revokeObjectURL(proofBlob);
                  setProofBlob(null);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1.5 md:p-2 transition-colors flex-shrink-0"
              >
                <XCircle className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-2 md:p-4">
              {loadingProof ? (
                <div className="text-center px-4">
                  {/* Animated Image Placeholder */}
                  <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto mb-4 md:mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        {/* Rotating outer ring */}
                        <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
                        {/* Inner pulsing circle */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base md:text-lg font-semibold text-gray-700 animate-pulse">Loading Proof...</p>
                    <div className="flex justify-center space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              ) : proofBlob ? (
                <img 
                  src={proofBlob} 
                  alt={proofType}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-center px-4">
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-3 md:mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-10 h-10 md:w-12 md:h-12 text-red-600" />
                  </div>
                  <p className="text-sm md:text-base text-gray-600 font-medium">Failed to load proof</p>
                  <p className="text-xs md:text-sm text-gray-500 mt-2">Please try again or contact support</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending Proof Edits Section */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">Pending Proof Edits</h2>
            <div className="flex items-center space-x-2 bg-orange-50 px-3 py-1 rounded-lg self-start">
              <Edit className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-600">{pendingProofEdits.length}</span>
              <span className="text-xs text-gray-600">Pending</span>
            </div>
          </div>
        </div>

        {loadingProofEdits ? (
          <div className="text-center py-8 md:py-12 px-4">
            <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3 md:mb-4"></div>
            <p className="text-sm md:text-base text-gray-600">Loading proof edits...</p>
          </div>
        ) : pendingProofEdits.length === 0 ? (
          <div className="text-center py-8 md:py-12 px-4">
            <CheckCircle className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 text-gray-400" />
            <p className="text-sm md:text-base text-gray-500">Tidak ada pending proof edits</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proof Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingProofEdits.map((proofEdit) => (
                    <tr key={proofEdit.proof_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-orange-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {proofEdit.proof_type === 'spend_limit' ? 'Spending Limit' : 'Budget Aspire'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{proofEdit.account_name || 'N/A'}</div>
                          <div className="text-gray-500 text-xs">{proofEdit.account_id?.substring(0, 12)}...</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{proofEdit.client_name || proofEdit.client_username}</div>
                          <div className="text-gray-500">@{proofEdit.client_username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{proofEdit.requested_by_username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(proofEdit.requested_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewProofEditDetails(proofEdit)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="text-sm">Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {pendingProofEdits.map((proofEdit) => (
                <div key={proofEdit.proof_id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-2 mb-3">
                    <FileText className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-gray-900 break-words">
                        {proofEdit.proof_type === 'spend_limit' ? 'Spending Limit' : 'Budget Aspire'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">Account:</span>
                      <div className="text-sm min-w-0 flex-1">
                        <div className="font-medium text-gray-900 break-words">{proofEdit.account_name || 'N/A'}</div>
                        <div className="text-xs text-gray-500 break-all">{proofEdit.account_id?.substring(0, 12)}...</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">Client:</span>
                      <div className="text-sm min-w-0 flex-1">
                        <div className="font-medium text-gray-900 break-words">{proofEdit.client_name || proofEdit.client_username}</div>
                        <div className="text-xs text-gray-500 break-all">@{proofEdit.client_username}</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">Requested By:</span>
                      <span className="text-sm text-gray-900 break-words min-w-0 flex-1">{proofEdit.requested_by_username}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">Requested At:</span>
                      <span className="text-xs text-gray-600 break-words min-w-0 flex-1">{formatDate(proofEdit.requested_at)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewProofEditDetails(proofEdit)}
                    className="w-full inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Detail
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Proof Edit Detail Modal */}
      {showProofEditModal && selectedProofEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                <Edit className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base md:text-xl font-bold break-words">Proof Edit Request</h3>
                  <p className="text-xs md:text-sm text-orange-100 break-words">
                    {selectedProofEdit.proof_type === 'spend_limit' ? 'Spending Limit Proof' : 'Budget Aspire Proof'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProofEditModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1.5 md:p-2 transition-colors flex-shrink-0 ml-2"
              >
                <XCircle className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Request Info */}
              <div className="bg-orange-50 rounded-lg p-3 md:p-4 border border-orange-200">
                <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3 flex items-center">
                  <FileText className="h-4 w-4 md:h-5 md:w-5 mr-2 text-orange-600 flex-shrink-0" />
                  <span className="break-words">Request Information</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Account Name</p>
                    <p className="text-sm md:text-base font-medium break-words">{selectedProofEdit.account_name || 'N/A'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Proof Type</p>
                    <p className="text-sm md:text-base font-medium break-words">
                      {selectedProofEdit.proof_type === 'spend_limit' ? 'Account Spending Limit' : 'Budget Aspire'}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Requested By</p>
                    <p className="text-sm md:text-base font-medium break-words">{selectedProofEdit.requested_by_username}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Requested At</p>
                    <p className="text-sm md:text-base font-medium break-words">{formatDate(selectedProofEdit.requested_at)}</p>
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3 flex items-center">
                  <User className="h-4 w-4 md:h-5 md:w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span className="break-words">Client Information</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Name</p>
                    <p className="text-sm md:text-base font-medium break-words">{selectedProofEdit.client_name || selectedProofEdit.client_username}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Username</p>
                    <p className="text-sm md:text-base font-medium break-all">@{selectedProofEdit.client_username}</p>
                  </div>
                </div>
              </div>

              {/* Edit Notes */}
              {selectedProofEdit.edit_notes && (
                <div className="bg-blue-50 rounded-lg p-3 md:p-4 border border-blue-200">
                  <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2">Admin's Edit Notes</h4>
                  <p className="text-gray-700 text-xs md:text-sm whitespace-pre-wrap break-words">{selectedProofEdit.edit_notes}</p>
                </div>
              )}

              {/* Proof Files Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Current Proof */}
                <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200">
                  <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3 text-center">Current Proof</h4>
                  {selectedProofEdit.current_gcs_path ? (
                    <button
                      onClick={() => handleViewProof(selectedProofEdit.current_gcs_path, 'Current Proof')}
                      className="w-full px-3 md:px-4 py-2 bg-gray-600 text-white text-sm md:text-base rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Current</span>
                    </button>
                  ) : (
                    <div className="w-full px-3 md:px-4 py-2 bg-gray-300 text-gray-600 text-sm md:text-base rounded-md cursor-not-allowed flex items-center justify-center space-x-2">
                      <XCircle className="h-4 w-4" />
                      <span>No Current Proof</span>
                    </div>
                  )}
                </div>

                {/* New Proof */}
                <div className="bg-orange-50 rounded-lg p-3 md:p-4 border border-orange-200">
                  <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3 text-center">New Proof (Proposed)</h4>
                  {selectedProofEdit.new_gcs_path ? (
                    <button
                      onClick={() => handleViewProof(selectedProofEdit.new_gcs_path, 'New Proof (Proposed)')}
                      className="w-full px-3 md:px-4 py-2 bg-orange-600 text-white text-sm md:text-base rounded-md hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View New</span>
                    </button>
                  ) : (
                    <div className="w-full px-3 md:px-4 py-2 bg-gray-300 text-gray-600 text-sm md:text-base rounded-md cursor-not-allowed flex items-center justify-center space-x-2">
                      <XCircle className="h-4 w-4" />
                      <span>No New Proof</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Approval Notes Input */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Approval Notes (Optional for Approve, Required for Reject)
                </label>
                <textarea
                  value={proofEditNotes}
                  onChange={(e) => setProofEditNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  placeholder="Masukkan catatan approve/reject..."
                />
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 border-t border-gray-200">
              <button
                onClick={() => setShowProofEditModal(false)}
                disabled={processingProofEdit}
                className="px-3 md:px-4 py-2 bg-gray-500 text-white text-sm md:text-base rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectProofEdit}
                disabled={processingProofEdit}
                className="px-3 md:px-4 py-2 bg-red-600 text-white text-sm md:text-base rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {processingProofEdit ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>Reject</span>
              </button>
              <button
                onClick={handleApproveProofEdit}
                disabled={processingProofEdit}
                className="px-3 md:px-4 py-2 bg-green-600 text-white text-sm md:text-base rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {processingProofEdit ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>Approve</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Wallet Deductions Section */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
              <Wallet className="h-4 w-4 md:h-5 md:w-5 mr-2 text-red-600 flex-shrink-0" />
              <span className="break-words">Pending Wallet Deductions</span>
            </h2>
            <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs md:text-sm font-medium self-start">
              {pendingDeductions.length}
            </span>
          </div>
        </div>

        {loadingDeductions ? (
          <div className="px-4 md:px-6 py-8 md:py-12 text-center">
            <RefreshCw className="h-6 w-6 md:h-8 md:w-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-sm md:text-base text-gray-500">Loading...</p>
          </div>
        ) : pendingDeductions.length === 0 ? (
          <div className="px-4 md:px-6 py-8 md:py-12 text-center">
            <CheckCircle className="h-10 w-10 md:h-12 md:w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm md:text-base text-gray-500">Tidak ada pending wallet deductions</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingDeductions.map((deduction) => {
                    const currency = deduction.wallet_type.includes('idr') ? 'IDR' : 'USD';
                    const formattedAmount = formatCurrency(deduction.amount, currency);
                    
                    return (
                      <tr key={deduction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{deduction.client_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 font-medium">
                            {deduction.wallet_type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-red-600">
                            - {formattedAmount}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700 line-clamp-2">{deduction.reason}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{deduction.admin_username}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(deduction.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleViewDeduction(deduction)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {pendingDeductions.map((deduction) => {
                const currency = deduction.wallet_type.includes('idr') ? 'IDR' : 'USD';
                const formattedAmount = formatCurrency(deduction.amount, currency);
                
                return (
                  <div key={deduction.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-900 break-words">{deduction.client_name}</span>
                      </div>
                      <span className="text-base font-bold text-red-600 ml-2 flex-shrink-0">
                        - {formattedAmount}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-start">
                        <span className="text-xs text-gray-500 w-20 flex-shrink-0">Wallet:</span>
                        <span className="text-sm font-medium text-gray-900 break-words min-w-0 flex-1">
                          {deduction.wallet_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-xs text-gray-500 w-20 flex-shrink-0">Reason:</span>
                        <p className="text-sm text-gray-700 break-words min-w-0 flex-1">{deduction.reason}</p>
                      </div>
                      <div className="flex items-start">
                        <span className="text-xs text-gray-500 w-20 flex-shrink-0">Admin:</span>
                        <span className="text-sm text-gray-600 break-words min-w-0 flex-1">{deduction.admin_username}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-xs text-gray-500 w-20 flex-shrink-0">Date:</span>
                        <span className="text-xs text-gray-500 break-words min-w-0 flex-1">
                          {new Date(deduction.created_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewDeduction(deduction)}
                      className="w-full inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Wallet Deduction Detail Modal */}
      {showDeductionModal && selectedDeduction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] md:max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 md:px-6 py-3 md:py-4 flex items-center justify-between rounded-t-lg md:rounded-t-xl">
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                <Wallet className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base md:text-xl font-bold break-words">Review Wallet Deduction</h3>
                  <p className="text-xs md:text-sm text-red-100 break-all">ID: {selectedDeduction.id.substring(0, 8)}...</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeductionModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1.5 md:p-2 transition-colors flex-shrink-0 ml-2"
              >
                <XCircle className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Request Info */}
              <div className="bg-red-50 rounded-lg p-3 md:p-4 border border-red-200">
                <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3 flex items-center">
                  <FileText className="h-4 w-4 md:h-5 md:w-5 mr-2 text-red-600 flex-shrink-0" />
                  <span className="break-words">Request Information</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Client</p>
                    <p className="text-sm md:text-base font-medium break-words">{selectedDeduction.client_name}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Wallet Type</p>
                    <p className="text-sm md:text-base font-medium break-words">{selectedDeduction.wallet_type.replace('_', ' ').toUpperCase()}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Amount</p>
                    <p className="text-base md:text-lg font-bold text-red-600 break-words">
                      - {formatCurrency(selectedDeduction.amount, selectedDeduction.wallet_type.includes('idr') ? 'IDR' : 'USD')}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Requested By</p>
                    <p className="text-sm md:text-base font-medium break-words">{selectedDeduction.admin_username}</p>
                  </div>
                  <div className="col-span-1 md:col-span-2 min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Date</p>
                    <p className="text-sm md:text-base font-medium break-words">{new Date(selectedDeduction.created_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2">Alasan Pengurangan</h4>
                <p className="text-xs md:text-sm text-gray-700 whitespace-pre-wrap break-words">{selectedDeduction.reason}</p>
              </div>

              {/* Proof File */}
              <div className="bg-blue-50 rounded-lg p-3 md:p-4 border border-blue-200">
                <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3 text-center">Bukti/Dokumen</h4>
                <button
                  onClick={() => handleViewProof(selectedDeduction.proof_file_url, 'deduction')}
                  className="w-full px-3 md:px-4 py-2 bg-blue-600 text-white text-sm md:text-base rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Proof</span>
                </button>
              </div>

              {/* Approval Notes Input */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Approval Notes (Optional for Approve, Required for Reject)
                </label>
                <textarea
                  value={deductionNotes}
                  onChange={(e) => setDeductionNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  placeholder="Masukkan catatan approve/reject..."
                />
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 md:p-4">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600 text-base md:text-lg flex-shrink-0">⚠️</span>
                  <div className="text-xs md:text-sm text-yellow-800 min-w-0 flex-1">
                    <p className="font-semibold mb-1">Perhatian:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li className="break-words">Approval akan langsung mengurangi saldo wallet client</li>
                      <li className="break-words">Saldo dapat menjadi minus setelah pengurangan</li>
                      <li className="break-words">Transaksi akan tercatat di riwayat dan wallet statement</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 border-t border-gray-200">
              <button
                onClick={handleRejectDeduction}
                disabled={processingDeduction}
                className="px-3 md:px-4 py-2 bg-red-600 text-white text-sm md:text-base rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {processingDeduction ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>Reject</span>
              </button>
              <button
                onClick={handleApproveDeduction}
                disabled={processingDeduction}
                className="px-3 md:px-4 py-2 bg-green-600 text-white text-sm md:text-base rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {processingDeduction ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>Approve</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions History Section */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">Riwayat Actions</h2>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-xs md:text-sm focus:ring-2 focus:ring-blue-500 self-start sm:self-auto"
          >
            <option value="">Semua Status</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {historyLoading ? (
          <div className="text-center py-8 md:py-12 px-4">
            <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3 md:mb-4"></div>
            <p className="text-sm md:text-base text-gray-600">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 md:py-12 px-4">
            <FileText className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 text-gray-400" />
            <p className="text-sm md:text-base text-gray-500">Tidak ada riwayat actions</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processed By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((action) => (
                    <tr key={action.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {getActionIcon(action.action_type)}
                          <span className="text-sm font-medium text-gray-900">{getActionTypeLabel(action.action_type)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[120px]">
                          <p className="text-sm font-medium text-gray-900 truncate">{action.client_name}</p>
                          <p className="text-xs text-gray-500 truncate">@{action.client_username}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm max-w-[150px]">
                          {action.action_type === 'topup_wallet' && (
                            <p className="text-gray-900 truncate">{action.wallet_type?.replace('_', ' ')}</p>
                          )}
                          {action.action_type === 'withdraw_account' && (
                            <div>
                              <p className="text-gray-900 truncate">{action.account_name}</p>
                              <p className="text-xs text-gray-500">{action.platform}</p>
                            </div>
                          )}
                          {action.action_type === 'transfer_wallet_to_account' && (
                            <div>
                              <p className="text-gray-900 text-xs truncate">From: {action.from_wallet?.replace('_', ' ')}</p>
                              <p className="text-xs text-gray-500 truncate">To: {action.to_account_name}</p>
                            </div>
                          )}
                          {action.action_type === 'proof_edit' && (
                            <div>
                              <p className="text-gray-900 truncate">{action.account_name || 'Account'}</p>
                              <p className="text-xs text-gray-500">{action.proof_type === 'spend_limit' ? 'Spending Limit' : 'Budget Aspire'}</p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          action.action_type === 'wallet_deduction' 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {action.action_type === 'wallet_deduction' ? '- ' : ''}
                          {formatCurrency(action.amount || 0, action.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {action.status === 'approved' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 max-w-[100px] truncate">{action.processed_by_name || '-'}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs text-gray-500">{formatDate(action.processed_at)}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(action)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {history.map((action) => (
                <div key={action.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      {getActionIcon(action.action_type)}
                      <span className="text-sm font-semibold text-gray-900 break-words">
                        {getActionTypeLabel(action.action_type)}
                      </span>
                    </div>
                    {action.status === 'approved' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0 ml-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 flex-shrink-0 ml-2">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejected
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">Client:</span>
                      <div className="text-sm min-w-0 flex-1">
                        <div className="font-medium text-gray-900 break-words">{action.client_name}</div>
                        <div className="text-xs text-gray-500 break-all">@{action.client_username}</div>
                      </div>
                    </div>

                    {/* Details based on action type */}
                    {action.action_type === 'topup_wallet' && (
                      <div className="flex items-start">
                        <span className="text-xs text-gray-500 w-24 flex-shrink-0">Wallet:</span>
                        <span className="text-sm text-gray-900 break-words min-w-0 flex-1">
                          {action.wallet_type?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {action.action_type === 'withdraw_account' && (
                      <div className="flex items-start">
                        <span className="text-xs text-gray-500 w-24 flex-shrink-0">Account:</span>
                        <div className="text-sm min-w-0 flex-1">
                          <div className="font-medium text-gray-900 break-words">{action.account_name}</div>
                          <div className="text-xs text-gray-500">{action.platform}</div>
                        </div>
                      </div>
                    )}

                    {action.action_type === 'transfer_wallet_to_account' && (
                      <div className="flex items-start">
                        <span className="text-xs text-gray-500 w-24 flex-shrink-0">Transfer:</span>
                        <div className="text-xs min-w-0 flex-1">
                          <div className="text-gray-900 break-words">From: {action.from_wallet?.replace('_', ' ')}</div>
                          <div className="text-gray-500 break-words">To: {action.to_account_name}</div>
                        </div>
                      </div>
                    )}

                    {action.action_type === 'proof_edit' && (
                      <div className="flex items-start">
                        <span className="text-xs text-gray-500 w-24 flex-shrink-0">Proof Edit:</span>
                        <div className="text-sm min-w-0 flex-1">
                          <div className="font-medium text-gray-900 break-words">{action.account_name || 'Account'}</div>
                          <div className="text-xs text-gray-500">
                            {action.proof_type === 'spend_limit' ? 'Spending Limit' : 'Budget Aspire'}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">Amount:</span>
                      <span className={`text-sm font-bold break-words min-w-0 flex-1 ${
                        action.action_type === 'wallet_deduction' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {action.action_type === 'wallet_deduction' ? '- ' : ''}
                        {formatCurrency(action.amount || 0, action.currency)}
                      </span>
                    </div>

                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">Processed By:</span>
                      <span className="text-sm text-gray-900 break-words min-w-0 flex-1">
                        {action.processed_by_name || '-'}
                      </span>
                    </div>

                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">Date:</span>
                      <span className="text-xs text-gray-600 break-words min-w-0 flex-1">
                        {formatDate(action.processed_at)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewDetails(action)}
                    className="w-full inline-flex items-center justify-center px-3 py-2 text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Detail
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="px-4 md:px-6 py-3 bg-white border-t border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center text-xs md:text-sm text-gray-700 space-y-2 sm:space-y-0">
                <span className="break-words">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalHistory)} dari {totalHistory} data
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="sm:ml-4 border border-gray-300 rounded px-2 py-1 text-xs md:text-sm"
                >
                  <option value={10}>10 per halaman</option>
                  <option value={25}>25 per halaman</option>
                  <option value={50}>50 per halaman</option>
                  <option value={100}>100 per halaman</option>
                </select>
              </div>

              <div className="flex items-center justify-center space-x-1 md:space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 md:px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 text-xs md:text-sm"
                >
                  ««
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 md:px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 text-xs md:text-sm"
                >
                  «
                </button>
                
                {(() => {
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
                        onClick={() => setCurrentPage(i)}
                        className={`px-2 md:px-3 py-1 rounded border text-xs md:text-sm ${
                          currentPage === i
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pages;
                })()}
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 md:px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 text-xs md:text-sm"
                >
                  »
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 md:px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 text-xs md:text-sm"
                >
                  »»
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SuperAdminApproval;
