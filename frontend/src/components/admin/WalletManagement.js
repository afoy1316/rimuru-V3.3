import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";
import AuthenticatedImage from "../ui/AuthenticatedImage";
import { 
  Clock, 
  CheckCircle, 
  Upload, 
  AlertCircle,
  Eye,
  Search,
  Filter,
  DollarSign,
  Banknote,
  User,
  FileText,
  Check,
  X,
  Wallet,
  ArrowRightLeft,
  RefreshCw,
  Download
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WalletManagement = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Common states
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('topup');
  
  // Wallet Top-Up states
  const [walletTopUps, setWalletTopUps] = useState([]);
  const [selectedTopUp, setSelectedTopUp] = useState(null);
  const [topUpStatusFilter, setTopUpStatusFilter] = useState('');
  const [topUpSearchTerm, setTopUpSearchTerm] = useState('');
  const [topUpVerificationModal, setTopUpVerificationModal] = useState(false);
  const [topUpVerificationData, setTopUpVerificationData] = useState({ status: '', admin_notes: '' });
  const [processing, setProcessing] = useState(false);
  
  // Wallet Transfer states  
  const [walletTransfers, setWalletTransfers] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [transferStatusFilter, setTransferStatusFilter] = useState('');
  const [transferSearchTerm, setTransferSearchTerm] = useState('');
  const [transferVerificationModal, setTransferVerificationModal] = useState(false);
  const [transferVerificationData, setTransferVerificationData] = useState({ status: '', admin_notes: '' });
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);
  
  // File uploads for verification (only for transfers)
  const [spendLimitProof, setSpendLimitProof] = useState(null);
  const [budgetAspireProof, setBudgetAspireProof] = useState(null);
  const [spendLimitPreview, setSpendLimitPreview] = useState(null);
  const [budgetAspirePreview, setBudgetAspirePreview] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [proofPreviewModal, setProofPreviewModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    fetchWalletTopUps();
    fetchWalletTransfers();
  }, []);

  // Cleanup blob URL when modal closes
  useEffect(() => {
    if (!proofPreviewModal && previewImageUrl && previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl);
      setPreviewImageUrl('');
    }
  }, [proofPreviewModal, previewImageUrl]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWalletTopUps();
      fetchWalletTransfers();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchWalletTopUps = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/wallet-topup-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWalletTopUps(response.data);
    } catch (error) {
      console.error('Error fetching wallet top-ups:', error);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      } else {
        toast.error('Failed to load wallet top-ups');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletTransfers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/wallet-transfer-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWalletTransfers(response.data);
    } catch (error) {
      console.error('Error fetching wallet transfers:', error);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      } else {
        toast.error('Failed to load wallet transfers');
      }
    }
  };

  // Filter and pagination for wallet top-ups
  const filteredTopUps = useMemo(() => {
    return walletTopUps.filter(topup => {
      const matchesStatus = !topUpStatusFilter || topup.status === topUpStatusFilter;
      const matchesSearch = !topUpSearchTerm || 
        topup.user.username.toLowerCase().includes(topUpSearchTerm.toLowerCase()) ||
        topup.user.email.toLowerCase().includes(topUpSearchTerm.toLowerCase()) ||
        (topup.reference_code && topup.reference_code.toLowerCase().includes(topUpSearchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [walletTopUps, topUpStatusFilter, topUpSearchTerm]);

  const paginatedTopUps = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTopUps.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTopUps, currentPage, itemsPerPage]);

  // Filter and pagination for wallet transfers  
  const filteredTransfers = useMemo(() => {
    return walletTransfers.filter(transfer => {
      const matchesStatus = !transferStatusFilter || transfer.status === transferStatusFilter;
      const matchesSearch = !transferSearchTerm || 
        transfer.user.username.toLowerCase().includes(transferSearchTerm.toLowerCase()) ||
        transfer.user.email.toLowerCase().includes(transferSearchTerm.toLowerCase()) ||
        transfer.target_account.name.toLowerCase().includes(transferSearchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [walletTransfers, transferStatusFilter, transferSearchTerm]);

  const paginatedTransfers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransfers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransfers, currentPage, itemsPerPage]);

  // Status badge component
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      proof_uploaded: { label: 'Review Required', color: 'bg-blue-100 text-blue-800' },
      verified: { label: 'Verified', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  // Format currency
  const formatCurrency = (amount, currency) => {
    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Download file helper
  const downloadFile = async (url, filename) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  // Handle wallet top-up verification
  const handleTopUpVerification = async () => {
    if (!selectedTopUp || !topUpVerificationData.status) {
      toast.error('Please select verification status');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      await axios.put(
        `${API}/admin/wallet-topup-requests/${selectedTopUp.id}/status`,
        topUpVerificationData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success(`Wallet top-up ${topUpVerificationData.status} successfully!`);
      setTopUpVerificationModal(false);
      setTopUpVerificationData({ status: '', admin_notes: '' });
      fetchWalletTopUps();
      setSelectedTopUp(null);
    } catch (error) {
      console.error('Error verifying wallet top-up:', error);
      toast.error(error.response?.data?.detail || 'Failed to verify wallet top-up');
    } finally {
      setProcessing(false);
    }
  };

  // Handle file upload for wallet transfers
  const handleFileUpload = async (file, type) => {
    if (!file) return null;
    
    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);  // Add type as form data, not query param
      
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(
        `${API}/admin/wallet-transfers/${selectedTransfer.id}/upload-verification-files`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data.file_path;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Failed to upload ${type} file`);
      return null;
    } finally {
      setFileUploading(false);
    }
  };

  // Handle wallet transfer verification
  const handleTransferVerification = async () => {
    if (!selectedTransfer || !transferVerificationData.status) {
      toast.error('Please select verification status');
      return;
    }

    // Check required files for approval - either new files OR existing files on server
    if (transferVerificationData.status === 'approved') {
      const hasSpendLimitFile = spendLimitProof || selectedTransfer.spend_limit_proof_url;
      const hasBudgetAspireFile = budgetAspireProof || selectedTransfer.budget_aspire_proof_url;
      
      if (!hasSpendLimitFile || !hasBudgetAspireFile) {
        toast.error('Bukti update batas pengeluaran dan budget aspire wajib diupload untuk approve transfer');
        return;
      }
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      let uploadedFiles = {};
      
      // Upload files if approving and new files are provided
      if (transferVerificationData.status === 'approved') {
        // Upload spend limit proof if new file provided
        if (spendLimitProof) {
          const spendLimitPath = await handleFileUpload(spendLimitProof, 'spend_limit_proof');
          if (!spendLimitPath) {
            setProcessing(false);
            return;
          }
          uploadedFiles.spend_limit_proof_path = spendLimitPath;
        }
        
        // Upload budget aspire proof if new file provided
        if (budgetAspireProof) {
          const budgetAspirePath = await handleFileUpload(budgetAspireProof, 'budget_aspire_proof');
          if (!budgetAspirePath) {
            setProcessing(false);
            return;
          }
          uploadedFiles.budget_aspire_proof_path = budgetAspirePath;
        }
      }
      
      await axios.put(
        `${API}/admin/wallet-transfer-requests/${selectedTransfer.id}/status`,
        {
          ...transferVerificationData,
          ...uploadedFiles
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success(`Wallet transfer ${transferVerificationData.status} successfully!`);
      setTransferVerificationModal(false);
      setTransferVerificationData({ status: '', admin_notes: '' });
      setSpendLimitProof(null);
      setBudgetAspireProof(null);
      setSpendLimitPreview(null);
      setBudgetAspirePreview(null);
      fetchWalletTransfers();
      setSelectedTransfer(null);
    } catch (error) {
      console.error('Error verifying wallet transfer:', error);
      toast.error(error.response?.data?.detail || 'Failed to verify wallet transfer');
    } finally {
      setProcessing(false);
    }
  };

  const handleTransferReview = (transfer) => {
    setSelectedTransfer(transfer);
    
    // Check if status is approved or rejected (view-only mode)
    const isReadOnly = transfer.status === 'approved' || transfer.status === 'rejected';
    setIsViewOnlyMode(isReadOnly);
    
    if (!isReadOnly) {
      // Only reset for pending requests
      setTransferVerificationData({ status: '', admin_notes: '' });
      // Reset file states untuk request baru
      setSpendLimitProof(null);
      setBudgetAspireProof(null);
      setSpendLimitPreview(null);
      setBudgetAspirePreview(null);
    }
    
    setTransferVerificationModal(true);
  };

  // View wallet top-up proof
  const viewTopUpProof = async (topUpId) => {
    try {
      const token = localStorage.getItem('admin_token');
      
      // Fetch the image as blob with proper authorization header
      const response = await fetch(`${API}/admin/wallet-topup-requests/${topUpId}/payment-proof`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch proof: ${response.status} ${response.statusText}`);
        throw new Error('Failed to load proof image');
      }
      
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      setPreviewImageUrl(imageUrl);
      setProofPreviewModal(true);
      
    } catch (error) {
      console.error('Error loading proof image:', error);
      toast.error('Gagal memuat gambar bukti. Silakan coba lagi.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading wallet management...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet Management</h1>
          <p className="text-gray-600">Kelola permintaan top-up wallet dan transfer</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <RefreshCw className="w-4 h-4" />
          Auto-refresh aktif
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="topup" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Wallet Top-Up ({walletTopUps.length})
            {walletTopUps.filter(t => t.status === 'pending').length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-yellow-500 text-white rounded-full animate-pulse">
                {walletTopUps.filter(t => t.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="transfer" className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Wallet Transfer ({walletTransfers.length})
            {walletTransfers.filter(t => t.status === 'pending').length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-yellow-500 text-white rounded-full animate-pulse">
                {walletTransfers.filter(t => t.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Wallet Top-Up Tab */}
        <TabsContent value="topup" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Username, email, atau kode referensi..."
                      value={topUpSearchTerm}
                      onChange={(e) => setTopUpSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    value={topUpStatusFilter}
                    onChange={(e) => setTopUpStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="proof_uploaded">Review Required</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top-Up Requests List */}
          {filteredTopUps.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Wallet Top-Up Requests</h3>
                <p className="text-gray-500">No wallet top-up requests match your current filters.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {paginatedTopUps.map((topup) => (
                <Card key={topup.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-purple-500" />
                          <CardTitle className="text-lg">
                            {formatCurrency(topup.amount, topup.currency)}
                          </CardTitle>
                          <Badge variant="outline" className="ml-2">
                            {topup.wallet_type} wallet
                          </Badge>
                        </div>
                        {getStatusBadge(topup.status)}
                      </div>
                      <div className="flex flex-col sm:text-right">
                        <div className="font-mono text-sm text-gray-500">
                          {topup.reference_code || topup.id.substring(0, 8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(topup.created_at)}
                        </div>
                        {topup.verified_by && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            Verified by: {topup.verified_by.name || topup.verified_by.username}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">{topup.user.username}</span>
                          <span className="break-all">({topup.user.email})</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{topup.payment_method}</span>
                          </div>
                          {topup.currency === 'IDR' && topup.unique_code > 0 && (
                            <div className="text-sm text-blue-600">
                              Kode: +{topup.unique_code}
                            </div>
                          )}
                          {topup.payment_proof.uploaded && (
                            <div className="flex items-center gap-1 text-blue-600 text-sm">
                              <Upload className="w-3 h-3" />
                              <span>Proof uploaded</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {topup.payment_proof.uploaded && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewTopUpProof(topup.id)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('admin_token');
                                  const response = await axios.get(
                                    `${API}/admin/wallet-topup-request/${topup.id}/invoice`,
                                    {
                                      headers: { Authorization: `Bearer ${token}` },
                                      responseType: 'blob'
                                    }
                                  );
                                  
                                  // Create blob URL and trigger download
                                  const url = window.URL.createObjectURL(new Blob([response.data]));
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.setAttribute('download', `wallet_invoice_${topup.reference_code || topup.id}.pdf`);
                                  document.body.appendChild(link);
                                  link.click();
                                  link.remove();
                                  window.URL.revokeObjectURL(url);
                                  
                                  toast.success('Invoice downloaded successfully');
                                } catch (error) {
                                  console.error('Error downloading invoice:', error);
                                  toast.error('Failed to download invoice');
                                }
                              }}
                              className="flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Invoice
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTopUp(topup);
                            setTopUpVerificationModal(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination for Top-Ups */}
          {filteredTopUps.length > 0 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-xl">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(Math.ceil(filteredTopUps.length / itemsPerPage), currentPage + 1))}
                    disabled={currentPage === Math.ceil(filteredTopUps.length / itemsPerPage)}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lanjutkan
                  </button>
                </div>
                
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-4">
                    <p className="text-sm text-gray-700">
                      Menampilkan{' '}
                      <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>
                      {' '}ke{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredTopUps.length)}
                      </span>
                      {' '}dari{' '}
                      <span className="font-medium">{filteredTopUps.length}</span> hasil
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
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
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
                      
                      {(() => {
                        const totalPages = Math.ceil(filteredTopUps.length / itemsPerPage);
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
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(Math.ceil(filteredTopUps.length / itemsPerPage), currentPage + 1))}
                        disabled={currentPage === Math.ceil(filteredTopUps.length / itemsPerPage)}
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
          )}
        </TabsContent>

        {/* Wallet Transfer Tab */}
        <TabsContent value="transfer" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Username, email, atau nama akun..."
                      value={transferSearchTerm}
                      onChange={(e) => setTransferSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    value={transferStatusFilter}
                    onChange={(e) => setTransferStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transfer Requests List */}
          {filteredTransfers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ArrowRightLeft className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Wallet Transfer Requests</h3>
                <p className="text-gray-500">No wallet transfer requests match your current filters.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {paginatedTransfers.map((transfer) => (
                <Card key={transfer.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                          <CardTitle className="text-lg">
                            {formatCurrency(transfer.amount, transfer.currency)}
                          </CardTitle>
                          <Badge variant="outline" className="ml-2">
                            {transfer.source_wallet_type} → {transfer.target_account.platform}
                          </Badge>
                        </div>
                        {getStatusBadge(transfer.status)}
                      </div>
                      <div className="flex flex-col sm:text-right">
                        <div className="font-mono text-sm text-gray-500">
                          {transfer.id.substring(0, 8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(transfer.created_at)}
                        </div>
                        {transfer.verified_by && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 sm:justify-end mt-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            Diproses oleh: {transfer.verified_by.name || transfer.verified_by.username}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">{transfer.user.username}</span>
                          <span className="break-all">({transfer.user.email})</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Ke: {transfer.target_account.name}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTransferReview(transfer)}
                          className="flex items-center gap-1"
                        >
                          {transfer.status === 'pending' ? (
                            <>
                              <FileText className="w-3 h-3" />
                              Review
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              View
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination for Transfers */}
          {filteredTransfers.length > 0 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-xl">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(Math.ceil(filteredTransfers.length / itemsPerPage), currentPage + 1))}
                    disabled={currentPage === Math.ceil(filteredTransfers.length / itemsPerPage)}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lanjutkan
                  </button>
                </div>
                
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-4">
                    <p className="text-sm text-gray-700">
                      Menampilkan{' '}
                      <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>
                      {' '}ke{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredTransfers.length)}
                      </span>
                      {' '}dari{' '}
                      <span className="font-medium">{filteredTransfers.length}</span> hasil
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
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
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
                      
                      {(() => {
                        const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);
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
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(Math.ceil(filteredTransfers.length / itemsPerPage), currentPage + 1))}
                        disabled={currentPage === Math.ceil(filteredTransfers.length / itemsPerPage)}
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
          )}
        </TabsContent>
      </Tabs>

      {/* Wallet Top-Up Verification Modal */}
      {selectedTopUp && (
        <Dialog open={topUpVerificationModal} onOpenChange={setTopUpVerificationModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Verify Wallet Top-Up</DialogTitle>
              <DialogDescription>
                Review and verify the wallet top-up request for {selectedTopUp?.user?.username}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Top-Up Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">User:</span>
                  <div className="font-medium">{selectedTopUp.user.username}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Amount:</span>
                  <div className="font-medium">{formatCurrency(selectedTopUp.amount, selectedTopUp.currency)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Wallet Type:</span>
                  <div className="font-medium capitalize">{selectedTopUp.wallet_type}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Payment Method:</span>
                  <div className="font-medium">{selectedTopUp.payment_method}</div>
                </div>
                {selectedTopUp.currency === 'IDR' && selectedTopUp.unique_code > 0 && (
                  <>
                    <div>
                      <span className="text-sm text-gray-500">Kode Unik:</span>
                      <div className="font-medium">+{selectedTopUp.unique_code}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Total + Kode:</span>
                      <div className="font-medium">{formatCurrency(selectedTopUp.total_with_unique_code, selectedTopUp.currency)}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Bank/Wallet Details */}
              {selectedTopUp.currency === 'IDR' ? (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Bank Transfer Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Bank:</span> {selectedTopUp.bank_name}</div>
                    <div><span className="text-gray-500">Account:</span> {selectedTopUp.bank_account}</div>
                    <div className="col-span-2"><span className="text-gray-500">Holder:</span> {selectedTopUp.bank_holder}</div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2">Crypto Wallet Details</h4>
                  <div className="text-sm space-y-1">
                    <div><span className="text-gray-500">Network:</span> {selectedTopUp.network}</div>
                    <div><span className="text-gray-500">Wallet:</span> {selectedTopUp.wallet_name}</div>
                    <div><span className="text-gray-500">Address:</span> <span className="font-mono text-xs break-all">{selectedTopUp.wallet_address}</span></div>
                  </div>
                </div>
              )}

              {/* Verification Form */}
              <div className="space-y-4">
                <div>
                  <Label>Verification Status</Label>
                  <select
                    value={topUpVerificationData.status}
                    onChange={(e) => setTopUpVerificationData({...topUpVerificationData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Status</option>
                    <option value="verified">Approve & Add to Wallet</option>
                    <option value="rejected">Reject</option>
                  </select>
                </div>

                <div>
                  <Label>Admin Notes</Label>
                  <Textarea
                    placeholder="Optional notes about the verification..."
                    value={topUpVerificationData.admin_notes}
                    onChange={(e) => setTopUpVerificationData({...topUpVerificationData, admin_notes: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setTopUpVerificationModal(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleTopUpVerification}
                  disabled={processing || !topUpVerificationData.status}
                  className={topUpVerificationData.status === 'verified' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {processing ? 'Processing...' : `${topUpVerificationData.status === 'verified' ? 'Approve' : 'Reject'} Top-Up`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Wallet Transfer Verification Modal */}
      {selectedTransfer && (
        <Dialog open={transferVerificationModal} onOpenChange={setTransferVerificationModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isViewOnlyMode ? 'View Transfer Details' : 'Verify Wallet Transfer'}
              </DialogTitle>
              <DialogDescription>
                {isViewOnlyMode 
                  ? `View transfer details for ${selectedTransfer?.user?.username}`
                  : `Review and verify the wallet transfer request for ${selectedTransfer?.user?.username}`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Transfer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">User:</span>
                  <div className="font-medium text-gray-900">{selectedTransfer.user.username}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Amount:</span>
                  <div className="font-medium text-gray-900">{formatCurrency(selectedTransfer.amount, selectedTransfer.currency)}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">From Wallet:</span>
                  <div className="font-medium text-gray-900 capitalize">{selectedTransfer.source_wallet_type}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">To Account:</span>
                  <div className="font-medium text-gray-900">{selectedTransfer.target_account.name}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Ad Account ID:</span>
                  <div className="font-mono text-sm font-medium text-blue-600">
                    {selectedTransfer.target_account?.account_id || 'N/A'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Platform:</span>
                  <div className="font-medium text-gray-900 capitalize">{selectedTransfer.target_account.platform}</div>
                </div>
              </div>

              {/* Existing Verification Files (if any) */}
              {(selectedTransfer.spend_limit_proof_url || selectedTransfer.budget_aspire_proof_url) && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Uploaded Verification Files
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTransfer.spend_limit_proof_url && (
                      <div className="bg-white rounded-lg border p-3 space-y-3">
                        <div className="text-sm font-medium text-gray-700">Bukti Batas Pengeluaran</div>
                        <div className="relative aspect-video bg-gray-100 rounded overflow-hidden">
                          <AuthenticatedImage
                            src={`${BACKEND_URL}/api/admin/wallet-transfers/${selectedTransfer.id}/proof/spend_limit`}
                            alt="Spend Limit Proof"
                            className="w-full h-full object-contain"
                            fallbackText="Preview not available"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem('admin_token');
                                const response = await fetch(`${BACKEND_URL}/api/admin/wallet-transfers/${selectedTransfer.id}/proof/spend_limit`, {
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (!response.ok) throw new Error('Failed to load');
                                const blob = await response.blob();
                                const imageUrl = URL.createObjectURL(blob);
                                setPreviewImageUrl(imageUrl);
                                setProofPreviewModal(true);
                              } catch (error) {
                                console.error('Error loading proof:', error);
                                toast.error('Gagal memuat gambar');
                              }
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              const fullUrl = `${BACKEND_URL}/api/admin/wallet-transfers/${selectedTransfer.id}/proof/spend_limit`;
                              downloadFile(fullUrl, `spend_limit_proof_${selectedTransfer.id}.jpg`);
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedTransfer.budget_aspire_proof_url && (
                      <div className="bg-white rounded-lg border p-3 space-y-3">
                        <div className="text-sm font-medium text-gray-700">Bukti Budget Aspire</div>
                        <div className="relative aspect-video bg-gray-100 rounded overflow-hidden">
                          <AuthenticatedImage
                            src={`${BACKEND_URL}/api/admin/wallet-transfers/${selectedTransfer.id}/proof/budget_aspire`}
                            alt="Budget Aspire Proof"
                            className="w-full h-full object-contain"
                            fallbackText="Preview not available"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem('admin_token');
                                const response = await fetch(`${BACKEND_URL}/api/admin/wallet-transfers/${selectedTransfer.id}/proof/budget_aspire`, {
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (!response.ok) throw new Error('Failed to load');
                                const blob = await response.blob();
                                const imageUrl = URL.createObjectURL(blob);
                                setPreviewImageUrl(imageUrl);
                                setProofPreviewModal(true);
                              } catch (error) {
                                console.error('Error loading proof:', error);
                                toast.error('Gagal memuat gambar');
                              }
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              const fullUrl = `${BACKEND_URL}/api/admin/wallet-transfers/${selectedTransfer.id}/proof/budget_aspire`;
                              downloadFile(fullUrl, `budget_aspire_proof_${selectedTransfer.id}.jpg`);
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* File Upload Requirements - Hanya muncul jika mode edit */}
              {!isViewOnlyMode && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Required Files for Approval</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Kedua file wajib diupload untuk approve transfer ke akun
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Bukti Update Batas Pengeluaran Akun</Label>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setSpendLimitProof(file);
                        // Create preview URL
                        if (file && file.type.startsWith('image/')) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSpendLimitPreview(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="mt-1"
                      disabled={selectedTransfer?.spend_limit_proof_url !== undefined && selectedTransfer?.spend_limit_proof_url !== null}
                    />
                    {spendLimitPreview && (
                      <div className="mt-2 relative">
                        <img 
                          src={spendLimitPreview} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded border"
                        />
                        {/* Remove button - hanya jika belum di-upload ke server */}
                        {!selectedTransfer?.spend_limit_proof_url && (
                          <button
                            onClick={() => {
                              setSpendLimitProof(null);
                              setSpendLimitPreview(null);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-sm"
                          >
                            ×
                          </button>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPreviewImageUrl(spendLimitPreview);
                              setProofPreviewModal(true);
                            }}
                            className="flex-1"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = spendLimitPreview;
                              link.download = `spend_limit_proof_preview.jpg`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="flex-1"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Bukti Update Budget Limit Aspire</Label>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setBudgetAspireProof(file);
                        // Create preview URL
                        if (file && file.type.startsWith('image/')) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setBudgetAspirePreview(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="mt-1"
                      disabled={selectedTransfer?.budget_aspire_proof_url !== undefined && selectedTransfer?.budget_aspire_proof_url !== null}
                    />
                    {budgetAspirePreview && (
                      <div className="mt-2 relative">
                        <img 
                          src={budgetAspirePreview} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded border"
                        />
                        {/* Remove button - hanya jika belum di-upload ke server */}
                        {!selectedTransfer?.budget_aspire_proof_url && (
                          <button
                            onClick={() => {
                              setBudgetAspireProof(null);
                              setBudgetAspirePreview(null);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-sm"
                          >
                            ×
                          </button>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPreviewImageUrl(budgetAspirePreview);
                              setProofPreviewModal(true);
                            }}
                            className="flex-1"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = budgetAspirePreview;
                              link.download = `budget_aspire_proof_preview.jpg`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="flex-1"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* Verification Form - Hanya muncul jika mode edit */}
              {!isViewOnlyMode && (
                <div className="space-y-4">
                  <div>
                    <Label>Verification Status</Label>
                    <select
                      value={transferVerificationData.status}
                      onChange={(e) => setTransferVerificationData({...transferVerificationData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Status</option>
                      <option value="approved">Approve Transfer</option>
                      <option value="rejected">Reject Transfer</option>
                    </select>
                  </div>

                  <div>
                    <Label>Admin Notes</Label>
                    <Textarea
                      placeholder="Optional notes about the verification..."
                      value={transferVerificationData.admin_notes}
                      onChange={(e) => setTransferVerificationData({...transferVerificationData, admin_notes: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setTransferVerificationModal(false)}
                  disabled={processing || fileUploading}
                >
                  {isViewOnlyMode ? 'Close' : 'Cancel'}
                </Button>
                {!isViewOnlyMode && (
                  <Button 
                    onClick={handleTransferVerification}
                    disabled={processing || fileUploading || !transferVerificationData.status}
                    className={transferVerificationData.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {processing || fileUploading ? 'Processing...' : `${transferVerificationData.status === 'approved' ? 'Approve' : 'Reject'} Transfer`}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Proof Preview Modal */}
      <Dialog open={proofPreviewModal} onOpenChange={setProofPreviewModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bukti Transfer</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto">
            <img 
              src={previewImageUrl} 
              alt="Payment proof" 
              className="w-full h-auto"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div style={{display: 'none'}} className="text-center text-gray-500 py-8">
              Unable to load image preview
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                const link = document.createElement('a');
                link.href = previewImageUrl;
                link.download = `bukti_transfer_${Date.now()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              onClick={() => setProofPreviewModal(false)}
              className="flex items-center gap-2"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletManagement;