import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import NotificationBell from './NotificationBell';
import NotificationStatus from '../NotificationStatus';
import { useRealTimeNotifications } from '../../hooks/useRealTimeNotifications';
import notificationNavigationService from '../../services/NotificationNavigationService';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Share,
  ArrowRightLeft,
  Settings, 
  User, 
  LogOut,
  Menu,
  X,
  CreditCard,
  Banknote,
  Wallet,
  Shield
} from 'lucide-react';
import rimuruLogo from '../../assets/rimuru-logo.png';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const AdminLayout = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Set up notification navigation service with React Router navigate
  useEffect(() => {
    notificationNavigationService.setNavigate(navigate);
    return () => {
      notificationNavigationService.setNavigate(null);
    };
  }, [navigate]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({
    'Transaksi': true,
    'Permintaan': true
  });

  // Real-time notifications
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestNotificationPermission,
    isNotificationSupported,
    isNotificationEnabled,
    permissionStatus
  } = useRealTimeNotifications('admin');

  useEffect(() => {
    checkAdminAuth();
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  const checkAdminAuth = async () => {
    const token = localStorage.getItem('admin_token');
    const userType = localStorage.getItem('user_type');
    
    if (!token || userType !== 'admin') {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await axios.get(`${API}/api/admin/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminData(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('user_type');
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user_type');
    toast.success(t('logoutSuccess'));
    navigate('/admin/login');
  };

  const menuItems = [
    {
      name: t('adminDashboard'),
      path: '/admin/dashboard',
      icon: BarChart3
    },
    {
      name: t('clientManagement'),
      path: '/admin/clients',
      icon: Users
    },
    {
      group: 'Transaksi',
      items: [
        {
          name: 'Wallet Top Up',
          path: '/admin/wallet-topup-management',
          icon: Wallet
        },
        {
          name: 'Top Up Akun',
          path: '/admin/account-topup-management',
          icon: CreditCard
        },
        {
          name: 'Transfer Wallet',
          path: '/admin/transfer-requests',
          icon: ArrowRightLeft
        },
        {
          name: t('withdrawManagement'),
          path: '/admin/withdraws',
          icon: Banknote
        }
      ]
    },
    {
      group: 'Permintaan',
      items: [
        {
          name: t('requestManagement'),
          path: '/admin/requests', 
          icon: FileText
        },
        {
          name: t('shareRequestManagement'),
          path: '/admin/share-requests',
          icon: Share
        },
        {
          name: t('accountManagement'),
          path: '/admin/accounts',
          icon: Users
        }
      ]
    },
    {
      name: t('financialReports') || 'Laporan',
      path: '/admin/financial-reports',
      icon: BarChart3
    },
    {
      name: 'Landing Pages',
      path: '/admin/landing-pages',
      icon: FileText
    },
    {
      name: 'Ad Copy Management',
      path: '/admin/ad-copies',
      icon: FileText
    },
    ...(adminData?.is_super_admin ? [
      {
        name: 'Super Admin',
        path: '/admin/super-admin-approval',
        icon: Shield,
        highlight: true
      },
      {
        name: t('adminManagement'),
        path: '/admin/admins',
        icon: Settings
      }
    ] : []),
    {
      name: t('adminProfile'),
      path: '/admin/profile',
      icon: User
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-gray-200 flex flex-col`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center min-w-0">
            <img 
              src={rimuruLogo} 
              alt="Rimuru" 
              className="h-8 w-8 mr-3 flex-shrink-0 object-contain"
            />
            <span className="text-xl font-bold text-gray-800 truncate">Rimuru Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="mt-6 px-3 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="space-y-1">
            {menuItems.map((item, index) => {
              // Handle grouped items
              if (item.group) {
                const isExpanded = expandedGroups[item.group];
                return (
                  <div key={`group-${index}`} className="mb-2">
                    <button
                      onClick={() => setExpandedGroups({...expandedGroups, [item.group]: !isExpanded})}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors uppercase tracking-wider"
                    >
                      <span>{item.group}</span>
                      <span className="text-gray-400">{isExpanded ? '−' : '+'}</span>
                    </button>
                    {isExpanded && (
                      <div className="space-y-0.5 ml-2">
                        {item.items.map((subItem) => {
                          const isActive = location.pathname === subItem.path;
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={`${
                                isActive
                                  ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-700'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                              } group flex items-center px-3 py-2 text-sm font-medium rounded-r-lg transition-all`}
                            >
                              <subItem.icon className={`${
                                isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                              } mr-3 h-4 w-4 flex-shrink-0`} />
                              <span className="truncate text-xs">{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Handle regular menu items
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${
                    isActive
                      ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                  } ${
                    item.highlight ? 'bg-gradient-to-r from-amber-50 to-transparent' : ''
                  } group flex items-center px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all`}
                >
                  <item.icon className={`${
                    isActive ? 'text-blue-600' : item.highlight ? 'text-amber-500' : 'text-gray-500 group-hover:text-gray-700'
                  } mr-3 h-5 w-5 flex-shrink-0`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Admin Info at Bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center text-gray-700 min-w-0">
            <User className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
            <span className="text-sm truncate">{adminData?.username || 'Admin'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <NotificationStatus />
                {/* Notification Bell */}
                <NotificationBell />

                {/* Client Dashboard Link */}
                <Link
                  to="/"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  {t('clientDashboard')}
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Notification banner removed as per user request */}

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;