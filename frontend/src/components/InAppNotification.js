import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info, Bell } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import notificationNavigationService from '../services/NotificationNavigationService';

const InAppNotification = ({ notification, onClose, autoClose = true }) => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (notification) {
      // Show animation
      setTimeout(() => setIsVisible(true), 10);
      
      // Auto close after 6 seconds if enabled
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, 6000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [notification, autoClose]);

  const handleClose = () => {
    setIsRemoving(true);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 300);
    }, 150);
  };

  const handleNotificationClick = (e) => {
    // Don't navigate if clicking close button
    if (e.target.closest('button')) {
      return;
    }

    // Handle navigation based on notification type using window.location
    const userType = localStorage.getItem('user_type') === 'admin' ? 'admin' : 'client';
    const path = notificationNavigationService.getNavigationPath(
      notification.type, 
      notification.reference_id || notification.data?.referenceId, 
      userType
    );
    
    // Navigate using window.location to avoid React Router context issues
    window.location.href = path;
    
    // Close notification after navigation
    handleClose();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'approval':
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'rejection':
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <Bell className="w-6 h-6 text-purple-500" />;
    }
  };

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'approval':
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'rejection':
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-purple-50 border-purple-200';
    }
  };

  const getProgressColor = (type) => {
    switch (type) {
      case 'approval':
      case 'completed':
        return 'bg-green-400';
      case 'rejection':
      case 'failed':
        return 'bg-red-400';
      case 'warning':
        return 'bg-yellow-400';
      case 'info':
        return 'bg-blue-400';
      default:
        return 'bg-purple-400';
    }
  };

  if (!notification) return null;

  return (
    <div 
      className={`fixed top-4 right-4 z-50 max-w-sm w-full sm:w-96 transform transition-all duration-300 ease-out ${
        isVisible && !isRemoving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
      }`}
      style={{
        maxWidth: 'calc(100vw - 2rem)', // Prevent overflow on small screens
        width: 'auto',
        minWidth: '300px'
      }}
    >
      <div 
        className={`rounded-lg shadow-lg border-l-4 p-3 sm:p-4 ${getBackgroundColor(notification.type)} max-w-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
        onClick={handleNotificationClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0 max-w-full">
              <h4 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed break-words">
                {notification.message}
              </p>
              {notification.created_at && (
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(notification.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-white hover:bg-opacity-50 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Progress bar for auto-close */}
        {autoClose && (
          <div className="mt-3 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressColor(notification.type)} rounded-full animate-shrink`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Container component to manage multiple notifications
export const InAppNotificationContainer = () => {
  const [notifications, setNotifications] = useState([]);

  // Function to add new notification (to be called from outside)
  const addNotification = (notification) => {
    const id = Date.now();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Remove old notifications if too many
    if (notifications.length >= 3) {
      setNotifications(prev => prev.slice(-2));
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Expose addNotification globally
  useEffect(() => {
    window.showInAppNotification = addNotification;
    return () => {
      window.showInAppNotification = null;
    };
  }, []);

  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none">
      <div className="p-2 sm:p-4 w-full max-w-xs sm:max-w-sm md:max-w-md space-y-2 sm:space-y-4" 
           style={{
             maxWidth: 'calc(100vw - 1rem)', // Ensure it doesn't exceed viewport width
             width: 'auto'
           }}>
        {notifications.map((notification, index) => (
          <div 
            key={notification.id}
            className="pointer-events-auto"
            style={{ 
              transform: `translateY(${index * 10}px)`,
              zIndex: 50 - index 
            }}
          >
          <InAppNotification
            notification={notification}
            onClose={() => removeNotification(notification.id)}
            autoClose={true}
          />
        </div>
          ))}
      </div>
    </div>
  );
};

export default InAppNotification;