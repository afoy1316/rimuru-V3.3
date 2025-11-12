/**
 * Utility functions for handling API errors gracefully
 */

/**
 * Check if error is due to session expiry
 * @param {Error} error - The error object from axios
 * @returns {boolean} - True if error is session expiry
 */
export const isSessionExpired = (error) => {
  return error?.response?.status === 401 || error?.message === 'Session expired';
};

/**
 * Get user-friendly error message
 * Prevents showing confusing error messages when session has expired
 * @param {Error} error - The error object from axios
 * @param {string} defaultMessage - Default message to show if not session expiry
 * @returns {string} - User-friendly error message or null if session expired
 */
export const getErrorMessage = (error, defaultMessage = 'Terjadi kesalahan') => {
  // Don't show error message if session expired (interceptor handles it)
  if (isSessionExpired(error)) {
    return null;
  }
  
  // Return specific error message from backend if available
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Return default message for other errors
  return defaultMessage;
};

/**
 * Handle API error with toast notification
 * Only shows toast if error is NOT session expiry (to prevent duplicate messages)
 * @param {Error} error - The error object from axios
 * @param {Function} toast - Toast notification function
 * @param {string} defaultMessage - Default error message
 */
export const handleApiError = (error, toast, defaultMessage = 'Terjadi kesalahan') => {
  const message = getErrorMessage(error, defaultMessage);
  
  // Only show toast if we have a message (not session expiry)
  if (message && toast) {
    toast.error(message);
  }
};
