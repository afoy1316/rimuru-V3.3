import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { Download } from "lucide-react";
import { formatCurrency } from '../utils/currencyFormatter';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Transactions = () => {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    status: "all",
    dateRange: "all"
  });
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: ""
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedTransactions, setPaginatedTransactions] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, filters, customDateRange]);
  
  // Pagination effect
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedTransactions(filteredTransactions.slice(startIndex, endIndex));
  }, [filteredTransactions, currentPage, itemsPerPage]);
  
  // Reset to page 1 when filters or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, customDateRange, itemsPerPage]);

  // Auto-refresh transactions every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTransactions();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API}/transactions`);
      setTransactions(response.data);
      setFilteredTransactions(response.data);
    } catch (error) {
      toast.error(t('failedToLoadTransactions') || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  // Export functions
  const exportToExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/transactions/export/excel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactions: filteredTransactions,
          filters: filters
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('✅ Excel berhasil di-export!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('❌ Gagal export Excel');
    }
  };

  // Date filtering utility functions
  const getDateRangeFilter = (range) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case "today":
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case "weekly":
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { start: weekAgo, end: now };
      case "monthly":
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { start: monthAgo, end: now };
      case "thismonth":
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return { start: firstDayThisMonth, end: lastDayThisMonth };
      case "90days":
        const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        return { start: ninetyDaysAgo, end: now };
      case "yearly":
        const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        return { start: yearAgo, end: now };
      case "custom":
        if (customDateRange.startDate && customDateRange.endDate) {
          return {
            start: new Date(customDateRange.startDate),
            end: new Date(customDateRange.endDate + "T23:59:59")
          };
        }
        return null;
      default:
        return null;
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by search
    if (filters.search) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filter by type
    if (filters.type !== "all") {
      // Special handling for "topup" to include both regular and wallet top-ups
      if (filters.type === "topup") {
        filtered = filtered.filter(transaction => 
          transaction.type === "topup" || transaction.type === "wallet_topup"
        );
      } else {
        filtered = filtered.filter(transaction => transaction.type === filters.type);
      }
    }

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter(transaction => transaction.status === filters.status);
    }

    // Filter by date range
    if (filters.dateRange !== "all") {
      const dateRange = getDateRangeFilter(filters.dateRange);
      if (dateRange) {
        filtered = filtered.filter(transaction => {
          const transactionDate = new Date(transaction.created_at);
          return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
        });
      }
    }

    setFilteredTransactions(filtered);
  };

  const getTransactionIcon = (type) => {
    const icons = {
      topup: (
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      ),
      withdraw: (
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4m16 0l-4-4m4 4l-4 4" />
          </svg>
        </div>
      ),
      account_request: (
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )
    };
    return icons[type] || icons.account_request;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: 'Menunggu', class: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      approved: { text: 'Disetujui', class: "bg-blue-100 text-blue-700 border-blue-200" },
      processing: { text: 'Sedang Diproses', class: "bg-purple-100 text-purple-700 border-purple-300 font-semibold" },
      completed: { text: 'Selesai', class: "bg-green-100 text-green-700 border-green-200" },
      active: { text: 'Aktif', class: "bg-green-100 text-green-700 border-green-200" },
      disabled: { text: 'Nonaktif', class: "bg-orange-100 text-orange-700 border-orange-200" },
      suspended: { text: 'Dibekukan', class: "bg-red-100 text-red-700 border-red-200" },
      failed: { text: 'Gagal', class: "bg-red-100 text-red-700 border-red-200" },
      rejected: { text: 'Ditolak', class: "bg-red-100 text-red-700 border-red-200" },
      cancelled: { text: 'Dibatalkan', class: "bg-gray-100 text-gray-700 border-gray-200" }
    };
    
    const cleanStatus = String(status).toLowerCase().trim();
    const config = statusConfig[cleanStatus] || { 
      text: String(status).replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), 
      class: "bg-gray-100 text-gray-700 border-gray-200" 
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const types = {
      topup: 'Top Up',
      wallet_topup: 'Top Up (Wallet)',
      wallet_to_account_transfer: 'Transfer Wallet ke Akun',
      withdraw: 'Penarikan',
      withdraw_request: 'Penarikan',
      approved_transfer: 'Transfer Disetujui',
      transfer: 'Transfer',
      account_request: 'Permintaan Akun',
      balance_transfer: 'Transfer Saldo',
      fee: 'Fee/Biaya'
    };
    const cleanType = String(type).toLowerCase().trim();
    return types[cleanType] || cleanType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Export transactions to CSV
  const exportToCSV = () => {
    // CSV export functionality would go here
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <Card>
          <CardContent className="p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 fade-in max-w-full overflow-hidden px-2 sm:px-0">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{t('transactionHistory') || 'Riwayat Transaksi'}</h1>
          <p className="text-sm sm:text-base text-gray-600 break-words">{t('viewAllActivities') || 'Lihat semua aktivitas transaksi Anda'}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial px-3 sm:px-4 py-2"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm sm:text-base">Export Excel</span>
          </Button>
        </div>
      </div>

      {/* Filters - Mobile Responsive */}
      <Card className="glass-card">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">{t('filterTransactions') || 'Filter Transaksi'}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t('filterBySearch') || 'Filter berdasarkan pencarian, tipe, status, dan periode'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search Input - Full width on mobile */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t('searchTransactions') || 'Cari'}</label>
              <Input
                placeholder={t('searchPlaceholder') || 'Cari transaksi...'}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="focus-ring h-10 sm:h-11 text-base sm:text-sm"
                data-testid="search-transactions-input"
              />
            </div>

            {/* Transaction Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t('transactionType') || 'Tipe'}</label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
                data-testid="filter-type-select"
              >
                <SelectTrigger className="focus-ring h-10 sm:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allTypes') || 'Semua Tipe'}</SelectItem>
                  <SelectItem value="topup">{t('topup') || 'Top Up'}</SelectItem>
                  <SelectItem value="withdraw">{t('withdraw') || 'Penarikan'}</SelectItem>
                  <SelectItem value="account_request">{t('accountRequest') || 'Request Akun'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t('status') || 'Status'}</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
                data-testid="filter-status-select"
              >
                <SelectTrigger className="focus-ring h-10 sm:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatus') || 'Semua Status'}</SelectItem>
                  <SelectItem value="pending">{t('pending') || 'Pending'}</SelectItem>
                  <SelectItem value="completed">{t('completed') || 'Selesai'}</SelectItem>
                  <SelectItem value="failed">{t('failed') || 'Gagal'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Periode</label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => {
                  setFilters({ ...filters, dateRange: value });
                  if (value !== "custom") {
                    setCustomDateRange({ startDate: "", endDate: "" });
                  }
                }}
                data-testid="filter-date-select"
              >
                <SelectTrigger className="h-10 sm:h-11">
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Periode</SelectItem>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="weekly">7 Hari Terakhir</SelectItem>
                  <SelectItem value="thismonth">Bulan Ini</SelectItem>
                  <SelectItem value="monthly">30 Hari Terakhir</SelectItem>
                  <SelectItem value="90days">90 Hari Terakhir</SelectItem>
                  <SelectItem value="yearly">1 Tahun Terakhir</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range Inputs - Mobile Responsive */}
            {filters.dateRange === "custom" && (
              <div className="col-span-full space-y-2 border-t pt-4">
                <label className="text-sm font-medium text-gray-700">Custom Date Range</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Input
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                      placeholder="Start Date"
                      className="text-base sm:text-sm h-10 sm:h-11"
                    />
                    <label className="text-xs text-gray-500 mt-1 block">Dari Tanggal</label>
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                      placeholder="End Date"
                      className="text-base sm:text-sm h-10 sm:h-11"
                    />
                    <label className="text-xs text-gray-500 mt-1 block">Sampai Tanggal</label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Summary - Mobile Responsive */}
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
            <span className="break-words">
              {t('showingResults') || 'Menampilkan'} {filteredTransactions.length} {t('of') || 'dari'} {transactions.length} {t('transactions') || 'transaksi'}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Auto-refresh aktif</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Summary Stats - Mobile Responsive */}
      {filteredTransactions.length > 0 && (
        <Card className="glass-card border-2 border-teal-100 bg-gradient-to-br from-teal-50 to-blue-50">
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="break-words">Ringkasan Transaksi</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm break-words">
              {filters.type !== "all" || filters.status !== "all" || filters.dateRange !== "all" || filters.search
                ? "Ringkasan berdasarkan filter yang dipilih"
                : "Ringkasan semua transaksi Anda"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* Total Transaksi */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Transaksi</span>
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {filteredTransactions.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">transaksi</div>
              </div>

              {/* Total Nominal IDR */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total IDR</span>
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(
                    filteredTransactions.filter(t => t.currency === 'IDR').reduce((sum, t) => sum + Math.abs(t.amount), 0),
                    'IDR'
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {filteredTransactions.filter(t => t.currency === 'IDR').length} transaksi
                </div>
              </div>

              {/* Total Nominal USD */}
              {filteredTransactions.some(t => t.currency === 'USD') && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Total USD</span>
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="text-lg font-bold text-purple-600">
                    {formatCurrency(
                      filteredTransactions.filter(t => t.currency === 'USD').reduce((sum, t) => sum + Math.abs(t.amount), 0),
                      'USD'
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {filteredTransactions.filter(t => t.currency === 'USD').length} transaksi
                  </div>
                </div>
              )}

              {/* Top Up */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-teal-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Top Up</span>
                  <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-teal-600">
                  {filteredTransactions.filter(t => t.type === 'topup' || t.type === 'wallet_topup').length}
                </div>
                <div className="text-xs text-gray-500 mt-1">transaksi</div>
              </div>

              {/* Withdraw */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Penarikan</span>
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4m16 0l-4-4m4 4l-4 4" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {filteredTransactions.filter(t => t.type === 'withdraw' || t.type === 'withdraw_request').length}
                </div>
                <div className="text-xs text-gray-500 mt-1">transaksi</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions List - Mobile Responsive */}
      <Card className="glass-card">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-base sm:text-lg break-words">{t('transactionsList') || 'Daftar Transaksi'}</span>
            <Badge variant="secondary" className="bg-teal-100 text-teal-700 w-fit">
              {filteredTransactions.length} {t('transactions') || 'Transaksi'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 text-base sm:text-lg mb-2 break-words px-4">
                {filters.search || filters.type !== "all" || filters.status !== "all"
                  ? (t('noMatchingTransactions') || "Tidak ada transaksi yang cocok")
                  : t('noTransactions') || 'Belum ada transaksi'
                }
              </p>
              <p className="text-gray-400 text-xs sm:text-sm break-words px-4">
                {filters.search || filters.type !== "all" || filters.status !== "all"
                  ? (t('tryChangingFilter') || "Coba ubah filter pencarian")
                  : (t('transactionsWillAppear') || "Transaksi akan muncul di sini setelah ada aktivitas")
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {paginatedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  data-testid={`transaction-${transaction.id}`}
                >
                  {/* Icon - Smaller on mobile */}
                  <div className="flex-shrink-0 self-start sm:self-center">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Header: Description + Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <p className="font-medium text-sm sm:text-base text-gray-900 break-words [overflow-wrap:anywhere] flex-1">
                        {transaction.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs">
                          {getTypeLabel(transaction.type)}
                        </Badge>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                    
                    {/* Admin Notes - Mobile Responsive */}
                    {transaction.admin_notes && (
                      <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs sm:text-sm">
                        <p className="font-semibold text-yellow-800 text-xs mb-1">📝 Catatan Admin:</p>
                        <p className="text-yellow-700 break-words [overflow-wrap:anywhere]">{transaction.admin_notes}</p>
                      </div>
                    )}
                    
                    {/* Date and Amount - Mobile Responsive */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs sm:text-sm text-gray-500 break-words">
                        {formatDate(transaction.created_at)}
                      </p>
                      <p className="text-base sm:text-lg font-bold text-gray-900 break-all flex-shrink-0">
                        {transaction.type === 'withdraw' ? '-' : '+'}
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls - Mobile Responsive */}
      {filteredTransactions.length > 0 && (
        <div className="bg-white px-3 sm:px-4 py-3 border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              {/* Mobile pagination */}
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(Math.ceil(filteredTransactions.length / itemsPerPage), currentPage + 1))}
                disabled={currentPage === Math.ceil(filteredTransactions.length / itemsPerPage)}
                className="ml-2 sm:ml-3 relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Berikutnya
              </button>
            </div>
            
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-700">
                  Menampilkan{' '}
                  <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>
                  {' '}-{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
                  </span>
                  {' '}dari{' '}
                  <span className="font-medium">{filteredTransactions.length}</span> transaksi
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
                    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
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
                    onClick={() => setCurrentPage(Math.min(Math.ceil(filteredTransactions.length / itemsPerPage), currentPage + 1))}
                    disabled={currentPage === Math.ceil(filteredTransactions.length / itemsPerPage)}
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

export default Transactions;