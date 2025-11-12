import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { 
  ArrowRightLeft, 
  DollarSign, 
  Banknote,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import CurrencyExchangeModal from './CurrencyExchangeModal';
import { formatIDR, formatUSD, formatCurrency } from '../utils/currencyFormatter';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DashboardHome = ({ user, stats, onRefresh }) => {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeRate, setExchangeRate] = useState({ IDR_USD: 0, USD_IDR: 0 });
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [monthlyTopupAmount, setMonthlyTopupAmount] = useState({ total_idr: 0, total_usd: 0 });

  useEffect(() => {
    fetchAccounts();
    fetchRecentTransactions();
    fetchMonthlyTopupAmount();
  }, []);

  // Auto-refresh data every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAccounts();
      fetchRecentTransactions();
      fetchMonthlyTopupAmount();
      // Refresh user stats (wallet balances) from parent
      if (onRefresh) {
        onRefresh();
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [onRefresh]);

  const fetchAccounts = async (retryCount = 0) => {
    try {
      const response = await axios.get(`${API}/accounts`, { timeout: 15000 });
      setAccounts(response.data);
      // Cache successful data in localStorage for fallback
      localStorage.setItem('cached_accounts', JSON.stringify(response.data));
    } catch (error) {
      // Silent retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000); // 1s, 2s, 4s, max 8s
        console.log(`Silent retry ${retryCount + 1}/3 for fetchAccounts in ${delay}ms...`);
        setTimeout(() => fetchAccounts(retryCount + 1), delay);
      } else {
        // After 3 retries, load from cache silently - NEVER show error to user
        console.warn('All retries failed, loading cached accounts');
        try {
          const cached = localStorage.getItem('cached_accounts');
          if (cached) {
            setAccounts(JSON.parse(cached));
            console.log('Successfully loaded cached accounts');
          } else {
            setAccounts([]); // Empty array as fallback
          }
        } catch (e) {
          setAccounts([]); // Empty array as final fallback
        }
      }
    }
  };

  const fetchRecentTransactions = async (retryCount = 0) => {
    try {
      const response = await axios.get(`${API}/transactions`, { timeout: 15000 });
      setRecentTransactions(response.data.slice(0, 5)); // 5 recent transactions
      // Cache successful data in localStorage for fallback
      localStorage.setItem('cached_transactions', JSON.stringify(response.data.slice(0, 5)));
    } catch (error) {
      // Silent retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000); // 1s, 2s, 4s, max 8s
        console.log(`Silent retry ${retryCount + 1}/3 for fetchRecentTransactions in ${delay}ms...`);
        setTimeout(() => fetchRecentTransactions(retryCount + 1), delay);
      } else {
        // After 3 retries, load from cache silently - NEVER show error to user
        console.warn('All retries failed, loading cached transactions');
        try {
          const cached = localStorage.getItem('cached_transactions');
          if (cached) {
            setRecentTransactions(JSON.parse(cached));
            console.log('Successfully loaded cached transactions');
          } else {
            setRecentTransactions([]); // Empty array as fallback
          }
        } catch (e) {
          setRecentTransactions([]); // Empty array as final fallback
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyTopupAmount = async (retryCount = 0) => {
    try {
      const response = await axios.get(`${API}/client/monthly-topup-amount`, { timeout: 15000 });
      setMonthlyTopupAmount({
        total_idr: response.data.total_idr || 0,
        total_usd: response.data.total_usd || 0
      });
      // Cache successful data in localStorage for fallback
      localStorage.setItem('cached_monthly_topup', JSON.stringify(response.data));
    } catch (error) {
      // Silent retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
        console.log(`Silent retry ${retryCount + 1}/3 for fetchMonthlyTopupAmount in ${delay}ms...`);
        setTimeout(() => fetchMonthlyTopupAmount(retryCount + 1), delay);
      } else {
        // After 3 retries, load from cache silently
        console.warn('All retries failed, loading cached monthly topup amount');
        try {
          const cached = localStorage.getItem('cached_monthly_topup');
          if (cached) {
            const data = JSON.parse(cached);
            setMonthlyTopupAmount({
              total_idr: data.total_idr || 0,
              total_usd: data.total_usd || 0
            });
          } else {
            setMonthlyTopupAmount({ total_idr: 0, total_usd: 0 });
          }
        } catch (e) {
          setMonthlyTopupAmount({ total_idr: 0, total_usd: 0 });
        }
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "secondary", text: "Menunggu", class: "bg-yellow-100 text-yellow-700" },
      approved: { variant: "default", text: "Disetujui", class: "bg-blue-100 text-blue-700" },
      processing: { variant: "default", text: "Processing", class: "bg-purple-100 text-purple-700" },
      completed: { variant: "default", text: "Selesai", class: "bg-green-100 text-green-700" },
      active: { variant: "default", text: "Aktif", class: "bg-green-100 text-green-700" },
      sharing: { variant: "default", text: "Proses Share", class: "bg-blue-100 text-blue-700" },  // CRITICAL FIX: Add sharing status
      rejected: { variant: "destructive", text: "Ditolak", class: "bg-red-100 text-red-700" },
      disabled: { variant: "destructive", text: "Disabled", class: "bg-orange-100 text-orange-700" },
      suspended: { variant: "destructive", text: "Suspended", class: "bg-red-100 text-red-700" },
      failed: { variant: "destructive", text: "Gagal", class: "bg-red-100 text-red-700" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const fetchExchangeRates = async () => {
    try {
      const [idrToUsd, usdToIdr] = await Promise.all([
        axios.get(`${API}/exchange-rate/IDR/USD`),
        axios.get(`${API}/exchange-rate/USD/IDR`)
      ]);
      
      setExchangeRate({
        IDR_USD: idrToUsd.data.rate,
        USD_IDR: usdToIdr.data.rate
      });
    } catch (error) {
      toast.error('Failed to fetch exchange rates');
    }
  };

  const handleCurrencyExchange = async (fromCurrency, toCurrency, amount) => {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setExchangeLoading(true);
      const response = await axios.post(`${API}/exchange`, {
        from_currency: fromCurrency,
        to_currency: toCurrency,
        amount: parseFloat(amount)
      });

      toast.success(`Successfully exchanged ${fromCurrency} ${amount} to ${toCurrency} ${formatCurrency(response.data.to_amount, toCurrency)}`);
      onRefresh(); // Refresh dashboard data
      setShowExchangeModal(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Exchange failed');
    } finally {
      setExchangeLoading(false);
    }
  };

  // Fetch exchange rates on component mount and every 30 seconds
  useEffect(() => {
    fetchExchangeRates();
    const interval = setInterval(fetchExchangeRates, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

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

  const getTransactionIcon = (type) => {
    const icons = {
      topup: (
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      ),
      withdraw: (
        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4m16 0l-4-4m4 4l-4 4" />
          </svg>
        </div>
      ),
      account_request: (
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )
    };
    return icons[type] || icons.account_request;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t('welcomeUser', { username: user?.username })}
        </h1>
        <p className="text-gray-600">{t('manageAdsEasily')}</p>
      </div>

      {/* Stats Cards - Organized in rows */}
      <div className="space-y-4">
        {/* Row 1: Main Wallets - Mobile Responsive */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
          {/* Main Wallet IDR */}
          <Card className="glass-card border-l-4 border-l-blue-500">
            <CardContent className="p-3 sm:p-6">
              {/* Mobile: Stack vertical, Desktop: Horizontal */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Main Wallet IDR</p>
                    {/* REMOVED truncate - Balance HARUS terlihat LENGKAP */}
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 break-all" data-testid="dashboard-main-wallet-idr">
                      {formatIDR(stats?.main_wallet_idr || 0)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExchangeModal(true)}
                  className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0 self-end sm:self-center"
                  title="Exchange Currency"
                >
                  <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Main Wallet USD */}
          <Card className="glass-card border-l-4 border-l-green-500">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Main Wallet USD</p>
                    {/* REMOVED truncate - Balance HARUS terlihat LENGKAP */}
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 break-all" data-testid="dashboard-main-wallet-usd">
                      {formatUSD(stats?.main_wallet_usd || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">{t('exchangeRate') || 'Kurs Tukar'}</p>
                  <p className="text-xs font-medium text-gray-700 break-all">
                    1 USD = Rp {exchangeRate.USD_IDR?.toLocaleString('id-ID') || '...'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Withdrawal Wallets - Mobile Responsive */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
          {/* Withdrawal Wallet IDR */}
          <Card className="glass-card border-l-4 border-l-purple-500">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-lg flex-shrink-0">
                    <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Withdrawal Wallet IDR</p>
                    {/* CRITICAL FIX: REMOVED truncate - Saldo HARUS LENGKAP! */}
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 break-all" data-testid="dashboard-withdrawal-wallet-idr">
                      Rp {stats?.withdrawal_wallet_idr?.toLocaleString('id-ID') || '0'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <p className="text-xs text-purple-600 font-medium">From Withdrawals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Wallet USD */}
          <Card className="glass-card border-l-4 border-l-indigo-500">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg flex-shrink-0">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Withdrawal Wallet USD</p>
                    {/* REMOVED truncate - Balance HARUS terlihat LENGKAP */}
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 break-all" data-testid="dashboard-withdrawal-wallet-usd">
                      ${stats?.withdrawal_wallet_usd?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <p className="text-xs text-indigo-600 font-medium">From Withdrawals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Other Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total Saldo Iklan */}
          <Card className="glass-card border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">{t('totalAdsBalance')}</p>
                  <div className="flex flex-col gap-0.5">
                    {/* IDR Total */}
                    <p className="text-xl font-bold text-gray-900 truncate">
                      Rp {accounts
                        .filter(acc => (acc.currency === 'IDR' || !acc.currency) && acc.status === 'active')
                        .reduce((sum, acc) => sum + (acc.balance || 0), 0)
                        .toLocaleString('id-ID') || '0'}
                    </p>
                    {/* USD Total */}
                    {accounts.some(acc => acc.currency === 'USD' && acc.status === 'active') && (
                      <p className="text-xl font-bold text-gray-900">
                        ${accounts
                          .filter(acc => acc.currency === 'USD' && acc.status === 'active')
                          .reduce((sum, acc) => sum + (acc.balance || 0), 0)
                          .toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Accounts */}
          <Card className="glass-card border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">akun</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="dashboard-accounts-count">
                    {stats?.accounts_count || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Transaction */}
          <Card className="glass-card border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Transaksi Bulanan</p>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xl font-bold text-gray-900 truncate" data-testid="dashboard-monthly-topup-idr">
                      Rp {monthlyTopupAmount.total_idr?.toLocaleString('id-ID') || '0'}
                    </p>
                    {monthlyTopupAmount.total_usd > 0 && (
                      <p className="text-xl font-bold text-gray-900" data-testid="dashboard-monthly-topup-usd">
                        ${monthlyTopupAmount.total_usd?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 w-full">
        {/* Ad Accounts */}
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t('yourAdAccounts')}
              <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                {accounts.length} {t('accounts') || 'Accounts'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {t('manageAllAccounts')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-gray-500 mb-4">{t('noAccounts')}</p>
                <Button 
                  size="sm" 
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={() => window.location.href = '/dashboard/kelola-akun'}
                  data-testid="create-first-account-button"
                >
                  {t('createFirstAccount')}
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {accounts.slice(0, 5).map((account) => (
                    <Card key={account.id} className="hover:shadow-lg transition-shadow max-w-full overflow-hidden">
                      <CardHeader className="pb-2 overflow-hidden">
                        <div className="flex items-center justify-between overflow-hidden">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            {getPlatformIcon(account.platform)}
                            <span className="text-sm font-medium capitalize truncate">{account.platform}</span>
                          </div>
                          <div className="flex-shrink-0">{getStatusBadge(account.status)}</div>
                        </div>
                      </CardHeader>
                      <CardContent className="overflow-hidden">
                        <div className="space-y-2 overflow-hidden">
                          <div className="overflow-hidden">
                            <p className="text-xs text-gray-600">Nama Akun:</p>
                            <p className="font-medium" title={account.account_name}>
                              {account.account_name && account.account_name.length > 30 
                                ? account.account_name.substring(0, 30) + '...' 
                                : account.account_name}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-600">Saldo:</p>
                            <p className="font-medium">
                              {account.currency === 'USD' 
                                ? `$${account.balance?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}`
                                : `Rp ${account.balance?.toLocaleString('id-ID') || '0'}`
                              }
                            </p>
                          </div>
                          
                          <button
                            onClick={() => {
                              setSelectedAccount(account);
                              setShowDetailModal(true);
                            }}
                            className="mt-2 w-full px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                          >
                            Lihat Detail
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {accounts.length > 5 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => window.location.href = '/dashboard/kelola-akun'}
                    data-testid="view-all-accounts-button"
                  >
                    Lihat Semua di Kelola Akun ({accounts.length} akun)
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{t('recentTransactions')}</CardTitle>
            <CardDescription>
              {t('last5Transactions')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500">{t('noTransactions')}</p>
                </div>
              ) : (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getTransactionIcon(transaction.type)}
                          <span className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-600">Deskripsi:</p>
                        <p className="font-medium" title={transaction.description}>
                          {transaction.description && transaction.description.length > 40 
                            ? transaction.description.substring(0, 40) + '...' 
                            : transaction.description}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-600">Jumlah:</p>
                        <p className="font-medium">
                          {transaction.currency === 'USD' 
                            ? `$${transaction.amount?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}`
                            : `Rp ${transaction.amount?.toLocaleString('id-ID') || '0'}`
                          }
                        </p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowTransactionModal(true);
                        }}
                        className="mt-2 w-full px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                ))
              )}
              {recentTransactions.length > 0 && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/dashboard/transactions'}
                  data-testid="view-all-transactions-button"
                >
                  {t('viewAllTransactions')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currency Exchange Modal */}
      {showExchangeModal && (
        <CurrencyExchangeModal
          isOpen={showExchangeModal}
          onClose={() => setShowExchangeModal(false)}
          onExchange={handleCurrencyExchange}
          exchangeRate={exchangeRate}
          walletIDR={stats?.main_wallet_idr || 0}
          walletUSD={stats?.main_wallet_usd || 0}
          loading={exchangeLoading}
        />
      )}

      {/* Account Detail Modal */}
      {showDetailModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Detail Akun</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center space-x-3">
                {getPlatformIcon(selectedAccount.platform)}
                <div>
                  <p className="font-semibold text-lg capitalize">{selectedAccount.platform} Ads</p>
                  {getStatusBadge(selectedAccount.status)}
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nama Akun</p>
                  <p className="font-medium text-gray-900 break-words">{selectedAccount.account_name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">ID Akun</p>
                  <p className="font-medium text-gray-900 font-mono text-sm break-all">{selectedAccount.account_id}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Saldo</p>
                  <p className="font-medium text-gray-900 text-lg">
                    {selectedAccount.currency === 'USD' 
                      ? `$${selectedAccount.balance?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}`
                      : `Rp ${selectedAccount.balance?.toLocaleString('id-ID') || '0'}`
                    }
                  </p>
                </div>
                
                {selectedAccount.platform === 'facebook' && (
                  <>
                    {selectedAccount.gmt && (
                      <div>
                        <p className="text-sm text-gray-600">Zona Waktu</p>
                        <p className="font-medium text-gray-900">{selectedAccount.gmt}</p>
                      </div>
                    )}
                    {selectedAccount.delivery_method && (
                      <div>
                        <p className="text-sm text-gray-600">Metode Pengiriman</p>
                        <p className="font-medium text-gray-900">{selectedAccount.delivery_method}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <button
                onClick={() => window.location.href = '/dashboard/kelola-akun'}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Kelola Akun Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowTransactionModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Detail Transaksi</h3>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center space-x-3">
                {getTransactionIcon(selectedTransaction.type)}
                <div>
                  <p className="font-semibold text-lg capitalize">{selectedTransaction.type}</p>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Deskripsi Lengkap</p>
                  <p className="font-medium text-gray-900 break-words">{selectedTransaction.description}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Jumlah</p>
                  <p className="font-medium text-gray-900 text-xl">
                    {selectedTransaction.currency === 'USD' 
                      ? `$${selectedTransaction.amount?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}`
                      : `Rp ${selectedTransaction.amount?.toLocaleString('id-ID') || '0'}`
                    }
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Tanggal</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedTransaction.created_at).toLocaleString('id-ID', {
                      dateStyle: 'full',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
                
                {selectedTransaction.id && (
                  <div>
                    <p className="text-sm text-gray-600">ID Transaksi</p>
                    <p className="font-mono text-xs text-gray-900 break-all">{selectedTransaction.id}</p>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => window.location.href = '/dashboard/transactions'}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Lihat Semua Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;