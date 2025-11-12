import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
// Tabs import removed - no longer needed
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { Wallet, CreditCard, Clock, RefreshCw, X, AlertCircle } from "lucide-react";
import { formatCurrency } from '../utils/currencyFormatter';
import ProcessingModal from './ProcessingModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Simplified ProofImage component
const ProofImage = ({ withdrawalId, proofPath, className, onImageClick }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      if (!withdrawalId || !proofPath) {
        console.log('ProofImage: Missing withdrawalId or proofPath');
        setImageError(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Try API endpoint first
        const token = localStorage.getItem('token');
        console.log(`ProofImage: Loading from API endpoint for withdrawal ${withdrawalId}`);
        const response = await fetch(`${API}/client/balance-proof/${withdrawalId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          if (blob.size === 0) {
            console.error('ProofImage: Received empty blob');
            setImageError(true);
            setLoading(false);
            return;
          }
          const imageUrl = URL.createObjectURL(blob);
          setImageSrc(imageUrl);
          setLoading(false);
          console.log('ProofImage: Successfully loaded from API');
        } else {
          console.error(`ProofImage: API endpoint failed with status ${response.status}`);
          setImageError(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('ProofImage: Error loading image:', error);
        setImageError(true);
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup blob URL on unmount
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [withdrawalId, proofPath]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('ProofImage handleClick called!', { withdrawalId, proofPath });
    if (onImageClick) {
      console.log('Calling onImageClick');
      onImageClick();
    }
  };

  if (loading) {
    return (
      <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-500 text-sm">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
          <span>Memuat gambar...</span>
        </div>
      </div>
    );
  }

  // Show loading skeleton
  if (loading) {
    return (
      <div className="w-full h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg border animate-pulse flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600">Memuat gambar...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (imageError || !imageSrc) {
    return (
      <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 text-sm">
        <div className="flex flex-col items-center gap-1">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>Gambar tidak tersedia</p>
        </div>
      </div>
    );
  }

  // Show loaded image
  return (
    <div 
      className={`${className} cursor-pointer relative group`}
      onClick={handleClick}
    >
      <img 
        src={imageSrc}
        alt="Bukti Verifikasi"
        className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105"
        onError={() => {
          setImageError(true);
          setLoading(false);
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
        <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      </div>
    </div>
  );
};

const Withdraw = ({ onRefresh }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  // Tab removed - withdraw only now
  
  // Balance Transfer states
  const [user, setUser] = useState(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [selectedTransferAccount, setSelectedTransferAccount] = useState(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageData, setModalImageData] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingWithdrawalId, setLoadingWithdrawalId] = useState(null);
  
  // Transfer Request monitoring states
  const [transferRequests, setTransferRequests] = useState([]);
  
  // Search states for account selection
  const [transferAccountSearch, setTransferAccountSearch] = useState("");
  const [withdrawAccountSearch, setWithdrawAccountSearch] = useState("");

  useEffect(() => {
    fetchAccounts();
    fetchUserData();
    fetchWithdrawHistory();
    fetchTransferRequests();
  }, []);

  // Auto-refresh data every 10 seconds for real-time updates
  // Only refreshes accounts, history, and transfer requests - doesn't affect form inputs
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAccounts();
      fetchWithdrawHistory();
      fetchTransferRequests();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Manual refresh function for immediate updates
  const handleManualRefresh = async () => {
    await Promise.all([
      fetchAccounts(),
      fetchWithdrawHistory(),
      fetchTransferRequests()
    ]);
  };

  // Listen for withdrawal notifications and trigger immediate refresh
  useEffect(() => {
    const handleWithdrawalNotification = (event) => {
      if (event.detail && 
          (event.detail.type === 'approval' || 
           event.detail.type === 'completion' || 
           event.detail.type === 'rejection') &&
          event.detail.title && 
          (event.detail.title.includes('Penarikan') || event.detail.title.includes('Withdrawal'))) {
        // Immediately refresh withdraw data when withdrawal notification received
        setTimeout(() => {
          fetchAccounts();
          fetchWithdrawHistory();
          fetchTransferRequests();
        }, 1000); // Small delay to ensure backend is updated
      }
    };

    // Listen for notification events
    window.addEventListener('newNotification', handleWithdrawalNotification);
    
    return () => {
      window.removeEventListener('newNotification', handleWithdrawalNotification);
    };
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get(`${API}/accounts`);
      // Filter only active accounts
      const activeAccounts = response.data.filter(
        account => account.status === 'active'
      );
      setAccounts(activeAccounts);
    } catch (error) {
      toast.error(t('failedToLoadAccounts') || "Failed to load accounts");
    }
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchTransferRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/transfer-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransferRequests(response.data);
    } catch (error) {
      console.error('Error fetching transfer requests:', error);
    }
  };

  // Old handleWithdraw function removed - replaced with new implementation below

  const handleBalanceTransfer = async (e) => {
    e.preventDefault();
    if (!selectedTransferAccount || !transferAmount) {
      toast.error(t('fillRequiredFields') || 'Harap isi semua field yang diperlukan');
      return;
    }

    // Validate amount is positive number
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Jumlah transfer harus lebih dari 0');
      return;
    }

    // Currency validation - ensure wallet and account have same currency
    const accountCurrency = selectedTransferAccount.currency || 'IDR';
    const walletBalance = accountCurrency === 'USD' ? user.wallet_balance_usd : user.wallet_balance_idr;
    const currencySymbol = accountCurrency === 'USD' ? '$' : 'Rp ';
    
    if (amount > walletBalance) {
      toast.error(`Saldo wallet ${currencySymbol}${walletBalance.toLocaleString()} tidak mencukupi untuk transfer ${currencySymbol}${amount.toLocaleString()}`);
      return;
    }

    setTransferLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/balance-transfer`, {
        from_type: "wallet",
        to_type: "account", 
        account_id: selectedTransferAccount.id,
        amount: amount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`✅ Transfer request berhasil dibuat! Permintaan transfer ${currencySymbol}${amount.toLocaleString()} ke ${selectedTransferAccount.account_name} sedang menunggu approval admin.`);
      setTransferAmount("");
      setSelectedTransferAccount(null);
      fetchAccounts();
      fetchUserData();
      fetchTransferRequests();
      onRefresh && onRefresh();
    } catch (error) {
      console.error('Transfer error:', error);
      const errorMessage = error.response?.data?.detail || 'Transfer gagal, silakan coba lagi';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setTransferLoading(false);
    }
  };

  // Withdraw functionality
  const [withdrawHistory, setWithdrawHistory] = useState([]);

  const fetchWithdrawHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/withdrawals`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        params: {
          t: Date.now() // Prevent caching with timestamp
        }
      });
      setWithdrawHistory(response.data);
    } catch (error) {
      console.error('Error fetching withdraw history:', error);
    }
  };

  const checkCanWithdraw = (accountId) => {
    // Backend now provides can_withdraw status, use that instead of complex frontend logic
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
      return false;
    }
    
    // Return the can_withdraw status from backend
    return account.can_withdraw !== false;
  };

  const openImageModal = async (withdrawal) => {
    console.log('openImageModal called with:', withdrawal);
    
    // Check if proof_image exists
    if (!withdrawal.proof_image) {
      toast.error('Bukti verifikasi belum tersedia untuk penarikan ini');
      return;
    }
    
    setLoadingImage(true);
    setLoadingWithdrawalId(withdrawal.id);
    
    try {
      // Try API endpoint first
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/client/balance-proof/${withdrawal.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        
        // Check if blob is valid
        if (blob.size === 0) {
          console.error('Received empty blob for image');
          toast.error('File gambar tidak ditemukan atau rusak');
          setLoadingImage(false);
          setLoadingWithdrawalId(null);
          return;
        }
        
        const imageSrc = URL.createObjectURL(blob);
        setModalImageData({
          src: imageSrc,
          alt: `Bukti Verifikasi - ${withdrawal.account?.account_name || 'Account'}`,
          withdrawalId: withdrawal.id
        });
        setShowImageModal(true);
        setLoadingImage(false);
        setLoadingWithdrawalId(null);
        console.log('Modal opened successfully');
      } else {
        // Handle specific error codes
        if (response.status === 404) {
          toast.error('File bukti verifikasi tidak ditemukan. Silakan hubungi admin.');
        } else if (response.status === 403) {
          toast.error('Bukti verifikasi hanya tersedia untuk penarikan yang sudah disetujui');
        } else {
          toast.error('Gagal memuat gambar bukti verifikasi');
        }
        console.error(`Failed to load image: ${response.status} ${response.statusText}`);
        setLoadingImage(false);
        setLoadingWithdrawalId(null);
      }
    } catch (error) {
      console.error('Error loading image:', error);
      toast.error('Terjadi kesalahan saat memuat gambar. Silakan coba lagi.');
      setLoadingImage(false);
      setLoadingWithdrawalId(null);
    }
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    // Clean up blob URL
    if (modalImageData?.src && modalImageData.src.startsWith('blob:')) {
      URL.revokeObjectURL(modalImageData.src);
    }
    setModalImageData(null);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!selectedAccount) {
      toast.error('Pilih akun yang akan ditarik saldonya');
      return;
    }

    if (!checkCanWithdraw(selectedAccount.id)) {
      toast.error('Akun ini sudah pernah ditarik dan belum ada riwayat top up baru');
      return;
    }

    setLoading(true);
    setShowProcessingModal(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/withdrawals`, {
        account_id: selectedAccount.id,
        currency: selectedAccount.currency || 'IDR'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Complete the progress animation
      if (window.completeProcessingModal) {
        window.completeProcessingModal();
      }
      
      // Wait for animation to complete
      setTimeout(() => {
        setShowProcessingModal(false);
        
        // Show success message
        toast.success('✅ Permintaan penarikan berhasil dibuat! Akun telah dikunci sementara hingga admin memproses penarikan Anda.', {
          duration: 5000
        });
        
        // Reset form
        setSelectedAccount(null);
        setWithdrawAmount("");
        
        // Refresh data
        fetchAccounts();
        fetchWithdrawHistory();
        onRefresh && onRefresh();
        
        // Show additional info toast after a delay
        setTimeout(() => {
          toast.info('💡 Akun yang ditarik tidak dapat ditarik lagi sampai Anda melakukan top-up baru.', {
            duration: 4000
          });
        }, 2000);
      }, 2000);
      
    } catch (error) {
      setShowProcessingModal(false);
      const errorMessage = error.response?.data?.detail || 'Gagal membuat permintaan penarikan';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: (
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
      ),
      google: (
        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
      ),
      tiktok: (
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        </div>
      )
    };
    return icons[platform] || icons.facebook;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section - Mobile Responsive */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">Tarik Dana</h1>
              <p className="text-sm sm:text-base text-gray-600 break-words">Ajukan penarikan saldo dari akun iklan ke Withdrawal Wallet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section - Mobile Responsive */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="w-full">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b">
              <div className="flex items-center justify-center py-3 sm:py-4 px-3 sm:px-6 bg-green-50 text-green-700 border border-green-200 rounded-lg">
                <Wallet className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base break-words">{t('withdrawFromAccount') || 'Tarik dari Akun'}</span>
              </div>
            </div>

            {/* Withdraw Content - Mobile Responsive */}
            <div className="p-0">
              <div className="p-3 sm:p-6">
                <div className="grid gap-4 sm:gap-6 xl:grid-cols-12 xl:gap-8">
                  {/* Withdraw Form */}
                  <div className="xl:col-span-7">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-6 border border-green-100">
                      <div className="flex items-start gap-2 sm:gap-3 mb-4 sm:mb-6">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Wallet className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{t('requestWithdraw') || 'Permintaan Penarikan'}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 break-words">Dana dari akun akan ditarik ke <strong>Withdrawal Wallet</strong> setelah disetujui admin</p>
                        </div>
                      </div>
                      <form onSubmit={handleWithdraw} className="space-y-4 sm:space-y-6">
                        {/* Account Selection */}
                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-gray-700 block">
                            Pilih Akun untuk Ditarik Saldonya <span className="text-red-500">*</span>
                          </label>
                          <p className="text-xs text-gray-600 break-words">
                            Saldo akan dipindahkan ke wallet sesuai mata uang akun (IDR → IDR Wallet, USD → USD Wallet)
                          </p>
                          
                          {/* Search Box - Mobile Responsive */}
                          {accounts.length > 0 && (
                            <div className="mb-3 sm:mb-4">
                              <Input
                                placeholder="Cari akun..."
                                value={withdrawAccountSearch}
                                onChange={(e) => setWithdrawAccountSearch(e.target.value)}
                                className="h-10 sm:h-11 text-base sm:text-sm"
                              />
                            </div>
                          )}
                          
                          {accounts.length === 0 ? (
                            <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg">
                              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-500 mb-2">Tidak ada akun yang tersedia untuk penarikan</p>
                              <p className="text-sm text-gray-400">
                                Pastikan Anda memiliki akun aktif dengan saldo untuk ditarik
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {accounts
                                .filter(account => 
                                  account.account_name?.toLowerCase().includes(withdrawAccountSearch.toLowerCase()) ||
                                  account.platform?.toLowerCase().includes(withdrawAccountSearch.toLowerCase()) ||
                                  account.account_id?.toLowerCase().includes(withdrawAccountSearch.toLowerCase())
                                )
                                .map((account) => {
                                const canWithdraw = checkCanWithdraw(account.id);
                                return (
                                  <div
                                    key={account.id}
                                    onClick={() => canWithdraw && setSelectedAccount(account)}
                                    className={`
                                      p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all relative
                                      ${selectedAccount?.id === account.id
                                        ? 'border-green-500 bg-green-50'
                                        : canWithdraw
                                        ? 'border-gray-200 hover:border-gray-300 bg-white'
                                        : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                      }
                                    `}
                                  >
                                    {!canWithdraw && (
                                      <div className="absolute top-2 right-2 z-10">
                                        <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                                          Tidak Dapat Ditarik
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Mobile: Stack vertical, Desktop: Horizontal */}
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                      <div className="flex items-center gap-2 sm:gap-3">
                                        <input
                                          type="radio"
                                          name="selectedAccount"
                                          checked={selectedAccount?.id === account.id}
                                          onChange={() => canWithdraw && setSelectedAccount(account)}
                                          disabled={!canWithdraw}
                                          className="flex-shrink-0"
                                        />
                                        <div className="flex-shrink-0">
                                          {getPlatformIcon(account.platform)}
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0 space-y-2 sm:ml-0">
                                        {/* Account Name and Badges */}
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                          <h4 className="font-medium text-sm sm:text-base text-gray-900 break-words [overflow-wrap:anywhere] flex-1">
                                            {account.account_name}
                                          </h4>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                              account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                              {account.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                            <span className="text-xs text-gray-500 flex-shrink-0">
                                              {account.currency || 'IDR'}
                                            </span>
                                          </div>
                                        </div>
                                        {/* Account ID and Platform */}
                                        <p className="text-xs sm:text-sm text-gray-500 break-all">{account.account_id}</p>
                                        <p className="text-xs sm:text-sm text-gray-500 capitalize break-words">
                                          Platform: {account.platform}
                                        </p>
                                        {/* Balance - Mobile: Inline, Desktop: Separate column above */}
                                        <div className="flex items-center justify-between pt-2 border-t sm:border-0 sm:pt-0">
                                          <p className="text-xs sm:text-sm text-gray-600">Saldo Saat Ini</p>
                                          <p className="text-sm sm:text-lg font-bold text-green-600 break-all">
                                            {formatCurrency(account.balance || 0, account.currency)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Warning Message - Mobile Responsive */}
                                    {!canWithdraw && (
                                      <div className="mt-3 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-start gap-2">
                                          <svg className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                                          </svg>
                                          <p className="text-xs sm:text-sm text-yellow-800 break-words [overflow-wrap:anywhere]">
                                            Akun ini sudah pernah ditarik dan belum ada riwayat top up baru. Silakan lakukan top up terlebih dahulu.
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {accounts.filter(account => 
                                account.account_name?.toLowerCase().includes(withdrawAccountSearch.toLowerCase()) ||
                                account.platform?.toLowerCase().includes(withdrawAccountSearch.toLowerCase()) ||
                                account.account_id?.toLowerCase().includes(withdrawAccountSearch.toLowerCase())
                              ).length === 0 && withdrawAccountSearch && (
                                <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg">
                                  <p className="text-gray-500">Tidak ada akun yang ditemukan untuk "{withdrawAccountSearch}"</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                          <button
                            type="submit"
                            disabled={loading || !selectedAccount || (selectedAccount && !checkCanWithdraw(selectedAccount.id))}
                            className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            {loading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Memproses...</span>
                              </>
                            ) : (
                              <>
                                <Wallet className="w-4 h-4" />
                                <span>Tarik Saldo ke Wallet</span>
                              </>
                            )}
                          </button>
                          
                          {selectedAccount && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="text-sm text-blue-800">
                                <p className="font-medium">Konfirmasi Penarikan:</p>
                                <p>Saldo dari akun <strong>{selectedAccount.account_name}</strong> akan dipindahkan ke {selectedAccount.currency || 'IDR'} Wallet Anda.</p>
                                <p className="text-xs mt-1">*Nominal saldo aktual akan diverifikasi oleh admin</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Sidebar Info & Status */}
                  <div className="xl:col-span-5 space-y-6">
                    {/* Withdrawal History & Status */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
                        <h3 className="text-white font-semibold flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Status Penarikan
                        </h3>
                      </div>
                      <div className="p-4">
                        {withdrawHistory && withdrawHistory.length > 0 ? (
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {withdrawHistory.slice(0, 5).map((withdrawal) => {
                              console.log('Withdrawal data:', withdrawal);
                              console.log('Proof image path:', withdrawal.proof_image);
                              console.log('Full image URL:', `${BACKEND_URL}/static/${withdrawal.proof_image}`);
                              return (
                              <div key={withdrawal.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                {/* Header with Account Name and Status */}
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {withdrawal.account?.account_name || withdrawal.account_name || 'Account Name'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(withdrawal.created_at).toLocaleDateString('id-ID')}
                                    </p>
                                  </div>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    withdrawal.status === 'approved' || withdrawal.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : withdrawal.status === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : withdrawal.status === 'processing'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {withdrawal.status === 'pending' ? 'Menunggu' :
                                     withdrawal.status === 'processing' ? 'Sedang Diproses' :
                                     withdrawal.status === 'approved' ? 'Disetujui' :
                                     withdrawal.status === 'completed' ? 'Selesai' :
                                     withdrawal.status === 'rejected' ? 'Ditolak' : withdrawal.status}
                                  </span>
                                </div>

                                {/* Balance Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                  <div className="bg-white p-3 rounded-lg border">
                                    <p className="text-xs text-gray-500 mb-1">Saldo Diminta</p>
                                    <p className="text-sm font-medium text-gray-900">
                                      {withdrawal.currency === 'USD' 
                                        ? `$${withdrawal.requested_amount?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}`
                                        : `Rp ${withdrawal.requested_amount?.toLocaleString('id-ID') || '0'}`
                                      }
                                    </p>
                                  </div>
                                  
                                  {withdrawal.actual_amount && (
                                    <div className="bg-white p-3 rounded-lg border border-green-200 bg-green-50">
                                      <p className="text-xs text-green-600 mb-1">Saldo Aktual (Terverifikasi)</p>
                                      <p className="text-sm font-medium text-green-700">
                                        {withdrawal.currency === 'USD' 
                                          ? `$${withdrawal.actual_amount?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}`
                                          : `Rp ${withdrawal.actual_amount?.toLocaleString('id-ID') || '0'}`
                                        }
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Proof Image - Always show for approved/completed */}
                                {(withdrawal.status === 'approved' || withdrawal.status === 'completed') && (
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs text-gray-500">Bukti Verifikasi Admin</p>
                                      {withdrawal.proof_image && (
                                        <button
                                          onClick={() => {
                                            console.log('View button clicked for withdrawal:', withdrawal.id);
                                            openImageModal(withdrawal);
                                          }}
                                          disabled={loadingWithdrawalId === withdrawal.id}
                                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                                        >
                                          {loadingWithdrawalId === withdrawal.id ? (
                                            <>
                                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1.5"></div>
                                              Loading...
                                            </>
                                          ) : (
                                            'Lihat Gambar'
                                          )}
                                        </button>
                                      )}
                                    </div>
                                    <div className="relative">
                                      {withdrawal.proof_image ? (
                                        <ProofImage
                                          withdrawalId={withdrawal.id}
                                          proofPath={withdrawal.proof_image}
                                          className="w-full h-32 border"
                                          onImageClick={() => openImageModal(withdrawal)}
                                        />
                                      ) : (
                                        <div className="w-full h-32 bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300 flex flex-col items-center justify-center text-yellow-700">
                                          <svg className="w-10 h-10 mb-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          <p className="text-sm font-medium">Bukti verifikasi belum diupload</p>
                                          <p className="text-xs mt-1">Admin sedang memproses bukti saldo</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Admin Notes */}
                                {withdrawal.admin_notes && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs text-blue-600 mb-1">Catatan Admin</p>
                                    <p className="text-sm text-blue-800">{withdrawal.admin_notes}</p>
                                  </div>
                                )}
                              </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">Belum ada riwayat penarikan</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Information Panel */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3">
                        <h3 className="text-white font-semibold flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Informasi Penarikan
                        </h3>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs font-bold">1</span>
                          </div>
                          <p className="text-sm text-gray-700">
                            <strong>Saldo Real akan Dicek:</strong> Admin akan memverifikasi saldo aktual di akun Anda sebelum transfer.
                          </p>
                        </div>
                        
                        <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-100">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs font-bold">2</span>
                          </div>
                          <p className="text-sm text-gray-700">
                            <strong>Auto Transfer:</strong> Setelah disetujui admin, saldo otomatis masuk ke wallet sesuai mata uang.
                          </p>
                        </div>

                        <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                          <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs font-bold">!</span>
                          </div>
                          <p className="text-sm text-gray-700">
                            <strong>Sekali Tarik:</strong> Setiap akun hanya bisa ditarik sekali sampai ada top up baru.
                          </p>
                        </div>

                        <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Clock className="w-3 h-3 text-white" />
                          </div>
                          <p className="text-sm text-gray-700">
                            <strong>Waktu Proses:</strong> Verifikasi dan transfer biasanya 1-3 hari kerja.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Modal */}
      {loadingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-8 h-8 bg-blue-100 rounded-full"></div>
              </div>
            </div>
            <p className="mt-4 text-gray-700 font-medium">Memuat gambar...</p>
            <p className="mt-1 text-sm text-gray-500">Mohon tunggu sebentar</p>
          </div>
        </div>
      )}

      {/* Enhanced Image Modal */}
      {showImageModal && modalImageData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={closeImageModal}
        >
          <div 
            className="relative w-full h-full max-w-7xl max-h-screen flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={modalImageData.src}
              alt={modalImageData.alt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{ maxHeight: 'calc(100vh - 2rem)', maxWidth: 'calc(100vw - 2rem)' }}
              onError={(e) => {
                console.error('Modal image failed to load:', e.target.src);
              }}
            />
            
            {/* Enhanced Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-60 hover:bg-opacity-80 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-110"
              aria-label="Tutup gambar"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Image Info */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-60 text-white p-3 rounded-lg">
              <p className="text-sm font-medium">{modalImageData.alt}</p>
              <p className="text-xs opacity-75 mt-1">Klik di luar gambar atau tombol X untuk menutup</p>
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

export default Withdraw;