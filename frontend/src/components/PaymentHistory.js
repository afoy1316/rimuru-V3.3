import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { 
  ArrowLeft,
  Clock, 
  CheckCircle, 
  Upload, 
  AlertCircle,
  Eye,
  Calendar,
  DollarSign,
  Banknote,
  Download,
  X,
  Search,
  Filter
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentHistory = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const downloadInvoice = async (payment) => {
    try {
      const token = localStorage.getItem('token');
      
      // Use different endpoint based on payment type
      const endpoint = payment.type === 'wallet_topup' 
        ? `${BACKEND_URL}/api/wallet-topup-request/${payment.id}/invoice`
        : `${BACKEND_URL}/api/topup-request/${payment.id}/invoice`;
        
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Invoice can only be generated for verified payments');
        }
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Use different filename based on type
      const filename = payment.type === 'wallet_topup' 
        ? `wallet_invoice_${payment.id}.pdf`
        : `invoice_${payment.id}.pdf`;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Invoice download error:', error);
      toast.error(`Failed to download invoice: ${error.message}`);
    }
  };

  const cancelPayment = async (paymentId, paymentType) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan top-up ini?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Use different endpoint based on payment type
      const endpoint = paymentType === 'wallet_topup' 
        ? `${API}/wallet-topup-request/${paymentId}/cancel`
        : `${API}/topup-request/${paymentId}/cancel`;
      
      await axios.put(endpoint, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Top-up berhasil dibatalkan');
      fetchPaymentHistory(); // Refresh the list
    } catch (error) {
      console.error('Error canceling payment:', error);
      toast.error(`Gagal membatalkan top-up: ${error.response?.data?.detail || error.message}`);
    }
  };
  
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  
  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all'); // all, daily, monthly, yearly, custom
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, proof_uploaded, verified, rejected, cancelled
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedPayments, setPaginatedPayments] = useState([]);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);
  
  // Auto-refresh data every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPaymentHistory();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);
  
  // Client-side filtering - Search, Status, and Period
  const filteredPayments = useMemo(() => {
    let filtered = [...payments];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.reference_code?.toLowerCase().includes(query) ||
        payment.total_amount.toString().includes(query) ||
        payment.currency?.toLowerCase().includes(query) ||
        payment.status?.toLowerCase().includes(query) ||
        (payment.type === 'wallet_topup' && payment.wallet_type?.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }
    
    // Apply period filter
    if (periodFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.created_at);
        
        switch(periodFilter) {
          case 'daily': {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const paymentDay = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
            return paymentDay.getTime() === today.getTime();
          }
          case 'monthly': {
            return paymentDate.getMonth() === now.getMonth() && 
                   paymentDate.getFullYear() === now.getFullYear();
          }
          case 'yearly': {
            return paymentDate.getFullYear() === now.getFullYear();
          }
          case 'custom': {
            if (customDateRange.start && customDateRange.end) {
              const startDate = new Date(customDateRange.start);
              startDate.setHours(0, 0, 0, 0);
              const endDate = new Date(customDateRange.end);
              endDate.setHours(23, 59, 59, 999);
              return paymentDate >= startDate && paymentDate <= endDate;
            }
            return true;
          }
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [payments, searchQuery, statusFilter, periodFilter, customDateRange]);
  
  // Pagination effect - use filtered payments
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedPayments(filteredPayments.slice(startIndex, endIndex));
  }, [filteredPayments, currentPage, itemsPerPage]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, periodFilter, customDateRange, itemsPerPage]);

  // DISABLED auto-refresh - user can manually refresh if needed
  // Prevents interruption when viewing payment details

  const fetchPaymentHistory = async (retryCount = 0) => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch both regular top-up requests and wallet top-up requests
      const [regularTopups, walletTopups] = await Promise.all([
        axios.get(`${API}/topup-requests`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000
        }),
        axios.get(`${API}/wallet-topup-requests`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000
        })
      ]);
      
      // Combine and sort by created_at (newest first)
      const allPayments = [...regularTopups.data, ...walletTopups.data]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setPayments(allPayments);
      localStorage.setItem('cached_payment_history', JSON.stringify(allPayments));
    } catch (error) {
      console.error('Error fetching payment history:', error);
      // Silent retry 3 times
      if (retryCount < 3) {
        setTimeout(() => fetchPaymentHistory(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        // Load from cache - NO ERROR TOAST
        try {
          const cached = localStorage.getItem('cached_payment_history');
          if (cached) setPayments(JSON.parse(cached));
          else setPayments([]);
        } catch (e) {
          setPayments([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Menunggu
          </Badge>
        );
      case 'proof_uploaded':
      case 'uploaded':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-300">
            <Upload className="w-3 h-3 mr-1" />
            Sedang Ditinjau
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50">
            <Clock className="w-3 h-3 mr-1 animate-spin" />
            Sedang Diproses
          </Badge>
        );
      case 'verified':
        return (
          <Badge variant="outline" className="text-green-600 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Terverifikasi
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-600 border-red-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Ditolak
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-300">
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency) => {
    const symbol = currency === 'IDR' ? 'Rp' : '$';
    return `${symbol} ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/topup')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Riwayat Top Up</h1>
        </div>
        <Button onClick={() => navigate('/dashboard/topup')} className="w-full sm:w-auto">
          Top Up Baru
        </Button>
      </div>

      {/* Search and Filter Section */}
      <Card className="border-2 border-gray-200">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan kode referensi, nominal, atau status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filter Status:</span>
              </div>
              
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Semua
              </button>
              
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'pending' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Clock className="w-3 h-3 inline-block mr-1" />
                Menunggu
              </button>
              
              <button
                onClick={() => setStatusFilter('proof_uploaded')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'proof_uploaded' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Upload className="w-3 h-3 inline-block mr-1" />
                Bukti Diupload
              </button>
              
              <button
                onClick={() => setStatusFilter('verified')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'verified' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CheckCircle className="w-3 h-3 inline-block mr-1" />
                Terverifikasi
              </button>
              
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'rejected' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <X className="w-3 h-3 inline-block mr-1" />
                Ditolak
              </button>
              
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'cancelled' 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <X className="w-3 h-3 inline-block mr-1" />
                Dibatalkan
              </button>
            </div>

            {/* Period Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filter Periode:</span>
              </div>
              
              <button
                onClick={() => setPeriodFilter('all')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  periodFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Semua
              </button>
              
              <button
                onClick={() => setPeriodFilter('daily')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  periodFilter === 'daily' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Harian
              </button>
              
              <button
                onClick={() => setPeriodFilter('monthly')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  periodFilter === 'monthly' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bulanan
              </button>
              
              <button
                onClick={() => setPeriodFilter('yearly')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  periodFilter === 'yearly' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tahunan
              </button>
              
              <button
                onClick={() => setPeriodFilter('custom')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  periodFilter === 'custom' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom
              </button>
              
              <span className="ml-auto text-sm text-gray-600">
                {filteredPayments.length} transaksi
              </span>
            </div>

            {/* Custom Date Range */}
            {periodFilter === 'custom' && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Dari:</span>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({...customDateRange, start: e.target.value})}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
                <span className="text-sm font-medium text-gray-700">Sampai:</span>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({...customDateRange, end: e.target.value})}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {payments.length > 0 && (
        <Card className="glass-card border-2 border-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="text-xl font-bold">Ringkasan Riwayat Top-Up</CardTitle>
            <CardDescription>Total transaksi dan nominal</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Total Transaksi */}
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredPayments.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Transaksi</div>
              </div>
              
              {/* Verified */}
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {filteredPayments.filter(p => p.status === 'verified').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Terverifikasi</div>
              </div>
              
              {/* Pending */}
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredPayments.filter(p => p.status === 'pending' || p.status === 'proof_uploaded').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Menunggu</div>
              </div>
              
              {/* Total Nominal IDR (All) */}
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  Rp {filteredPayments
                    .filter(p => p.currency === 'IDR')
                    .reduce((sum, p) => sum + p.total_amount, 0)
                    .toLocaleString('id-ID')}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total IDR</div>
              </div>
              
              {/* Total Nominal IDR (Verified) */}
              <div className="text-center p-3 bg-teal-50 rounded-lg">
                <div className="text-lg font-bold text-teal-600">
                  Rp {filteredPayments
                    .filter(p => p.currency === 'IDR' && p.status === 'verified')
                    .reduce((sum, p) => sum + p.total_amount, 0)
                    .toLocaleString('id-ID')}
                </div>
                <div className="text-sm text-gray-600 mt-1">IDR Verified</div>
              </div>
              
              {/* Total Nominal USD */}
              {filteredPayments.some(p => p.currency === 'USD') && (
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <div className="text-lg font-bold text-indigo-600">
                    ${filteredPayments
                      .filter(p => p.currency === 'USD')
                      .reduce((sum, p) => sum + p.total_amount, 0)
                      .toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total USD</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {payments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Belum Ada Riwayat Top Up</h3>
            <p className="text-gray-500 mb-4">Anda belum pernah melakukan permintaan top up.</p>
            <Button onClick={() => navigate('/dashboard/topup')}>
              Buat Top Up Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedPayments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center gap-3">
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
                  <div className="text-left sm:text-right">
                    <div className="font-mono text-sm text-gray-500">
                      {payment.reference_code}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(payment.created_at)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-gray-600">
                    {payment.type === 'wallet_topup' ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-purple-600">Wallet Top-Up</span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {payment.wallet_type} Wallet
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-medium">{payment.accounts_count || 1}</span> account{(payment.accounts_count || 1) > 1 ? 's' : ''}
                      </div>
                    )}
                    {payment.total_fee > 0 && (
                      <div>
                        Fee: {formatCurrency(payment.total_fee, payment.currency)}
                      </div>
                    )}
                    {payment.unique_code > 0 && (
                      <div className="text-blue-600">
                        Kode Unik: +{payment.unique_code}
                      </div>
                    )}
                    {payment.payment_proof.uploaded && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Upload className="w-3 h-3" />
                        Proof uploaded
                      </div>
                    )}
                    {payment.verified_at && (
                      <div className="text-green-600">
                        Verified: {formatDate(payment.verified_at)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Show appropriate button based on status and type */}
                    {payment.status === 'pending' ? (
                      <>
                        {/* For pending, only show Upload button (no redundant View Details) */}
                        <Button
                          size="sm"
                          onClick={() => {
                            if (payment.type === 'wallet_topup') {
                              navigate(`/dashboard/wallet/upload-proof/${payment.id}`);
                            } else {
                              navigate(`/dashboard/topup/confirmation/${payment.id}`);
                            }
                          }}
                          className={`flex items-center gap-1 ${
                            payment.type === 'wallet_topup'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700'
                              : 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0 hover:from-green-600 hover:to-green-700'
                          }`}
                        >
                          <Upload className="w-3 h-3" />
                          Upload Bukti Transfer
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelPayment(payment.id, payment.type)}
                          className="flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Batal
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* For completed/verified, show View Details */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (payment.type === 'wallet_topup') {
                              navigate(`/dashboard/wallet/upload-proof/${payment.id}`);
                            } else {
                              navigate(`/dashboard/topup/confirmation/${payment.id}`);
                            }
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Lihat Detail
                        </Button>
                      </>
                    )}
                    
                    {(payment.status === 'verified' || payment.status === 'completed') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadInvoice(payment)}
                        className="flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download Invoice
                      </Button>
                    )}
                  </div>
                </div>

                {payment.admin_notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">Admin Notes:</div>
                    <div className="text-sm text-gray-600">{payment.admin_notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {payments.length > 0 && (
        <div className="bg-white px-4 py-3 border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              {/* Mobile pagination */}
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(Math.ceil(payments.length / itemsPerPage), currentPage + 1))}
                disabled={currentPage === Math.ceil(payments.length / itemsPerPage)}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-700">
                  Menampilkan{' '}
                  <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>
                  {' '}-{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredPayments.length)}
                  </span>
                  {' '}dari{' '}
                  <span className="font-medium">{filteredPayments.length}</span> top-up
                </p>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Per halaman:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={10}>10</option>
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
                    <span className="sr-only">Previous</span>
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
                    onClick={() => setCurrentPage(Math.min(Math.ceil(payments.length / itemsPerPage), currentPage + 1))}
                    disabled={currentPage === Math.ceil(payments.length / itemsPerPage)}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
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
    </div>
  );
};

export default PaymentHistory;