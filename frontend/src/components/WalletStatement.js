import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Pagination } from "./ui/Pagination";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { Download, RefreshCw, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WalletStatement = () => {
  const { t } = useLanguage();
  const [statements, setStatements] = useState([]);
  const [allStatements, setAllStatements] = useState([]); // Store all data
  const [loading, setLoading] = useState(true);
  const [walletType, setWalletType] = useState("main");
  const [currency, setCurrency] = useState("IDR");
  const [balances, setBalances] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("all"); // Track selected period
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedStatements, setPaginatedStatements] = useState([]);

  useEffect(() => {
    fetchBalances();
    fetchStatement();
  }, [walletType, currency]); // Remove startDate, endDate dependency
  
  // Auto-refresh data every 10 seconds for real-time updates (silent)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBalances(true); // Silent refresh
      fetchStatement(true); // Silent refresh
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [walletType, currency]);
  
  // Filter statements based on date range (client-side filtering)
  useEffect(() => {
    if (!startDate && !endDate) {
      setStatements(allStatements); // Show all
    } else {
      const filtered = allStatements.filter(stmt => {
        // Get date from statement - handle both Date objects and strings
        let stmtDateObj = stmt.date;
        if (typeof stmtDateObj === 'string') {
          stmtDateObj = new Date(stmtDateObj);
        }
        
        // Format to YYYY-MM-DD in local timezone to avoid timezone issues
        const year = stmtDateObj.getFullYear();
        const month = String(stmtDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(stmtDateObj.getDate()).padStart(2, '0');
        const stmtDate = `${year}-${month}-${day}`;
        
        // Compare dates as strings (YYYY-MM-DD format)
        if (startDate && endDate) {
          return stmtDate >= startDate && stmtDate <= endDate;
        } else if (startDate) {
          return stmtDate >= startDate;
        } else if (endDate) {
          return stmtDate <= endDate;
        }
        return true;
      });
      
      console.log('Filter Debug:', {
        startDate,
        endDate,
        totalStatements: allStatements.length,
        filteredCount: filtered.length,
        sampleFiltered: filtered.slice(0, 3).map(s => ({
          date: s.date,
          description: s.description
        }))
      });
      
      setStatements(filtered);
    }
    setCurrentPage(1); // Reset to page 1 when filter changes
  }, [allStatements, startDate, endDate]);
  
  // Pagination effect
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedStatements(statements.slice(startIndex, endIndex));
  }, [statements, currentPage, itemsPerPage]);
  
  // DISABLED auto-refresh - user can manually refresh if needed
  // Prevents interruption when viewing statement

  const fetchBalances = async (silent = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/wallet/balances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalances(response.data);
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const fetchStatement = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const token = localStorage.getItem('token');
      const params = {
        wallet_type: walletType,
        currency: currency,
        limit: 1000 // Fetch more data for client-side filtering
      };
      
      // Don't send date filters - fetch all data
      
      const response = await axios.get(`${API}/wallet/statement`, {
        params: params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllStatements(response.data); // Store all data
      setStatements(response.data); // Initially show all
    } catch (error) {
      if (!silent) {
        toast.error(error.response?.data?.detail || "Gagal memuat wallet statement");
      }
      console.error('Error fetching statement:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const formatCurrency = (amount, curr = currency) => {
    if (curr === 'USD') {
      return `$${amount?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}`;
    } else {
      return `Rp ${amount?.toLocaleString('id-ID') || '0'}`;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBalanceKey = () => {
    return `${walletType}_wallet_${currency.toLowerCase()}`;
  };

  const getCurrentBalance = () => {
    return balances[getBalanceKey()] || 0;
  };

  const getPendingBalance = () => {
    return balances[`${getBalanceKey()}_pending`] || 0;
  };

  const getAvailableBalance = () => {
    return balances[`${getBalanceKey()}_available`] || 0;
  };

  const exportToPDF = async () => {
    try {
      toast.info("Mengunduh PDF...");
      const token = localStorage.getItem('token');
      const params = {
        wallet_type: walletType,
        currency: currency
      };
      
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await axios.get(`${API}/wallet/statement/export/pdf`, {
        params: params,
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Wallet_Statement_${walletType}_${currency}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF berhasil diunduh!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gagal export PDF");
      console.error('Error exporting PDF:', error);
    }
  };

  const exportToExcel = async () => {
    try {
      toast.info("Mengunduh Excel...");
      const token = localStorage.getItem('token');
      const params = {
        wallet_type: walletType,
        currency: currency
      };
      
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await axios.get(`${API}/wallet/statement/export/excel`, {
        params: params,
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Wallet_Statement_${walletType}_${currency}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Excel berhasil diunduh!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gagal export Excel");
      console.error('Error exporting Excel:', error);
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period); // Track selected period
    
    // Get current date in Jakarta timezone (GMT+7)
    const now = new Date();
    const jakartaOffset = 7 * 60; // GMT+7 in minutes
    const localOffset = now.getTimezoneOffset(); // Browser offset in minutes
    const jakartaTime = new Date(now.getTime() + (jakartaOffset + localOffset) * 60000);
    
    const today = jakartaTime;
    let start = new Date(jakartaTime);
    
    // Format date to YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    switch(period) {
      case 'today':
        setStartDate(formatDate(today));
        setEndDate(formatDate(today));
        break;
      case 'yesterday':
        const yesterday = new Date(jakartaTime);
        yesterday.setDate(today.getDate() - 1);
        setStartDate(formatDate(yesterday));
        setEndDate(formatDate(yesterday));
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        setStartDate(formatDate(start));
        setEndDate(formatDate(today));
        break;
      case 'thisMonth':
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(formatDate(firstDayOfMonth));
        setEndDate(formatDate(today));
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        setStartDate(formatDate(start));
        setEndDate(formatDate(today));
        break;
      case 'all':
        setStartDate("");
        setEndDate("");
        break;
      default:
        break;
    }
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Memuat statement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden px-2 sm:px-0">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">Wallet Statement</h1>
          <p className="text-sm sm:text-base text-gray-600 break-words">Riwayat transaksi wallet Anda</p>
        </div>
        {/* Export Buttons - Stack on mobile */}
        <div className="flex gap-2 sm:flex-shrink-0">
          <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5">
            <Download className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm sm:text-base">PDF</span>
          </Button>
          <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5">
            <Download className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm sm:text-base">Excel</span>
          </Button>
        </div>
      </div>

      {/* Balance Summary - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
            <CardDescription className="text-xs sm:text-sm">Saldo Total</CardDescription>
            <CardTitle className="text-lg sm:text-xl md:text-2xl break-all">{formatCurrency(getCurrentBalance())}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
            <CardDescription className="text-xs sm:text-sm">Saldo Pending</CardDescription>
            <CardTitle className="text-lg sm:text-xl md:text-2xl text-yellow-600 break-all">{formatCurrency(getPendingBalance())}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
            <CardDescription className="text-xs sm:text-sm">Saldo Tersedia</CardDescription>
            <CardTitle className="text-lg sm:text-xl md:text-2xl text-green-600 break-all">{formatCurrency(getAvailableBalance())}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters - Mobile Responsive */}
      <Card>
        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {/* Wallet & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipe Wallet</label>
                <Select value={walletType} onValueChange={setWalletType}>
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Wallet</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Currency</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
                    <SelectItem value="USD">USD (Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={fetchStatement} className="w-full flex items-center gap-2 h-10 sm:h-11">
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm sm:text-base">Refresh</span>
                </Button>
              </div>
            </div>

            {/* Period Presets - Mobile Responsive */}
            <div>
              <label className="text-sm font-medium mb-2 block">Periode</label>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePeriodChange('today')}
                  className={`h-9 sm:h-8 text-sm ${selectedPeriod === 'today' ? 'bg-teal-500 text-white border-teal-600 hover:bg-teal-600 hover:text-white' : ''}`}
                >
                  Hari Ini
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePeriodChange('yesterday')}
                  className={`h-9 sm:h-8 text-sm ${selectedPeriod === 'yesterday' ? 'bg-teal-500 text-white border-teal-600 hover:bg-teal-600 hover:text-white' : ''}`}
                >
                  Kemarin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePeriodChange('week')}
                  className={`h-9 sm:h-8 text-sm ${selectedPeriod === 'week' ? 'bg-teal-500 text-white border-teal-600 hover:bg-teal-600 hover:text-white' : ''}`}
                >
                  7 Hari
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePeriodChange('thisMonth')}
                  className={`h-9 sm:h-8 text-sm ${selectedPeriod === 'thisMonth' ? 'bg-teal-500 text-white border-teal-600 hover:bg-teal-600 hover:text-white' : ''}`}
                >
                  Bulan Ini
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePeriodChange('month')}
                  className={`h-9 sm:h-8 text-sm ${selectedPeriod === 'month' ? 'bg-teal-500 text-white border-teal-600 hover:bg-teal-600 hover:text-white' : ''}`}
                >
                  30 Hari
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePeriodChange('all')}
                  className={`h-9 sm:h-8 text-sm ${selectedPeriod === 'all' ? 'bg-teal-500 text-white border-teal-600 hover:bg-teal-600 hover:text-white' : ''}`}
                >
                  Semua
                </Button>
              </div>
            </div>

            {/* Custom Date Range - Mobile Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Dari Tanggal</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Sampai Tanggal</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={clearDateFilter}
                  disabled={!startDate && !endDate}
                  className="w-full h-10 sm:h-11"
                >
                  Clear Filter
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statement Table - Mobile Responsive */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            Riwayat Transaksi
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm break-words">
            {statements.length} transaksi untuk {walletType === 'main' ? 'Main' : 'Withdrawal'} Wallet ({currency})
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {statements.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Wallet className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">Tidak Ada Transaksi</h3>
              <p className="text-sm text-gray-500">Belum ada transaksi untuk wallet ini.</p>
            </div>
          ) : (
            <>
              {/* Desktop: Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Referensi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedStatements.map((statement) => (
                      <tr key={statement.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(statement.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{statement.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {statement.type === 'credit' ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1 w-fit">
                              <ArrowUpCircle className="w-3 h-3" />
                              Credit
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1 w-fit">
                              <ArrowDownCircle className="w-3 h-3" />
                              Debit
                            </Badge>
                          )}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${statement.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {statement.type === 'credit' ? '+' : '-'}{formatCurrency(statement.amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                          {statement.fee > 0 ? formatCurrency(statement.fee) : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {formatCurrency(statement.balance_after)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">{statement.reference}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile: Card View */}
              <div className="md:hidden space-y-3">
                {paginatedStatements.map((statement) => (
                  <div key={statement.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">{formatDate(statement.date)}</p>
                        <p className="text-sm font-medium text-gray-900 break-words mt-1">{statement.description}</p>
                      </div>
                      {statement.type === 'credit' ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1 ml-2 flex-shrink-0">
                          <ArrowUpCircle className="w-3 h-3" />
                          <span className="text-xs">Credit</span>
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1 ml-2 flex-shrink-0">
                          <ArrowDownCircle className="w-3 h-3" />
                          <span className="text-xs">Debit</span>
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Amount:</span>
                        <span className={`font-medium break-all ${statement.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {statement.type === 'credit' ? '+' : '-'}{formatCurrency(statement.amount)}
                        </span>
                      </div>
                      {statement.fee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fee:</span>
                          <span className="text-gray-900 break-all">{formatCurrency(statement.fee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1.5 border-t border-gray-100">
                        <span className="text-gray-500 font-medium">Saldo:</span>
                        <span className="font-medium text-gray-900 break-all">{formatCurrency(statement.balance_after)}</span>
                      </div>
                      <div className="pt-1.5">
                        <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono break-all">{statement.reference}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Pagination */}
      {statements.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={statements.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemLabel="transaksi"
        />
      )}
    </div>
  );
};

export default WalletStatement;
