import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Unlock, Shield, Clock, AlertTriangle, Download, Upload, Database, Save, RefreshCw, Trash2, CheckCircle, XCircle, Wrench } from 'lucide-react';

const DatabaseCleaner = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [showClientSection, setShowClientSection] = useState(false);
  const [showClientConfirm, setShowClientConfirm] = useState(false);
  const [clientDeleteResult, setClientDeleteResult] = useState(null);
  const navigate = useNavigate();

  // PIN Protection States
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [verifiedPin, setVerifiedPin] = useState(''); // Store verified PIN
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [lockMessage, setLockMessage] = useState('');
  const pinTimerRef = useRef(null);
  const unlockTimeRef = useRef(null);

  // Backup/Restore States
  const [backups, setBackups] = useState([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [showBackupSection, setShowBackupSection] = useState(false);
  const [restoreHistory, setRestoreHistory] = useState([]);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(null);
  const [showRestoreHistorySection, setShowRestoreHistorySection] = useState(false);

  // Maintenance Mode States
  const [maintenanceMode, setMaintenanceMode] = useState({
    enabled: false,
    message: 'System sedang dalam maintenance. Silakan coba lagi nanti.',
    estimated_completion: ''
  });
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [showMaintenanceSection, setShowMaintenanceSection] = useState(false);

  // Change PIN States
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [changePinData, setChangePinData] = useState({
    oldPin: '',
    newPin: '',
    confirmPin: ''
  });
  const [changePinError, setChangePinError] = useState('');
  const [changePinLoading, setChangePinLoading] = useState(false);

  const PIN_VALIDITY_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Initialize PIN check on mount - Super Admin Only
  useEffect(() => {
    const isSuperAdmin = localStorage.getItem('is_super_admin') === 'true';
    if (!isSuperAdmin) {
      setError('🚫 Akses Ditolak: Hanya Super Admin yang dapat mengakses halaman Database Cleaner');
      // Redirect after showing error
      const timer = setTimeout(() => navigate('/admin'), 3000);
      return () => clearTimeout(timer);
    }
  }, [navigate]);

  // Auto-lock timer
  useEffect(() => {
    if (isPinUnlocked && unlockTimeRef.current) {
      const updateTimer = () => {
        const elapsed = Date.now() - unlockTimeRef.current;
        const remaining = Math.max(0, PIN_VALIDITY_DURATION - elapsed);
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          handleAutoLock();
        }
      };

      pinTimerRef.current = setInterval(updateTimer, 1000);
      updateTimer();

      return () => {
        if (pinTimerRef.current) {
          clearInterval(pinTimerRef.current);
        }
      };
    }
  }, [isPinUnlocked]);

  const handleAutoLock = () => {
    setIsPinUnlocked(false);
    setVerifiedPin(''); // Clear verified PIN
    setTimeRemaining(0);
    unlockTimeRef.current = null;
    setLockMessage('Sesi telah berakhir. Silakan masukkan PIN kembali.');
    setTimeout(() => setLockMessage(''), 3000);
    if (pinTimerRef.current) {
      clearInterval(pinTimerRef.current);
    }
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVerifyPin = async () => {
    if (!pinInput || pinInput.length !== 6) {
      setPinError('PIN harus 6 digit');
      return;
    }

    setPinLoading(true);
    setPinError('');

    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/database-cleaner/verify-pin`,
        { pin: pinInput },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setIsPinUnlocked(true);
      setVerifiedPin(pinInput); // Store verified PIN for later use
      setShowPinModal(false);
      setPinInput('');
      unlockTimeRef.current = Date.now();
      setLockMessage('');
    } catch (err) {
      setPinError(err.response?.data?.detail || 'PIN salah. Silakan coba lagi.');
    } finally {
      setPinLoading(false);
    }
  };

  const requestPinForAction = (action) => {
    if (!isPinUnlocked) {
      setShowPinModal(true);
      return false;
    }
    return true;
  };

  const handleChangePin = async () => {
    // Validate inputs
    if (!changePinData.oldPin || !changePinData.newPin || !changePinData.confirmPin) {
      setChangePinError('Semua field harus diisi');
      return;
    }

    if (changePinData.newPin.length !== 6 || !/^\d+$/.test(changePinData.newPin)) {
      setChangePinError('PIN baru harus 6 digit angka');
      return;
    }

    if (changePinData.newPin !== changePinData.confirmPin) {
      setChangePinError('PIN baru dan konfirmasi tidak sama');
      return;
    }

    if (changePinData.newPin === changePinData.oldPin) {
      setChangePinError('PIN baru harus berbeda dengan PIN lama');
      return;
    }

    setChangePinLoading(true);
    setChangePinError('');

    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/database-cleaner/change-pin`,
        {
          old_pin: changePinData.oldPin,
          new_pin: changePinData.newPin,
          confirm_pin: changePinData.confirmPin
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Success - lock and clear session
      setIsPinUnlocked(false);
      setVerifiedPin('');
      setShowChangePinModal(false);
      setChangePinData({ oldPin: '', newPin: '', confirmPin: '' });
      setLockMessage('✅ PIN berhasil diubah! Silakan login ulang dengan PIN baru.');
      setTimeout(() => setLockMessage(''), 5000);

      // Clear timer
      if (pinTimerRef.current) {
        clearInterval(pinTimerRef.current);
      }
      unlockTimeRef.current = null;
      setTimeRemaining(0);

    } catch (err) {
      setChangePinError(err.response?.data?.detail || 'Gagal mengubah PIN. Silakan coba lagi.');
    } finally {
      setChangePinLoading(false);
    }
  };

  // Maintenance Mode Functions
  const fetchMaintenanceStatus = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/maintenance/status`);
      setMaintenanceMode({
        enabled: response.data.enabled,
        message: response.data.message || 'System sedang dalam maintenance.',
        estimated_completion: response.data.estimated_completion || ''
      });
    } catch (err) {
      console.error('Error fetching maintenance status:', err);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!isPinUnlocked) {
      setShowPinModal(true);
      return;
    }

    const action = maintenanceMode.enabled ? 'menonaktifkan' : 'mengaktifkan';
    if (!window.confirm(`Yakin ingin ${action} maintenance mode?`)) {
      return;
    }

    setMaintenanceLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/maintenance/toggle`,
        {
          enabled: !maintenanceMode.enabled,
          message: maintenanceMode.message,
          estimated_completion: maintenanceMode.estimated_completion || null
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await fetchMaintenanceStatus();
      setLockMessage(`✅ Maintenance mode berhasil ${action}!`);
      setTimeout(() => setLockMessage(''), 3000);
    } catch (err) {
      console.error('Error toggling maintenance:', err);
      setError(err.response?.data?.detail || 'Gagal mengubah maintenance mode');
      setTimeout(() => setError(null), 5000);
    } finally {
      setMaintenanceLoading(false);
    }
  };

  useEffect(() => {
    if (showMaintenanceSection && isPinUnlocked) {
      fetchMaintenanceStatus();
    }
  }, [showMaintenanceSection, isPinUnlocked]);

  // Backup/Restore Functions
  const fetchBackups = async () => {
    if (!isPinUnlocked) {
      setShowPinModal(true);
      return;
    }

    setBackupsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/database/backups`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setBackups(response.data.backups || []);
    } catch (err) {
      console.error('Error fetching backups:', err);
      setError('Gagal mengambil daftar backup');
    } finally {
      setBackupsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!isPinUnlocked) {
      setShowPinModal(true);
      return;
    }

    setBackupInProgress(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/database/backup`,
        { pin: verifiedPin },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setLockMessage('✅ Backup berhasil dibuat!');
      setTimeout(() => setLockMessage(''), 3000);
      
      // Auto expand backup section and refresh
      setShowBackupSection(true);
      await fetchBackups();
    } catch (err) {
      console.error('Error creating backup:', err);
      setError(err.response?.data?.detail || 'Gagal membuat backup');
      setTimeout(() => setError(null), 5000);
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleDownloadBackup = async (backupId, filename) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/database/backup/${backupId}/download`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setLockMessage('✅ Backup berhasil didownload!');
      setTimeout(() => setLockMessage(''), 3000);
    } catch (err) {
      console.error('Error downloading backup:', err);
      setError('Gagal download backup');
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (!window.confirm('Yakin ingin menghapus backup ini?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/database/backup/${backupId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: { pin: verifiedPin }
        }
      );

      setLockMessage('✅ Backup berhasil dihapus!');
      setTimeout(() => setLockMessage(''), 3000);
      
      // Refresh backup list
      await fetchBackups();
    } catch (err) {
      console.error('Error deleting backup:', err);
      setError(err.response?.data?.detail || 'Gagal menghapus backup');
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    if (!window.confirm('⚠️ PERINGATAN: Restore akan menghapus semua data saat ini dan menggantinya dengan data dari backup. Yakin ingin melanjutkan?')) {
      return;
    }

    setRestoreLoading(true);
    setShowRestoreModal(false); // Close confirmation modal
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/database/restore`,
        {
          backup_id: selectedBackup.backup_id,
          pin: verifiedPin
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Show success
      setRestoreSuccess({
        success: true,
        backup_id: selectedBackup.backup_id,
        results: response.data.results
      });
      
      setSelectedBackup(null);
      
      // Reload after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (err) {
      console.error('Error restoring backup:', err);
      setRestoreSuccess({
        success: false,
        error: err.response?.data?.detail || 'Gagal restore database'
      });
      setRestoreLoading(false);
    }
  };

  const fetchRestoreHistory = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/database/restore-history`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setRestoreHistory(response.data.history || []);
    } catch (err) {
      console.error('Error fetching restore history:', err);
    }
  };

  useEffect(() => {
    if (showBackupSection && isPinUnlocked) {
      fetchBackups();
    }
  }, [showBackupSection, isPinUnlocked]);

  useEffect(() => {
    if (showRestoreHistorySection && isPinUnlocked) {
      fetchRestoreHistory();
    }
  }, [showRestoreHistorySection, isPinUnlocked]);

  useEffect(() => {
    if (showClientSection) {
      fetchClients();
    }
  }, [showClientSection]);

  const fetchClients = async () => {
    setClientsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/clients-list`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setClients(response.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to fetch clients list');
    } finally {
      setClientsLoading(false);
    }
  };

  const handleSelectClient = (clientId) => {
    setSelectedClients(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  };

  const handleSelectAllClients = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map(c => c.id));
    }
  };

  const handleDeleteClients = async () => {
    // Check PIN first
    if (!requestPinForAction('delete')) {
      return;
    }

    if (selectedClients.length === 0) {
      setError('Please select at least one client to delete');
      return;
    }

    setLoading(true);
    setError(null);
    setClientDeleteResult(null);

    try {
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        throw new Error('No admin token found. Please login first.');
      }

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/delete-clients`,
        {
          client_ids: selectedClients,
          pin: verifiedPin // Use stored verified PIN
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setClientDeleteResult(response.data);
      setShowClientConfirm(false);
      setSelectedClients([]);
      
      // Refresh client list
      setTimeout(() => {
        fetchClients();
      }, 2000);

    } catch (err) {
      console.error('Error deleting clients:', err);
      
      if (err.response?.status === 403) {
        setError('Access denied. Only super admin can delete clients.');
      } else if (err.response?.status === 401) {
        setError('Unauthorized. Please login again.');
        setTimeout(() => navigate('/admin/login'), 2000);
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to delete clients');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        throw new Error('No admin token found. Please login first.');
      }

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/clear-database`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setResult(response.data);
      setShowConfirm(false);
      
      // Show success and reload after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (err) {
      console.error('Error clearing database:', err);
      
      if (err.response?.status === 403) {
        setError('Access denied. Only super admin can clear database.');
      } else if (err.response?.status === 401) {
        setError('Unauthorized. Please login again.');
        setTimeout(() => navigate('/admin/login'), 2000);
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to clear database');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Access Denied Error for Non-Super Admin */}
        {error && error.includes('🚫') && (
          <div className="mb-6 bg-red-50 border-2 border-red-500 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-red-800">{error}</h3>
                <p className="mt-2 text-sm text-red-600">Anda akan dialihkan ke dashboard dalam beberapa detik...</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Kembali ke Dashboard
            </button>
          </div>
        )}

        {/* PIN Status Indicator - Only show for Super Admin */}
        {!error || !error.includes('🚫') ? (
          <div className="mb-6">
            <div className={`flex items-center justify-between p-4 rounded-lg ${
              isPinUnlocked ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
            }`}>
            <div className="flex items-center space-x-3">
              {isPinUnlocked ? (
                <>
                  <Unlock className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">PIN Terverifikasi</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      Sisa waktu: {formatTime(timeRemaining)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Lock className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">PIN Terkunci</p>
                    <p className="text-xs text-red-600">Masukkan PIN untuk mengakses fitur delete</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!isPinUnlocked && (
                <button
                  onClick={() => setShowPinModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Unlock</span>
                </button>
              )}
              {isPinUnlocked && (
                <>
                  <button
                    onClick={() => setShowChangePinModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Ganti PIN</span>
                  </button>
                  <button
                    onClick={handleAutoLock}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    Lock
                  </button>
                </>
              )}
            </div>
          </div>
          {lockMessage && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {lockMessage}
            </div>
          )}
        </div>
        ) : null}

        {/* Main Content - Only show for Super Admin */}
        {!error || !error.includes('🚫') ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-red-600 mb-2">⚠️ Database Cleaner</h1>
              <p className="text-gray-600">Super Admin Only - Use with Caution</p>
            </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>This action will permanently delete:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All top-up requests (Account & Wallet)</li>
                  <li>All transactions</li>
                  <li>All ad accounts</li>
                  <li>All transfer & withdraw requests</li>
                  <li>All notifications</li>
                  <li>All payment proofs</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Data yang TIDAK akan terhapus:</h3>
              <div className="mt-2 text-sm text-green-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>✅ User login data (clients)</li>
                  <li>✅ Admin login data</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {!showConfirm && (
          <div className="text-center">
            <button
              onClick={() => {
                if (!isPinUnlocked) {
                  setShowPinModal(true);
                  return;
                }
                setShowConfirm(true);
              }}
              disabled={!isPinUnlocked}
              className={`font-bold py-3 px-8 rounded-lg transition duration-200 ${
                isPinUnlocked 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isPinUnlocked ? (
                'Clear Database'
              ) : (
                <span className="flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Unlock PIN untuk Clear Database
                </span>
              )}
            </button>
          </div>
        )}

        {showConfirm && !loading && !result && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <h3 className="text-lg font-bold text-red-800 mb-4">Are you absolutely sure?</h3>
            <p className="text-red-700 mb-6">
              Type <strong>DELETE</strong> to confirm this action. This cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleClearDatabase}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Yes, Delete All Data
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <p className="mt-4 text-gray-600">Clearing database...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <h3 className="font-bold mb-2">✅ Database Cleared Successfully!</h3>
            <div className="text-sm">
              <p className="mb-2"><strong>Deleted:</strong></p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                {Object.entries(result.deleted || {}).map(([col, count]) => (
                  count > 0 && <li key={col}>{col}: {count} documents</li>
                ))}
              </ul>
              <p className="mb-2"><strong>Preserved:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(result.preserved || {}).map(([col, count]) => (
                  <li key={col}>{col}: {count} documents</li>
                ))}
              </ul>
              <p className="mt-4 text-green-600">Page will reload in 3 seconds...</p>
            </div>
          </div>
        )}

        {/* Client Deletion Section */}
        <div className="mt-8 pt-8 border-t border-gray-300">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Delete Specific Clients</h2>
          
          {!showClientSection && (
            <button
              onClick={() => setShowClientSection(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
            >
              Show Client List
            </button>
          )}

          {showClientSection && (
            <div>
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
                <p className="text-sm text-orange-700">
                  ⚠️ Deleting a client will also delete ALL their related data: accounts, transactions, top-ups, transfers, withdrawals, notifications, etc.
                </p>
              </div>

              {clientsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="mt-2 text-gray-600">Loading clients...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex justify-between items-center">
                    <button
                      onClick={handleSelectAllClients}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {selectedClients.length === clients.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-sm text-gray-600">
                      {selectedClients.length} of {clients.length} selected
                    </span>
                  </div>

                  <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg mb-4">
                    {clients.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">No clients found</p>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Select
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Username
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Email
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Wallet IDR
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Wallet USD
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {clients.map((client) => (
                            <tr key={client.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedClients.includes(client.id)}
                                  onChange={() => handleSelectClient(client.id)}
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {client.username}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {client.email}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {client.display_name || client.name || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                Rp {(client.wallet_balance_idr || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                ${(client.wallet_balance_usd || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {!showClientConfirm && selectedClients.length > 0 && (
                    <button
                      onClick={() => {
                        if (!isPinUnlocked) {
                          setShowPinModal(true);
                          return;
                        }
                        setShowClientConfirm(true);
                      }}
                      disabled={!isPinUnlocked}
                      className={`w-full font-bold py-3 px-6 rounded-lg transition duration-200 ${
                        isPinUnlocked 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isPinUnlocked ? (
                        `Delete ${selectedClients.length} Selected Client(s)`
                      ) : (
                        <span className="flex items-center justify-center">
                          <Lock className="w-4 h-4 mr-2" />
                          Unlock PIN untuk Delete
                        </span>
                      )}
                    </button>
                  )}

                  {showClientConfirm && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                      <h3 className="text-lg font-bold text-red-800 mb-4">Confirm Client Deletion</h3>
                      <p className="text-red-700 mb-6">
                        Are you sure you want to delete <strong>{selectedClients.length} client(s)</strong> and all their related data? This action cannot be undone.
                      </p>
                      <div className="flex space-x-4">
                        <button
                          onClick={handleDeleteClients}
                          disabled={loading}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
                        >
                          {loading ? 'Deleting...' : 'Yes, Delete Clients'}
                        </button>
                        <button
                          onClick={() => setShowClientConfirm(false)}
                          disabled={loading}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {clientDeleteResult && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4">
                      <h3 className="font-bold mb-2">✅ Clients Deleted Successfully!</h3>
                      <div className="text-sm">
                        <p className="mb-2">Deleted {clientDeleteResult.summary?.clients_deleted} client(s)</p>
                        <p className="mb-2"><strong>Related data deleted:</strong></p>
                        <ul className="list-disc list-inside space-y-1">
                          {Object.entries(clientDeleteResult.summary?.data_deleted || {}).map(([key, count]) => (
                            count > 0 && <li key={key}>{key}: {count}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Maintenance Mode Section */}
        <div className="mt-8 border-t-4 border-orange-500 pt-6">
          <button
            onClick={() => setShowMaintenanceSection(!showMaintenanceSection)}
            className="w-full flex items-center justify-between p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors mb-4"
          >
            <div className="flex items-center space-x-3">
              <Wrench className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-orange-800">Maintenance Mode</h2>
            </div>
            <span className="text-2xl text-orange-600">{showMaintenanceSection ? '−' : '+'}</span>
          </button>

          {showMaintenanceSection && (
            <div className="bg-orange-50 rounded-lg p-6">
              {/* Current Status */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold text-gray-800">Status:</span>
                  <span className={`px-4 py-2 rounded-lg font-bold ${
                    maintenanceMode.enabled 
                      ? 'bg-red-100 text-red-800 border-2 border-red-500' 
                      : 'bg-green-100 text-green-800 border-2 border-green-500'
                  }`}>
                    {maintenanceMode.enabled ? '🔴 AKTIF' : '🟢 NONAKTIF'}
                  </span>
                </div>
                
                <button
                  onClick={handleToggleMaintenance}
                  disabled={!isPinUnlocked || maintenanceLoading}
                  className={`px-6 py-3 rounded-lg font-bold transition-colors ${
                    !isPinUnlocked || maintenanceLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : maintenanceMode.enabled
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {maintenanceLoading ? 'Loading...' : (
                    maintenanceMode.enabled ? 'Nonaktifkan' : 'Aktifkan'
                  )}
                </button>
              </div>

              {/* Configuration */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Message
                  </label>
                  <textarea
                    value={maintenanceMode.message}
                    onChange={(e) => setMaintenanceMode(prev => ({ ...prev, message: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Pesan yang akan ditampilkan ke user..."
                    disabled={!isPinUnlocked}
                  />
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Completion (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={maintenanceMode.estimated_completion}
                    onChange={(e) => setMaintenanceMode(prev => ({ ...prev, estimated_completion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={!isPinUnlocked}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Perkiraan waktu selesai maintenance (akan ditampilkan ke user)
                  </p>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">⚠️ Peringatan:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Semua client TIDAK BISA login saat maintenance aktif</li>
                        <li>Client akan diarahkan ke halaman maintenance</li>
                        <li>Super Admin tetap bisa login untuk monitoring</li>
                        <li>Pastikan maintenance benar-benar diperlukan sebelum aktivasi</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Backup & Restore Section */}
        <div className="mt-8 border-t-4 border-blue-500 pt-6">
          <button
            onClick={() => setShowBackupSection(!showBackupSection)}
            className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors mb-4"
          >
            <div className="flex items-center space-x-3">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-blue-800">Backup & Restore Database</h2>
            </div>
            <span className="text-2xl text-blue-600">{showBackupSection ? '−' : '+'}</span>
          </button>

          {showBackupSection && (
            <div className="space-y-6">
              {/* Create Backup Button */}
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Create manual backup atau restore dari backup sebelumnya</p>
                <button
                  onClick={handleCreateBackup}
                  disabled={!isPinUnlocked || backupInProgress}
                  className={`px-6 py-3 rounded-lg font-bold transition-colors flex items-center space-x-2 ${
                    isPinUnlocked && !backupInProgress
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {backupInProgress ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Create Backup</span>
                    </>
                  )}
                </button>
              </div>

              {/* Backup History */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Backup History</h3>
                  <button
                    onClick={fetchBackups}
                    disabled={backupsLoading || !isPinUnlocked}
                    className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                  >
                    <RefreshCw className={`w-5 h-5 ${backupsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {backupsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading backups...</div>
                ) : backups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Belum ada backup. Buat backup pertama Anda!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {backups.map((backup) => (
                      <div key={backup.backup_id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col space-y-3">
                          {/* Header Info */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                  backup.backup_type === 'manual' ? 'bg-blue-100 text-blue-800' :
                                  backup.backup_type === 'scheduled' ? 'bg-green-100 text-green-800' :
                                  'bg-purple-100 text-purple-800'
                                }`}>
                                  {backup.backup_type}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {(backup.file_size / 1024 / 1024).toFixed(2)} MB
                                </span>
                                <span className="text-xs text-gray-500">
                                  {backup.collections_count} collections
                                </span>
                              </div>
                              <p className="text-sm font-mono text-gray-700">{backup.backup_id}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(backup.backup_date).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleDownloadBackup(backup.backup_id, backup.filename)}
                              className="flex-1 min-w-[120px] px-4 py-2 text-sm font-medium text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600 rounded transition-colors flex items-center justify-center space-x-2"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </button>
                            <button
                              onClick={() => {
                                if (!isPinUnlocked) {
                                  setShowPinModal(true);
                                  return;
                                }
                                setSelectedBackup(backup);
                                setShowRestoreModal(true);
                              }}
                              className={`flex-1 min-w-[120px] px-4 py-2 text-sm font-medium border rounded transition-colors flex items-center justify-center space-x-2 ${
                                isPinUnlocked 
                                  ? 'text-green-600 hover:text-white hover:bg-green-600 border-green-600' 
                                  : 'text-gray-400 border-gray-300 cursor-not-allowed'
                              }`}
                            >
                              <Upload className="w-4 h-4" />
                              <span>{isPinUnlocked ? 'Restore' : 'Locked'}</span>
                            </button>
                            <button
                              onClick={() => {
                                if (!isPinUnlocked) {
                                  setShowPinModal(true);
                                  return;
                                }
                                handleDeleteBackup(backup.backup_id);
                              }}
                              className={`flex-1 min-w-[120px] px-4 py-2 text-sm font-medium border rounded transition-colors flex items-center justify-center space-x-2 ${
                                isPinUnlocked 
                                  ? 'text-red-600 hover:text-white hover:bg-red-600 border-red-600' 
                                  : 'text-gray-400 border-gray-300 cursor-not-allowed'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>{isPinUnlocked ? 'Delete' : 'Locked'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Restore History Section */}
        <div className="mt-8 border-t-4 border-green-500 pt-6">
          <button
            onClick={() => setShowRestoreHistorySection(!showRestoreHistorySection)}
            className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors mb-4"
          >
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-green-800">Restore History</h2>
            </div>
            <span className="text-2xl text-green-600">{showRestoreHistorySection ? '−' : '+'}</span>
          </button>

          {showRestoreHistorySection && (
            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">Riwayat restore database</p>
                <button
                  onClick={fetchRestoreHistory}
                  className="text-green-600 hover:text-green-800"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              {restoreHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada restore yang dilakukan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {restoreHistory.map((restore, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                              Restore Completed
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            From Backup: <span className="font-mono">{restore.backup_id}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Backup Date: {new Date(restore.backup_date).toLocaleString('id-ID')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Restored At: {new Date(restore.restore_date).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      {/* Restored Collections */}
                      {restore.collections_restored && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">
                            Collections Restored: {restore.collections_restored.length}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {restore.collections_restored.map((col) => (
                              <span key={col} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Results Summary */}
                      {restore.results && restore.results.collections && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">Results:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(restore.results.collections).map(([col, result]) => (
                              <div key={col} className="flex items-center space-x-2">
                                {result.status === 'success' ? (
                                  <CheckCircle className={`w-3 h-3 ${
                                    result.inserted > 0 ? 'text-green-600' : 'text-gray-400'
                                  }`} />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-600" />
                                )}
                                <span className={
                                  result.status === 'success' 
                                    ? (result.inserted > 0 ? 'text-gray-600' : 'text-gray-400')
                                    : 'text-red-600'
                                }>
                                  {col}: {result.inserted || 0} docs
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-gray-600 hover:text-gray-800 underline"
          >
            ← Back to Dashboard
          </button>
        </div>
        </>
        ) : null}
      </div>

      {/* Restore Loading Modal */}
      {restoreLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-8">
            <div className="text-center">
              <RefreshCw className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Restoring Database...</h3>
              <p className="text-sm text-gray-600 mb-4">
                Mohon tunggu. Proses restore sedang berjalan.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ Jangan close atau refresh page!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Success/Error Modal */}
      {restoreSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
            {/* Header */}
            <div className={`px-6 py-4 rounded-t-xl ${
              restoreSuccess.success ? 'bg-green-600' : 'bg-red-600'
            }`}>
              <h3 className="text-lg font-semibold text-white flex items-center">
                {restoreSuccess.success ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Restore Berhasil!
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 mr-2" />
                    Restore Gagal!
                  </>
                )}
              </h3>
            </div>

            {/* Body */}
            <div className="p-6">
              {restoreSuccess.success ? (
                <>
                  <p className="text-gray-700 mb-4">
                    Database berhasil di-restore dari backup: <span className="font-mono font-semibold">{restoreSuccess.backup_id}</span>
                  </p>

                  {restoreSuccess.results && restoreSuccess.results.collections && (
                    <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <p className="text-sm font-medium text-gray-700 mb-3">Collections Restored:</p>
                      <div className="space-y-2">
                        {Object.entries(restoreSuccess.results.collections).map(([col, result]) => (
                          <div key={col} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{col}</span>
                            <div className="flex items-center space-x-2">
                              {result.status === 'success' ? (
                                <>
                                  <span className={`font-medium ${
                                    result.inserted > 0 ? 'text-green-600' : 'text-gray-500'
                                  }`}>
                                    {result.inserted} docs
                                  </span>
                                  <CheckCircle className={`w-4 h-4 ${
                                    result.inserted > 0 ? 'text-green-600' : 'text-gray-400'
                                  }`} />
                                </>
                              ) : (
                                <>
                                  <span className="text-red-600 text-xs">{result.error || 'Failed'}</span>
                                  <XCircle className="w-4 h-4 text-red-600" />
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      Page akan reload dalam 3 detik...
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-red-600 mb-4">
                    {restoreSuccess.error}
                  </p>
                  <button
                    onClick={() => setRestoreSuccess(null)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Tutup
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Verifikasi PIN
                </h3>
                <button
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput('');
                    setPinError('');
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  Masukkan PIN 6 digit untuk mengakses fitur Database Cleaner.
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-800 ml-2">
                      <span className="font-semibold">Peringatan:</span> PIN akan berlaku selama 5 menit setelah verifikasi.
                    </p>
                  </div>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN (6 digit)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setPinInput(value);
                    setPinError('');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyPin();
                    }
                  }}
                  placeholder="••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                  autoFocus
                />
                
                {pinError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {pinError}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput('');
                  setPinError('');
                }}
                disabled={pinLoading}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleVerifyPin}
                disabled={pinLoading || pinInput.length !== 6}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2 disabled:opacity-50"
              >
                {pinLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifikasi...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Verifikasi PIN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change PIN Modal */}
      {showChangePinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="bg-purple-600 text-white px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Ganti PIN Database Cleaner
                </h3>
                <button
                  onClick={() => {
                    setShowChangePinModal(false);
                    setChangePinData({ oldPin: '', newPin: '', confirmPin: '' });
                    setChangePinError('');
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800 ml-2">
                      <span className="font-semibold">Info:</span> Setelah PIN diubah, Anda akan otomatis logout dan harus login ulang dengan PIN baru.
                    </p>
                  </div>
                </div>

                {/* Old PIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN Lama
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={changePinData.oldPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setChangePinData(prev => ({ ...prev, oldPin: value }));
                      setChangePinError('');
                    }}
                    placeholder="••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-xl tracking-widest"
                  />
                </div>

                {/* New PIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN Baru (6 digit)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={changePinData.newPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setChangePinData(prev => ({ ...prev, newPin: value }));
                      setChangePinError('');
                    }}
                    placeholder="••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-xl tracking-widest"
                  />
                </div>

                {/* Confirm New PIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konfirmasi PIN Baru
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={changePinData.confirmPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setChangePinData(prev => ({ ...prev, confirmPin: value }));
                      setChangePinError('');
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleChangePin();
                      }
                    }}
                    placeholder="••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-xl tracking-widest"
                  />
                </div>
                
                {changePinError && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {changePinError}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowChangePinModal(false);
                  setChangePinData({ oldPin: '', newPin: '', confirmPin: '' });
                  setChangePinError('');
                }}
                disabled={changePinLoading}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleChangePin}
                disabled={changePinLoading || !changePinData.oldPin || !changePinData.newPin || !changePinData.confirmPin}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium flex items-center space-x-2 disabled:opacity-50"
              >
                {changePinLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Mengubah...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Ganti PIN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
            {/* Header */}
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Restore Database
                </h3>
                <button
                  onClick={() => {
                    setShowRestoreModal(false);
                    setSelectedBackup(null);
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="mb-4">
                <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm font-semibold text-red-800 mb-2">
                        ⚠️ PERINGATAN PENTING!
                      </p>
                      <p className="text-xs text-red-700">
                        Restore akan <strong>menghapus semua data saat ini</strong> dan menggantinya dengan data dari backup. Tindakan ini tidak dapat dibatalkan!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <h4 className="font-semibold text-gray-800 mb-3">Backup Details:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <p className="text-gray-600">Backup ID:</p>
                    <p className="font-mono text-gray-900">{selectedBackup.backup_id}</p>
                    
                    <p className="text-gray-600">Date:</p>
                    <p className="text-gray-900">{new Date(selectedBackup.backup_date).toLocaleString('id-ID')}</p>
                    
                    <p className="text-gray-600">Type:</p>
                    <p className="text-gray-900 capitalize">{selectedBackup.backup_type}</p>
                    
                    <p className="text-gray-600">Collections:</p>
                    <p className="text-gray-900">{selectedBackup.collections_count}</p>
                    
                    <p className="text-gray-600">Documents:</p>
                    <p className="text-gray-900">{selectedBackup.total_documents || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setSelectedBackup(null);
                }}
                disabled={loading}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleRestoreBackup}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Restore Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseCleaner;
