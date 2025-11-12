import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  ArrowRightLeft, 
  DollarSign, 
  Banknote, 
  X, 
  RefreshCw,
  Calculator
} from 'lucide-react';

const CurrencyExchangeModal = ({ 
  isOpen, 
  onClose, 
  onExchange, 
  exchangeRate, 
  walletIDR, 
  walletUSD, 
  loading 
}) => {
  const { t } = useLanguage();
  const [fromCurrency, setFromCurrency] = useState('IDR');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [convertedAmount, setConvertedAmount] = useState(0);

  // Calculate converted amount when amount or currencies change
  useEffect(() => {
    if (amount && !isNaN(amount)) {
      const rate = fromCurrency === 'IDR' ? exchangeRate.IDR_USD : exchangeRate.USD_IDR;
      setConvertedAmount((parseFloat(amount) * rate).toFixed(fromCurrency === 'IDR' ? 2 : 0));
    } else {
      setConvertedAmount(0);
    }
  }, [amount, fromCurrency, toCurrency, exchangeRate]);

  const handleSwapCurrencies = () => {
    const newFromCurrency = toCurrency;
    const newToCurrency = fromCurrency;
    setFromCurrency(newFromCurrency);
    setToCurrency(newToCurrency);
    setAmount('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onExchange(fromCurrency, toCurrency, amount);
  };

  const getMaxAmount = () => {
    return fromCurrency === 'IDR' ? walletIDR : walletUSD;
  };

  const getCurrentRate = () => {
    return fromCurrency === 'IDR' ? exchangeRate.IDR_USD : exchangeRate.USD_IDR;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg">
                <ArrowRightLeft className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('currencyExchange') || 'Currency Exchange'}
                </h3>
                <p className="text-sm text-gray-500">
                  {t('exchangeDescription') || 'Convert between IDR and USD'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Exchange Rate Display */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Exchange Rate</p>
                <p className="text-lg font-bold text-gray-900">
                  1 {fromCurrency} = {fromCurrency === 'IDR' 
                    ? getCurrentRate()?.toFixed(8) 
                    : getCurrentRate()?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
                  } {toCurrency}
                </p>
              </div>
              <div className="p-2 bg-white rounded-lg">
                <Calculator className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* From Currency */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t('fromAmount') || 'From'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {fromCurrency === 'IDR' ? (
                    <Banknote className="h-5 w-5 text-blue-500" />
                  ) : (
                    <DollarSign className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // For IDR, only allow whole numbers
                    // For USD, allow up to 2 decimal places
                    if (fromCurrency === 'IDR') {
                      // Remove any decimal point for IDR
                      setAmount(value.split('.')[0]);
                    } else {
                      setAmount(value);
                    }
                  }}
                  className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Enter ${fromCurrency} amount`}
                  min="0"
                  step={fromCurrency === 'USD' ? '0.01' : '1'}
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-sm font-medium text-gray-500">
                    {fromCurrency}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Available: {fromCurrency === 'IDR' 
                  ? Math.floor(getMaxAmount()).toLocaleString('id-ID')
                  : getMaxAmount().toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
                } {fromCurrency}</span>
                <button
                  type="button"
                  onClick={() => {
                    const maxAmount = getMaxAmount();
                    // Round IDR to whole number, USD to 2 decimals
                    const roundedAmount = fromCurrency === 'IDR' 
                      ? Math.floor(maxAmount).toString()
                      : maxAmount.toFixed(2);
                    setAmount(roundedAmount);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSwapCurrencies}
                className="p-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-full hover:from-blue-600 hover:to-green-600 transition-all duration-200 transform hover:scale-105"
              >
                <ArrowRightLeft className="h-5 w-5" />
              </button>
            </div>

            {/* To Currency */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t('toAmount') || 'To'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {toCurrency === 'IDR' ? (
                    <Banknote className="h-5 w-5 text-blue-500" />
                  ) : (
                    <DollarSign className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <input
                  type="text"
                  value={convertedAmount}
                  readOnly
                  className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder="Converted amount"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-sm font-medium text-gray-500">
                    {toCurrency}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > getMaxAmount()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t('exchanging') || 'Exchanging...'}
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    {t('exchange') || 'Exchange'}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Disclaimer */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <span className="font-medium">Note:</span> Exchange rates are updated in real-time. 
              No fees applied for currency exchange.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyExchangeModal;