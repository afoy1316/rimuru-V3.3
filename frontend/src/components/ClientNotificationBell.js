import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, CheckCheck, Clock, CheckCircle, XCircle, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import notificationNavigationService from '../services/NotificationNavigationService';
import notificationSoundService from '../services/NotificationSoundService';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const ClientNotificationBell = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevUnreadCount = useRef(0);
  const dropdownRef = useRef(null);
  const bellButtonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  // Setup navigation service
  useEffect(() => {
    notificationNavigationService.setNavigate(navigate);
    return () => {
      notificationNavigationService.setNavigate(null);
    };
  }, [navigate]);

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (isOpen) {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API}/api/client/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newCount = response.data.count;
      
      // Trigger animation and sound if count increased (new notification)
      if (newCount > prevUnreadCount.current && prevUnreadCount.current > 0) {
        setIsAnimating(true);
        notificationSoundService.playNewNotification();
        
        // Reset animation after 1 second
        setTimeout(() => setIsAnimating(false), 1000);
      }
      
      prevUnreadCount.current = newCount;
      setUnreadCount(newCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API}/api/client/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/api/client/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read first
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }

      // Close notification dropdown
      setIsOpen(false);

      // Navigate to relevant page
      const userType = 'client';
      notificationNavigationService.handleNotificationClick(
        notification.type,
        notification.reference_id,
        userType
      );

      console.log(`Clicked notification: ${notification.type} - navigating to relevant page`);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/api/client/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
      toast.success(t('allNotificationsMarkedRead') || 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error(t('errorMarkingNotifications') || 'Error marking notifications as read');
    }
  };

  const getNotificationIcon = (type, isRead = false) => {
    // If already read, show checkmark
    if (isRead) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }

    // For unread notifications, show specific icons by type
    switch (type) {
      case 'approval':
      case 'account_approved':
      case 'payment_verified':
      case 'payment_confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejection':
      case 'account_rejected':
      case 'payment_rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'completed':
      case 'account_completed':
      case 'withdrawal_completed':
        return <CheckCheck className="w-5 h-5 text-purple-600" />;
      case 'info':
      case 'payment_proof_uploaded':
      case 'withdrawal_processed':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-yellow-600" />;
    }
  };

  const handleBellClick = () => {
    console.log('Bell clicked! Current isOpen:', isOpen);
    notificationSoundService.playClick();
    
    // Calculate dropdown position based on bell button position
    if (bellButtonRef.current) {
      const rect = bellButtonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      // For mobile: center dropdown or align right edge with some margin
      if (viewportWidth < 640) { // sm breakpoint
        setDropdownPosition({
          top: rect.bottom + 8,
          right: 8, // Just 8px from right edge for mobile
          left: null
        });
      } else {
        // For desktop: align right edge of dropdown with bell button
        setDropdownPosition({
          top: rect.bottom + 8,
          right: viewportWidth - rect.right,
          left: null
        });
      }
    }
    
    setIsOpen(!isOpen);
    if (!isOpen) {
      console.log('Fetching notifications...');
      fetchNotifications();
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('justNow') || 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  console.log('ClientNotificationBell render - isOpen:', isOpen, 'notifications:', notifications.length);

  return (
    <>
      {/* Bell Button */}
      <button
        ref={bellButtonRef}
        onClick={handleBellClick}
        className={`relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${isAnimating ? 'animate-bounce' : ''}`}
      >
        <Bell className={`w-6 h-6 transition-all duration-500 ${unreadCount > 0 ? 'text-red-500 animate-pulse' : ''} ${isAnimating ? 'animate-bounce' : ''}`} />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-medium shadow-lg ring-2 ring-red-200 transition-all duration-300 ${isAnimating ? 'animate-bounce scale-110' : 'animate-pulse'}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown - Using Portal - Mobile Responsive Positioning */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="w-[calc(100vw-1rem)] sm:w-80 bg-white rounded-lg shadow-2xl border border-gray-200"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
            zIndex: 99999,
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
        >
          {/* Header - Mobile Responsive */}
          <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 border-b border-gray-100 gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words flex-1">
              {t('notifications') || 'Notifikasi'}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                >
                  Tandai dibaca
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List - Mobile Responsive */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-3 sm:p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-xs sm:text-sm">{t('loading') || 'Loading...'}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <Bell className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                <p className="text-lg font-medium">{t('noNotifications') || 'No notifications'}</p>
                <p className="text-sm">{t('noNotificationsMessage') || 'You\'re all caught up!'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex gap-2 sm:gap-3">
                      <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                        {getNotificationIcon(notification.type, notification.is_read)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {/* Title - WRAP not truncate */}
                            <p className={`text-xs sm:text-sm font-medium break-words [overflow-wrap:anywhere] ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            {/* Message - WRAP not truncate */}
                            <p className={`text-xs sm:text-sm mt-1 break-words [overflow-wrap:anywhere] ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                              {notification.message}
                            </p>
                            {/* Time */}
                            <p className="text-xs text-gray-400 mt-1.5 sm:mt-2">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                          {/* Unread indicator */}
                          {!notification.is_read && (
                            <div className="flex-shrink-0">
                              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Mobile Responsive */}
          {notifications.length > 0 && (
            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-b-lg border-t border-gray-100">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/dashboard/notifications');
                }}
                className="w-full text-center text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium py-2 transition-colors"
              >
                Lihat semua notifikasi
              </button>
            </div>
          )}
        </div>
        , document.body
      )}
    </>
  );
};

export default ClientNotificationBell;