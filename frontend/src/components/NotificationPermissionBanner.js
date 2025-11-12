import React, { useState, useEffect } from 'react';
import { Bell, X, Volume2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import notificationService from '../services/NotificationService';

const NotificationPermissionBanner = () => {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    // Show banner if notifications are supported but not enabled
    const shouldShow = notificationService.isSupported() && 
                      !notificationService.isEnabled() &&
                      notificationService.getPermissionStatus() === 'default';
    
    if (shouldShow) {
      // Show banner after 3 seconds to avoid immediate annoyance
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnableNotifications = async () => {
    setIsRequestingPermission(true);
    
    try {
      const granted = await notificationService.requestPermission();
      
      if (granted) {
        setShowBanner(false);
        // Desktop notifications enabled successfully
        console.log('✅ Desktop notifications enabled successfully');
      } else {
        // Desktop notification permission denied
        console.log('⚠️ Desktop notification permission denied');
        setShowBanner(false);
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Remember user dismissed it for this session
    sessionStorage.setItem('notification_banner_dismissed', 'true');
  };

  if (!showBanner || sessionStorage.getItem('notification_banner_dismissed')) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm sm:text-base">
                🔔 {t('enableNotifications') || 'Aktifkan Notifikasi Desktop'}
              </p>
              <p className="text-sm text-blue-100 hidden sm:block">
                {t('notificationDescription') || 'Dapatkan update real-time tentang permintaan akun, pembayaran, dan status lainnya dengan suara keras'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEnableNotifications}
              disabled={isRequestingPermission}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isRequestingPermission ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span>{t('enabling') || 'Mengaktifkan...'}</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>{t('enable') || 'Aktifkan'}</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleDismiss}
              className="text-white hover:text-blue-200 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;