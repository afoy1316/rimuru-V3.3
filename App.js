import React, { useState, useEffect, useCallback, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import "./App.css";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import MerchantOrders from "./components/MerchantOrders";
import MerchantProducts from "./components/MerchantProducts";
import AdminLogin from "./components/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./components/admin/AdminDashboard";
import ClientManagement from "./components/admin/ClientManagement";
import ClientDetail from "./components/admin/ClientDetail";
import ClientEdit from "./components/admin/ClientEdit";
import AdminManagement from "./components/admin/AdminManagement";
import AdminProfile from "./components/admin/AdminProfile";
import RequestManagement from "./components/admin/RequestManagement";
import ShareRequestManagement from "./components/admin/ShareRequestManagement";
import TransferRequestManagement from "./components/admin/TransferRequestManagement";
import AccountManagement from "./components/admin/AccountManagement";
import WalletTopUpManagement from "./components/admin/WalletTopUpManagement";
import AdAccountTopUpManagement from "./components/admin/AdAccountTopUpManagement";
import WithdrawManagement from "./components/admin/WithdrawManagement";
import FinancialReports from "./components/admin/FinancialReports";
import DatabaseCleaner from "./components/admin/DatabaseCleaner";
import SuperAdminApproval from "./components/admin/SuperAdminApproval";
import LandingPageManagement from "./components/admin/LandingPageManagement";
import AdCopyManagement from "./components/admin/AdCopyManagement";
import ShareAccount from "./components/ShareAccount";
import SimpleNotifications from "./components/SimpleNotifications";
import PaymentConfirmation from "./components/PaymentConfirmation";
import WalletUploadProof from "./components/WalletUploadProof";
import MaintenancePage from "./components/MaintenancePage";
import LandingPageViewer from "./components/LandingPageViewer";
import OrderTracking from "./components/OrderTracking";
import { LanguageProvider } from "./contexts/LanguageContext";
// Notification banner removed as per user request
import notificationService from "./services/NotificationService";
import notificationNavigationService from "./services/NotificationNavigationService";
import notificationSoundService from "./services/NotificationSoundService";
import { Toaster, toast } from "sonner";
import { Toaster as HotToaster } from "react-hot-toast";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Setup axios interceptor for auth
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Initialize NotificationService globally
window.notificationService = notificationService;

// Initialize NotificationNavigationService globally
window.notificationNavigationService = notificationNavigationService;

// Initialize NotificationSoundService globally
window.notificationSoundService = notificationSoundService;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);

  // Setup axios response interceptor for session expiry handling
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle session expiry (401 Unauthorized)
        if (error.response?.status === 401) {
          const url = error.config?.url || '';
          
          // Skip login/register endpoints (these are expected to return 401)
          if (url.includes('/auth/login') || url.includes('/auth/register') || 
              url.includes('/admin/auth/login')) {
            return Promise.reject(error);
          }
          
          // Session has expired - show clear message and logout
          console.log('Session expired, logging out user');
          
          // Show toast notification
          toast.error('Session habis, silakan login kembali', {
            duration: 4000,
            position: 'top-center',
          });
          
          // Clear authentication data
          localStorage.removeItem('token');
          localStorage.removeItem('admin_token');
          
          // Redirect to appropriate login page after short delay
          setTimeout(() => {
            if (window.location.pathname.includes('/admin')) {
              window.location.href = '/admin/login';
            } else {
              window.location.href = '/';
            }
          }, 1000);
          
          // Return a rejected promise with a clear message (prevents component error messages)
          return Promise.reject(new Error('Session expired'));
        }
        
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on component unmount
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      // If token exists in localStorage, trust it - don't make API call that could fail
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      
      // Optional: Try to verify in background but don't logout on error
      try {
        await axios.get(`${API}/auth/me`);
        console.log('Auth check successful');
      } catch (error) {
        // DO NOT logout on any error - keep user logged in
        console.warn('Auth check failed but keeping session:', error.message);
        // User stays logged in regardless of API response
      }
      // Inactivity timer will be started by useEffect when isAuthenticated changes to true
    }
    setLoading(false);
  };

  const handleLogin = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password
      });
      
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      // Check if it's a maintenance mode error (503)
      if (error.response?.status === 503) {
        // Re-throw the error so LoginPage can handle the redirect
        throw error;
      }
      
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const handleRegister = async (username, name, company_name, phone_number, address, city, province, email, password) => {
    try {
      const response = await axios.post(`${API}/auth/register`, {
        username,
        name,
        company_name,
        phone_number,
        address,
        city,
        province,
        email,
        password
      });
      
      return { success: true, message: 'Registration successful! Please login.' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  // Auto-logout configuration
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  const lastActivityRef = useRef(Date.now());

  const handleLogout = useCallback(() => {
    // Clear inactivity timer when logging out
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  }, []);

  const checkInactivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
      toast.error("Sesi berakhir karena tidak ada aktivitas selama 30 menit. Silakan login kembali.");
      handleLogout();
    } else {
      // Schedule next check
      const remainingTime = INACTIVITY_TIMEOUT - timeSinceLastActivity;
      inactivityTimerRef.current = setTimeout(checkInactivity, remainingTime);
    }
  }, [handleLogout]);

  const resetInactivityTimer = useCallback(() => {
    // Update last activity timestamp
    lastActivityRef.current = Date.now();
    
    // Only reset timer if it's not already running or if authenticated
    if (!inactivityTimerRef.current && isAuthenticated) {
      inactivityTimerRef.current = setTimeout(checkInactivity, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated, checkInactivity]);

  // Track user activity for inactivity-based auto-logout
  useEffect(() => {
    if (!isAuthenticated) return;

    // Throttled activity handler to avoid too many calls
    let throttleTimeout = null;
    const throttledActivityHandler = () => {
      if (!throttleTimeout) {
        lastActivityRef.current = Date.now();
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 1000); // Throttle to max once per second
      }
    };

    // Activity events to monitor
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, throttledActivityHandler, false);
    });

    // Initialize timer when user becomes authenticated
    lastActivityRef.current = Date.now();
    inactivityTimerRef.current = setTimeout(checkInactivity, INACTIVITY_TIMEOUT);

    // Cleanup when component unmounts or user logs out
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledActivityHandler, false);
      });
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [isAuthenticated, checkInactivity]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <div className="App">
        {/* Notification banner removed as per user request */}
        
        <BrowserRouter>
          <Routes>
            {/* Maintenance Page Route - Public */}
            <Route path="/maintenance" element={<MaintenancePage />} />
            
            {/* Order Tracking - Public */}
            <Route path="/track-order" element={<OrderTracking />} />
            
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
                )
              }
            />
            <Route
              path="/dashboard/*"
              element={
                isAuthenticated ? (
                  <Dashboard onLogout={handleLogout} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="clients" element={<ClientManagement />} />
              <Route path="clients/:id" element={<ClientDetail />} />
              <Route path="clients/:id/edit" element={<ClientEdit />} />
              <Route path="requests" element={<RequestManagement />} />
              <Route path="share-requests" element={<ShareRequestManagement />} />
              <Route path="transfer-requests" element={<TransferRequestManagement />} />
              <Route path="wallet-topup-management" element={<WalletTopUpManagement />} />
              <Route path="account-topup-management" element={<AdAccountTopUpManagement />} />
              <Route path="accounts" element={<AccountManagement />} />
              <Route path="withdraws" element={<WithdrawManagement />} />
              <Route path="financial-reports" element={<FinancialReports />} />
              <Route path="admins" element={<AdminManagement />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="super-admin-approval" element={<SuperAdminApproval />} />
              <Route path="landing-pages" element={<LandingPageManagement />} />
              <Route path="ad-copies" element={<AdCopyManagement />} />
              <Route path="database-cleaner" element={<DatabaseCleaner />} />
              <Route 
                path="notifications" 
                element={
                  <div className="p-6">
                    <SimpleNotifications isAdmin={true} />
                  </div>
                } 
              />
            </Route>
            
            {/* Public Landing Page Viewer - Must be AFTER admin and dashboard routes */}
            <Route path="/:slug" element={<LandingPageViewer />} />
            
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" expand={true} richColors />
        <HotToaster position="top-right" />
      </div>
    </LanguageProvider>
  );
}

export default App;