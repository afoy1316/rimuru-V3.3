import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import notificationService from '../services/NotificationService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Global singleton to prevent multiple polling instances
let globalPollingInterval = null;
let instanceCount = 0;

export const useRealTimeNotifications = (userType = 'client') => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(new Date());
  const intervalRef = useRef(null);
  const isInitialized = useRef(false);
  const savedCallback = useRef(); // Fix for stale closures

  const fetchNotifications = useCallback(async (retryCount = 0) => {
    try {
      const token = localStorage.getItem(userType === 'admin' ? 'admin_token' : 'token');
      if (!token) return [];

      const endpoint = userType === 'admin' 
        ? '/admin/notifications?limit=50' 
        : '/client/notifications';

      const response = await axios.get(`${API}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      });

      // Cache successful result
      localStorage.setItem(`cached_notifications_${userType}`, JSON.stringify(response.data || []));
      return response.data || [];
    } catch (error) {
      // Silent retry on network errors
      if (retryCount < 2 && !error.response) {
        const delay = 1000 * (retryCount + 1); // 1s, 2s
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchNotifications(retryCount + 1);
      }
      
      // Load from cache on all failures - NEVER show error
      try {
        const cached = localStorage.getItem(`cached_notifications_${userType}`);
        if (cached) return JSON.parse(cached);
      } catch (e) {
        console.warn('Cache load failed, returning empty array');
      }
      return [];
    }
  }, [userType]);

  const fetchUnreadCount = useCallback(async (retryCount = 0) => {
    try {
      const token = localStorage.getItem(userType === 'admin' ? 'admin_token' : 'token');
      if (!token) return 0;

      const endpoint = userType === 'admin' 
        ? '/admin/notifications/unread-count' 
        : '/client/notifications/unread-count';

      const response = await axios.get(`${API}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      });

      const count = response.data?.count || 0;
      // Cache successful result
      localStorage.setItem(`cached_unread_count_${userType}`, count.toString());
      return count;
    } catch (error) {
      // Silent retry on network errors
      if (retryCount < 2 && !error.response) {
        const delay = 1000 * (retryCount + 1); // 1s, 2s
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchUnreadCount(retryCount + 1);
      }
      
      // Load from cache on all failures - NEVER show error
      try {
        const cached = localStorage.getItem(`cached_unread_count_${userType}`);
        if (cached) return parseInt(cached, 10);
      } catch (e) {
        console.warn('Cache load failed, returning 0');
      }
      return 0;
    }
  }, [userType]);

  const checkForNewNotifications = async () => {
    try {
      const currentNotifications = await fetchNotifications();
      const currentUnreadCount = await fetchUnreadCount();

      if (!isInitialized.current) {
        // First load - just set the data without showing notifications
        setNotifications(currentNotifications);
        setUnreadCount(currentUnreadCount);
        isInitialized.current = true;
        return;
      }

      // Check for new notifications since last check
      const lastCheck = new Date(Date.now() - 15000); // Look back 15 seconds to avoid missing notifications
      const newNotifications = currentNotifications.filter(notification => {
        const notificationTime = new Date(notification.created_at);
        return notificationTime > lastCheck && !notification.is_read;
      });

      // Show desktop notifications for new items (with sound only for first notification)
      for (let i = 0; i < newNotifications.length; i++) {
        const notification = newNotifications[i];
        const isFirstNotification = i === 0;
        
        if (userType === 'admin') {
          notificationService.showAdminNotification(
            notification.title,
            notification.message,
            notification.type,
            isFirstNotification, // Only play sound for first notification
            notification.reference_id // Pass reference ID for navigation
          );
        } else {
          notificationService.showClientNotification(
            notification.title,
            notification.message,
            notification.type,
            isFirstNotification, // Only play sound for first notification
            notification.reference_id // Pass reference ID for navigation
          );
        }
      }

      // Update state using updater functions to avoid stale closures
      setNotifications(currentNotifications);
      setUnreadCount(currentUnreadCount);
      setLastCheckTime(new Date());

    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  };

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem(userType === 'admin' ? 'admin_token' : 'token');
      if (!token) return;

      const endpoint = userType === 'admin' 
        ? `/admin/notifications/${notificationId}/read`
        : `/client/notifications/${notificationId}/read`;

      await axios.put(`${API}${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [userType]);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem(userType === 'admin' ? 'admin_token' : 'token');
      if (!token) return;

      const endpoint = userType === 'admin' 
        ? '/admin/notifications/mark-all-read'
        : '/client/notifications/mark-all-read';

      await axios.put(`${API}${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userType]);

  const requestNotificationPermission = useCallback(async () => {
    return await notificationService.requestPermission();
  }, []);

  // Initialize and start polling
  // Update saved callback
  useEffect(() => {
    savedCallback.current = checkForNewNotifications;
  });

  // Setup polling with fixed dependencies
  useEffect(() => {
    const token = localStorage.getItem(userType === 'admin' ? 'admin_token' : 'token');
    if (!token) return;

    // Increment instance count
    instanceCount++;
    
    // Initial load
    savedCallback.current();

    // Only start polling if it's not already running
    if (!globalPollingInterval) {
      console.log('Starting global notification polling (60 seconds)');
      globalPollingInterval = setInterval(() => {
        // Use saved callback to avoid stale closures
        if (instanceCount > 0 && savedCallback.current) {
          savedCallback.current();
        }
      }, 60000); // Increased from 10s to 60s to reduce server load
    }

    return () => {
      // Decrement instance count on cleanup
      instanceCount--;
      
      // Clear global polling if no instances left
      if (instanceCount <= 0 && globalPollingInterval) {
        console.log('Stopping global notification polling');
        clearInterval(globalPollingInterval);
        globalPollingInterval = null;
        instanceCount = 0; // Reset to 0
      }
    };
  }, [userType]); // Only depend on userType, not changing functions

  // Auto-request permission immediately on mount
  useEffect(() => {
    if (notificationService.isSupported()) {
      // Request permission immediately for better user experience
      const requestPermissionImmediately = async () => {
        if (!notificationService.isEnabled()) {
          // In-app notifications removed - only desktop notifications are used
          console.log('🔔 Requesting desktop notification permission');
          
          // Request permission after short delay
          setTimeout(() => {
            requestNotificationPermission();
          }, 1500);
        }
      };
      
      requestPermissionImmediately();
    }
  }, [requestNotificationPermission]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestNotificationPermission,
    refreshNotifications: checkForNewNotifications,
    isNotificationSupported: notificationService.isSupported(),
    isNotificationEnabled: notificationService.isEnabled(),
    permissionStatus: notificationService.getPermissionStatus()
  };
};