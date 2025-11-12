import React, { useState, useEffect } from "react";
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { handleApiError } from "../utils/errorHandler";
import DashboardHome from "./DashboardHome";
import RequestAccount from "./RequestAccount";
import TopUp from "./TopUp";
import WalletTopUp from "./WalletTopUp";
import Transactions from "./Transactions";
import Withdraw from "./Withdraw";
import Profile from "./Profile";
import ClientNotificationBell from "./ClientNotificationBell";
import ShareAccount from "./ShareAccount";
import PaymentConfirmation from "./PaymentConfirmation";
import PaymentHistory from "./PaymentHistory";
import NotificationTest from "./NotificationTest";
import NotificationStatus from "./NotificationStatus";
import AccountManagement from "./AccountManagement";
import SimpleNotifications from "./SimpleNotifications";
import WalletDropdownSidebar from "./WalletDropdownSidebar";
import WalletStatement from "./WalletStatement";
import WalletUploadProof from "./WalletUploadProof";
import LandingPageBuilder from "./LandingPageBuilder";
import AdCopyGenerator from "./AdCopyGenerator";
import MerchantOrders from "./MerchantOrders";
import MerchantProducts from "./MerchantProducts";
import ResiGenerator from "./ResiGenerator";
import { useRealTimeNotifications } from "../hooks/useRealTimeNotifications";
import notificationNavigationService from "../services/NotificationNavigationService";
import rimuruLogo from "../assets/rimuru-logo.png";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ onLogout }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Track previous location to detect profile page navigation
  const [prevLocation, setPrevLocation] = useState(null);

  // Set up notification navigation service with React Router navigate
  useEffect(() => {
    notificationNavigationService.setNavigate(navigate);
    return () => {
      notificationNavigationService.setNavigate(null);
    };
  }, [navigate]);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profilePictureBlob, setProfilePictureBlob] = useState(null);
  const [loadingProfilePicture, setLoadingProfilePicture] = useState(false);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [sidebarOpen]);

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
  } = useRealTimeNotifications('client');

  useEffect(() => {
    fetchUserData();
    fetchStats();
    
    // Set up interval to refresh user data every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchUserData();
    }, 30000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    if (user?.profile_picture) {
      fetchProfilePictureBlob(user.profile_picture);
    }
    return () => {
      // Cleanup blob URL on unmount
      if (profilePictureBlob) {
        URL.revokeObjectURL(profilePictureBlob);
      }
    };
  }, [user?.profile_picture]);
  
  // Re-fetch user data when route changes (e.g., coming back from profile page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUserData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Detect navigation from profile page and refresh user data
  useEffect(() => {
    if (prevLocation?.pathname === '/dashboard/profile' && location.pathname !== '/dashboard/profile') {
      // User just left profile page, refresh data
      console.log('Refreshing user data after leaving profile page');
      fetchUserData();
    }
    setPrevLocation(location);
  }, [location]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      // Session expiry is handled by global interceptor with clear message
      handleApiError(error, toast, "Failed to load user data");
    }
  };

  const fetchStats = async (retryCount = 0) => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`, { timeout: 15000 });
      setStats(response.data);
      localStorage.setItem('cached_stats', JSON.stringify(response.data));
    } catch (error) {
      // Silent retry 3 times
      if (retryCount < 3) {
        const delay = 1000 * Math.pow(2, retryCount);
        setTimeout(() => fetchStats(retryCount + 1), delay);
      } else {
        // Load from cache - NO ERROR TOAST
        try {
          const cached = localStorage.getItem('cached_stats');
          if (cached) setStats(JSON.parse(cached));
          else setStats({ total_accounts: 0, pending_requests: 0, wallet_balance_idr: 0, wallet_balance_usd: 0 });
        } catch (e) {
          setStats({ total_accounts: 0, pending_requests: 0, wallet_balance_idr: 0, wallet_balance_usd: 0 });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfilePictureBlob = async (profilePicturePath) => {
    const token = localStorage.getItem('token');
    try {
      setLoadingProfilePicture(true);
      
      const url = `${BACKEND_URL}/api${profilePicturePath}`;
      
      const response = await axios.get(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        responseType: 'blob',
        timeout: 30000
      });
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Create blob URL
      const blobUrl = URL.createObjectURL(response.data);
      setProfilePictureBlob(blobUrl);
      setLoadingProfilePicture(false);
    } catch (error) {
      console.error('Error fetching profile picture:', error);
      setLoadingProfilePicture(false);
      setProfilePictureBlob(null);
    }
  };

  const handleLogout = () => {
    onLogout();
    toast.success(t('logoutSuccess') || 'Berhasil logout');
  };

  const menuItems = [
    {
      path: "/dashboard",
      name: t('dashboard'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14l-5-3-5 3V5z" />
        </svg>
      )
    },
    {
      path: "/dashboard/request-account",
      name: t('requestAccount'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      path: "/dashboard/kelola-akun",
      name: "Kelola Akun",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      )
    },
    {
      path: "/dashboard/share-account",
      name: t('shareAccount') || 'Share Account',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      )
    },
    {
      path: "/dashboard/topup",
      name: t('topUpBalance'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    {
      path: "/dashboard/topup/history",
      name: t('topUpHistory') || 'Riwayat Top Up',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      path: "/dashboard/wallet-statement",
      name: 'Wallet Statement',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      path: "/dashboard/transactions",
      name: t('transactions'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      path: "/dashboard/withdraw",
      name: t('withdraw'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      path: "/dashboard/landing-pages",
      name: "Landing Page Builder",
      badge: "BETA",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    {
      path: "/dashboard/ad-copy-generator",
      name: "Ad Copy Generator",
      badge: "NEW",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    /* ORDER MANAGEMENT MENU - HIDDEN FOR NOW */
    /* Uncomment these objects to enable Order Management menus
    {
      path: "/dashboard/orders",
      name: "Pesanan Saya",
      badge: "NEW",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      path: "/dashboard/products",
      name: "Produk Saya",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    */
    {
      path: "/dashboard/profile",
      name: t('profile') || 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    // Development only - Test Notifications
    ...(process.env.NODE_ENV === 'development' ? [{
      path: "/dashboard/test-notifications",
      name: "🔔 Test Notifikasi",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4.868 19.504a8 8 0 1113.132-13.132M15 17h5l-5 5v-5z" />
        </svg>
      )
    }] : [])
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden max-w-full">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0 overflow-hidden max-w-full
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
      >
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden" style={{ overscrollBehavior: 'contain' }}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <img 
                    src={rimuruLogo} 
                    alt="Rimuru Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">{t('appName')}</h2>
                  <p className="text-xs text-gray-500">Dashboard</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden flex-shrink-0"
                onClick={() => setSidebarOpen(false)}
                data-testid="close-sidebar-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-orange-50 flex-shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-semibold flex-shrink-0" style={{ backgroundColor: profilePictureBlob ? 'transparent' : '#0d9488' }}>
                {loadingProfilePicture ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : profilePictureBlob ? (
                  <img 
                    src={profilePictureBlob}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user?.username?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate" data-testid="user-username">{user?.username}</p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="mt-3">
              <WalletDropdownSidebar user={user} />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === "/dashboard" && location.pathname === "/dashboard/");
              
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
                    ${isActive 
                      ? 'bg-teal-100 text-teal-700 border-l-4 border-teal-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.icon}
                  <span className="font-medium flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-orange-400 to-yellow-400 text-white rounded-full shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Language Selector & Logout */}
          <div className="px-4 py-4 pb-6 border-t border-gray-200 flex-shrink-0 bg-white">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              data-testid="logout-button"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('logout')}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-full overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-2 sm:px-4 py-3 sm:py-4 flex-shrink-0 max-w-full overflow-hidden">
          <div className="flex items-center justify-between w-full max-w-full">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-1"
                onClick={() => setSidebarOpen(true)}
                data-testid="open-sidebar-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
              <h1 className="hidden sm:block text-xl font-semibold text-gray-900">{t('dashboard')}</h1>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-1 min-w-0">
              <div className="hidden sm:block">
                <NotificationStatus />
              </div>
              <ClientNotificationBell />
              <button
                onClick={onLogout}
                className="text-gray-500 hover:text-gray-700 p-1 sm:p-2 rounded transition-colors flex-shrink-0"
                title={t('logout') || 'Logout'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Notification banner removed as per user request */}

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <Routes>
            <Route 
              path="/" 
              element={<DashboardHome user={user} stats={stats} onRefresh={fetchStats} />} 
            />
            <Route 
              path="/request-account" 
              element={<RequestAccount onRefresh={fetchStats} />} 
            />
            <Route 
              path="/topup" 
              element={<WalletTopUp onRefresh={fetchStats} />} 
            />
            <Route 
              path="/topup/legacy" 
              element={<TopUp onRefresh={fetchStats} hideDisabledAccounts={true} />} 
            />
            <Route 
              path="/topup/confirmation/:requestId" 
              element={<PaymentConfirmation />} 
            />
            <Route 
              path="/topup/history" 
              element={<PaymentHistory />} 
            />
            <Route 
              path="/wallet-statement" 
              element={<WalletStatement />} 
            />
            <Route 
              path="/wallet/upload-proof/:requestId" 
              element={<WalletUploadProof />} 
            />
            <Route 
              path="/transactions" 
              element={<Transactions />} 
            />
            <Route 
              path="/withdraw" 
              element={<Withdraw onRefresh={fetchStats} />} 
            />
            <Route 
              path="/share-account" 
              element={<ShareAccount />} 
            />
            <Route 
              path="/profile" 
              element={<Profile />} 
            />
            <Route 
              path="/test-notifications" 
              element={<NotificationTest />} 
            />
            <Route 
              path="/kelola-akun" 
              element={<AccountManagement />} 
            />
            <Route 
              path="/notifications" 
              element={
                <div className="p-6">
                  <SimpleNotifications isAdmin={false} />
                </div>
              } 
            />
            <Route 
              path="/landing-pages" 
              element={<LandingPageBuilder />} 
            />
            <Route 
              path="/ad-copy-generator" 
              element={<AdCopyGenerator />} 
            />
            {/* ORDER MANAGEMENT ROUTES - HIDDEN FOR NOW */}
            {/* Uncomment these lines to enable Order Management
            <Route 
              path="/orders" 
              element={<MerchantOrders />} 
            />
            <Route 
              path="/products" 
              element={<MerchantProducts />} 
            />
            <Route 
              path="/resi-generator" 
              element={<ResiGenerator />} 
            />
            */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;