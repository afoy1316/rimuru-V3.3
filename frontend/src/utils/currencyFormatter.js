/**
 * Currency Formatter Utility
 * Consistent currency formatting across the entire application
 */

/**
 * Format IDR currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted IDR string (e.g., "Rp 10.572.631")
 */
export const formatIDR = (amount) => {
  if (amount === null || amount === undefined) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format USD currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted USD string (e.g., "$50,000.00")
 */
export const formatUSD = (amount) => {
  if (amount === null || amount === undefined) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format currency based on type
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency type ('IDR' or 'USD')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'IDR') => {
  if (currency === 'USD') {
    return formatUSD(amount);
  }
  return formatIDR(amount);
};

/**
 * Format number with thousand separators (no currency symbol)
 * @param {number} amount - The amount to format
 * @param {string} locale - Locale for formatting ('id-ID' or 'en-US')
 * @returns {string} Formatted number string
 */
export const formatNumber = (amount, locale = 'id-ID') => {
  if (amount === null || amount === undefined) return '0';
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Parse formatted currency string back to number
 * @param {string} formattedAmount - Formatted currency string
 * @returns {number} Parsed number
 */
export const parseCurrency = (formattedAmount) => {
  if (!formattedAmount) return 0;
  
  // Remove all non-numeric characters except decimal point
  const cleaned = formattedAmount.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
};
