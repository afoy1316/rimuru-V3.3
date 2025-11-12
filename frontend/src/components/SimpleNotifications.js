import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { 
  Bell, 
  RefreshCw, 
  CheckCheck,
  User,
  FileText,
  DollarSign,
  CreditCard,
  UserPlus,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const SimpleNotifications = ({ isAdmin = false, onBack = null }) => {
  const { language, t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  // Simple fetch without complex error handling that causes issues
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const token = isAdmin 
        ? localStorage.getItem('admin_token') 
        : localStorage.getItem('token');
        
      if (!token) {
        setNotifications([]);
        return;
      }
      
      const endpoint = isAdmin ? '/api/admin/notifications' : '/api/client/notifications';
      
      const response = await axios.get(`${API}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
      }
      
    } catch (error) {
      // Silent fail - just show empty state
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = isAdmin 
        ? localStorage.getItem('admin_token') 
        : localStorage.getItem('token');
        
      const endpoint = isAdmin ? '/api/admin/notifications' : '/api/client/notifications';
      
      await axios.put(`${API}${endpoint}/${notificationId}/read`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      // Silent fail
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = isAdmin 
        ? localStorage.getItem('admin_token') 
        : localStorage.getItem('token');
        
      const endpoint = isAdmin ? '/api/admin/notifications' : '/api/client/notifications';
      
      await axios.put(`${API}${endpoint}/mark-all-read`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      
      toast.success('Semua notifikasi telah ditandai sebagai dibaca');
    } catch (error) {
      // Silent fail
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAdmin]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'read') return notification.is_read;
    return true; // all
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type, isRead) => {
    const iconClass = isRead ? 'text-gray-400' : 'text-blue-600';
    
    switch (type) {
      case 'account_request':
        return <FileText className={`w-5 h-5 ${iconClass}`} />;
      case 'status_update':
        return <Info className={`w-5 h-5 ${iconClass}`} />;
      case 'rejection':
        return <XCircle className={`w-5 h-5 text-red-500`} />;
      case 'account_completed':
        return <CheckCircle className={`w-5 h-5 text-green-500`} />;
      default:
        return <Bell className={`w-5 h-5 ${iconClass}`} />;
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Bell className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAdmin ? 'Notifikasi Admin' : 'Semua Notifikasi'}
            </h1>
            <p className="text-sm text-gray-500">
              {notifications.length} total, {unreadCount} belum dibaca
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}
          
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex rounded-lg border border-gray-300 overflow-hidden w-fit">
        {['all', 'unread', 'read'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'Semua' : f === 'unread' ? 'Belum Dibaca' : 'Sudah Dibaca'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Memuat notifikasi...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Notifikasi</h3>
          <p className="text-gray-500">
            {filter === 'unread' ? 'Semua notifikasi sudah dibaca' : 'Belum ada notifikasi masuk'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 divide-y divide-gray-200">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 cursor-pointer transition-colors ${
                !notification.is_read 
                  ? 'bg-blue-50 hover:bg-blue-100' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type, notification.is_read)}
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <h4 className={`text-sm font-semibold ${
                        !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h4>
                      <p className={`mt-1 text-sm ${
                        !notification.is_read ? 'text-gray-800' : 'text-gray-600'
                      }`}>
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    
                    {!notification.is_read && (
                      <div className="flex-shrink-0 ml-4">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
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
  );
};

export default SimpleNotifications;