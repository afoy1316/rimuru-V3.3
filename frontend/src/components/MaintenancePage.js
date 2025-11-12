import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Wrench } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const MaintenancePage = () => {
  const [countdown, setCountdown] = useState(30);
  const [maintenanceData, setMaintenanceData] = useState({
    message: 'System sedang dalam maintenance.',
    estimated_completion: null
  });

  // Check status setiap 30 detik
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(`${API}/api/maintenance/status`);
        if (!response.data.enabled) {
          // Maintenance selesai, reload page
          window.location.href = '/';
        } else {
          setMaintenanceData({
            message: response.data.message,
            estimated_completion: response.data.estimated_completion
          });
        }
      } catch (error) {
        console.error('Error checking maintenance status:', error);
      }
    };

    // Check immediately
    checkStatus();

    // Then check every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/Rimuru_New.png" 
            alt="Rimuru Logo" 
            className="h-20 mx-auto mb-6"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          {/* Icon with Animation */}
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-blue-400 rounded-full opacity-20 animate-ping"></div>
              <div className="relative bg-blue-500 rounded-full p-6">
                <Wrench className="w-16 h-16 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Under Maintenance
          </h1>

          {/* Message */}
          <div className="mb-8">
            <p className="text-lg text-gray-600 leading-relaxed">
              {maintenanceData.message}
            </p>
          </div>

          {/* Estimated Completion */}
          {maintenanceData.estimated_completion && (
            <div className="mb-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 inline-block">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <p className="text-xs font-medium text-blue-800 uppercase">Estimated Completion</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {new Date(maintenanceData.estimated_completion).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Animated Illustration */}
          <div className="mb-8">
            <div className="flex justify-center items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>

          {/* Auto Refresh Info */}
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <p className="text-sm">
              Auto-refresh in <span className="font-bold text-blue-600">{countdown}s</span>
            </p>
          </div>

          {/* Manual Refresh Button */}
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Refresh Now
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Thank you for your patience 🙏
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
