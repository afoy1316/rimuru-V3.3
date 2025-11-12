import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import { 
  ArrowLeft, 
  User, 
  FileText, 
  DollarSign, 
  TrendingUp,
  Facebook,
  Chrome,
  Zap,
  Smartphone,
  CreditCard,
  Download,
  Wallet,
  ArrowRightLeft,
  Upload,
  X,
  Calendar,
  Filter,
  Eye,
  RefreshCw,
  Minus,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatIDR, formatUSD } from '../../utils/currencyFormatter';
import SearchableSelect from '../ui/searchable-select';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profilePictureBlob, setProfilePictureBlob] = useState(null);
  const [loadingProfilePicture, setLoadingProfilePicture] = useState(false);
  
  // Admin Actions States
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [deductSuccess, setDeductSuccess] = useState(false);
  
  // Admin Action Form Data
  const [topUpData, setTopUpData] = useState({
    wallet_type: 'main_idr',
    amount: '',
    notes: '',
    payment_proof: null
  });
  
  const [withdrawData, setWithdrawData] = useState({
    account_id: '',
    amount: '',
    currency: 'IDR',
    notes: '',
    real_balance_proof: null
  });
  
  const [transferData, setTransferData] = useState({
    from_wallet: 'main_idr',
    to_account_id: '',
    amount: '',
    currency: 'IDR',
    notes: '',
    spending_limit_proof: null,
    budget_aspire_proof: null
  });
  
  const [deductData, setDeductData] = useState({
    wallet_type: 'main_idr',
    amount: '',
    reason: '',
    proof_file: null
  });
  
  
  // Currency formatting helpers
  const formatAmountInput = (value) => {
    // Remove all non-numeric except decimal point
    const cleaned = String(value).replace(/[^\d.]/g, '');
    
    // Handle empty or just decimal
    if (cleaned === '' || cleaned === '.') return '';
    
    // Split by decimal point
    const parts = cleaned.split('.');
    
    // Format integer part with thousand separators
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Return with at most 2 decimal places
    if (parts.length > 1) {
      return parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    return parts[0];
  };
  
  const parseFormattedAmount = (formatted) => {
    // Remove all non-numeric except decimal point
    return String(formatted).replace(/[^\d.]/g, '');
  };
  
  const getCurrencySymbol = (walletType) => {
    return walletType.includes('usd') ? '$' : 'Rp ';
  };
  
  const formatWalletBalance = (walletType) => {
    if (!client) return '-';
    
    const fieldMapping = {
      'main_idr': 'main_wallet_idr',
      'main_usd': 'main_wallet_usd',
      'withdrawal_idr': 'withdrawal_wallet_idr',
      'withdrawal_usd': 'withdrawal_wallet_usd'
    };
    
    const field = fieldMapping[walletType];
    if (!field) return '-';
    
    const balance = client[field] || 0;
    const currency = walletType.includes('usd') ? 'USD' : 'IDR';
    
    return formatCurrency(balance, currency);
  };
  
  const getCurrencyPrefix = (walletType) => {
    if (walletType.includes('idr')) return 'Rp';
    if (walletType.includes('usd')) return '$';
    return '';
  };
  
  const getCurrencyFromWallet = (walletType) => {
    return walletType.includes('idr') ? 'IDR' : 'USD';
  };
  
  const [submittingAction, setSubmittingAction] = useState(false);
  
  // Transaction Filter States
  const [transactionFilter, setTransactionFilter] = useState('all'); // all, daily, monthly, yearly, custom
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]); // Filtered account requests
  const [allTransactions, setAllTransactions] = useState([]); // Store all transactions

  useEffect(() => {
    if (id) {
      fetchClientDetail();
    }
  }, [id]); // Remove filter dependencies - fetch only once per client
  
  // Client-side filter transactions
  useEffect(() => {
    if (!client?.transactions) return;
    
    let filtered = [...client.transactions];
    
    if (transactionFilter === 'all') {
      setFilteredTransactions(filtered);
      return;
    }
    
    const now = new Date();
    filtered = filtered.filter(transaction => {
      const txDate = new Date(transaction.date || transaction.created_at);
      
      switch(transactionFilter) {
        case 'daily': {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
          return txDay.getTime() === today.getTime();
        }
        case 'monthly': {
          return txDate.getMonth() === now.getMonth() && 
                 txDate.getFullYear() === now.getFullYear();
        }
        case 'yearly': {
          return txDate.getFullYear() === now.getFullYear();
        }
        case 'custom': {
          if (customDateRange.start && customDateRange.end) {
            const startDate = new Date(customDateRange.start);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(customDateRange.end);
            endDate.setHours(23, 59, 59, 999);
            return txDate >= startDate && txDate <= endDate;
          }
          return true;
        }
        default:
          return true;
      }
    });
    
    setFilteredTransactions(filtered);
  }, [client?.transactions, transactionFilter, customDateRange]);
  
  // Client-side filter account requests
  useEffect(() => {
    if (!client?.requests) return;
    
    let filtered = [...client.requests];
    
    if (transactionFilter === 'all') {
      setFilteredRequests(filtered);
      return;
    }
    
    const now = new Date();
    filtered = filtered.filter(request => {
      const reqDate = new Date(request.created_at);
      
      switch(transactionFilter) {
        case 'daily': {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const reqDay = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate());
          return reqDay.getTime() === today.getTime();
        }
        case 'monthly': {
          return reqDate.getMonth() === now.getMonth() && 
                 reqDate.getFullYear() === now.getFullYear();
        }
        case 'yearly': {
          return reqDate.getFullYear() === now.getFullYear();
        }
        case 'custom': {
          if (customDateRange.start && customDateRange.end) {
            const startDate = new Date(customDateRange.start);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(customDateRange.end);
            endDate.setHours(23, 59, 59, 999);
            return reqDate >= startDate && reqDate <= endDate;
          }
          return true;
        }
        default:
          return true;
      }
    });
    
    setFilteredRequests(filtered);
  }, [client?.requests, transactionFilter, customDateRange]);

  // Calculate filtered top-up totals based on filtered transactions
  const filteredTopUpTotals = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      return { idr: 0, usd: 0 };
    }

    // Top-up transaction types to include
    const topUpTypes = ['topup', 'account_topup', 'wallet_topup', 'admin_topup'];
    
    const totals = filteredTransactions.reduce((acc, transaction) => {
      // Only include top-up type transactions with positive amounts
      if (topUpTypes.includes(transaction.type) && transaction.amount > 0) {
        if (transaction.currency === 'IDR') {
          acc.idr += transaction.amount;
        } else if (transaction.currency === 'USD') {
          acc.usd += transaction.amount;
        }
      }
      return acc;
    }, { idr: 0, usd: 0 });

    return totals;
  }, [filteredTransactions]);

  useEffect(() => {
    if (client?.profile_picture) {
      fetchProfilePictureBlob(client.profile_picture);
    }
    return () => {
      // Cleanup blob URL on unmount
      if (profilePictureBlob) {
        URL.revokeObjectURL(profilePictureBlob);
      }
    };
  }, [client?.profile_picture]);

  const fetchClientDetail = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      setLoading(true);
      
      // Fetch all data without date filtering - will filter on client side
      const response = await axios.get(`${API}/api/admin/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClient(response.data);
    } catch (error) {
      console.error('Failed to fetch client detail:', error);
      toast.error(t('failedToLoadClient'));
      if (error.response?.status === 404) {
        navigate('/admin/clients');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfilePictureBlob = async (profilePicturePath) => {
    const token = localStorage.getItem('admin_token');
    try {
      console.log('🔍 Fetching profile picture:', profilePicturePath);
      setLoadingProfilePicture(true);
      
      const url = `${API}${profilePicturePath}`;
      console.log('🔍 Full URL:', url);
      
      const response = await axios.get(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        responseType: 'blob',
        timeout: 30000
      });
      
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response size:', response.data.size, 'bytes');
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Create blob URL
      const contentType = response.headers['content-type'] || 'image/jpeg';
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      
      console.log('🔍 Blob URL created:', blobUrl);
      setProfilePictureBlob(blobUrl);
      setLoadingProfilePicture(false);
      
      console.log('✅ Profile picture loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load profile picture:', error);
      console.error('❌ Error details:', error.message, error.response?.status);
      setLoadingProfilePicture(false);
      // Don't show error toast, just use fallback
    }
  };

  // Handle View Proof
  const handleDownloadProof = async (transactionId, fileName) => {
    const token = localStorage.getItem('admin_token');
    try {
      const fileUrl = `${API}/api/admin/transactions/${transactionId}/payment-proof`;
      
      const response = await axios.get(fileUrl, {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
        timeout: 30000
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'proof.jpg');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('File berhasil didownload');
      
    } catch (error) {
      console.error('Failed to download proof:', error);
      toast.error('Gagal mendownload file');
    }
  };

  // Filter transactions based on selected filter
  // Note: Backend now returns filtered data based on date range,
  // so we just need to sort them here
  useEffect(() => {
    if (!client?.transactions) {
      setFilteredTransactions([]);
      return;
    }
    
    // Backend already filters by date, we just sort by date (latest first)
    const sorted = [...client.transactions].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    setFilteredTransactions(sorted);
  }, [client?.transactions]);

  // Admin Action: Top Up Wallet
  const handleTopUpWallet = async (e) => {
    e.preventDefault();
    
    if (!topUpData.amount || !topUpData.payment_proof) {
      toast.error('Amount dan payment proof wajib diisi');
      return;
    }
    
    const token = localStorage.getItem('admin_token');
    try {
      setSubmittingAction(true);
      
      const formData = new FormData();
      formData.append('client_id', id);
      formData.append('wallet_type', topUpData.wallet_type);
      formData.append('amount', topUpData.amount);
      formData.append('notes', topUpData.notes || '');
      formData.append('payment_proof', topUpData.payment_proof);
      
      await axios.post(`${API}/api/admin/client-actions/topup-wallet`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Top-up request berhasil dibuat. Menunggu approval super admin.');
      setShowTopUpModal(false);
      setTopUpData({ wallet_type: 'main_idr', amount: '', notes: '', payment_proof: null });
      
    } catch (error) {
      console.error('Failed to create top-up action:', error);
      toast.error(error.response?.data?.detail || 'Gagal membuat top-up request');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Admin Action: Deduct Wallet
  const handleDeductWallet = async (e) => {
    e.preventDefault();
    
    console.log('handleDeductWallet called');
    console.log('deductData:', deductData);
    
    if (!deductData.amount || !deductData.reason || !deductData.proof_file) {
      console.log('Validation failed:', {
        amount: deductData.amount,
        reason: deductData.reason,
        proof_file: deductData.proof_file
      });
      toast.error('Semua field wajib diisi');
      return;
    }
    
    const token = localStorage.getItem('admin_token');
    console.log('Token:', token ? 'exists' : 'missing');
    
    try {
      setSubmittingAction(true);
      
      // Parse amount - remove commas if any
      const parsedAmount = parseFormattedAmount(deductData.amount);
      console.log('Parsed amount:', parsedAmount);
      
      const formData = new FormData();
      formData.append('client_id', id);
      formData.append('wallet_type', deductData.wallet_type);
      formData.append('amount', parsedAmount);
      formData.append('reason', deductData.reason);
      formData.append('proof_file', deductData.proof_file);
      
      console.log('Sending request to:', `${API}/api/admin/client-actions/deduct-wallet`);
      
      const response = await axios.post(`${API}/api/admin/client-actions/deduct-wallet`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Response:', response.data);
      
      // Set success state to show visual feedback
      setDeductSuccess(true);
      
      // Show success toast
      toast.success('✅ Permintaan berhasil dikirim ke Super Admin!', {
        duration: 5000,
        style: {
          background: '#10B981',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      });
      
      // Wait before closing modal so user sees success state
      setTimeout(() => {
        setShowDeductModal(false);
        setDeductSuccess(false);
        setDeductData({ wallet_type: 'main_idr', amount: '', reason: '', proof_file: null });
      }, 2000);
      
    } catch (error) {
      console.error('Failed to create wallet deduction request:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Gagal membuat permintaan pengurangan wallet');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Admin Action: Withdraw Account
  const handleWithdrawAccount = async (e) => {
    e.preventDefault();
    
    if (!withdrawData.account_id || !withdrawData.amount || !withdrawData.real_balance_proof) {
      toast.error('Semua field wajib diisi');
      return;
    }
    
    const token = localStorage.getItem('admin_token');
    try {
      setSubmittingAction(true);
      
      const formData = new FormData();
      formData.append('client_id', id);
      formData.append('account_id', withdrawData.account_id);
      formData.append('amount', withdrawData.amount);
      formData.append('currency', withdrawData.currency);
      formData.append('notes', withdrawData.notes || '');
      formData.append('real_balance_proof', withdrawData.real_balance_proof);
      
      await axios.post(`${API}/api/admin/client-actions/withdraw-account`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Withdrawal request berhasil dibuat. Menunggu approval super admin.');
      setShowWithdrawModal(false);
      setWithdrawData({ account_id: '', amount: '', currency: 'IDR', notes: '', real_balance_proof: null });
      
    } catch (error) {
      console.error('Failed to create withdrawal action:', error);
      toast.error(error.response?.data?.detail || 'Gagal membuat withdrawal request');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Admin Action: Transfer Wallet to Account
  const handleTransferWalletToAccount = async (e) => {
    e.preventDefault();
    
    if (!transferData.to_account_id || !transferData.amount || !transferData.spending_limit_proof || !transferData.budget_aspire_proof) {
      toast.error('Semua field wajib diisi');
      return;
    }
    
    const token = localStorage.getItem('admin_token');
    try {
      setSubmittingAction(true);
      
      const formData = new FormData();
      formData.append('client_id', id);
      formData.append('from_wallet', transferData.from_wallet);
      formData.append('to_account_id', transferData.to_account_id);
      formData.append('amount', transferData.amount);
      formData.append('currency', transferData.currency);
      formData.append('notes', transferData.notes || '');
      formData.append('spending_limit_proof', transferData.spending_limit_proof);
      formData.append('budget_aspire_proof', transferData.budget_aspire_proof);
      
      await axios.post(`${API}/api/admin/client-actions/transfer-wallet-to-account`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Transfer request berhasil dibuat. Menunggu approval super admin.');
      setShowTransferModal(false);
      setTransferData({ 
        from_wallet: 'main_idr', 
        to_account_id: '', 
        amount: '', 
        currency: 'IDR', 
        notes: '', 
        spending_limit_proof: null,
        budget_aspire_proof: null
      });
      
    } catch (error) {
      console.error('Failed to create transfer action:', error);
      toast.error(error.response?.data?.detail || 'Gagal membuat transfer request');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleStatusToggle = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      setUpdating(true);
      const newStatus = !client.is_active;
      await axios.put(`${API}/api/admin/clients/${id}/status`, {
        is_active: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setClient({ ...client, is_active: newStatus });
      toast.success(t('clientStatusUpdated'));
    } catch (error) {
      console.error('Failed to update client status:', error);
      toast.error(t('failedToUpdateStatus'));
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  // Helper to get wallet balance
  const getWalletBalance = (walletType) => {
    if (!client) return 0;
    const mapping = {
      'main_idr': client.main_wallet_idr || 0,
      'main_usd': client.main_wallet_usd || 0,
      'withdrawal_idr': client.withdrawal_wallet_idr || 0,
      'withdrawal_usd': client.withdrawal_wallet_usd || 0
    };
    return mapping[walletType] || 0;
  };

  // Helper to get selected account details
  const getAccountDetails = (accountId) => {
    if (!client?.accounts) return null;
    return client.accounts.find(acc => acc.id === accountId);
  };

  // Get accounts with balance > 0 for withdraw modal
  const getAccountsWithBalance = () => {
    if (!client?.accounts || client.accounts.length === 0) {
      return [];
    }
    
    return client.accounts.filter(acc => 
      acc.status === 'active' && 
      (acc.balance || 0) > 0
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'facebook': return <Facebook className="h-5 w-5 text-blue-600" />;
      case 'google': return <Chrome className="h-5 w-5 text-red-500" />;
      case 'tiktok': return <Zap className="h-5 w-5 text-black" />;
      default: return <Smartphone className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'topup': return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'withdraw': return <Download className="h-5 w-5 text-red-600" />;
      case 'account_request': return <FileText className="h-5 w-5 text-blue-600" />;
      default: return <CreditCard className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t('clientNotFound')}</p>
        <Link to="/admin/clients" className="text-blue-600 hover:text-blue-800 mt-2 inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('backToClients')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Link 
              to="/admin/clients"
              className="text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1 flex-shrink-0" />
              {t('backToClients')}
            </Link>
            <div className="hidden sm:block h-6 border-l border-gray-300"></div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {t('clientDetail')}
            </h1>
          </div>
          <button
            onClick={handleStatusToggle}
            disabled={updating}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              client.is_active !== false
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } disabled:opacity-50`}
          >
            {updating ? (
              t('updating')
            ) : client.is_active !== false ? (
              t('deactivate')
            ) : (
              t('activate')
            )}
          </button>
        </div>

        {/* Modern Client Profile Card - Rimuru Theme */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white bg-opacity-20 rounded-full"></div>
          <div className="absolute -bottom-5 -left-5 w-32 h-32 bg-white bg-opacity-10 rounded-full"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8">
            {/* Enhanced Avatar */}
            <div className="flex-shrink-0 text-center sm:text-left">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white bg-opacity-20 backdrop-blur-md flex items-center justify-center ring-4 ring-white ring-opacity-30 overflow-hidden mx-auto sm:mx-0">
                {loadingProfilePicture ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : profilePictureBlob ? (
                  <img 
                    src={profilePictureBlob}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : client.profile_picture ? (
                  <div className="flex flex-col items-center justify-center text-center px-2">
                    <User className="h-12 w-12 text-white text-opacity-50 mb-1" />
                    <span className="text-xs text-white text-opacity-70">Memuat...</span>
                  </div>
                ) : (
                  <span className="text-white text-3xl font-bold">
                    {client.name?.charAt(0) || client.display_name?.charAt(0) || client.username?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="mt-4 text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  client.is_active !== false 
                    ? 'bg-cyan-400 bg-opacity-90 text-blue-900' 
                    : 'bg-red-400 bg-opacity-90 text-red-900'
                }`}>
                  {client.is_active !== false ? '● Aktif' : '● Nonaktif'}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0 w-full">
              {/* Client Name & Title */}
              <div className="mb-4 sm:mb-6 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 break-words">
                  {client.name || client.display_name || client.username}
                </h2>
                <p className="text-lg sm:text-xl text-white text-opacity-80 break-words">@{client.username}</p>
                {client.company_name && (
                  <p className="text-base sm:text-lg text-white text-opacity-70 mt-2 break-words">
                    🏢 {client.company_name}
                  </p>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Personal Info */}
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-base sm:text-lg font-semibold text-white border-b border-white border-opacity-30 pb-2">
                    📧 Kontak
                  </h4>
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    <div>
                      <p className="text-white text-opacity-70 mb-1">Email</p>
                      <p className="font-medium break-all">{client.email}</p>
                    </div>
                    {client.phone_number && (
                      <div>
                        <p className="text-white text-opacity-70 mb-1">Telepon</p>
                        <p className="font-medium break-words">{client.phone_number}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Info */}
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-base sm:text-lg font-semibold text-white border-b border-white border-opacity-30 pb-2">
                    📍 Alamat
                  </h4>
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    {client.address ? (
                      <div>
                        <p className="text-white text-opacity-70 mb-1">Alamat Lengkap</p>
                        <p className="font-medium">{client.address}</p>
                      </div>
                    ) : (
                      <p className="text-white text-opacity-50 italic">Alamat belum diisi</p>
                    )}
                    
                    <div className="flex space-x-4">
                      {client.city && (
                        <div>
                          <p className="text-white text-opacity-70 mb-1">Kota</p>
                          <p className="font-medium">{client.city}</p>
                        </div>
                      )}
                      {client.province && (
                        <div>
                          <p className="text-white text-opacity-70 mb-1">Provinsi</p>
                          <p className="font-medium">{client.province}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Wallet Info - Updated to show all 4 wallets */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white border-b border-white border-opacity-30 pb-2">
                    💰 Wallet
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-white text-opacity-70 mb-1">Main Wallet IDR</p>
                      <p className="text-lg font-bold text-cyan-300">{formatIDR(client.main_wallet_idr || 0)}</p>
                    </div>
                    <div>
                      <p className="text-white text-opacity-70 mb-1">Main Wallet USD</p>
                      <p className="text-lg font-bold text-cyan-300">{formatUSD(client.main_wallet_usd || 0)}</p>
                    </div>
                    <div>
                      <p className="text-white text-opacity-70 mb-1">Withdrawal Wallet IDR</p>
                      <p className="text-lg font-bold text-green-300">{formatIDR(client.withdrawal_wallet_idr || 0)}</p>
                    </div>
                    <div>
                      <p className="text-white text-opacity-70 mb-1">Withdrawal Wallet USD</p>
                      <p className="text-lg font-bold text-green-300">{formatUSD(client.withdrawal_wallet_usd || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Admin Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                >
                  <Wallet className="h-4 w-4 flex-shrink-0" />
                  <span>Top Up Wallet</span>
                </button>
                <button
                  onClick={() => setShowDeductModal(true)}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                >
                  <Minus className="h-4 w-4 flex-shrink-0" />
                  <span>Kurangi Saldo</span>
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm"
                >
                  <Download className="h-4 w-4 flex-shrink-0" />
                  <span>Withdraw</span>
                </button>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm"
                >
                  <ArrowRightLeft className="h-4 w-4 flex-shrink-0" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards with Active Accounts Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
              <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="text-center sm:text-left min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 break-words">{t('totalRequests')}</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{filteredRequests?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
              <Smartphone className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="text-center sm:text-left min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 break-words">Active</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {filteredRequests?.filter(r => r.status === 'approved' || r.status === 'completed').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        {/* Facebook Accounts */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
              <Facebook className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="text-center sm:text-left min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 break-words">Facebook</p>
              <p className="text-lg sm:text-xl font-bold text-blue-600">
                {filteredRequests?.filter(r => r.platform === 'facebook' && (r.status === 'approved' || r.status === 'completed')).length || 0}
              </p>
            </div>
          </div>
        </div>
        
        {/* Google Accounts */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
              <Chrome className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
            </div>
            <div className="text-center sm:text-left min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 break-words">Google</p>
              <p className="text-lg sm:text-xl font-bold text-red-600">
                {filteredRequests?.filter(r => r.platform === 'google' && (r.status === 'approved' || r.status === 'completed')).length || 0}
              </p>
            </div>
          </div>
        </div>
        
        {/* TikTok Accounts */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
              <Zap className="h-4 w-4 sm:h-6 sm:w-6 text-gray-900" />
            </div>
            <div className="text-center sm:text-left min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 break-words">TikTok</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {filteredRequests?.filter(r => r.platform === 'tiktok' && (r.status === 'approved' || r.status === 'completed')).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filter Transaksi:</span>
          
          <button
            onClick={() => setTransactionFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              transactionFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          
          <button
            onClick={() => setTransactionFilter('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              transactionFilter === 'daily' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Harian
          </button>
          
          <button
            onClick={() => setTransactionFilter('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              transactionFilter === 'monthly' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bulanan
          </button>
          
          <button
            onClick={() => setTransactionFilter('yearly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              transactionFilter === 'yearly' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tahunan
          </button>
          
          <button
            onClick={() => setTransactionFilter('custom')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              transactionFilter === 'custom' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom
          </button>
          
          {transactionFilter === 'custom' && (
            <div className="flex items-center gap-2 ml-4">
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({...customDateRange, start: e.target.value})}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({...customDateRange, end: e.target.value})}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}
          
          <span className="ml-auto text-sm text-gray-600">
            {filteredTransactions.length} transaksi
          </span>
        </div>
      </div>

      {/* Original Statistics Cards - Updated to use filtered transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('totalTransactions')}</p>
              <p className="text-xl font-bold text-gray-900">{filteredTransactions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Top Up IDR</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(filteredTopUpTotals.idr || 0, 'IDR')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Top Up USD</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(filteredTopUpTotals.usd || 0, 'USD')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Old statistics removed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{display: 'none'}}>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('totalRequests')}</p>
              <p className="text-xl font-bold text-gray-900">{filteredRequests?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('totalTransactions')}</p>
              <p className="text-xl font-bold text-gray-900">{client.transactions?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('totalTopUp')}</p>
              <p className="text-lg font-bold text-gray-900">
                {formatIDR(client.transactions?.filter(t => t.type === 'topup' && t.status === 'completed').reduce((sum, t) => sum + (t.amount || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-lg">⏳</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('pendingRequests')}</p>
              <p className="text-xl font-bold text-gray-900">
                {filteredRequests?.filter(r => r.status === 'pending').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Requests */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600 flex-shrink-0" />
              <span className="break-words">{t('accountRequests')}</span>
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredRequests && filteredRequests.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredRequests
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map((request) => (
                  <div key={request.id} className="px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <span className="text-lg flex-shrink-0">{getPlatformIcon(request.platform)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 break-words">
                            {request.account_name}
                          </p>
                          <p className="text-xs text-gray-500 break-words">
                            {request.platform?.toUpperCase()} • {request.gmt} • {request.currency}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(request.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                <p>{t('noRequests')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-green-600 flex-shrink-0" />
              <span className="break-words">{t('transactionHistory')}</span>
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredTransactions && filteredTransactions.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredTransactions
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map((transaction) => (
                  <div key={transaction.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <span className="text-lg flex-shrink-0">{getTransactionIcon(transaction.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 break-words">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500 break-words">
                            {transaction.type?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${
                          transaction.type === 'topup' ? 'text-green-600' : 
                          transaction.type === 'withdraw' ? 'text-red-600' : 
                          'text-gray-600'
                        }`}>
                          {transaction.type === 'topup' ? '+' : transaction.type === 'withdraw' ? '-' : ''}
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(transaction.created_at).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <DollarSign className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                <p>{t('noTransactions')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Up Wallet Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
              <div className="flex items-center space-x-3">
                <Wallet className="h-6 w-6" />
                <h3 className="text-xl font-bold">Top Up Wallet Client</h3>
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Type</label>
                  <SearchableSelect
                    options={[
                      { value: 'main_idr', label: 'Main Wallet IDR', searchText: 'main idr rupiah' },
                      { value: 'main_usd', label: 'Main Wallet USD', searchText: 'main usd dollar' },
                      { value: 'withdrawal_idr', label: 'Withdrawal Wallet IDR', searchText: 'withdrawal idr rupiah' },
                      { value: 'withdrawal_usd', label: 'Withdrawal Wallet USD', searchText: 'withdrawal usd dollar' }
                    ]}
                    value={topUpData.wallet_type}
                    onChange={(value) => setTopUpData({...topUpData, wallet_type: value})}
                    placeholder="Select wallet type..."
                    searchPlaceholder="Search wallet..."
                  />
                  
                  {/* Display Current Balance */}
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-600">Current Balance:</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatWalletBalance(topUpData.wallet_type)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-lg">
                      {getCurrencyPrefix(topUpData.wallet_type)}
                    </span>
                    <input
                      type="text"
                      value={formatAmountInput(topUpData.amount)}
                      onChange={(e) => {
                        const parsed = parseFormattedAmount(e.target.value);
                        setTopUpData({...topUpData, amount: parsed});
                      }}
                      className="w-full pl-12 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                      {getCurrencyFromWallet(topUpData.wallet_type)}
                    </span>
                  </div>
                  {topUpData.amount && (
                    <p className="mt-1 text-sm text-gray-500">
                      = {formatCurrency(parseFloat(topUpData.amount) || 0, getCurrencyFromWallet(topUpData.wallet_type))}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Proof</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setTopUpData({...topUpData, payment_proof: e.target.files[0]})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                  {topUpData.payment_proof && (
                    <p className="text-sm text-gray-600 mt-1">Selected: {topUpData.payment_proof.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={topUpData.notes}
                    onChange={(e) => setTopUpData({...topUpData, notes: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Add notes..."
                  />
                </div>
              </div>
            </div>
              
            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  disabled={submittingAction}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={handleTopUpWallet}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {submittingAction ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
          </div>
        </div>
      )}

      {/* Deduct Wallet Modal */}
      {showDeductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative">
            
            {/* Success Overlay */}
            {deductSuccess && (
              <div className="absolute inset-0 bg-green-50 bg-opacity-95 rounded-xl flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
                    <CheckCircle className="w-16 h-16 text-white" strokeWidth={3} />
                  </div>
                  <h3 className="text-2xl font-bold text-green-700 mb-2">
                    Berhasil Dikirim!
                  </h3>
                  <p className="text-green-600 text-lg">
                    Permintaan pengurangan wallet telah dikirim ke Super Admin
                  </p>
                  <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-green-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
              <div className="flex items-center space-x-3">
                <Minus className="h-6 w-6" />
                <h3 className="text-xl font-bold">Kurangi Saldo Wallet Client</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeductModal(false);
                  setDeductSuccess(false);
                }}
                className="text-white hover:text-gray-200 p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                console.log('Form onSubmit triggered!');
                handleDeductWallet(e);
              }} 
              className="flex-1 overflow-y-auto"
            >
              <div className="px-6 py-4 space-y-4">
                {/* Wallet Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Wallet <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={[
                      { value: 'main_idr', label: 'Main Wallet IDR', searchText: 'main idr rupiah' },
                      { value: 'main_usd', label: 'Main Wallet USD', searchText: 'main usd dollar' },
                      { value: 'withdrawal_idr', label: 'Withdrawal Wallet IDR', searchText: 'withdrawal idr rupiah' },
                      { value: 'withdrawal_usd', label: 'Withdrawal Wallet USD', searchText: 'withdrawal usd dollar' }
                    ]}
                    value={deductData.wallet_type}
                    onChange={(value) => setDeductData({...deductData, wallet_type: value})}
                    placeholder="Pilih wallet"
                  />
                </div>

                {/* Display Current Wallet Balance */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Saldo saat ini: <span className="font-bold">{formatWalletBalance(deductData.wallet_type)}</span>
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nominal Pengurangan <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      {getCurrencySymbol(deductData.wallet_type)}
                    </div>
                    <input
                      type="text"
                      value={deductData.amount}
                      onChange={(e) => setDeductData({...deductData, amount: formatAmountInput(e.target.value)})}
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {deductData.wallet_type.includes('usd') 
                      ? 'Format: 1000.50 (gunakan titik untuk desimal)'
                      : 'Format: 50000 (tanpa titik atau koma)'}
                  </p>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alasan Pengurangan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={deductData.reason}
                    onChange={(e) => setDeductData({...deductData, reason: e.target.value})}
                    placeholder="Jelaskan alasan pengurangan (refund, koreksi, dll)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>

                {/* Proof File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Bukti/Dokumen <span className="text-red-500">*</span>
                  </label>
                  <div className={`border-2 border-dashed rounded-xl p-6 transition-all ${
                    deductData.proof_file 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 bg-gray-50 hover:border-red-400 hover:bg-red-50'
                  }`}>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          // Check file size (10MB max)
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error('Ukuran file maksimal 10MB');
                            return;
                          }
                          setDeductData({...deductData, proof_file: file});
                        }
                      }}
                      accept="image/*,.pdf"
                      className="hidden"
                      id="deduct-proof-upload"
                      required
                    />
                    <label
                      htmlFor="deduct-proof-upload"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      {deductData.proof_file ? (
                        <>
                          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-3 animate-scale-in">
                            <CheckCircle className="h-10 w-10 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-green-700 mb-1">
                            File berhasil dipilih!
                          </span>
                          <span className="text-xs text-green-600 bg-green-100 px-3 py-1 rounded-full mb-2 break-all max-w-full">
                            {deductData.proof_file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {(deductData.proof_file.size / 1024).toFixed(1)} KB
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setDeductData({...deductData, proof_file: null});
                            }}
                            className="mt-3 text-xs text-red-600 hover:text-red-700 underline"
                          >
                            Ganti file
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-3">
                            <Upload className="h-8 w-8 text-red-600" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 mb-1">
                            Klik untuk upload bukti
                          </span>
                          <span className="text-xs text-gray-500">atau drag & drop file disini</span>
                          <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              PDF
                            </span>
                            <span className="flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              PNG, JPG
                            </span>
                            <span>Max 10MB</span>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Warning Note */}
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-600 text-lg">⚠️</span>
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">Perhatian:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Permintaan akan dikirim ke Super Admin untuk approval</li>
                        <li>Saldo dapat menjadi minus jika disetujui</li>
                        <li>Pastikan bukti dan alasan jelas dan valid</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Batal clicked');
                    setShowDeductModal(false);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submittingAction}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  onClick={(e) => {
                    console.log('Submit button clicked!');
                    console.log('Event:', e);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submittingAction}
                >
                  {submittingAction ? 'Mengirim...' : 'Kirim Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Account Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
              <div className="flex items-center space-x-3">
                <Download className="h-6 w-6" />
                <h3 className="text-xl font-bold">Withdraw dari Akun</h3>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Account</label>
                  <SearchableSelect
                    options={getAccountsWithBalance().map(acc => ({
                      value: acc.id,
                      label: `${acc.account_name} (${acc.platform})`,
                      searchText: `${acc.account_name} ${acc.platform} ${acc.balance}`,
                      data: acc
                    }))}
                    value={withdrawData.account_id}
                    onChange={(value) => setWithdrawData({...withdrawData, account_id: value})}
                    placeholder="Choose account..."
                    emptyMessage="Tidak ada akun dengan saldo"
                    searchPlaceholder="Search account..."
                    disabled={getAccountsWithBalance().length === 0}
                    renderOption={(option) => (
                      <div className="flex flex-col gap-1 py-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">{option.data.account_name}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                            {option.data.platform.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Balance</span>
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(option.data.balance, option.data.currency)}
                          </span>
                        </div>
                      </div>
                    )}
                    renderValue={(option) => option ? (
                      <div className="flex flex-col gap-1.5 w-full pr-8">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-gray-900 flex-1 min-w-0 truncate">{option.data.account_name}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex-shrink-0">
                            {option.data.platform.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-500">Balance:</span>
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(option.data.balance, option.data.currency)}
                          </span>
                        </div>
                      </div>
                    ) : 'Choose account...'}
                  />
                  {getAccountsWithBalance().length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      Client ini belum memiliki akun dengan saldo, atau semua akun memiliki saldo 0.
                    </p>
                  )}
                  
                  {/* Display Selected Account Details */}
                  {withdrawData.account_id && getAccountDetails(withdrawData.account_id) && (
                    <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Account ID:</span>
                        <span className="text-sm font-medium text-gray-900">{getAccountDetails(withdrawData.account_id).account_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Current Balance:</span>
                        <span className="text-lg font-bold text-orange-600">
                          {formatCurrency(getAccountDetails(withdrawData.account_id).balance || 0, getAccountDetails(withdrawData.account_id).currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Platform:</span>
                        <span className="text-sm font-medium text-gray-900">{getAccountDetails(withdrawData.account_id).platform?.toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    value={withdrawData.currency}
                    onChange={(e) => setWithdrawData({...withdrawData, currency: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="IDR">IDR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-lg">
                      {withdrawData.currency === 'IDR' ? 'Rp' : '$'}
                    </span>
                    <input
                      type="text"
                      value={formatAmountInput(withdrawData.amount)}
                      onChange={(e) => {
                        const parsed = parseFormattedAmount(e.target.value);
                        setWithdrawData({...withdrawData, amount: parsed});
                      }}
                      className="w-full pl-12 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                      {withdrawData.currency}
                    </span>
                  </div>
                  {withdrawData.amount && (
                    <p className="mt-1 text-sm text-gray-500">
                      = {formatCurrency(parseFloat(withdrawData.amount) || 0, withdrawData.currency)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Real Balance Proof</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setWithdrawData({...withdrawData, real_balance_proof: e.target.files[0]})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  {withdrawData.real_balance_proof && (
                    <p className="text-sm text-gray-600 mt-1">Selected: {withdrawData.real_balance_proof.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={withdrawData.notes}
                    onChange={(e) => setWithdrawData({...withdrawData, notes: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    placeholder="Add notes..."
                  />
                </div>
              </div>
            </div>
              
            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={submittingAction}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={handleWithdrawAccount}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center"
                >
                  {submittingAction ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
          </div>
        </div>
      )}

      {/* Transfer Wallet to Account Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
              <div className="flex items-center space-x-3">
                <ArrowRightLeft className="h-6 w-6" />
                <h3 className="text-xl font-bold">Transfer Wallet ke Akun</h3>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Wallet</label>
                  <SearchableSelect
                    options={[
                      { value: 'main_idr', label: 'Main Wallet IDR', searchText: 'main idr rupiah' },
                      { value: 'main_usd', label: 'Main Wallet USD', searchText: 'main usd dollar' },
                      { value: 'withdrawal_idr', label: 'Withdrawal Wallet IDR', searchText: 'withdrawal idr rupiah' },
                      { value: 'withdrawal_usd', label: 'Withdrawal Wallet USD', searchText: 'withdrawal usd dollar' }
                    ]}
                    value={transferData.from_wallet}
                    onChange={(value) => setTransferData({...transferData, from_wallet: value})}
                    placeholder="Select wallet..."
                    searchPlaceholder="Search wallet..."
                  />
                  
                  {/* Display Current Wallet Balance */}
                  <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-gray-600">Current Balance:</p>
                    <p className="text-lg font-bold text-purple-600">
                      {formatWalletBalance(transferData.from_wallet)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Account</label>
                  <SearchableSelect
                    options={client?.accounts?.filter(acc => acc.status === 'active').map(acc => ({
                      value: acc.id,
                      label: `${acc.account_name} (${acc.platform?.toUpperCase()})`,
                      searchText: `${acc.account_name} ${acc.platform} ${acc.balance}`,
                      data: acc
                    })) || []}
                    value={transferData.to_account_id}
                    onChange={(value) => setTransferData({...transferData, to_account_id: value})}
                    placeholder="Choose account..."
                    emptyMessage="No accounts available"
                    searchPlaceholder="Search account..."
                    renderOption={(option) => (
                      <div className="flex flex-col">
                        <span className="font-medium">{option.data.account_name}</span>
                        <span className="text-sm text-gray-500">
                          {option.data.platform?.toUpperCase()} • Balance: {formatCurrency(option.data.balance || 0, option.data.currency)}
                        </span>
                      </div>
                    )}
                  />
                  
                  {/* Display Selected Account Details */}
                  {transferData.to_account_id && getAccountDetails(transferData.to_account_id) && (
                    <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Account ID:</span>
                        <span className="text-sm font-medium text-gray-900">{getAccountDetails(transferData.to_account_id).account_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Current Balance:</span>
                        <span className="text-lg font-bold text-purple-600">
                          {formatCurrency(getAccountDetails(transferData.to_account_id).balance || 0, getAccountDetails(transferData.to_account_id).currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Platform:</span>
                        <span className="text-sm font-medium text-gray-900">{getAccountDetails(transferData.to_account_id).platform?.toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    value={transferData.currency}
                    onChange={(e) => setTransferData({...transferData, currency: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="IDR">IDR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-lg">
                      {transferData.currency === 'IDR' ? 'Rp' : '$'}
                    </span>
                    <input
                      type="text"
                      value={formatAmountInput(transferData.amount)}
                      onChange={(e) => {
                        const parsed = parseFormattedAmount(e.target.value);
                        setTransferData({...transferData, amount: parsed});
                      }}
                      className="w-full pl-12 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="0"
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                      {transferData.currency}
                    </span>
                  </div>
                  {transferData.amount && (
                    <p className="mt-1 text-sm text-gray-500">
                      = {formatCurrency(parseFloat(transferData.amount) || 0, transferData.currency)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bukti Update Batas Pengeluaran</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setTransferData({...transferData, spending_limit_proof: e.target.files[0]})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  {transferData.spending_limit_proof && (
                    <p className="text-sm text-gray-600 mt-1">Selected: {transferData.spending_limit_proof.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bukti Update Limit Budget Aspire</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setTransferData({...transferData, budget_aspire_proof: e.target.files[0]})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  {transferData.budget_aspire_proof && (
                    <p className="text-sm text-gray-600 mt-1">Selected: {transferData.budget_aspire_proof.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={transferData.notes}
                    onChange={(e) => setTransferData({...transferData, notes: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Add notes..."
                  />
                </div>
              </div>
            </div>
              
            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  disabled={submittingAction}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={handleTransferWalletToAccount}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
                >
                  {submittingAction ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientDetail;