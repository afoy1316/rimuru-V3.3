import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Download, FileText, Table as TableIcon } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { formatCurrency } from '../../utils/currencyFormatter';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const FinancialReports = () => {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

  const [financialData, setFinancialData] = useState(null);
  const [growthData, setGrowthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchFinancialData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        setError('Admin token not found');
        return;
      }
      
      const params = new URLSearchParams();
      
      if (startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        params.append('period', period);
      }
      
      const response = await fetch(`${BACKEND_URL}/api/admin/financial-reports/summary?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFinancialData(data);
        setError(null);
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        setError(`API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setError(`Network Error: ${error.message}`);
    }
  };

  const fetchGrowthData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        return;
      }
      
      const response = await fetch(`${BACKEND_URL}/api/admin/financial-reports/growth?period=month&months_back=12`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGrowthData(data);
      } else {
        const errorText = await response.text();
        console.error('Growth API Error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching growth data:', error);
    }
  };

  const exportReport = async (format) => {
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      
      if (startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      } else {
        params.append('period', period);
      }
      params.append('format', format);

      const response = await fetch(`${BACKEND_URL}/api/admin/financial-reports/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `financial_report_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  useEffect(() => {
    const fetchData = async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      await Promise.all([fetchFinancialData(), fetchGrowthData()]);
      if (!silent) {
        setLoading(false);
      }
    };
    fetchData();
  }, [period, startDate, endDate]);

  // Auto-refresh every 10 seconds for real-time updates (silent)
  useEffect(() => {
    const interval = setInterval(async () => {
      // Silent refresh - no loading state
      await Promise.all([fetchFinancialData(), fetchGrowthData()]);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [period, startDate, endDate]);

  const generateChartData = (type = 'topup') => {
    if (!growthData || !growthData.growth_data) return { labels: [], datasets: [] };

    const idrData = growthData.growth_data[type]?.IDR || [];
    const usdData = growthData.growth_data[type]?.USD || [];
    
    // Get all unique periods and sort them
    const allPeriods = [...new Set([
      ...idrData.map(d => d.period),
      ...usdData.map(d => d.period)
    ])].sort();

    // Create gradient colors
    const createGradient = (ctx, color1, color2) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      return gradient;
    };

    return {
      labels: allPeriods,
      datasets: [
        {
          label: `${type === 'topup' ? 'Top-up' : type === 'withdraw' ? 'Withdrawal' : 'Revenue'} IDR`,
          data: allPeriods.map(period => {
            const item = idrData.find(d => d.period === period);
            return item ? parseFloat(item.amount) || 0 : 0;
          }),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: type === 'topup' 
            ? (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
                gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
                return gradient;
              }
            : 'rgba(99, 102, 241, 0.7)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(99, 102, 241)',
        },
        {
          label: `${type === 'topup' ? 'Top-up' : type === 'withdraw' ? 'Withdrawal' : 'Revenue'} USD`,
          data: allPeriods.map(period => {
            const item = usdData.find(d => d.period === period);
            return item ? parseFloat(item.amount) || 0 : 0;
          }),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: type === 'topup'
            ? (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(34, 197, 94, 0.5)');
                gradient.addColorStop(1, 'rgba(34, 197, 94, 0.0)');
                return gradient;
              }
            : 'rgba(34, 197, 94, 0.7)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(34, 197, 94)',
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error Loading Financial Reports</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchFinancialData();
              fetchGrowthData();
            }}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">Laporan Keuangan</h1>
          <p className="text-sm sm:text-base text-gray-600 break-words">Dashboard analisis keuangan dan pertumbuhan</p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => exportReport('pdf')} 
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded flex items-center justify-center text-sm sm:text-base"
          >
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">Export </span>PDF
          </button>
          <button 
            onClick={() => exportReport('xlsx')} 
            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded flex items-center justify-center text-sm sm:text-base"
          >
            <TableIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">Export </span>Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Filter Periode</h3>
        
        {/* Quick Filter Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-3 sm:mb-4">
          <button
            onClick={() => {
              setPeriod('today');
              setStartDate('');
              setEndDate('');
            }}
            className={`px-3 sm:px-4 py-2 rounded border text-sm sm:text-base ${period === 'today' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => {
              setPeriod('yesterday');
              setStartDate('');
              setEndDate('');
            }}
            className={`px-3 sm:px-4 py-2 rounded border text-sm sm:text-base ${period === 'yesterday' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Kemarin
          </button>
          <button
            onClick={() => {
              setPeriod('week');
              setStartDate('');
              setEndDate('');
            }}
            className={`px-3 sm:px-4 py-2 rounded border text-sm sm:text-base ${period === 'week' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            7 Hari
          </button>
          <button
            onClick={() => {
              setPeriod('month');
              setStartDate('');
              setEndDate('');
            }}
            className={`px-3 sm:px-4 py-2 rounded border text-sm sm:text-base ${period === 'month' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => {
              setPeriod('year');
              setStartDate('');
              setEndDate('');
            }}
            className={`px-4 py-2 rounded border ${period === 'year' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Tahun Ini
          </button>
          <button
            onClick={() => {
              setPeriod('all');
              setStartDate('');
              setEndDate('');
            }}
            className={`px-4 py-2 rounded border ${period === 'all' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Semua Data
          </button>
        </div>
        
        {/* Custom Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPeriod('custom');
            }}
            placeholder="Tanggal mulai"
            className="border border-gray-300 rounded px-3 py-2"
          />
          
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPeriod('custom');
            }}
            placeholder="Tanggal selesai"
            className="border border-gray-300 rounded px-3 py-2"
          />
          
          <button 
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setPeriod('month');
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Reset Filter
          </button>
        </div>
        
        {startDate && endDate && (
          <p className="text-sm text-gray-600 mt-2">
            📅 Periode custom: {startDate} s/d {endDate}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      {financialData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Total Revenue IDR */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-xs sm:text-sm font-medium break-words flex-1 min-w-0 mr-2">Total Revenue IDR</h3>
              <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-600 break-all">
              {formatCurrency(financialData.revenue?.total_revenue_idr || 0, 'IDR')}
            </div>
            <p className="text-xs text-gray-600 break-words">
              Fee dari transfer wallet & top-up akun (Bank Transfer)
            </p>
          </div>

          {/* Total Revenue USD */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-xs sm:text-sm font-medium break-words flex-1 min-w-0 mr-2">Total Revenue USD</h3>
              <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-600 break-all">
              {formatCurrency(financialData.revenue?.total_revenue_usd || 0, 'USD')}
            </div>
            <p className="text-xs text-gray-600 break-words">
              Fee dari transfer wallet & top-up akun (Crypto)
            </p>
          </div>

          {/* Total Top-up IDR */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-xs sm:text-sm font-medium break-words flex-1 min-w-0 mr-2">Total Top-up IDR</h3>
              <TrendingUp className="h-4 w-4 text-blue-600 flex-shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 break-all">
              {formatCurrency(financialData.topup_volume?.total_topup_idr || 0, 'IDR')}
            </div>
            <p className="text-xs text-gray-600 break-words">
              Volume dari top-up wallet & top-up akun (Bank Transfer)
            </p>
          </div>

          {/* Total Top-up USD */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-xs sm:text-sm font-medium break-words flex-1 min-w-0 mr-2">Total Top-up USD</h3>
              <TrendingUp className="h-4 w-4 text-blue-600 flex-shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 break-all">
              {formatCurrency(financialData.topup_volume?.total_topup_usd || 0, 'USD')}
            </div>
            <p className="text-xs text-gray-600 break-words">
              Volume dari top-up wallet & top-up akun (Crypto)
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No financial data available. Check console for errors.</p>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top-up Growth Chart */}
        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-lg border border-indigo-100 p-4 sm:p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-xl font-bold text-gray-800 flex items-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-indigo-600 flex-shrink-0" />
                <span className="break-words">Pertumbuhan Top-up</span>
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">Volume top-up per periode</p>
            </div>
          </div>
          <div className="h-64 sm:h-80 bg-white rounded-lg p-2 sm:p-4 shadow-inner">
            <Line
              data={generateChartData('topup')}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: {
                      usePointStyle: true,
                      padding: 15,
                      font: {
                        size: 12,
                        weight: '600'
                      }
                    }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                      size: 14,
                      weight: 'bold'
                    },
                    bodyFont: {
                      size: 13
                    },
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    displayColors: true,
                    callbacks: {
                      label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                          label += ': ';
                        }
                        if (context.parsed.y !== null) {
                          const currency = label.includes('IDR') ? 'IDR' : 'USD';
                          const value = context.parsed.y;
                          label += currency === 'IDR' 
                            ? `Rp ${value.toLocaleString('id-ID')}` 
                            : `$${value.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
                        }
                        return label;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      font: {
                        size: 11,
                        weight: '500'
                      }
                    }
                  },
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                      borderDash: [5, 5]
                    },
                    ticks: {
                      font: {
                        size: 11
                      },
                      callback: function(value) {
                        if (value >= 1000000) {
                          return (value / 1000000).toFixed(1) + 'M';
                        } else if (value >= 1000) {
                          return (value / 1000).toFixed(0) + 'K';
                        }
                        return value;
                      }
                    }
                  }
                },
                interaction: {
                  mode: 'index',
                  intersect: false
                }
              }}
            />
          </div>
        </div>

        {/* Revenue Growth Chart */}
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg border border-green-100 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <DollarSign className="w-6 h-6 mr-2 text-green-600" />
                Pertumbuhan Revenue
              </h3>
              <p className="text-sm text-gray-600 mt-1">Revenue fee per periode</p>
            </div>
          </div>
          <div className="h-80 bg-white rounded-lg p-4 shadow-inner">
            <Bar
              data={generateChartData('revenue')}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: {
                      usePointStyle: true,
                      padding: 15,
                      font: {
                        size: 12,
                        weight: '600'
                      }
                    }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                      size: 14,
                      weight: 'bold'
                    },
                    bodyFont: {
                      size: 13
                    },
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    displayColors: true,
                    callbacks: {
                      label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                          label += ': ';
                        }
                        if (context.parsed.y !== null) {
                          const currency = label.includes('IDR') ? 'IDR' : 'USD';
                          const value = context.parsed.y;
                          label += currency === 'IDR' 
                            ? `Rp ${value.toLocaleString('id-ID')}` 
                            : `$${value.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
                        }
                        return label;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      font: {
                        size: 11,
                        weight: '500'
                      }
                    }
                  },
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                      borderDash: [5, 5]
                    },
                    ticks: {
                      font: {
                        size: 11
                      },
                      callback: function(value) {
                        if (value >= 1000000) {
                          return (value / 1000000).toFixed(1) + 'M';
                        } else if (value >= 1000) {
                          return (value / 1000).toFixed(0) + 'K';
                        }
                        return value;
                      }
                    }
                  }
                },
                interaction: {
                  mode: 'index',
                  intersect: false
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      {financialData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Breakdown Revenue (Fee)</h3>
            <div className="space-y-4">
              {/* IDR Revenue Breakdown */}
              <div>
                <h4 className="font-semibold text-lg mb-2">IDR</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Transfer Wallet ke Akun</span>
                    <span className="font-semibold">
                      {formatCurrency(financialData.revenue?.breakdown_idr?.wallet_transfer_fee || 0, 'IDR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Top-Up Akun (Bank Transfer)</span>
                    <span className="font-semibold">
                      {formatCurrency(financialData.revenue?.breakdown_idr?.ad_account_topup_fee || 0, 'IDR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded border-2 border-blue-200">
                    <span className="font-bold">Total Revenue IDR</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(financialData.revenue?.total_revenue_idr || 0, 'IDR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* USD Revenue Breakdown */}
              <div>
                <h4 className="font-semibold text-lg mb-2">USD</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Transfer Wallet ke Akun</span>
                    <span className="font-semibold">
                      {formatCurrency(financialData.revenue?.breakdown_usd?.wallet_transfer_fee || 0, 'USD')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Top-Up Akun (Crypto)</span>
                    <span className="font-semibold">
                      {formatCurrency(financialData.revenue?.breakdown_usd?.ad_account_topup_fee || 0, 'USD')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded border-2 border-blue-200">
                    <span className="font-bold">Total Revenue USD</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(financialData.revenue?.total_revenue_usd || 0, 'USD')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top-up Volume Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Breakdown Top-Up Volume</h3>
            <div className="space-y-4">
              {/* IDR Top-up Breakdown */}
              <div>
                <h4 className="font-semibold text-lg mb-2">IDR</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Top-Up Wallet</span>
                    <span className="font-semibold">
                      {formatCurrency(financialData.topup_volume?.breakdown_idr?.wallet_topup || 0, 'IDR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Top-Up Akun (Bank Transfer)</span>
                    <span className="font-semibold">
                      {formatCurrency(financialData.topup_volume?.breakdown_idr?.ad_account_topup || 0, 'IDR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded border-2 border-blue-200">
                    <span className="font-bold">Total Top-Up IDR</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(financialData.topup_volume?.total_topup_idr || 0, 'IDR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* USD Top-up Breakdown */}
              <div>
                <h4 className="font-semibold text-lg mb-2">USD</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Top-Up Wallet</span>
                    <span className="font-semibold">
                      {formatCurrency(financialData.topup_volume?.breakdown_usd?.wallet_topup || 0, 'USD')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Top-Up Akun (Crypto)</span>
                    <span className="font-semibold">
                      {formatCurrency(financialData.topup_volume?.breakdown_usd?.ad_account_topup || 0, 'USD')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded border-2 border-blue-200">
                    <span className="font-bold">Total Top-Up USD</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(financialData.topup_volume?.total_topup_usd || 0, 'USD')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialReports;