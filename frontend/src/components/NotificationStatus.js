import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Volume2, VolumeX, Settings, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import notificationService from '../services/NotificationService';

const NotificationStatus = () => {
  const { t } = useLanguage();
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check notification support and permission status
    setIsSupported(notificationService.isSupported());
    setPermissionStatus(notificationService.getPermissionStatus());
    
    // Update status periodically
    const interval = setInterval(() => {
      setPermissionStatus(notificationService.getPermissionStatus());
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRequestPermission = async () => {
    if (notificationService.isSupported()) {
      const granted = await notificationService.requestPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      
      if (granted) {
        // Show test notification
        notificationService.showClientNotification(
          '🔔 Notifikasi Aktif!',
          'Anda sekarang akan menerima notifikasi desktop dengan suara untuk semua update penting.',
          'info'
        );
      }
    }
  };

  const openBrowserSettings = () => {
    alert(`Untuk mengaktifkan notifikasi:

Chrome/Edge:
1. Klik ikon gembok/pengaturan di address bar
2. Pilih "Notifications" → "Allow"
3. Refresh halaman

Firefox:
1. Klik ikon shield di address bar  
2. Pilih "Permissions" → "Notifications" → "Allow"
3. Refresh halaman

Safari:
1. Menu Safari → Preferences → Websites
2. Pilih "Notifications" → Cari website ini → "Allow"`);
  };

  if (!isSupported) {
    return (
      <div className="flex items-center space-x-2 text-gray-500 text-sm">
        <BellOff className="w-4 h-4" />
        <span>Browser tidak mendukung notifikasi</span>
      </div>
    );
  }

  const getStatusDisplay = () => {
    switch (permissionStatus) {
      case 'granted':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          text: 'Notifikasi Aktif',
          color: 'text-green-600',
          actionText: 'Test Notifikasi',
          action: () => {
            notificationService.showClientNotification(
              'Test Notifikasi',
              'Notifikasi desktop dengan suara bekerja dengan baik! 🔔',
              'info'
            );
          }
        };
      
      case 'denied':
        return {
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          text: 'Notifikasi Diblokir',
          color: 'text-red-600',
          actionText: 'Cara Aktifkan',
          action: openBrowserSettings
        };
      
      default:
        return {
          icon: <Bell className="w-4 h-4 text-orange-500" />,
          text: 'Belum Diaktifkan',
          color: 'text-orange-600',
          actionText: 'Aktifkan',
          action: handleRequestPermission
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="flex items-center space-x-2 text-sm">
      {/* Status text removed as requested */}
    </div>
  );
};

export default NotificationStatus;