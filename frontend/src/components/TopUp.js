import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import ProcessingModal from './ProcessingModal';
import {
  Wallet,
  DollarSign,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Search,
  CheckSquare,
  Square,
  Users,
  Copy,
  CreditCard,
  Globe,
  Calculator,
  RefreshCw,
  Eye,
  EyeOff,
  Upload,
  Clock
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TopUp = ({ onRefresh, hideDisabledAccounts = false }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Multi-step states
  const [currentStep, setCurrentStep] = useState(1); // 1: Select Accounts, 2: Set Amounts, 3: Payment Summary
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Step 1: Account Selection
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState([]);
  
  // Step 2: Amount Input
  const [topupAmounts, setTopupAmounts] = useState({}); // { accountId: amount }
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkAmount, setBulkAmount] = useState('');
  
  // Step 3: Payment
  const [submitting, setSubmitting] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [uniqueCode, setUniqueCode] = useState(null);
  
  // UI States
  const [showSummary, setShowSummary] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('IDR');
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [accountsPerPage] = useState(10);

  useEffect(() => {
    fetchAccounts();

    // DISABLED auto-refresh - mengganggu saat user pilih akun dan input amount
    // User bisa manual refresh jika perlu
    
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(response.data);
      
      // Fetch account groups separately
      try {
        const groupsResponse = await axios.get(`${API}/account-groups`);
        setGroups(groupsResponse.data.map(group => group.name));
      } catch (groupError) {
        console.error('Error fetching groups:', groupError);
        // Fallback to default groups if API fails
        setGroups(['Marketing Campaign', 'Brand Awareness', 'Sales Funnel']);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      // NO ERROR TOAST - Load from cache or empty
      try {
        const cached = localStorage.getItem('cached_topup_accounts');
        if (cached) setAccounts(JSON.parse(cached));
        else setAccounts([]);
      } catch (e) {
        setAccounts([]);
      }
    } finally {
      setLoading(false);
      setLoadingAccounts(false);
    }
  };

  // Helper functions
  const getSelectedAccountObjects = () => {
    return accounts.filter(account => selectedAccounts.includes(account.id));
  };

  const getCurrenciesFromSelected = () => {
    const selectedAccountObjects = getSelectedAccountObjects();
    return [...new Set(selectedAccountObjects.map(acc => acc.currency || 'IDR'))];
  };

  const calculateFee = (amount, feePercentage) => {
    if (!feePercentage || feePercentage === 0) return 0;
    return (amount * feePercentage) / 100;
  };

  const calculateAccountTotal = (amount, feePercentage) => {
    return amount + calculateFee(amount, feePercentage);
  };

  const getAccountsWithAmounts = () => {
    return getSelectedAccountObjects().filter(account => 
      topupAmounts[account.id] && parseFloat(topupAmounts[account.id]) > 0
    );
  };

  const calculateTotalsByurrency = () => {
    const accountsWithAmounts = getAccountsWithAmounts();
    const totals = {};
    
    // Generate unique code once and store it in state
    if (!uniqueCode && accountsWithAmounts.some(acc => (acc.currency || 'IDR') === 'IDR')) {
      setUniqueCode(Math.floor(Math.random() * 900) + 100);
    }
    
    accountsWithAmounts.forEach(account => {
      const currency = account.currency || 'IDR';
      const amount = parseFloat(topupAmounts[account.id] || 0);
      const total = calculateAccountTotal(amount, account.fee_percentage || 0);
      
      if (!totals[currency]) {
        totals[currency] = {
          subtotal: 0,
          fee: 0,
          total: 0,
          uniqueCode: currency === 'IDR' ? (uniqueCode || 0) : 0
        };
      }
      
      totals[currency].subtotal += amount;
      totals[currency].fee += calculateFee(amount, account.fee_percentage || 0);
      totals[currency].total += total;
    });

    // Add unique code to IDR total
    if (totals.IDR) {
      totals.IDR.totalWithUniqueCode = totals.IDR.total + totals.IDR.uniqueCode;
    }

    return totals;
  };

  // Additional helper functions
  const getSelectedAccounts = () => {
    return accounts.filter(account => {
      const amount = parseFloat(topupAmounts[account.id] || 0);
      return amount > 0 && (account.currency || 'IDR') === selectedCurrency;
    });
  };

  const calculateGrandTotal = () => {
    return getSelectedAccounts().reduce((total, account) => {
      const amount = parseFloat(topupAmounts[account.id] || 0);
      return total + calculateAccountTotal(amount, account.fee_percentage || 0);
    }, 0);
  };

  // Filter accounts based on search term, group, currency, and status
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.platform?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if account belongs to selected group by matching group_id with group names
    const matchesGroup = !selectedGroup || account.group_name === selectedGroup;
    const matchesCurrency = (account.currency || 'IDR') === selectedCurrency;
    
    // Hide disabled accounts if hideDisabledAccounts prop is true
    const isAccountActive = hideDisabledAccounts ? account.status === 'active' : true;
    
    return matchesSearch && matchesGroup && matchesCurrency && isAccountActive;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAccounts.length / accountsPerPage);
  const startIndex = (currentPage - 1) * accountsPerPage;
  const endIndex = startIndex + accountsPerPage;
  const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);

  // Multi-step navigation functions
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (selectedAccounts.length === 0) {
        toast.error('Pilih minimal satu akun untuk top up');
        return;
      }
      
      // Check currency consistency
      const currencies = getCurrenciesFromSelected();
      if (currencies.length > 1) {
        toast.error('Tidak dapat top up akun dengan mata uang berbeda dalam satu transaksi');
        return;
      }
      
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const accountsWithAmounts = getAccountsWithAmounts();
      if (accountsWithAmounts.length === 0) {
        toast.error('Masukkan nominal top up untuk minimal satu akun');
        return;
      }
      
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedAccounts([]);
    setTopupAmounts({});
    setBulkMode(false);
    setBulkAmount('');
    setPaymentDetails(null);
    setUniqueCode(null);
  };

  // Account selection functions
  const handleAccountToggle = (accountId) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAccounts.length === filteredAccounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(filteredAccounts.map(acc => acc.id));
    }
  };

  // Bulk amount functions
  const applyBulkAmount = () => {
    if (!bulkAmount || parseFloat(bulkAmount) <= 0) {
      toast.error('Masukkan nominal bulk yang valid');
      return;
    }
    
    const newAmounts = { ...topupAmounts };
    selectedAccounts.forEach(accountId => {
      newAmounts[accountId] = bulkAmount;
    });
    setTopupAmounts(newAmounts);
    toast.success(`Nominal ${bulkAmount} diterapkan ke ${selectedAccounts.length} akun`);
  };

  const updateAccountAmount = (accountId, amount) => {
    setTopupAmounts(prev => ({
      ...prev,
      [accountId]: amount
    }));
  };

  // Submit function
  const handleSubmitTopUp = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const accountsWithAmounts = getAccountsWithAmounts();
      const currencies = getCurrenciesFromSelected();
      
      // Group accounts by currency
      const requestsByCurrency = {};
      
      accountsWithAmounts.forEach(account => {
        const currency = account.currency || 'IDR';
        if (!requestsByCurrency[currency]) {
          requestsByCurrency[currency] = {
            currency: currency,
            accounts: [],
            total_amount: 0,
            total_fee: 0
          };
        }
        
        const amount = parseFloat(topupAmounts[account.id]);
        const fee = calculateFee(amount, account.fee_percentage || 0);
        const totalWithFee = amount + fee;
        
        requestsByCurrency[currency].accounts.push({
          account_id: account.id,
          amount: amount,
          fee_percentage: account.fee_percentage || 0,
          fee_amount: fee
        });
        
        requestsByCurrency[currency].total_amount += totalWithFee; // Include fee in total
        requestsByCurrency[currency].total_fee += fee;
      });

      // Send one request per currency
      const responses = [];
      for (const [currency, payload] of Object.entries(requestsByCurrency)) {
        const response = await axios.post(`${API}/topup`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        responses.push(response);
      }
      
      // Store payment details from first response (assuming same currency)
      setPaymentDetails(responses[0].data);
      
      toast.success(`${accountsWithAmounts.length} permintaan top up berhasil dibuat`);
      
      if (onRefresh) onRefresh();
      
    } catch (error) {
      console.error('Error submitting top up:', error);
      // Handle Pydantic validation errors
      if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
        // This is a Pydantic validation error array
        const errorMessages = error.response.data.detail.map(err => 
          `${err.loc?.join('.')} - ${err.msg}`
        ).join('; ');
        toast.error(`Validation error: ${errorMessages}`);
      } else {
        const errorMsg = error.response?.data?.detail || 'Gagal membuat permintaan top up';
        toast.error(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Helper functions for UI
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

  const formatCurrency = (amount, currency = 'IDR') => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    } else {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
      }).format(amount);
    }
  };

  const getPaymentMethodInfo = (currency) => {
    if (currency === 'USD') {
      return {
        type: 'Crypto Wallet',
        details: 'USDT TRC20',
        address: 'TBCJiUoYGxBYBpqMNb9ZtuwXWJLuCwBPXa',
        name: 'BINANCE'
      };
    } else {
      return {
        type: 'Bank Transfer',
        bank: 'BRI',
        account: '057901002665566',
        holder: 'PT RINAIYANTI CAHAYA INTERMA'
      };
    }
  };

  const calculateTotalFee = () => {
    const selectedAccounts = getSelectedAccounts();
    return selectedAccounts.reduce((totalFee, account) => {
      const amount = parseFloat(topupAmounts[account.id] || 0);
      return totalFee + calculateFee(amount, account.fee_percentage || 0);
    }, 0);
  };

  const getTransferInfo = () => {
    if (selectedCurrency === 'IDR') {
      return {
        method: 'Bank Transfer (IDR)',
        account: 'BRI 057901002665566',
        name: 'PT RINAIYANTI CAHAYA INTERMA',
        currency: 'IDR'
      };
    } else {
      return {
        method: 'USDT TRC20',
        account: 'TBCJiUoYGxBYBpqMNb9ZtuwXWJLuCwBPXa',
        name: 'USDT TRC20 Address', 
        currency: 'USD'
      };
    }
  };

  const handleAmountChange = (accountId, amount) => {
    setTopupAmounts({
      ...topupAmounts,
      [accountId]: amount
    });
  };

  const handleShowSummary = () => {
    const selectedAccounts = getSelectedAccounts();
    if (selectedAccounts.length === 0) {
      toast.error(t('pleaseSelectAtLeastOneAccount') || 'Please select at least one account to top up');
      return;
    }

    const minAmount = selectedCurrency === 'IDR' ? 50000 : 10;
    const hasInvalidAmount = selectedAccounts.some(account => {
      const amount = parseFloat(topupAmounts[account.id]);
      return amount < minAmount;
    });

    if (hasInvalidAmount) {
      const minAmountText = selectedCurrency === 'IDR' ? 'Rp 50,000' : '$10';
      toast.error(t('minTopupAmount', { amount: minAmountText }) || `Minimum top up amount is ${minAmountText}`);
      return;
    }

    setShowSummary(true);
  };

  const handleSubmitTopup = async () => {
    console.log('🚀 handleSubmitTopup called');
    setSubmitting(true);
    setShowProcessingModal(true);
    console.log('✅ Processing modal should be visible now');
    
    try {
      const token = localStorage.getItem('token');
      const accountsWithAmounts = getAccountsWithAmounts();
      const currencies = getCurrenciesFromSelected();
      
      // Group accounts by currency
      const requestsByCurrency = {};
      
      accountsWithAmounts.forEach(account => {
        const currency = account.currency || 'IDR';
        if (!requestsByCurrency[currency]) {
          requestsByCurrency[currency] = {
            currency: currency,
            accounts: [],
            total_amount: 0,
            total_fee: 0,
            unique_code: currency === 'IDR' ? uniqueCode : 0  // Send unique code from frontend
          };
        }
        
        const amount = parseFloat(topupAmounts[account.id]);
        const fee = calculateFee(amount, account.fee_percentage || 0);
        const totalWithFee = amount + fee;
        
        requestsByCurrency[currency].accounts.push({
          account_id: account.id,
          amount: amount,
          fee_percentage: account.fee_percentage || 0,
          fee_amount: fee
        });
        
        requestsByCurrency[currency].total_amount += totalWithFee; // Include fee in total
        requestsByCurrency[currency].total_fee += fee;
      });

      // Send one request per currency
      const responses = [];
      for (const [currency, payload] of Object.entries(requestsByCurrency)) {
        console.log('Sending topup data:', payload);
        const response = await axios.post(`${API}/topup`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        responses.push(response);
        console.log('Response received:', response.data);
      }
      
      // Get request ID from first response
      const requestId = responses[0].data.request_id || responses[0].data.id;
      const accountsWithDetails = responses[0].data.accounts || [];
      console.log('Request ID:', requestId);
      console.log('Accounts with details:', accountsWithDetails);
      
      if (!requestId) {
        console.error('No request ID in response:', responses[0].data);
        setShowProcessingModal(false);
        toast.error('Top up berhasil tapi tidak mendapat ID. Silakan cek riwayat top up.');
        navigate('/dashboard/topup/history');
        return;
      }
      
      // Store accounts details for payment confirmation page
      sessionStorage.setItem('topup_accounts_details', JSON.stringify(accountsWithDetails));
      
      // Complete the progress animation
      if (window.completeProcessingModal) {
        window.completeProcessingModal();
      }
      
      // Wait for animation to complete before showing next UI
      setTimeout(() => {
        setShowProcessingModal(false);
        
        // Show success message
        toast.success(`✅ Permintaan top up berhasil diajukan untuk ${accountsWithDetails.length} akun!`);
        
        // Show desktop notification if permission granted
        if (window.notificationService && window.notificationService.isEnabled()) {
          window.notificationService.showClientNotification(
            'Permintaan Top Up Berhasil',
            `ID: ${requestId} - ${accountsWithDetails.length} akun. Silakan upload bukti transfer.`,
            'info'
          );
        }
        
        // Show upload prompt modal
        setPendingRequestId(requestId);
        setShowUploadPrompt(true);
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting top up:', error);
      setShowProcessingModal(false);
      // Handle Pydantic validation errors
      if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
        // This is a Pydantic validation error array
        const errorMessages = error.response.data.detail.map(err => 
          `${err.loc?.join('.')} - ${err.msg}`
        ).join('; ');
        toast.error(`Validation error: ${errorMessages}`);
      } else {
        const errorMsg = error.response?.data?.detail || 'Gagal membuat permintaan top up';
        toast.error(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const quickAmountsIDR = [50000, 100000, 250000, 500000, 1000000, 2500000];
  const quickAmountsUSD = [10, 25, 50, 100, 250, 500];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center">
            {hideDisabledAccounts && (
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard/topup')}
                className="mr-4 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            )}
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Wallet className="mr-3 text-green-600" />
              {t('addBalance') || 'Isi Saldo Akun'}
            </h1>
          </div>
          <p className="text-gray-600 mt-1">
            {hideDisabledAccounts 
              ? 'Isi saldo akun iklan melalui transfer bank atau crypto (akun nonaktif tidak ditampilkan)'
              : (t('balanceDescription') || 'Isi saldo untuk beberapa akun iklan sekaligus dengan mata uang yang sesuai')
            }
          </p>
        </div>
        {!hideDisabledAccounts && (
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/topup/history')}
            className="flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>{t('topUpHistory') || 'Riwayat Top Up'}</span>
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4 max-w-md w-full">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'} font-semibold`}>
              1
            </div>
            <div className={`flex-1 h-1 ${currentStep > 1 ? 'bg-green-600' : 'bg-gray-300'} rounded`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'} font-semibold`}>
              2
            </div>
            <div className={`flex-1 h-1 ${currentStep > 2 ? 'bg-green-600' : 'bg-gray-300'} rounded`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'} font-semibold`}>
              3
            </div>
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600 max-w-md mx-auto">
          <span className={currentStep === 1 ? 'font-semibold text-green-600' : ''}>{t('chooseAccounts') || 'Pilih Akun'}</span>
          <span className={currentStep === 2 ? 'font-semibold text-green-600' : ''}>{t('enterAmounts') || 'Atur Nominal'}</span>
          <span className={currentStep === 3 ? 'font-semibold text-green-600' : ''}>{t('paymentSummary') || 'Ringkasan Bayar'}</span>
        </div>
      </div>

      {/* Step 1: Account Selection */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckSquare className="w-5 h-5 mr-2 text-green-600" />
                  {t('chooseAccounts') || 'Pilih Akun'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {t('chooseAccountsToTopUp') || 'Pilih akun yang ingin Anda isi saldonya'}
                </p>
              </div>
              
              {selectedAccounts.length > 0 && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800 font-medium">
                    {selectedAccounts.length} {t('chosenAccounts') || 'akun terpilih'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Currency Selection - Mobile Responsive */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('chooseCurrency') || 'Pilih Mata Uang'} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedCurrency('IDR')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedCurrency === 'IDR' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                      <span className="text-xs font-bold">Rp</span>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base">Indonesian Rupiah</div>
                      <div className="text-xs text-gray-500 break-words">Bank Transfer - BRI</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setSelectedCurrency('USD')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedCurrency === 'USD' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                      <span className="text-sm font-bold">$</span>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base">US Dollar</div>
                      <div className="text-xs text-gray-500 break-words">Crypto - USDT TRC20</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Search and Filter Bar - Mobile Responsive */}
            <div className="space-y-3">
              {/* Search Box - Full width on mobile */}
              <div className="relative">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('findAccount') || 'Cari akun...'}
                  className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Filters Row - Stack on mobile if needed */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Group Filter */}
                {groups.length > 0 && (
                  <div className="flex-1">
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base sm:text-sm"
                    >
                      <option value="">{t('allGroup') || 'Semua Grup'}</option>
                      {groups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Select All/None Toggle */}
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-base sm:text-sm whitespace-nowrap flex-shrink-0"
                >
                  {selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-green-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="hidden sm:inline">{selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0 ? (t('deselectAll') || 'Batal Pilih Semua') : (t('selectAll') || 'Pilih Semua')}</span>
                  <span className="sm:hidden">{selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0 ? 'Batal' : 'Semua'}</span>
                </button>
              </div>
              
              {/* Filter Results Info */}
              <div className="text-sm text-gray-600 flex items-center space-x-4">
                <span>
                  {t('showing') || 'Menampilkan'} {filteredAccounts.length} {t('from') || 'dari'} {accounts.length} {t('totalAccounts') || 'akun'} ({selectedCurrency})
                </span>
                {(searchTerm || selectedGroup) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedGroup('');
                    }}
                    className="text-green-600 hover:text-green-800 text-xs"
                  >
                    {t('clearFilter') || 'Hapus Filter'}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {filteredAccounts.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">
                  {searchTerm ? (t('accountNotFound') || 'Tidak ada akun ditemukan') : (t('noAccountAvailable') || 'Tidak Ada Akun Tersedia')}
                </p>
                <p className="text-sm text-gray-400">
                  {searchTerm 
                    ? (t('tryOtherKeyword') || 'Coba kata kunci pencarian yang berbeda')
                    : (t('noAccountForCurrency') || `Belum ada akun ${selectedCurrency} yang tersedia untuk top up`)
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAccounts.map((account) => (
                  <div key={account.id} className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedAccounts.includes(account.id) 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`} onClick={() => handleAccountToggle(account.id)}>
                    {/* Mobile: Stack vertically for better layout */}
                    <div className="space-y-3">
                      {/* Checkbox, Icon, Name - Top section */}
                      <div className="flex items-start gap-2 sm:gap-3">
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(account.id)}
                          onChange={() => handleAccountToggle(account.id)}
                          className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50 mt-1 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {getPlatformIcon(account.platform)}
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* Nama akun WRAP, bukan truncate */}
                            <h3 className="font-medium text-gray-900 break-words [overflow-wrap:anywhere]">{account.account_name}</h3>
                            <p className="text-sm text-gray-500 capitalize">{account.platform} Ads</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Account ID */}
                      <div className="pl-6 sm:pl-9">
                        <p className="text-xs text-gray-500">{t('idAccount') || 'Account ID'}</p>
                        <p className="text-sm font-mono text-gray-900 break-all">{account.account_id}</p>
                      </div>
                      
                      {/* Status and Balance */}
                      <div className="flex justify-between items-center gap-2 pl-6 sm:pl-9">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          account.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {t(account.status) || account.status}
                        </span>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-gray-500">
                            {t('balance') || 'Saldo'}
                          </div>
                          <div className="text-sm font-medium break-all">
                            {formatCurrency(account.balance || 0, account.currency || 'IDR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Step 1 Actions */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <div></div>
            <button
              onClick={handleNextStep}
              disabled={selectedAccounts.length === 0}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{t('next') || 'Lanjutkan'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Step 2: Set Amounts */}
      {currentStep === 2 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-green-600" />
              {t('enterAmounts') || 'Atur Nominal'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('enterTopUpAmounts') || 'Tentukan nominal top up untuk setiap akun yang dipilih'}
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Selected Accounts Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">
                {t('chosenAccounts') || 'Akun Terpilih'} ({selectedAccounts.length}) - {selectedCurrency}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {getSelectedAccountObjects().map(account => (
                  <div key={account.id} className="flex items-start gap-2 text-sm min-w-0">
                    <div className="flex-shrink-0">{getPlatformIcon(account.platform)}</div>
                    <span className="font-medium break-words [overflow-wrap:anywhere] flex-1 min-w-0">{account.account_name}</span>
                    <span className="text-gray-600 flex-shrink-0 break-all">({formatCurrency(account.balance || 0, selectedCurrency)})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bulk Top Up Option - Mobile Responsive */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-blue-900 text-base sm:text-lg">
                    {t('bulkMode') || '✨ Bulk Top Up'}
                  </h4>
                  <p className="text-sm text-blue-700 break-words">
                    {t('bulkFeatureDesc') || 'Atur nominal yang sama untuk semua akun'}
                  </p>
                </div>
                <button
                  onClick={() => setBulkMode(!bulkMode)}
                  className={`px-3 py-1.5 sm:py-1 rounded text-sm font-medium transition-colors flex-shrink-0 ${
                    bulkMode ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-300'
                  }`}
                >
                  {bulkMode ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>
              
              {bulkMode && (
                <div className="space-y-3">
                  {/* Input - Full width on mobile */}
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      💰 Masukkan Nominal untuk Semua Akun
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-base sm:text-sm font-medium">
                        {selectedCurrency === 'IDR' ? 'Rp' : '$'}
                      </span>
                      <input
                        type="number"
                        placeholder={selectedCurrency === 'IDR' ? '100000' : '50'}
                        value={bulkAmount}
                        onChange={(e) => setBulkAmount(e.target.value)}
                        className="w-full pl-10 sm:pl-8 pr-4 py-3 sm:py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right text-base sm:text-sm font-medium"
                      />
                    </div>
                  </div>
                  {/* Button - Full width on mobile */}
                  <button
                    onClick={applyBulkAmount}
                    className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base sm:text-sm"
                  >
                    {t('applyAll') || 'Terapkan ke Semua Akun'}
                  </button>
                  <p className="text-xs text-blue-600">
                    💡 Setelah diterapkan, Anda masih bisa edit nominal setiap akun secara individual
                  </p>
                </div>
              )}
            </div>

            {/* Individual Account Amounts */}
            <div className="space-y-4">
              {getSelectedAccountObjects().map(account => {
                const amount = parseFloat(topupAmounts[account.id] || 0);
                const fee = calculateFee(amount, account.fee_percentage || 0);
                const total = amount + fee;
                
                return (
                  <div key={account.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                      {/* Account Info */}
                      <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                        <div className="flex-shrink-0">{getPlatformIcon(account.platform)}</div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 break-words [overflow-wrap:anywhere]">{account.account_name}</h4>
                          <p className="text-sm text-gray-500 capitalize">{account.platform} Ads</p>
                          <div className="text-xs text-gray-400 break-words">
                            {t('balance') || 'Saldo'}: {formatCurrency(account.balance || 0, selectedCurrency)}
                            {account.fee_percentage > 0 && ` • Fee: ${account.fee_percentage}%`}
                          </div>
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('fillAmount') || 'Nominal Top Up'} *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            {selectedCurrency === 'IDR' ? 'Rp' : '$'}
                          </span>
                          <input
                            type="number"
                            placeholder="0"
                            value={topupAmounts[account.id] || ''}
                            onChange={(e) => updateAccountAmount(account.id, e.target.value)}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                            min="0"
                            step={selectedCurrency === 'IDR' ? '1000' : '1'}
                          />
                        </div>
                      </div>

                      {/* Calculation */}
                      <div>
                        {amount > 0 ? (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>{t('amount') || 'Nominal'}:</span>
                                <span className="font-medium">{formatCurrency(amount, selectedCurrency)}</span>
                              </div>
                              {fee > 0 && (
                                <div className="flex justify-between text-orange-600">
                                  <span>{t('fee') || 'Fee'} ({account.fee_percentage}%):</span>
                                  <span>{formatCurrency(fee, selectedCurrency)}</span>
                                </div>
                              )}
                              <hr />
                              <div className="flex justify-between font-medium text-green-600">
                                <span>{t('total') || 'Total'}:</span>
                                <span>{formatCurrency(total, selectedCurrency)}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">
                            {t('inputAmountFirst') || 'Masukkan nominal untuk melihat kalkulasi'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Step 2 Actions */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={handlePreviousStep}
              className="flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('back') || 'Sebelumnya'}</span>
            </button>
            <button
              onClick={handleNextStep}
              disabled={getAccountsWithAmounts().length === 0}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <span>{t('next') || 'Lanjutkan'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment Summary */}
      {currentStep === 3 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                  {t('paymentSummary') || 'Ringkasan Pembayaran'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {t('reviewDetails') || 'Tinjau detail sebelum melakukan transfer'}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addMoreBalance') || 'Top Up Lagi'}</span>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account Details */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">{t('balanceDetails') || 'Detail Top Up'}</h3>
                {getAccountsWithAmounts().map(account => {
                  const amount = parseFloat(topupAmounts[account.id]);
                  const fee = calculateFee(amount, account.fee_percentage || 0);
                  const total = amount + fee;
                  
                  return (
                    <div key={account.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="flex-shrink-0">{getPlatformIcon(account.platform)}</div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-gray-900 break-words [overflow-wrap:anywhere]">{account.account_name}</h4>
                            <p className="text-sm text-gray-500 capitalize break-words">{account.platform} Ads</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="break-words">{t('fillAmount') || 'Nominal Top Up'}:</span>
                          <span className="font-medium break-all flex-shrink-0">{formatCurrency(amount, selectedCurrency)}</span>
                        </div>
                        {fee > 0 && (
                          <div className="flex justify-between text-orange-600 gap-2">
                            <span className="break-words">{t('fee') || 'Fee'} ({account.fee_percentage}%):</span>
                            <span className="break-all flex-shrink-0">{formatCurrency(fee, selectedCurrency)}</span>
                          </div>
                        )}
                        <hr />
                        <div className="flex justify-between font-medium text-green-600 gap-2">
                          <span className="break-words">{t('subtotal') || 'Subtotal'}:</span>
                          <span className="break-all flex-shrink-0">{formatCurrency(total, selectedCurrency)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Info */}
              <div className="space-y-4">
                {Object.entries(calculateTotalsByurrency()).map(([currency, totals]) => {
                  const paymentInfo = getPaymentMethodInfo(currency);
                  
                  return (
                    <div key={currency} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white mr-2 ${
                          currency === 'IDR' ? 'bg-blue-600' : 'bg-green-600'
                        }`}>
                          {currency === 'IDR' ? 'Rp' : '$'}
                        </div>
                        {t('sendTo') || 'Transfer ke'} {currency}
                      </h3>
                      
                      {/* Total */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(currency === 'IDR' ? totals.totalWithUniqueCode : totals.total, currency)}
                          </div>
                          <div className="text-sm text-gray-600">{t('totalPayment') || 'Total Transfer'}</div>
                        </div>
                        
                        {currency === 'IDR' && (
                          <div className="mt-3 pt-3 border-t text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>{formatCurrency(totals.subtotal, currency)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Fee:</span>
                              <span>{formatCurrency(totals.fee, currency)}</span>
                            </div>
                            <div className="flex justify-between text-blue-600">
                              <span>Kode Unik:</span>
                              <span>+{totals.uniqueCode}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Payment Method */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">{t('howToPay') || 'Metode Pembayaran'}</h4>
                        {currency === 'IDR' ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t('bank') || 'Bank'}:</span>
                              <span className="font-medium">{paymentInfo.bank}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t('bankAccount') || 'No. Rekening'}:</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium font-mono">{paymentInfo.account}</span>
                                <button
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(paymentInfo.account);
                                      toast.success('✅ Nomor rekening berhasil di-copy!');
                                    } catch (error) {
                                      toast.error('❌ Gagal copy nomor rekening');
                                    }
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t('accountHolder') || 'Atas Nama'}:</span>
                              <span className="font-medium">{paymentInfo.holder}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t('network') || 'Network'}:</span>
                              <span className="font-medium">{paymentInfo.details}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t('wallet') || 'Wallet'}:</span>
                              <span className="font-medium">{paymentInfo.name}</span>
                            </div>
                            <div className="space-y-1">
                              <div className="text-gray-600 text-xs">{t('address') || 'Address'}:</div>
                              <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                                <span className="font-mono text-xs flex-1 break-all">{paymentInfo.address}</span>
                                <button
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(paymentInfo.address);
                                      toast.success('✅ Alamat wallet berhasil di-copy!');
                                    } catch (error) {
                                      toast.error('❌ Gagal copy alamat wallet');
                                    }
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={handleSubmitTopup}
                        disabled={submitting}
                        className="w-full mt-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                        <span>
                          {submitting 
                            ? (t('submitting') || 'Memproses...') 
                            : (t('confirmBalance') || 'Konfirmasi Top Up')
                          }
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Prompt Modal */}
      {showUploadPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                ✅ Top Up Berhasil Diajukan!
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Request ID:</span>
                    <span className="font-mono font-semibold text-gray-900">{pendingRequestId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-orange-600 font-semibold">Menunggu Pembayaran</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-gray-600 mb-6">
                Silakan lakukan transfer dan upload bukti pembayaran
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowUploadPrompt(false);
                    navigate(`/dashboard/topup/confirmation/${pendingRequestId}`);
                  }}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload Bukti Sekarang
                </button>
                
                <button
                  onClick={() => {
                    setShowUploadPrompt(false);
                    navigate('/dashboard/topup/history');
                  }}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  Upload Nanti di Riwayat
                </button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-4">
                💡 Anda bisa upload bukti kapan saja di halaman Riwayat Top Up
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      <ProcessingModal 
        isOpen={showProcessingModal}
        onComplete={() => setShowProcessingModal(false)}
        estimatedTime={60000}
      />
    </div>
  );
};

export default TopUp;