import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import { 
  Bell, 
  FileText, 
  DollarSign, 
  User, 
  RefreshCw,
  X,
  CheckCircle,
  CreditCard,
  UserPlus,
  AlertCircle,
  Info
} from 'lucide-react';
import notificationNavigationService from '../../services/NotificationNavigationService';
import notificationSoundService from '../../services/NotificationSoundService';
import { toast } from 'react-hot-toast';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const NotificationBell = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevUnreadCount = useRef(0);

  // Setup navigation service
  useEffect(() => {
    notificationNavigationService.setNavigate(navigate);
    return () => {
      notificationNavigationService.setNavigate(null);
    };
  }, [navigate]);

  // Initial fetch and polling for unread count
  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();
    
    // Setup polling every 30 seconds for real-time updates
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await axios.get(`${API}/api/admin/notifications?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await axios.get(`${API}/api/admin/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newCount = response.data.count;
      
      // Trigger animation and sound if count increased (new notification)
      // FIXED: Remove prevUnreadCount > 0 check to allow sound on first load
      if (newCount > prevUnreadCount.current) {
        setIsAnimating(true);
        console.log('🔔 New notification detected! Count:', prevUnreadCount.current, '→', newCount);
        console.log('🎵 Playing admin notification sound...');
        
        // Play admin notification sound
        notificationSoundService.playNewNotification('admin');
        
        // Reset animation after 1 second
        setTimeout(() => setIsAnimating(false), 1000);
      }
      
      prevUnreadCount.current = newCount;
      setUnreadCount(newCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem('admin_token');
    try {
      await axios.put(`${API}/api/admin/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      setLoading(true);
      
      // Stop admin notification sound
      notificationSoundService.stopAdminNotification();
      
      await axios.put(`${API}/api/admin/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
      toast.success(t('allNotificationsRead'));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error(t('failedToMarkRead'));
    } finally {
      setLoading(false);
    }
  };

  // Handle notification click with navigation
  const handleNotificationClick = async (notification) => {
    try {
      // Stop admin notification sound when any notification clicked
      notificationSoundService.stopAdminNotification();
      
      // Mark as read first
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }

      // Close notification dropdown
      setIsOpen(false);

      // Navigate to relevant page
      const userType = 'admin';
      notificationNavigationService.handleNotificationClick(
        notification.type,
        notification.reference_id,
        userType
      );

      console.log(`Admin clicked notification: ${notification.type} - navigating to relevant page`);
    } catch (error) {
      console.error('Error handling admin notification click:', error);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (isOpen) {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return `${diffMins}${t('minsAgo')}`;
    if (diffHours < 24) return `${diffHours}${t('hoursAgo')}`;
    return `${diffDays}${t('daysAgo')}`;
  };

  // Get notification icon
  const getNotificationIcon = (type, isRead = false) => {
    // If already read, show checkmark
    if (isRead) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }

    // For unread notifications, show specific icons by type
    switch (type) {
      case 'new_account_request':
      case 'new_request': 
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'new_payment_request':
      case 'payment_proof_uploaded':
      case 'new_topup': 
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'new_withdrawal_request':
        return <Info className="h-4 w-4 text-orange-600" />;
      case 'new_share_request':
        return <UserPlus className="h-4 w-4 text-purple-600" />;
      case 'new_user': 
        return <UserPlus className="h-4 w-4 text-purple-600" />;
      case 'status_change': 
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: 
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  // Handle dropdown toggle
  const toggleDropdown = async () => {
    // Resume audio context on user interaction (required by browsers)
    await notificationSoundService.resumeAudioContext();
    
    notificationSoundService.playClick();
    
    // Stop looping admin notification sound when dropdown opened
    if (!isOpen) {
      notificationSoundService.stopAdminNotification();
      fetchNotifications();
    }
    
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={toggleDropdown}
        className={`relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-300 transform hover:scale-105 ${isAnimating ? 'animate-bounce' : ''}`}
      >
        <Bell className={`w-6 h-6 transition-all duration-500 ${unreadCount > 0 ? 'text-red-500 animate-pulse' : ''} ${isAnimating ? 'animate-bounce' : ''}`} />
        
        {/* Badge with Enhanced Animation */}
        {unreadCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold px-1 shadow-lg ring-2 ring-red-200 transition-all duration-300 ${isAnimating ? 'animate-bounce scale-110' : 'animate-pulse'}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content - Enhanced Animation - Mobile Responsive */}
          <div className="fixed sm:absolute right-0 left-0 sm:left-auto mt-2 mx-4 sm:mx-0 sm:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-20 animate-in slide-in-from-top-2 fade-in duration-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('notifications')}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 whitespace-nowrap"
                  >
                    {loading ? (t('marking')) : (t('markAllRead'))}
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                      !notification.is_read 
                        ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm' 
                        : 'hover:bg-gray-25'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-xl mt-1 flex-shrink-0">
                        {getNotificationIcon(notification.type, notification.is_read)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium break-words ${!notification.is_read ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                              {notification.title}
                              {!notification.is_read && (
                                <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                              )}
                            </p>
                            <p className={`text-sm mt-1 break-words ${!notification.is_read ? 'text-gray-800' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse whitespace-nowrap">
                                Baru
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  <Bell className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                  <p>{t('noNotifications')}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-100">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/admin/notifications');
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 transition-colors"
                >
                  Lihat semua notifikasi
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;