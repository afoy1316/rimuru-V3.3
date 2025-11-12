import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

const DateRangeFilter = ({ onFilterChange }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const periods = [
    { value: 'today', label: 'Hari Ini' },
    { value: 'yesterday', label: 'Kemarin' },
    { value: '7days', label: '7 Hari' },
    { value: 'thisMonth', label: 'Bulan Ini' },
    { value: 'thisYear', label: 'Tahun Ini' },
    { value: 'all', label: 'Semua Data' },
    { value: 'custom', label: 'Custom' }
  ];

  const getDateRange = (period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          startDate: yesterday.toISOString(),
          endDate: today.toISOString()
        };
      case '7days':
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          startDate: sevenDaysAgo.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'thisMonth':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: monthStart.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'thisYear':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return {
          startDate: yearStart.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'all':
        return { startDate: null, endDate: null };
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            startDate: new Date(customStartDate).toISOString(),
            endDate: new Date(new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000).toISOString()
          };
        }
        return { startDate: null, endDate: null };
      default:
        return { startDate: null, endDate: null };
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    
    if (period === 'custom') {
      setShowCustom(true);
      return;
    }
    
    setShowCustom(false);
    const dateRange = getDateRange(period);
    onFilterChange(dateRange);
  };

  const handleCustomApply = () => {
    if (customStartDate && customEndDate) {
      const dateRange = getDateRange('custom');
      onFilterChange(dateRange);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filter Periode</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => handlePeriodChange(period.value)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              selectedPeriod === period.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleCustomApply}
            disabled={!customStartDate || !customEndDate}
            className="mt-3 w-full px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Terapkan Filter
          </button>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
