/**
 * Auto-apply currency formatters to components
 * This utility helps to quickly update currency displays
 */

import { formatIDR, formatUSD, formatCurrency } from './currencyFormatter';

/**
 * Format amount based on currency
 * @param {number|string} amount 
 * @param {string} currency - 'IDR' or 'USD'
 * @returns {string}
 */
export const formatAmount = (amount, currency = 'IDR') => {
  const num = parseFloat(amount) || 0;
  return formatCurrency(num, currency);
};

/**
 * Quick helper for conditional currency formatting
 */
export const quickFormat = {
  idr: (amount) => formatIDR(amount),
  usd: (amount) => formatUSD(amount),
  auto: (amount, currency) => formatCurrency(amount, currency)
};

export default { formatAmount, quickFormat };
