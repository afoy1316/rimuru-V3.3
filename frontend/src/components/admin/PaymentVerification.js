import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";
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
  Download
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentVerification = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const downloadInvoice = async (paymentId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${BACKEND_URL}/api/admin/topup-request/${paymentId}/invoice`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoice_${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(t('invoiceDownloaded'));
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error(t('errorDownloadingInvoice'));
    }
  };
  
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationModal, setVerificationModal] = useState(false);
  const [verificationData, setVerificationData] = useState({ status: '', admin_notes: '' });
  const [processing, setProcessing] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [paginatedPayments, setPaginatedPayments] = useState([]);
  
  // File uploads for verification
  const [spendLimitProof, setSpendLimitProof] = useState(null);
  const [budgetAspireProof, setBudgetAspireProof] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [proofPreviewModal, setProofPreviewModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  // Auto-refresh payments every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPayments();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Pagination effect
  useEffect(() => {
    const filteredPayments = payments.filter(payment => {
      const matchesSearch = payment.reference_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payment.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payment.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredPayments.slice(startIndex, endIndex);
    setPaginatedPayments(paginated);
  }, [payments, searchTerm, statusFilter, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: statusFilter ? { status: statusFilter } : {}
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentDetail = async (paymentId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedPayment(response.data);
    } catch (error) {
      console.error('Error fetching payment detail:', error);
      toast.error('Failed to load payment details');
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return null;
    
    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(
        `${API}/admin/payments/${selectedPayment.id}/upload-verification-files`,
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

  const handleVerification = async () => {
    if (!selectedPayment || !verificationData.status) {
      toast.error('Please select verification status');
      return;
    }

    // Check required files for approval
    if (verificationData.status === 'verified' && (!spendLimitProof || !budgetAspireProof)) {
      toast.error('Bukti update batas pengeluaran dan budget aspire wajib diupload untuk approve payment');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      let uploadedFiles = {};
      
      // Upload files if approving
      if (verificationData.status === 'verified') {
        // Upload spend limit proof
        const spendLimitPath = await handleFileUpload(spendLimitProof, 'spend_limit_proof');
        if (!spendLimitPath) {
          setProcessing(false);
          return;
        }
        
        // Upload budget aspire proof
        const budgetAspirePath = await handleFileUpload(budgetAspireProof, 'budget_aspire_proof');
        if (!budgetAspirePath) {
          setProcessing(false);
          return;
        }
        
        uploadedFiles = {
          spend_limit_proof_path: spendLimitPath,
          budget_aspire_proof_path: budgetAspirePath
        };
      }
      
      await axios.put(
        `${API}/admin/payments/${selectedPayment.id}/verify`,
        {
          ...verificationData,
          ...uploadedFiles
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success(`Payment ${verificationData.status} successfully!`);
      setVerificationModal(false);
      setVerificationData({ status: '', admin_notes: '' });
      setSpendLimitProof(null);
      setBudgetAspireProof(null);
      fetchPayments();
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error(error.response?.data?.detail || 'Failed to verify payment');
    } finally {
      setProcessing(false);
    }
  };

  const viewProofFile = (paymentId) => {
    const token = localStorage.getItem('admin_token');
    // Create a blob URL for the image with proper authentication
    const fetchImageBlob = async () => {
      try {
        const response = await axios.get(`${API}/admin/payments/${paymentId}/proof-file`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });
        const imageUrl = URL.createObjectURL(response.data);
        setPreviewImageUrl(imageUrl);
        setProofPreviewModal(true);
      } catch (error) {
        console.error('Error loading image:', error);
        toast.error('Failed to load payment proof image');
      }
    };
    
    fetchImageBlob();
  };

  const downloadProofFile = (paymentId) => {
    const token = localStorage.getItem('admin_token');
    
    // Download file with proper authentication
    const downloadFile = async () => {
      try {
        const response = await axios.get(`${API}/admin/payments/${paymentId}/proof-file`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payment_proof_${paymentId}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading file:', error);
        toast.error('Failed to download payment proof');
      }
    };
    
    downloadFile();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Waiting Payment
          </Badge>
        );
      case 'proof_uploaded':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-300">
            <Upload className="w-3 h-3 mr-1" />
            Review Required
          </Badge>
        );
      case 'verified':
        return (
          <Badge variant="outline" className="text-green-600 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-600 border-red-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  const formatCurrency = (amount, currency) => {
    const symbol = currency === 'IDR' ? 'Rp' : '$';
    return `${symbol} ${amount.toLocaleString()}`;
  };

  // Calculate filtered payments for pagination
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.reference_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Payment Verification</h1>
          <p className="text-gray-600">Review and verify client payment requests</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Auto-refresh aktif</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by reference code, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-auto sm:min-w-[200px]">
              <Label>Status</Label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  // Auto-refresh when filter changes
                  setTimeout(fetchPayments, 100);
                }}
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

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Payment Requests</h3>
            <p className="text-gray-500">No payment requests match your current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedPayments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                {/* Mobile-first responsive layout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      {payment.currency === 'IDR' ? (
                        <Banknote className="w-5 h-5 text-blue-500" />
                      ) : (
                        <DollarSign className="w-5 h-5 text-green-500" />
                      )}
                      <CardTitle className="text-lg">
                        {formatCurrency(payment.total_amount, payment.currency)}
                      </CardTitle>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                  <div className="flex flex-col sm:text-right">
                    <div className="font-mono text-sm text-gray-500 break-all">
                      {payment.reference_code}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(payment.created_at)}
                    </div>
                    {payment.verified_by && (
                      <div className="text-xs text-gray-500 flex items-center gap-1 sm:justify-end mt-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Diproses oleh: {payment.verified_by.name || payment.verified_by.username}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Mobile responsive content layout */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">{payment.user.username}</span>
                      <span className="break-all">({payment.user.email})</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{payment.accounts_count}</span> account{payment.accounts_count > 1 ? 's' : ''}
                      </div>
                      {payment.payment_proof.uploaded && (
                        <div className="flex items-center gap-1 text-blue-600 text-sm">
                          <Upload className="w-3 h-3" />
                          <span className="whitespace-nowrap">Proof uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 self-start lg:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchPaymentDetail(payment.id)}
                      className="flex items-center gap-1 whitespace-nowrap"
                    >
                      <Eye className="w-3 h-3" />
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {filteredPayments.length > 0 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              {/* Mobile pagination */}
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(Math.ceil(filteredPayments.length / itemsPerPage), currentPage + 1))}
                disabled={currentPage === Math.ceil(filteredPayments.length / itemsPerPage)}
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
                    {Math.min(currentPage * itemsPerPage, filteredPayments.length)}
                  </span>
                  {' '}dari{' '}
                  <span className="font-medium">{filteredPayments.length}</span> hasil
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
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {/* Previous button */}
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
                  
                  {/* Page numbers */}
                  {(() => {
                    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
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
                    onClick={() => setCurrentPage(Math.min(Math.ceil(filteredPayments.length / itemsPerPage), currentPage + 1))}
                    disabled={currentPage === Math.ceil(filteredPayments.length / itemsPerPage)}
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

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Payment Request Details
                {getStatusBadge(selectedPayment.status)}
              </DialogTitle>
              <DialogDescription>
                Reference: {selectedPayment.reference_code}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* User Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Client Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Name: </span>
                      <span className="font-medium">{selectedPayment.user.name}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Username: </span>
                      <span className="font-medium">{selectedPayment.user.username}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Email: </span>
                      <span className="font-medium">{selectedPayment.user.email}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Payment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Total Amount: </span>
                      <span className="font-bold text-lg">
                        {formatCurrency(selectedPayment.total_amount, selectedPayment.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Total Fee: </span>
                      <span className="font-medium">
                        {formatCurrency(selectedPayment.total_fee, selectedPayment.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Created: </span>
                      <span className="font-medium">{formatDate(selectedPayment.created_at)}</span>
                    </div>
                    
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadInvoice(selectedPayment.id)}
                        className="w-full flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {t('downloadInvoice')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Accounts List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedPayment.accounts.map((account, index) => (
                      <div key={account.account_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{account.account_name}</div>
                            <div className="text-sm text-gray-500">
                              {account.platform.toUpperCase()} • {account.account_id}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(account.amount, selectedPayment.currency)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Fee: {account.fee_percentage}% ({formatCurrency(account.fee_amount, selectedPayment.currency)})
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Proof */}
              {selectedPayment.payment_proof && selectedPayment.payment_proof.uploaded ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Payment Proof
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="font-medium break-all">{selectedPayment.payment_proof.file_name || 'Payment Proof'}</div>
                        <div className="text-sm text-gray-600">
                          Uploaded: {formatDate(selectedPayment.payment_proof.uploaded_at)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => viewProofFile(selectedPayment.id)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => downloadProofFile(selectedPayment.id)}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Upload className="w-4 h-4 text-gray-400" />
                      Payment Proof
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No payment proof uploaded yet</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transfer Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {selectedPayment.transfer_details?.type === 'bank_transfer' 
                      ? 'Bank Transfer Details' 
                      : 'Crypto Wallet Details'
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedPayment.transfer_details?.type === 'bank_transfer' ? (
                    <>
                      <div>
                        <span className="text-sm text-gray-500">Bank: </span>
                        <span className="font-medium">{selectedPayment.transfer_details.bank_name}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Account Number: </span>
                        <span className="font-mono font-medium">{selectedPayment.transfer_details.account_number}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Account Holder: </span>
                        <span className="font-medium">{selectedPayment.transfer_details.account_holder}</span>
                      </div>
                      {/* Payment Breakdown with Unique Code */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">Payment Breakdown:</div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Subtotal:</span>
                            <span className="text-sm font-medium">
                              Rp {(selectedPayment.transfer_details.subtotal || selectedPayment.total_amount).toLocaleString()}
                            </span>
                          </div>
                          {selectedPayment.transfer_details.unique_code && selectedPayment.transfer_details.unique_code > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Kode Unik:</span>
                              <span className="text-sm font-medium text-orange-600">
                                +{selectedPayment.transfer_details.unique_code}
                              </span>
                            </div>
                          )}
                          <hr className="border-gray-300" />
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-800">Total Transfer:</span>
                            <span className="text-sm font-bold text-blue-600">
                              Rp {(selectedPayment.transfer_details.total_transfer || selectedPayment.total_amount).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : selectedPayment.transfer_details?.type === 'crypto_wallet' ? (
                    <>
                      <div>
                        <span className="text-sm text-gray-500">Wallet Address: </span>
                        <span className="font-mono font-medium text-sm break-all">{selectedPayment.transfer_details.wallet_address}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Network: </span>
                        <span className="font-medium">{selectedPayment.transfer_details.network}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Wallet Name: </span>
                        <span className="font-medium">{selectedPayment.transfer_details.wallet_name}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500 italic">Transfer details not available</div>
                  )}
                </CardContent>
              </Card>

              {/* Admin Notes */}
              {selectedPayment.admin_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Admin Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-700">{selectedPayment.admin_notes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setSelectedPayment(null)} className="flex-1">
                  Close
                </Button>
                {selectedPayment.status === 'proof_uploaded' && (
                  <Button onClick={() => setVerificationModal(true)} className="flex-1">
                    Verify Payment
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Verification Modal */}
      <Dialog open={verificationModal} onOpenChange={setVerificationModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>
              Review and verify the payment request for {selectedPayment?.reference_code}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label>Verification Status</Label>
              <div className="flex gap-3 mt-2">
                <Button
                  variant={verificationData.status === 'verified' ? 'default' : 'outline'}
                  onClick={() => setVerificationData({...verificationData, status: 'verified'})}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </Button>
                <Button
                  variant={verificationData.status === 'rejected' ? 'destructive' : 'outline'}
                  onClick={() => setVerificationData({...verificationData, status: 'rejected'})}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reject
                </Button>
              </div>
            </div>

            {/* Required Files for Approval */}
            {verificationData.status === 'verified' && (
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Dokumen Wajib untuk Approve</h3>
                </div>
                
                {/* Spend Limit Proof Upload */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Bukti Update Batas Pengeluaran Akun Iklan <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setSpendLimitProof(e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required
                    />
                    {spendLimitProof && (
                      <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {spendLimitProof.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Budget Aspire Proof Upload */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Bukti Update Budget Aspire <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setBudgetAspireProof(e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required
                    />
                    {budgetAspireProof && (
                      <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {budgetAspireProof.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-600 mt-3">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Kedua file wajib diupload untuk approve payment
                </div>
              </div>
            )}

            <div>
              <Label>Admin Notes</Label>
              <Textarea
                placeholder="Add notes about this verification..."
                value={verificationData.admin_notes}
                onChange={(e) => setVerificationData({...verificationData, admin_notes: e.target.value})}
                className="mt-2"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setVerificationModal(false);
                  setSpendLimitProof(null);
                  setBudgetAspireProof(null);
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleVerification}
                disabled={
                  !verificationData.status || 
                  processing || 
                  fileUploading ||
                  (verificationData.status === 'verified' && (!spendLimitProof || !budgetAspireProof))
                }
                className="flex-1"
              >
                {processing || fileUploading ? 'Processing...' : `${verificationData.status === 'verified' ? 'Approve' : 'Reject'} Payment`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Proof Preview Modal */}
      <Dialog open={proofPreviewModal} onOpenChange={setProofPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Payment Proof Preview</DialogTitle>
            <DialogDescription className="break-all">
              {selectedPayment?.payment_proof?.file_name}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4 min-h-[400px]">
            {previewImageUrl && (
              <img 
                src={previewImageUrl}
                alt="Payment Proof"
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            )}
            <div className="text-center text-gray-500 hidden">
              <FileText className="w-16 h-16 mx-auto mb-2" />
              <p>Cannot preview this file type</p>
              <Button 
                onClick={() => downloadProofFile(selectedPayment?.id)} 
                className="mt-2"
              >
                Download to View
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setProofPreviewModal(false)} className="flex-1">
              Close
            </Button>
            <Button 
              onClick={() => downloadProofFile(selectedPayment?.id)} 
              className="flex-1 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Original
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentVerification;