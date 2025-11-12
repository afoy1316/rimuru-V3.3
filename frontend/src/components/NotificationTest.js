import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Bell, Volume2, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import notificationService from '../services/NotificationService';
import { useLanguage } from '../contexts/LanguageContext';

const NotificationTest = () => {
  const { t } = useLanguage();

  const testDesktopNotification = () => {
    notificationService.showNotification('🔔 Test Desktop Notification', {
      body: 'Ini adalah test notifikasi desktop dengan suara keras!',
      type: 'info',
      data: { category: 'info' }
    });
  };

  const testInAppNotification = (type) => {
    const notifications = {
      approval: {
        title: '✅ Permintaan Disetujui!', 
        message: 'Permintaan akun Facebook Ads Anda telah disetujui dan siap digunakan.',
        type: 'approval'
      },
      rejection: {
        title: '❌ Permintaan Ditolak',
        message: 'Permintaan akun Google Ads Anda ditolak. Silakan periksa detail dan coba lagi.',
        type: 'rejection'
      },
      info: {
        title: 'ℹ️ Informasi Penting',
        message: 'Ada update baru untuk akun TikTok Ads Anda. Silakan periksa dashboard.',
        type: 'info'
      },
      warning: {
        title: '⚠️ Peringatan Saldo',
        message: 'Saldo akun Anda hampir habis. Lakukan top-up segera agar iklan tetap berjalan.',
        type: 'warning'
      },
      completed: {
        title: '🎉 Pembayaran Berhasil!',
        message: 'Top-up senilai Rp 500.000 berhasil diproses. Saldo akun Anda telah diperbarui.',
        type: 'completed'
      }
    };

    const notification = notifications[type];
    if (window.showInAppNotification && notification) {
      window.showInAppNotification({
        ...notification,
        created_at: new Date().toISOString()
      });
    }
  };

  const testSoundOnly = async () => {
    if (notificationService.playSound) {
      await notificationService.playSound();
    }
  };

  const checkPermissionStatus = () => {
    const status = notificationService.getPermissionStatus();
    alert(`Permission Status: ${status}\nSupported: ${notificationService.isSupported()}\nEnabled: ${notificationService.isEnabled()}`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Test Sistem Notifikasi Pop-up</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Desktop Notifications */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Desktop Notifications</span>
              </h3>
              
              <Button 
                onClick={testDesktopNotification}
                className="w-full"
                variant="outline"
              >
                Test Desktop + Sound
              </Button>
              
              <Button 
                onClick={checkPermissionStatus}
                className="w-full"
                variant="outline"
              >
                Check Permission Status
              </Button>
            </div>

            {/* Sound Test */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center space-x-2">
                <Volume2 className="w-4 h-4" />
                <span>Audio Test</span>
              </h3>
              
              <Button 
                onClick={testSoundOnly}
                className="w-full"
                variant="outline"
              >
                Test Loud Sound Only
              </Button>
            </div>
          </div>

          {/* In-App Notifications */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">In-App Pop-up Notifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <Button 
                onClick={() => testInAppNotification('approval')}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approval
              </Button>
              
              <Button 
                onClick={() => testInAppNotification('rejection')}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejection
              </Button>
              
              <Button 
                onClick={() => testInAppNotification('warning')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                size="sm"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Warning
              </Button>
              
              <Button 
                onClick={() => testInAppNotification('info')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Info className="w-4 h-4 mr-2" />
                Info
              </Button>
              
              <Button 
                onClick={() => testInAppNotification('completed')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Completed
              </Button>
            </div>
          </div>

          {/* Multiple Notifications Test */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Multiple Notifications Test</h3>
            <Button 
              onClick={() => {
                testInAppNotification('approval');
                setTimeout(() => testInAppNotification('info'), 1000);
                setTimeout(() => testInAppNotification('warning'), 2000);
              }}
              className="w-full"
              variant="outline"
            >
              Test Multiple Pop-ups (3 notifications)
            </Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Fitur Notifikasi:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Desktop notifications dengan suara keras yang enak didengar</li>
              <li>• In-app pop-up notifications dengan progress bar</li>
              <li>• Auto-close setelah 6 detik</li>
              <li>• Real-time polling setiap 10 detik</li>
              <li>• Otomatis minta permission saat pertama kali</li>
              <li>• Support semua jenis event (account, payment, withdrawal, share)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationTest;