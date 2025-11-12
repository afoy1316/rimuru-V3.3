// Navigation service for handling notification clicks
class NotificationNavigationService {
  constructor() {
    this.navigate = null; // Will be set by useNavigate hook
  }

  setNavigate(navigateFunction) {
    this.navigate = navigateFunction;
  }

  getNavigationPath(notificationType, referenceId = null, userType = 'client') {
    switch (notificationType) {
      // ========== ACTUAL CLIENT NOTIFICATION TYPES FROM DATABASE ==========
      case 'approval':  // Account approval notifications → Kelola Akun
        return userType === 'client' ? '/dashboard/kelola-akun' : '/admin/requests';
      
      case 'withdraw_approved':  // Withdrawal approval notifications → Withdraw page
      case 'withdraw_rejected':   // Withdrawal rejection notifications → Withdraw page  
        return userType === 'client' ? '/dashboard/withdraw' : '/admin/withdraws';
      
      // ========== ACTUAL ADMIN NOTIFICATION TYPES FROM DATABASE ==========
      case 'account_request':  // New account requests → Admin Requests
        return '/admin/requests';
      
      case 'payment_proof':  // Payment proof uploads → Admin Account Top Up Management
      case 'topup_request':   // Top-up requests → Admin Account Top Up Management
        return '/admin/account-topup-management';
      
      case 'user_registration':  // New user registrations → Admin Clients
        return '/admin/clients';
      
      // ========== LEGACY/EXPECTED TYPES (for backward compatibility) ==========
      case 'account_approved':
      case 'account_rejected':  
      case 'account_completed':
      case 'account_sharing':
        return userType === 'client' ? '/dashboard/kelola-akun' : '/admin/requests';
      
      case 'payment_confirmed':
      case 'payment_verified':
      case 'payment_rejected':
      case 'topup_confirmed':
      case 'topup_verified':
      case 'topup_rejected':
        return userType === 'client' ? '/dashboard/topup/history' : '/admin/account-topup-management';
      
      case 'withdrawal_processed':
      case 'withdrawal_completed':
      case 'withdrawal_rejected':
        return userType === 'client' ? '/dashboard/withdraw' : '/admin/withdraws';
      
      case 'share_request_approved':
      case 'share_request_rejected':
        return userType === 'client' ? '/dashboard/share-account' : '/admin/share-requests';
      
      // ========== TRANSFER SALDO NOTIFICATIONS ==========
      case 'transfer_created':
      case 'transfer_approved':
      case 'transfer_rejected':
      case 'transfer_failed':
        return userType === 'client' ? '/dashboard/withdraw' : '/admin/transfer-requests';
      
      case 'transfer_request':  // Admin notification for new transfer request
        return '/admin/transfer-requests';
      
      // ========== TOP-UP CANCEL NOTIFICATIONS ==========
      case 'topup_cancelled':
      case 'warning':  // Auto-cancel notifications
        return userType === 'client' ? '/dashboard/topup/history' : '/admin/topup-management';
      
      case 'new_account_request':
      case 'new_payment_request':
      case 'payment_proof_uploaded':
        return '/admin/account-topup-management';
      
      case 'new_withdrawal_request':
      case 'new_withdraw_request':  // Match backend notification type
        return '/admin/withdraws';
      
      case 'share_request':         // Backend uses this type for new share requests
      case 'new_share_request':
        return '/admin/share-requests';
      
      case 'new_transfer_request':
      case 'wallet_transfer_request':  // Wallet transfer to account request
        return '/admin/transfer-requests';
      
      // ========== WALLET & TOP-UP MANAGEMENT NOTIFICATIONS ==========
      case 'wallet_topup_request':     // Admin notification for new wallet top-up request
      case 'wallet_transfer_request':  // Admin notification for new wallet transfer request
      case 'wallet_topup_proof_uploaded': // Admin notification for wallet proof upload
        return '/admin/wallet-topup-management';
      
      case 'wallet_topup_success':     // Client notification for wallet top-up success
      case 'wallet_topup_rejected':    // Client notification for wallet top-up rejection  
      case 'wallet_transfer_success':  // Client notification for wallet transfer success
      case 'wallet_transfer_rejected': // Client notification for wallet transfer rejection
        return userType === 'client' ? '/dashboard/wallet-statement' : '/admin/wallet-topup-management';
      
      // Fallback based on user type
      default:
        console.warn(`Unknown notification type: ${notificationType} - using fallback route`);
        return userType === 'client' ? '/dashboard' : '/admin';
    }
  }

  handleNotificationClick(notificationType, referenceId = null, userType = 'client') {
    const path = this.getNavigationPath(notificationType, referenceId, userType);
    const currentPath = window.location.pathname;
    
    // Focus window if it's a desktop notification
    window.focus();
    
    // Navigate to the appropriate page
    if (this.navigate) {
      // Use React Router navigate if available
      if (currentPath === path) {
        // If already on the target page, provide visual feedback
        // First scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Show a brief visual indication that the notification was processed
        if (window.showInAppNotification) {
          setTimeout(() => {
            window.showInAppNotification({
              title: '✅ Navigasi Berhasil',
              message: 'Anda sudah berada di halaman yang tepat',
              type: 'info',
              created_at: new Date().toISOString()
            });
          }, 500);
        }
        
        // Force a re-render by navigating with state
        this.navigate(path, { replace: true, state: { timestamp: Date.now() } });
      } else {
        this.navigate(path);
      }
    } else {
      // Fallback to window.location for desktop notifications
      if (currentPath === path) {
        // Force a page refresh when already on the target page
        window.location.reload();
      } else {
        window.location.href = path;
      }
    }
    
    console.log(`Navigated to ${path} for notification type: ${notificationType} (current: ${currentPath})`);
  }

  // Convenience methods for specific notification types
  navigateToAccountRequests() {
    this.handleNotificationClick('account_approved');
  }

  navigateToPaymentHistory() {
    this.handleNotificationClick('payment_confirmed');
  }

  navigateToWithdrawals() {
    this.handleNotificationClick('withdrawal_processed');
  }

  navigateToShareRequests() {
    this.handleNotificationClick('share_request_approved');
  }
}

// Global instance
const notificationNavigationService = new NotificationNavigationService();

export default notificationNavigationService;