import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Wallet,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  CreditCard,
  CheckCircle,
  RefreshCw,
  Users,
  AlertCircle
} from "lucide-react";
import { formatCurrency } from '../utils/currencyFormatter';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WalletToAccountTransfer = ({ onBack, onRefresh, walletType }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [walletBalances, setWalletBalances] = useState({
    main_wallet_idr: 0,
    main_wallet_idr_available: 0,
    main_wallet_idr_pending: 0,
    main_wallet_usd: 0,
    main_wallet_usd_available: 0,
    main_wallet_usd_pending: 0,
    withdrawal_wallet_idr: 0,
    withdrawal_wallet_idr_available: 0,
    withdrawal_wallet_idr_pending: 0,
    withdrawal_wallet_usd: 0,
    withdrawal_wallet_usd_available: 0,
    withdrawal_wallet_usd_pending: 0
  });
  
  // Form data
  const [formData, setFormData] = useState({
    source_wallet: walletType || 'main',
    currency: 'IDR',
    notes: ''
  });
  
  // Multiple account selection
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [accountAmounts, setAccountAmounts] = useState({}); // { accountId: amount }
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkAmount, setBulkAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all'); // Filter by platform
  const [groupFilter, setGroupFilter] = useState('all'); // Filter by group

  // Fetch data on component mount
  useEffect(() => {
    Promise.all([
      fetchWalletBalances(),
      fetchAccounts()
    ]).finally(() => setLoading(false));
  }, []);

  // Fetch wallet balances
  const fetchWalletBalances = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/wallet/balances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWalletBalances(response.data);
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
    }
  };

  // Fetch user accounts
  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter only active accounts
      const activeAccounts = response.data.filter(account => account.status === 'active');
      setAccounts(activeAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Gagal memuat daftar akun');
    }
  };

  // Handle form changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle account selection
  const toggleAccountSelection = (accountId) => {
    setSelectedAccounts(prev => {
      if (prev.includes(accountId)) {
        // Remove account
        const newSelected = prev.filter(id => id !== accountId);
        setAccountAmounts(prevAmounts => {
          const newAmounts = { ...prevAmounts };
          delete newAmounts[accountId];
          return newAmounts;
        });
        return newSelected;
      } else {
        // Add account
        return [...prev, accountId];
      }
    });
  };

  // Handle select all accounts
  const handleSelectAll = () => {
    const filteredAccounts = getAccountsByCurrency();
    if (selectedAccounts.length === filteredAccounts.length) {
      // Deselect all
      setSelectedAccounts([]);
      setAccountAmounts({});
    } else {
      // Select all
      setSelectedAccounts(filteredAccounts.map(acc => acc.id));
    }
  };

  // Handle amount change for specific account
  const handleAmountChange = (accountId, amount) => {
    setAccountAmounts(prev => ({
      ...prev,
      [accountId]: amount
    }));
  };

  // Handle bulk amount
  const applyBulkAmount = () => {
    if (bulkAmount && selectedAccounts.length > 0) {
      const newAmounts = {};
      selectedAccounts.forEach(accountId => {
        newAmounts[accountId] = bulkAmount;
      });
      setAccountAmounts(newAmounts);
    }
  };

  // Get available balance for selected wallet and currency
  const getAvailableBalance = () => {
    const key = `${formData.source_wallet}_wallet_${formData.currency.toLowerCase()}_available`;
    return walletBalances[key] || 0;
  };

  // Calculate fee based on wallet type
  const calculateFee = (amount, account) => {
    if (formData.source_wallet === 'withdrawal') {
      return 0; // Withdrawal wallet is fee-free
    }
    
    // Main wallet fee based on account's fee_percentage set by admin
    const feePercentage = account?.fee_percentage || 1; // Default 1% if not set
    return (amount * feePercentage) / 100;
  };

  // Calculate total amount including fee
  const calculateTotal = (amount, account) => {
    return amount + calculateFee(amount, account);
  };

  // Calculate totals for all selected accounts
  const calculateGrandTotals = () => {
    let totalAmount = 0;
    let totalFee = 0;
    
    selectedAccounts.forEach(accountId => {
      const account = accounts.find(acc => acc.id === accountId);
      const amount = parseFloat(accountAmounts[accountId]) || 0;
      if (account && amount > 0) {
        totalAmount += amount;
        totalFee += calculateFee(amount, account);
      }
    });
    
    return {
      totalAmount,
      totalFee,
      grandTotal: totalAmount + totalFee
    };
  };

  // Get selected account
  const getSelectedAccount = () => {
    return accounts.find(account => account.id === formData.account_id);
  };

  // Form validation
  const validateForm = () => {
    if (selectedAccounts.length === 0) {
      toast.error('Harap pilih minimal satu akun');
      return false;
    }

    // Validate each account has amount
    let hasValidAmount = false;
    for (const accountId of selectedAccounts) {
      const amount = parseFloat(accountAmounts[accountId]) || 0;
      if (amount > 0) {
        hasValidAmount = true;
        break;
      }
    }

    if (!hasValidAmount) {
      toast.error('Harap masukkan nominal untuk minimal satu akun');
      return false;
    }
    
    const { grandTotal } = calculateGrandTotals();
    const availableBalance = getAvailableBalance();
    if (grandTotal > availableBalance) {
      toast.error(`Saldo ${formData.source_wallet} wallet tidak mencukupi`);
      return false;
    }

    return true;
  };

  // Submit transfer
  const handleTransferClick = () => {
    if (!validateForm()) return;
    setShowConfirmModal(true);
  };

  const submitTransfer = async () => {
    // Close modal immediately
    setShowConfirmModal(false);
    
    // Prevent double submission
    if (submitting) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      // Prepare transfers array
      const transfers = [];
      selectedAccounts.forEach(accountId => {
        const amount = parseFloat(accountAmounts[accountId]);
        if (amount > 0) {
          const account = accounts.find(acc => acc.id === accountId);
          transfers.push({
            target_account_id: accountId,
            target_account_name: account.account_name,
            amount: amount,
            fee: calculateFee(amount, account),
            total: calculateTotal(amount, account)
          });
        }
      });

      const transferData = {
        source_wallet_type: formData.source_wallet,
        currency: formData.currency,
        transfers: transfers,
        notes: formData.notes
      };

      const response = await axios.post(`${API}/wallet/transfer-to-accounts`, transferData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Show success message
      toast.success(`Permintaan transfer untuk ${transfers.length} akun berhasil dikirim! Menunggu verifikasi admin.`, {
        duration: 3000
      });
      
      // Refresh data if callback provided
      if (onRefresh) {
        onRefresh();
      }

      // Navigate immediately to dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error('Error submitting transfer:', error);
      toast.error(error.response?.data?.detail || 'Terjadi kesalahan saat transfer');
      setSubmitting(false); // Only reset on error
    }
    // Note: Don't reset submitting on success to prevent re-clicking
  };

  // Filter accounts by currency
  const getAccountsByCurrency = () => {
    return accounts.filter(account => account.currency === formData.currency);
  };

  // Get unique groups from accounts
  const getUniqueGroups = () => {
    const groups = accounts
      .filter(account => account.group_name)
      .map(account => ({ id: account.group_id, name: account.group_name }));
    
    // Remove duplicates based on group_id
    const uniqueGroups = groups.filter((group, index, self) =>
      index === self.findIndex((g) => g.id === group.id)
    );
    
    return uniqueGroups;
  };

  // Get filtered accounts based on all filters
  const getFilteredAccounts = () => {
    return getAccountsByCurrency().filter(account => {
      // Search filter (search in account name, platform, or group name)
      const matchesSearch = searchTerm === '' || 
                          account.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          account.platform?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          account.group_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Platform filter (case-insensitive)
      const matchesPlatform = platformFilter === 'all' || 
                            account.platform?.toLowerCase() === platformFilter.toLowerCase();
      
      // Group filter
      const matchesGroup = groupFilter === 'all' || account.group_id === groupFilter;
      
      return matchesSearch && matchesPlatform && matchesGroup;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Memuat data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden px-1 sm:px-0">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-3 sm:mb-4 flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex-shrink-0"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">Kembali</span>
          </Button>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 break-words">
            Transfer dari Wallet ke Akun
          </h2>
        </div>
        <p className="text-sm sm:text-base text-gray-600 break-words px-2">
          Transfer saldo dari wallet Anda langsung ke akun iklan
        </p>
      </div>

      {/* Transfer Form */}
      <div className="max-w-2xl mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowRight className="w-5 h-5 mr-2 text-blue-600" />
              Detail Transfer
            </CardTitle>
            <CardDescription>
              Pilih sumber wallet, akun tujuan, dan nominal transfer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Source Wallet Selection */}
            <div className="space-y-3">
              <Label>Sumber Wallet *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Main Wallet */}
                <Card 
                  className={`cursor-pointer transition-all ${
                    formData.source_wallet === 'main' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('source_wallet', 'main')}
                >
                  <CardContent className="p-3 sm:p-4">
                    {/* Mobile: Horizontal layout, Desktop: Vertical */}
                    <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 sm:mx-auto sm:mb-3">
                        <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0 sm:w-full">
                        <h4 className="font-medium text-sm sm:text-base break-words">Main Wallet</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 break-words [overflow-wrap:anywhere]">Dari top-up langsung</p>
                        <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1">
                          <div className="text-xs sm:text-sm font-medium text-blue-600 break-all">
                            {formatCurrency(walletBalances.main_wallet_idr_available, 'IDR')}
                          </div>
                          <div className="text-xs sm:text-sm font-medium text-blue-500 break-all">
                            {formatCurrency(walletBalances.main_wallet_usd_available, 'USD')}
                          </div>
                        </div>
                      </div>
                      {formData.source_wallet === 'main' && (
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 sm:mx-auto sm:mt-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Withdrawal Wallet */}
                <Card 
                  className={`cursor-pointer transition-all ${
                    formData.source_wallet === 'withdrawal' 
                      ? 'border-green-500 bg-green-50' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('source_wallet', 'withdrawal')}
                >
                  <CardContent className="p-3 sm:p-4">
                    {/* Mobile: Horizontal layout, Desktop: Vertical */}
                    <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 sm:mx-auto sm:mb-3">
                        <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0 sm:w-full">
                        <h4 className="font-medium text-sm sm:text-base break-words">Withdrawal Wallet</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 break-words [overflow-wrap:anywhere]">Dari penarikan (bebas fee)</p>
                        <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1">
                          <div className="text-xs sm:text-sm font-medium text-green-600 break-all">
                            {formatCurrency(walletBalances.withdrawal_wallet_idr_available, 'IDR')}
                          </div>
                          <div className="text-xs sm:text-sm font-medium text-green-500 break-all">
                            {formatCurrency(walletBalances.withdrawal_wallet_usd_available, 'USD')}
                          </div>
                        </div>
                      </div>
                      {formData.source_wallet === 'withdrawal' && (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 sm:mx-auto sm:mt-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Currency Selection */}
            <div className="space-y-2">
              <Label htmlFor="currency">Mata Uang *</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata uang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDR">Indonesian Rupiah (IDR)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Available Balance Display */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Saldo tersedia: <span className="font-medium">{formatCurrency(getAvailableBalance(), formData.currency)}</span>
                </p>
              </div>
            </div>

            {/* Account Selection & Amounts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-medium">Pilih Akun & Nominal Transfer *</Label>
                {getAccountsByCurrency().length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    type="button"
                  >
                    {selectedAccounts.length === getAccountsByCurrency().length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                  </Button>
                )}
              </div>

              {getAccountsByCurrency().length === 0 ? (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-800">
                      Tidak ada akun aktif dengan mata uang {formData.currency}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Search and Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {/* Search */}
                    <div>
                      <Input
                        placeholder="🔍 Cari akun..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    {/* Platform Filter */}
                    <div>
                      <Select value={platformFilter} onValueChange={setPlatformFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="📱 Semua Platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Platform</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Group Filter */}
                    <div>
                      <Select value={groupFilter} onValueChange={setGroupFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="📂 Semua Group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Group</SelectItem>
                          {getUniqueGroups().map(group => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Bulk Amount - Mobile Responsive */}
                  {selectedAccounts.length > 0 && (
                    <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                      {/* Mobile: Stack vertically, Desktop: Horizontal */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={bulkMode}
                            onChange={(e) => setBulkMode(e.target.checked)}
                            className="rounded flex-shrink-0"
                            id="bulk-mode-checkbox"
                          />
                          <Label htmlFor="bulk-mode-checkbox" className="text-sm font-medium cursor-pointer">
                            ✨ Nominal sama untuk semua akun
                          </Label>
                        </div>
                        {bulkMode && (
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Input
                              type="number"
                              placeholder={formData.currency === 'IDR' ? 'Contoh: 50000' : 'Contoh: 25'}
                              value={bulkAmount}
                              onChange={(e) => setBulkAmount(e.target.value)}
                              className="flex-1 sm:w-32"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={applyBulkAmount}
                              type="button"
                              className="flex-shrink-0 bg-white hover:bg-blue-100"
                            >
                              Terapkan
                            </Button>
                          </div>
                        )}
                      </div>
                      {bulkMode && (
                        <p className="text-xs text-blue-700 mt-2">
                          💡 Nominal yang diisi akan diterapkan ke semua akun yang dipilih
                        </p>
                      )}
                    </div>
                  )}

                  {/* Account List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {getFilteredAccounts().length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">Tidak ada akun ditemukan</p>
                        <p className="text-sm mt-1">
                          Coba ubah filter atau kata kunci pencarian
                        </p>
                      </div>
                    ) : (
                      getFilteredAccounts().map((account) => (
                        <div
                          key={account.id}
                          className={`border rounded-lg p-3 sm:p-4 transition-all ${
                            selectedAccounts.includes(account.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {/* Mobile: Stack vertically, Desktop: Horizontal */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            {/* Checkbox and Account Info */}
                            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={selectedAccounts.includes(account.id)}
                                onChange={() => toggleAccountSelection(account.id)}
                                className="rounded mt-1 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                {/* Account Name - WRAP not truncate */}
                                <div className="flex items-start gap-2 mb-1">
                                  <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                  <span className="font-medium break-words [overflow-wrap:anywhere] flex-1">{account.account_name}</span>
                                </div>
                                {/* Platform and Tags */}
                                <div className="flex items-center gap-2 flex-wrap ml-6">
                                  <span className="text-xs sm:text-sm text-gray-500">({account.platform})</span>
                                  {account.group_name && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded break-all">
                                      📂 {account.group_name}
                                    </span>
                                  )}
                                  {formData.source_wallet === 'main' && (
                                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                                      Fee: {account.fee_percentage || 5}%
                                    </span>
                                  )}
                                </div>
                                {/* Balance */}
                                <p className="text-xs sm:text-sm text-gray-600 ml-6 mt-1 break-all">
                                  Saldo: {formatCurrency(account.balance || 0, account.currency)}
                                </p>
                              </div>
                            </div>
                            {/* Amount Input - Mobile: Full width with border, Desktop: Compact */}
                            {selectedAccounts.includes(account.id) && (
                              <div className="w-full sm:w-auto sm:flex-shrink-0">
                                {/* Mobile: Separate section with border */}
                                <div className="sm:hidden w-full mt-3 pt-3 border-t border-gray-200">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    💰 Masukkan Nominal Transfer
                                  </label>
                                  <Input
                                    type="number"
                                    placeholder={formData.currency === 'IDR' ? 'Contoh: 50000' : 'Contoh: 25'}
                                    value={accountAmounts[account.id] || ''}
                                    onChange={(e) => handleAmountChange(account.id, e.target.value)}
                                    min="0"
                                    step={formData.currency === 'IDR' ? '1000' : '0.01'}
                                    className="text-right text-base"
                                  />
                                  {accountAmounts[account.id] && (
                                    <div className="text-xs text-gray-600 mt-2 space-y-1 bg-blue-50 p-2 rounded">
                                      <div className="flex justify-between">
                                        <span>Nominal:</span>
                                        <span className="font-medium">{formatCurrency(parseFloat(accountAmounts[account.id]), formData.currency)}</span>
                                      </div>
                                      {formData.source_wallet === 'main' && calculateFee(parseFloat(accountAmounts[account.id]), account) > 0 && (
                                        <div className="flex justify-between text-orange-600">
                                          <span>Fee ({account.fee_percentage || 5}%):</span>
                                          <span className="font-medium">{formatCurrency(calculateFee(parseFloat(accountAmounts[account.id]), account), formData.currency)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between font-semibold text-blue-700 pt-1 border-t border-blue-200">
                                        <span>Total:</span>
                                        <span>{formatCurrency(calculateTotal(parseFloat(accountAmounts[account.id]), account), formData.currency)}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Desktop: Compact inline */}
                                <div className="hidden sm:block sm:w-32">
                                  <Input
                                    type="number"
                                    placeholder="Nominal"
                                    value={accountAmounts[account.id] || ''}
                                    onChange={(e) => handleAmountChange(account.id, e.target.value)}
                                    min="0"
                                    step={formData.currency === 'IDR' ? '1000' : '0.01'}
                                    className="text-right"
                                  />
                                  {accountAmounts[account.id] && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {formData.source_wallet === 'main' && calculateFee(parseFloat(accountAmounts[account.id]), account) > 0 && (
                                        <div>Fee: {formatCurrency(calculateFee(parseFloat(accountAmounts[account.id]), account), formData.currency)}</div>
                                      )}
                                      <div className="font-medium">
                                        Total: {formatCurrency(calculateTotal(parseFloat(accountAmounts[account.id]), account), formData.currency)}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Input
                id="notes"
                placeholder="Tambahkan catatan transfer..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>

            {/* Transfer Summary */}
            {selectedAccounts.length > 0 && Object.keys(accountAmounts).some(id => parseFloat(accountAmounts[id]) > 0) && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border border-blue-200">
                <h4 className="font-bold text-lg text-blue-800 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Ringkasan Transfer
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dari Wallet:</span>
                    <span className="font-medium">
                      {formData.source_wallet === 'main' ? 'Main Wallet' : 'Withdrawal Wallet'} 
                      {formData.source_wallet === 'withdrawal' && (
                        <span className="text-green-600 text-sm ml-1">(Bebas Fee)</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah Akun:</span>
                    <span className="font-medium">{selectedAccounts.filter(id => parseFloat(accountAmounts[id]) > 0).length} akun</span>
                  </div>

                  {/* Account Breakdown */}
                  <div className="border-t border-blue-200 pt-3 mt-3">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Detail Akun:</h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto bg-white rounded-lg p-3">
                      {selectedAccounts
                        .filter(id => parseFloat(accountAmounts[id]) > 0)
                        .map(accountId => {
                          const account = accounts.find(acc => acc.id === accountId);
                          const amount = parseFloat(accountAmounts[accountId]);
                          const fee = calculateFee(amount, account);
                          const total = calculateTotal(amount, account);
                          
                          return (
                            <div key={accountId} className="border-b border-gray-100 pb-2 last:border-0">
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-900 break-words [overflow-wrap:anywhere]">
                                    {account.account_name}
                                  </p>
                                  <p className="text-xs text-gray-500 break-words">
                                    {account.platform} • {account.group_name || 'No Group'}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-semibold text-gray-900 break-all">
                                    {formatCurrency(amount, formData.currency)}
                                  </p>
                                  {formData.source_wallet === 'main' && fee > 0 && (
                                    <p className="text-xs text-orange-600 break-all">
                                      +Fee: {formatCurrency(fee, formData.currency)}
                                    </p>
                                  )}
                                  {formData.source_wallet === 'main' && fee > 0 && (
                                    <p className="text-xs text-gray-600 font-medium break-all">
                                      Total: {formatCurrency(total, formData.currency)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="space-y-2 text-sm">
                      {(() => {
                        const { totalAmount, totalFee, grandTotal } = calculateGrandTotals();
                        return (
                          <>
                            <div className="flex justify-between">
                              <span>Total Nominal:</span>
                              <span className="font-medium">{formatCurrency(totalAmount, formData.currency)}</span>
                            </div>
                            {formData.source_wallet === 'main' && totalFee > 0 && (
                              <div className="flex justify-between text-orange-600">
                                <span>Total Fee:</span>
                                <span className="font-medium">{formatCurrency(totalFee, formData.currency)}</span>
                              </div>
                            )}
                            <div className="border-t pt-2 mt-2">
                              <div className="flex justify-between font-bold text-lg">
                                <span>Grand Total:</span>
                                <span className="text-green-600">{formatCurrency(grandTotal, formData.currency)}</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Available Balance Warning */}
                  {(() => {
                    const { grandTotal } = calculateGrandTotals();
                    const availableBalance = getAvailableBalance();
                    if (grandTotal > availableBalance) {
                      return (
                        <div className="bg-red-100 border border-red-300 rounded-lg p-3 mt-3">
                          <p className="text-red-800 text-sm font-medium">
                            ⚠️ Saldo tidak mencukupi! Butuh: {formatCurrency(grandTotal, formData.currency)}, 
                            Tersedia: {formatCurrency(availableBalance, formData.currency)}
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleTransferClick}
            disabled={submitting || selectedAccounts.length === 0 || !Object.keys(accountAmounts).some(id => parseFloat(accountAmounts[id]) > 0)}
            className="min-w-36"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Transfer ke {selectedAccounts.filter(id => parseFloat(accountAmounts[id]) > 0).length} Akun
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Konfirmasi Transfer
              </h3>
            </div>

            <div className="mb-6 space-y-3">
              <p className="text-gray-700">
                Apakah Anda yakin ingin melakukan transfer dari <span className="font-semibold">{formData.source_wallet === 'main' ? 'Main Wallet' : 'Withdrawal Wallet'}</span> ke{' '}
                <span className="font-semibold">{selectedAccounts.filter(id => parseFloat(accountAmounts[id]) > 0).length} akun</span>?
              </p>

              {/* List Akun Detail */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                <p className="text-sm font-semibold text-gray-900 mb-2">Daftar Akun:</p>
                <div className="space-y-2">
                  {selectedAccounts
                    .filter(id => parseFloat(accountAmounts[id]) > 0)
                    .map((accountId, index) => {
                      const account = accounts.find(acc => acc.id === accountId);
                      const amount = parseFloat(accountAmounts[accountId]);
                      const fee = calculateFee(amount, account);
                      const total = calculateTotal(amount, account);
                      
                      return (
                        <div key={accountId} className="bg-white border border-gray-200 rounded p-2 text-xs">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 truncate">{account?.account_name}</p>
                              <p className="text-gray-500 text-xs">{account?.platform}</p>
                            </div>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-2 flex-shrink-0">
                              #{index + 1}
                            </span>
                          </div>
                          <div className="space-y-0.5 text-gray-600">
                            <div className="flex justify-between">
                              <span>Amount:</span>
                              <span className="font-medium">{formatCurrency(amount, formData.currency)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Fee:</span>
                              <span className="font-medium">{formatCurrency(fee, formData.currency)}</span>
                            </div>
                            <div className="flex justify-between pt-0.5 border-t border-gray-200">
                              <span className="font-semibold">Total:</span>
                              <span className="font-semibold text-blue-700">{formatCurrency(total, formData.currency)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Summary Total */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-blue-900 mb-2">Ringkasan Total:</p>
                <div className="space-y-1 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Mata Uang:</span>
                    <span className="font-semibold">{formData.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        selectedAccounts.reduce((sum, id) => sum + (parseFloat(accountAmounts[id]) || 0), 0),
                        formData.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Fee:</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        selectedAccounts.reduce((sum, id) => {
                          const amount = parseFloat(accountAmounts[id]) || 0;
                          if (amount > 0) {
                            const account = accounts.find(acc => acc.id === id);
                            return sum + calculateFee(amount, account);
                          }
                          return sum;
                        }, 0),
                        formData.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-300">
                    <span className="font-bold">Grand Total:</span>
                    <span className="font-bold">
                      {formatCurrency(
                        selectedAccounts.reduce((sum, id) => {
                          const amount = parseFloat(accountAmounts[id]) || 0;
                          if (amount > 0) {
                            const account = accounts.find(acc => acc.id === id);
                            return sum + calculateTotal(amount, account);
                          }
                          return sum;
                        }, 0),
                        formData.currency
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                <strong>Perhatian:</strong> Transfer akan diproses setelah disetujui oleh admin. Saldo akan dikurangi dari wallet Anda.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirmModal(false)}
                variant="outline"
                className="flex-1"
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                onClick={submitTransfer}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Ya, Transfer Sekarang'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletToAccountTransfer;