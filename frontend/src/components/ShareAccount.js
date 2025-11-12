import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';
import CustomDropdown from './ui/CustomDropdown';
import { Pagination } from './ui/Pagination';
import {
  Share,
  Facebook,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Eye,
  RefreshCw,
  ArrowRight,
  Mail,
  Building,
  Hash,
  Search,
  CheckSquare,
  Square,
  Users,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const ShareAccount = () => {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState([]);
  const [shareRequests, setShareRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Multi-step flow states
  const [currentStep, setCurrentStep] = useState(1); // 1: Select Accounts, 2: Share Method, 3: Monitor
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [shareRecipients, setShareRecipients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter functionality
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Share method form states for step 2 (using RequestAccount model)
  const [shareMethods, setShareMethods] = useState({
    facebook: { 
      delivery_method: '',
      recipients: [{ id: 1, value: '' }]
    },
    google: { 
      recipients: [{ id: 1, value: '' }]
    },
    tiktok: { 
      recipients: [{ id: 1, value: '' }]
    }
  });
  const [shareNotes, setShareNotes] = useState('');
  
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  // Legacy states (keeping for backward compatibility)
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [shareForm, setShareForm] = useState({
    target_bm_email: '',
    target_email: '',
    target_bc_id: '',
    notes: ''
  });
  const [showBulkShareModal, setShowBulkShareModal] = useState(false);
  const [selectedShareRequest, setSelectedShareRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [bulkShareForm, setBulkShareForm] = useState({
    target_bm_email: '',
    target_email: '',
    target_bc_id: '',
    notes: ''
  });
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Helper functions for platform-specific share methods
  const getShareMethodsForPlatform = (platform) => {
    switch (platform) {
      case 'facebook':
        return [
          { key: 'bm_id', label: t('bmId') || 'BM ID', placeholder: t('enterBmId') || 'Masukkan BM ID', type: 'text' },
          { key: 'email', label: t('email') || 'Email', placeholder: t('enterEmail') || 'Masukkan Email', type: 'email' }
        ];
      case 'google':
        return [
          { key: 'email', label: t('email') || 'Email', placeholder: t('enterEmail') || 'Masukkan Email', type: 'email' }
        ];
      case 'tiktok':
        return [
          { key: 'bc_id', label: t('bcId') || 'BC ID', placeholder: t('enterBcId') || 'Masukkan BC ID', type: 'text' }
        ];
      default:
        return [];
    }
  };

  const getSelectedPlatforms = () => {
    const selectedAccountObjects = accounts.filter(account => selectedAccounts.includes(account.id));
    const platforms = [...new Set(selectedAccountObjects.map(acc => acc.platform))];
    return platforms;
  };

  const handleAccountToggle = (accountId) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const addLegacyRecipient = (platform, method, value) => {
    if (!value.trim()) return;
    
    const newRecipient = {
      id: Date.now(),
      platform,
      method,
      value: value.trim()
    };
    
    setShareRecipients(prev => [...prev, newRecipient]);
  };

  const removeLegacyRecipient = (recipientId) => {
    setShareRecipients(prev => prev.filter(r => r.id !== recipientId));
  };

  // Multi-step navigation functions
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (selectedAccounts.length === 0) {
        toast.error(t('pleaseSelectAccounts') || 'Silakan pilih minimal satu akun');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate share methods based on selected platforms
      const platforms = getSelectedPlatforms();
      let hasError = false;
      
      platforms.forEach(platform => {
        if (platform === 'facebook') {
          if (!shareMethods.facebook.delivery_method) {
            toast.error(t('deliveryMethodRequired') || 'Metode pengiriman harus dipilih untuk Facebook');
            hasError = true;
          } else {
            const validRecipients = shareMethods.facebook.recipients.filter(r => r.value.trim());
            if (validRecipients.length === 0) {
              toast.error(t('recipientRequired') || 'Minimal satu penerima diperlukan untuk Facebook');
              hasError = true;
            }
          }
        } else if (platform === 'google') {
          const validRecipients = shareMethods.google.recipients.filter(r => r.value.trim());
          if (validRecipients.length === 0) {
            toast.error(t('recipientRequired') || 'Minimal satu penerima diperlukan untuk Google');
            hasError = true;
          }
        } else if (platform === 'tiktok') {
          const validRecipients = shareMethods.tiktok.recipients.filter(r => r.value.trim());
          if (validRecipients.length === 0) {
            toast.error(t('recipientRequired') || 'Minimal satu penerima diperlukan untuk TikTok');
            hasError = true;
          }
        }
      });
      
      if (hasError) return;
      
      // Submit share requests
      handleSubmitShareRequests();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetMultiStepForm = () => {
    setCurrentStep(1);
    setSelectedAccounts([]);
    setShareMethods({
      facebook: { 
        delivery_method: '',
        recipients: [{ id: 1, value: '' }]
      },
      google: { 
        recipients: [{ id: 1, value: '' }]
      },
      tiktok: { 
        recipients: [{ id: 1, value: '' }]
      }
    });
    setShareNotes('');
  };

  // Recipient management functions (like RequestAccount)
  const addRecipient = (platform) => {
    setShareMethods(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        recipients: [...prev[platform].recipients, { id: Date.now(), value: '' }]
      }
    }));
  };

  const removeRecipient = (platform, recipientId) => {
    setShareMethods(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        recipients: prev[platform].recipients.length > 1 
          ? prev[platform].recipients.filter(r => r.id !== recipientId)
          : prev[platform].recipients
      }
    }));
  };

  const updateRecipient = (platform, recipientId, value) => {
    setShareMethods(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        recipients: prev[platform].recipients.map(r => 
          r.id === recipientId ? { ...r, value } : r
        )
      }
    }));
  };

  // Submit share requests for multi-step flow
  const handleSubmitShareRequests = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const requests = [];

      // Create share requests for each selected account
      for (const accountId of selectedAccounts) {
        const account = accounts.find(acc => acc.id === accountId);
        if (!account) continue;

        const payload = {
          account_id: accountId,
          notes: shareNotes.trim()
        };

        // Add platform-specific fields using recipients model - Send ALL recipients as array
        if (account.platform === 'facebook') {
          const validRecipients = shareMethods.facebook.recipients.filter(r => r.value.trim());
          if (validRecipients.length > 0) {
            // Send all BM IDs/Emails as array
            payload.target_bm_email = validRecipients.map(r => r.value.trim());
            payload.delivery_method = shareMethods.facebook.delivery_method;
          }
        } else if (account.platform === 'google') {
          const validRecipients = shareMethods.google.recipients.filter(r => r.value.trim());
          if (validRecipients.length > 0) {
            // Send all emails as array
            payload.target_email = validRecipients.map(r => r.value.trim());
          }
        } else if (account.platform === 'tiktok') {
          const validRecipients = shareMethods.tiktok.recipients.filter(r => r.value.trim());
          if (validRecipients.length > 0) {
            // Send all BC IDs as array
            payload.target_bc_id = validRecipients.map(r => r.value.trim());
          }
        }

        requests.push(
          axios.post(`${API}/api/accounts/share`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
      }

      await Promise.all(requests);

      toast.success(t('shareRequestsSubmitted') || `${selectedAccounts.length} permintaan share berhasil dikirim`);
      setCurrentStep(3);
      fetchData(); // Refresh data to show new requests
    } catch (error) {
      console.error('Error submitting share requests:', error);
      const errorMsg = error.response?.data?.detail || t('errorSubmittingRequests') || 'Gagal mengirim permintaan share';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh data every 10 seconds for real-time updates (silent)
  // Only refreshes accounts and pending transfers, doesn't affect form inputs
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true); // Silent refresh
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  // CustomDropdown handles outside clicks internally

  const fetchData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    const token = localStorage.getItem('token');
    
    // Fetch user's active accounts - INDEPENDENT try-catch
    try {
      const accountsResponse = await axios.get(`${API}/api/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(accountsResponse.data);
    } catch (accountError) {
      console.error('Error fetching accounts:', accountError);
      setAccounts([]);
    }

    // Fetch account groups - INDEPENDENT try-catch
    try {
      const groupsResponse = await axios.get(`${API}/api/account-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(groupsResponse.data.map(group => group.name));
    } catch (groupError) {
      console.error('Error fetching groups:', groupError);
      setGroups(['Toko Online Q4 2024', 'Campaign Promo', 'Brand Awareness']);
    }

    // Fetch share requests - INDEPENDENT try-catch
    try {
      const shareResponse = await axios.get(`${API}/api/accounts/share-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShareRequests(shareResponse.data);
    } catch (shareError) {
      console.error('Error fetching share requests:', shareError);
      setShareRequests([]);
    }
    
    if (!silent) {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedAccount) return;

    // Validate required fields based on platform
    if (selectedAccount.platform === 'facebook' && !shareForm.target_bm_email.trim()) {
      toast.error(t('bmIdEmailRequired') || 'BM ID or Email is required for Facebook');
      return;
    }
    if (selectedAccount.platform === 'google' && !shareForm.target_email.trim()) {
      toast.error(t('emailRequired') || 'Email is required for Google Ads');
      return;
    }
    if (selectedAccount.platform === 'tiktok' && !shareForm.target_bc_id.trim()) {
      toast.error(t('bcIdRequired') || 'BC ID is required for TikTok');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        account_id: selectedAccount.id,
        notes: shareForm.notes.trim()
      };

      // Add platform-specific fields
      if (selectedAccount.platform === 'facebook') {
        payload.target_bm_email = shareForm.target_bm_email.trim();
      } else if (selectedAccount.platform === 'google') {
        payload.target_email = shareForm.target_email.trim();
      } else if (selectedAccount.platform === 'tiktok') {
        payload.target_bc_id = shareForm.target_bc_id.trim();
      }

      await axios.post(`${API}/api/accounts/share`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(t('shareRequestSubmitted') || 'Share request submitted successfully');
      setShowShareModal(false);
      setSelectedAccount(null);
      setShareForm({ target_bm_email: '', target_email: '', target_bc_id: '', notes: '' });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error submitting share request:', error);
      const errorMsg = error.response?.data?.detail || t('errorSubmittingRequest') || 'Error submitting request';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk selection functions
  const handleSelectAccount = (accountId) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAccounts.length === filteredAccounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(filteredAccounts.map(acc => acc.id));
    }
  };

  // Bulk share function
  const handleBulkShare = async () => {
    if (selectedAccounts.length === 0) {
      toast.error(t('pleaseSelectAccounts') || 'Please select accounts to share');
      return;
    }

    setBulkSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Submit share requests for all selected accounts
      const promises = selectedAccounts.map(accountId => {
        const payload = {
          account_id: accountId,
          ...bulkShareForm
        };
        
        return axios.post(`${API}/api/share-account`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      });

      await Promise.all(promises);

      toast.success(t('bulkShareRequestSubmitted') || `${selectedAccounts.length} share requests submitted successfully`);
      setShowBulkShareModal(false);
      setSelectedAccounts([]);
      setBulkShareForm({
        target_bm_email: '',
        target_email: '',
        target_bc_id: '',
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error bulk sharing accounts:', error);
      toast.error(error.response?.data?.detail || t('bulkShareRequestFailed') || 'Bulk share request failed');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Filter accounts based on search term and group
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.platform?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = !selectedGroup || account.group_name === selectedGroup;
    
    return matchesSearch && matchesGroup;
  });
  
  // Paginated accounts
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGroup]);

  const handleSelectAllAccounts = () => {
    const filteredAccountIds = filteredAccounts.map(acc => acc.id);
    if (selectedAccounts.length === filteredAccountIds.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(filteredAccountIds);
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-[10px]">F</div>;
      case 'google':
        return <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center text-white font-bold text-[10px]">G</div>;
      case 'tiktok':
        return <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-white font-bold text-[10px]">T</div>;
      default:
        return <Globe className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-purple-100 text-purple-800 border-purple-200',
      failed: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const statusIcons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      completed: CheckCircle,
      failed: AlertTriangle
    };

    const Icon = statusIcons[status] || Clock;
    const style = statusStyles[status] || statusStyles.pending;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${style}`}>
        <Icon className="w-3 h-3 mr-1" />
        {t(status) || status}
      </span>
    );
  };

  const getTargetInfo = (request) => {
    let targets = [];
    let icon = null;
    
    if (request.platform === 'facebook' && request.target_bm_email) {
      targets = Array.isArray(request.target_bm_email) ? request.target_bm_email : [request.target_bm_email];
      icon = <Building className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />;
    } else if (request.platform === 'google' && request.target_email) {
      targets = Array.isArray(request.target_email) ? request.target_email : [request.target_email];
      icon = <Mail className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />;
    } else if (request.platform === 'tiktok' && request.target_bc_id) {
      targets = Array.isArray(request.target_bc_id) ? request.target_bc_id : [request.target_bc_id];
      icon = <Hash className="w-4 h-4 mr-2 text-gray-600 flex-shrink-0" />;
    }
    
    if (targets.length === 0) return <span className="text-gray-400">-</span>;
    
    // Show first target with count badge if multiple
    return (
      <div className="flex items-center space-x-2">
        {icon}
        <div className="flex flex-col">
          <span className="text-sm text-gray-900 font-mono break-all">{targets[0]}</span>
          {targets.length > 1 && (
            <span className="text-xs text-blue-600 font-medium">+{targets.length - 1} lainnya</span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-4 md:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 md:space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Share Account</h2>
            <p className="text-sm md:text-base text-gray-600">Bagikan akun iklan aktif Anda</p>
          </div>

          {/* Progress Steps */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-bold flex-shrink-0`}>1</div>
              <div className={`flex-1 h-0.5 md:h-1 mx-1 md:mx-2 ${currentStep > 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-bold flex-shrink-0`}>2</div>
              <div className={`flex-1 h-0.5 md:h-1 mx-1 md:mx-2 ${currentStep > 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-bold flex-shrink-0`}>3</div>
            </div>
            <div className="flex justify-between text-xs md:text-sm text-gray-600">
              <span className={`${currentStep === 1 ? 'font-semibold text-blue-600' : ''} text-center flex-1`}>Pilih Akun</span>
              <span className={`${currentStep === 2 ? 'font-semibold text-blue-600' : ''} text-center flex-1`}>Metode</span>
              <span className={`${currentStep === 3 ? 'font-semibold text-blue-600' : ''} text-center flex-1`}>Status</span>
            </div>
          </div>

      {/* Multi-Step Content */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
                  <CheckSquare className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-600" />
                  {t('selectAccounts') || 'Pilih Akun'}
                </h2>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  {t('selectAccountsDescription') || 'Pilih akun yang ingin Anda bagikan'}
                </p>
              </div>
              
              {selectedAccounts.length > 0 && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800 font-medium">
                    {selectedAccounts.length} {t('accountsSelected') || 'akun terpilih'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Search and Filter Bar - Mobile Responsive */}
            <div className="space-y-4">
              {/* Search Input - Full Width on Mobile */}
              <div className="w-full">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('searchAccounts') || 'Cari akun...'}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Filter Controls - Stack on Mobile */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Group Filter */}
                {groups.length > 0 && (
                  <div className="flex-1">
                    <CustomDropdown
                      options={[
                        { value: '', label: t('allGroups') || 'Semua Grup' },
                        ...groups.map(group => ({
                          value: group,
                          label: group
                        }))
                      ]}
                      value={selectedGroup}
                      onChange={setSelectedGroup}
                      placeholder={t('allGroups') || 'Semua Grup'}
                    />
                  </div>
                )}
                
                {/* Select All/None Toggle */}
                <button
                  onClick={handleSelectAllAccounts}
                  className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm bg-white"
                >
                  {selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="hidden sm:inline">
                    {selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0 
                      ? (t('deselectAll') || 'Batalkan Semua')
                      : (t('selectAll') || 'Pilih Semua')
                    }
                  </span>
                  <span className="sm:hidden">
                    {selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0 ? 'Batal' : 'Semua'}
                  </span>
                </button>
              </div>
              
              {/* Filter Results Info - Mobile Responsive */}
              <div className="text-xs sm:text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center gap-2">
                <span>
                  {filteredAccounts.length} dari {accounts.length} akun
                </span>
                {(searchTerm || selectedGroup) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedGroup('');
                    }}
                    className="text-blue-600 hover:text-blue-800 text-xs self-start"
                  >
                    {t('clearFilters') || 'Hapus Filter'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Search Results Info */}
            {searchTerm && (
              <div className="mt-3 text-sm text-gray-600">
                {t('showingResults') || 'Menampilkan'} {filteredAccounts.length} {t('of') || 'dari'} {accounts.length} {t('accounts') || 'akun'}
              </div>
            )}
          </div>
          
          <div className="p-3 md:p-6">
            {filteredAccounts.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Share className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-base md:text-lg font-medium text-gray-500">
                  {searchTerm ? (t('noAccountsFound') || 'Tidak ada akun ditemukan') : (t('noActiveAccounts') || 'Tidak Ada Akun Aktif')}
                </p>
                <p className="text-xs md:text-sm text-gray-400">
                  {searchTerm 
                    ? (t('tryDifferentSearch') || 'Coba kata kunci pencarian yang berbeda')
                    : (t('noActiveAccountsDesc') || 'Anda belum memiliki akun aktif yang dapat dibagikan')
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
                {paginatedAccounts.map((account) => (
                  <div key={account.id} className={`border rounded-lg p-2.5 md:p-3 hover:shadow-md transition-all cursor-pointer overflow-hidden ${
                    selectedAccounts.includes(account.id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`} onClick={() => handleAccountToggle(account.id)}>
                    {/* Header with Checkbox and Platform Icon */}
                    <div className="flex flex-col space-y-1.5 md:space-y-2 mb-2 md:mb-3">
                      {/* Row 1: Checkbox, Icon, Name */}
                      <div className="flex items-center space-x-2 w-full">
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(account.id)}
                          onChange={() => handleAccountToggle(account.id)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="w-5 h-5 flex-shrink-0">
                          {getPlatformIcon(account.platform)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 text-xs md:text-sm truncate">{account.account_name}</h3>
                        </div>
                      </div>
                      {/* Row 2: Platform name and Status badge */}
                      <div className="flex items-center justify-between w-full pl-7 md:pl-9">
                        <p className="text-[10px] md:text-xs text-gray-500 capitalize">{account.platform} Ads</p>
                        <span className={`inline-flex items-center px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium ${
                          account.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {t(account.status) || account.status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Account ID */}
                    <div className="bg-gray-50 rounded p-1.5 md:p-2 mb-1.5 md:mb-2 w-full">
                      <p className="text-[9px] md:text-[10px] text-gray-500 mb-0.5">ID Akun</p>
                      <p className="text-[10px] md:text-xs font-mono text-gray-900 break-all">{account.account_id}</p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] md:text-xs text-gray-500">Klik untuk pilih</span>
                      {account.balance && (
                        <span className="text-[10px] md:text-xs text-gray-600">
                          {account.currency} {account.balance?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {filteredAccounts.length > 0 && (
            <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredAccounts.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemLabel="akun"
              />
            </div>
          )}
          
          {/* Step 1 Actions - Mobile Responsive */}
          <div className="px-4 sm:px-6 py-3 md:py-4 border-t border-gray-200 flex justify-between">
            <div></div>
            <button
              onClick={handleNextStep}
              disabled={selectedAccounts.length === 0}
              className="flex items-center space-x-2 px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <span>{t('continue') || 'Lanjutkan'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Share Methods */}
      {currentStep === 2 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              {t('shareMethod') || 'Metode Berbagi'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('shareMethodDescription') || 'Masukkan detail untuk berbagi akun ke platform yang sesuai'}
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Selected Accounts Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                {t('selectedAccounts') || 'Akun Terpilih'} ({selectedAccounts.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {accounts
                  .filter(account => selectedAccounts.includes(account.id))
                  .map(account => (
                    <div key={account.id} className="flex items-center space-x-2 text-sm">
                      {getPlatformIcon(account.platform)}
                      <span className="font-medium">{account.account_name}</span>
                      <span className="text-gray-600 capitalize">({account.platform})</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Platform-Specific Share Methods */}
            {getSelectedPlatforms().includes('facebook') && (
              <div className="space-y-4 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">F</div>
                  <h3 className="text-lg font-medium text-gray-900">Facebook Ads</h3>
                </div>
                
                {/* Method Selection */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metode Pengiriman <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Pilih cara untuk berbagi akses ke akun Facebook Ads</p>
                  
                  <CustomDropdown
                    options={[
                      { 
                        value: 'BM_ID', 
                        label: 'Business Manager ID',
                        icon: Building,
                        color: 'text-blue-600'
                      },
                      { 
                        value: 'EMAIL', 
                        label: 'Email',
                        icon: Mail,
                        color: 'text-green-600'
                      }
                    ]}
                    value={shareMethods.facebook.delivery_method}
                    onChange={(value) => {
                      setShareMethods({
                        ...shareMethods,
                        facebook: { ...shareMethods.facebook, delivery_method: value }
                      });
                    }}
                    placeholder="Pilih metode pengiriman"
                  />
                </div>

                {/* Input Fields based on selected method */}
                {shareMethods.facebook.delivery_method && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {shareMethods.facebook.delivery_method === 'BM_ID' ? 'Business Manager ID *' : 'Alamat Email *'}
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      {shareMethods.facebook.delivery_method === 'BM_ID' 
                        ? 'Masukkan Business Manager ID yang akan diberikan akses ke akun Facebook Ads'
                        : 'Masukkan alamat email yang akan diberikan akses ke akun Facebook Ads'
                      }
                    </p>
                    <div className="space-y-2">
                      {shareMethods.facebook.recipients.map((recipient, index) => (
                        <div key={recipient.id} className="flex items-center space-x-2">
                          <input
                            type={shareMethods.facebook.delivery_method === 'EMAIL' ? 'email' : 'text'}
                            placeholder={
                              shareMethods.facebook.delivery_method === 'BM_ID' 
                                ? `Masukkan Business Manager ID ${index + 1}`
                                : `Masukkan alamat email ${index + 1}`
                            }
                            value={recipient.value}
                            onChange={(e) => updateRecipient('facebook', recipient.id, e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                          {shareMethods.facebook.recipients.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRecipient('facebook', recipient.id)}
                              className="p-2 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addRecipient('facebook')}
                        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {shareMethods.facebook.delivery_method === 'BM_ID' ? 'Tambah Business Manager ID' : 'Tambah Email'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {getSelectedPlatforms().includes('google') && (
              <div className="space-y-4 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white font-bold text-sm">G</div>
                  <h3 className="text-lg font-medium text-gray-900">Google Ads</h3>
                </div>
                
                {/* Email Recipients for Google */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat Email *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Masukkan alamat email yang akan diberikan akses ke akun Google Ads</p>
                  <div className="space-y-2">
                    {shareMethods.google.recipients.map((recipient, index) => (
                      <div key={recipient.id} className="flex items-center space-x-2">
                        <input
                          type="email"
                          placeholder={`Masukkan alamat email ${index + 1}`}
                          value={recipient.value}
                          onChange={(e) => updateRecipient('google', recipient.id, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        {shareMethods.google.recipients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRecipient('google', recipient.id)}
                            className="p-2 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addRecipient('google')}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Email</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {getSelectedPlatforms().includes('tiktok') && (
              <div className="space-y-4 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-sm">T</div>
                  <h3 className="text-lg font-medium text-gray-900">TikTok Ads</h3>
                </div>
                
                {/* BC ID Recipients for TikTok */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Center ID *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Masukkan Business Center ID yang akan diberikan akses ke akun TikTok Ads</p>
                  <div className="space-y-2">
                    {shareMethods.tiktok.recipients.map((recipient, index) => (
                      <div key={recipient.id} className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder={`Masukkan Business Center ID ${index + 1}`}
                          value={recipient.value}
                          onChange={(e) => updateRecipient('tiktok', recipient.id, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        {shareMethods.tiktok.recipients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRecipient('tiktok', recipient.id)}
                            className="p-2 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addRecipient('tiktok')}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Business Center ID</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('notes') || 'Catatan'} ({t('optional') || 'Opsional'})
              </label>
              <textarea
                rows={3}
                placeholder={t('addShareNotes') || 'Tambahkan catatan untuk permintaan share...'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={shareNotes}
                onChange={(e) => setShareNotes(e.target.value)}
              />
            </div>
          </div>
          
          {/* Step 2 Actions */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={handlePreviousStep}
              className="flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>{t('previous') || 'Sebelumnya'}</span>
            </button>
            <button
              onClick={handleNextStep}
              disabled={submitting}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{submitting ? (t('submitting') || 'Mengirim...') : (t('submitShareRequests') || 'Kirim Permintaan')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Monitor Status */}
      {currentStep === 3 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  {t('shareRequestsSubmitted') || 'Permintaan Share Berhasil Dikirim'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {t('monitorShareStatus') || 'Pantau status permintaan share Anda di bawah ini'}
                </p>
              </div>
              <button
                onClick={resetMultiStepForm}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{t('shareMoreAccounts') || 'Share Akun Lagi'}</span>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">
                    {t('successfullySubmitted') || 'Berhasil Dikirim!'}
                  </p>
                  <p className="text-green-800 text-sm mt-1">
                    {t('shareRequestsProcessing') || `${selectedAccounts.length} permintaan share telah dikirim dan sedang diproses oleh admin. Anda akan mendapat notifikasi ketika status berubah.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Requests History */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-600" />
            {t('shareRequestsHistory') || 'Riwayat Permintaan Share'}
          </h2>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          {shareRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">{t('noShareRequests') || 'No Share Requests'}</p>
              <p className="text-sm text-gray-400">{t('noShareRequestsDesc') || 'You haven\'t made any share requests yet'}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('account') || 'Account'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('shareTarget') || 'Share Target'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status') || 'Status'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('requestDate') || 'Request Date'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('notes') || 'Notes'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('action') || 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shareRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getPlatformIcon(request.platform)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{request.account_name}</div>
                          <div className="text-sm text-gray-500 capitalize">{request.platform} Ads</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getTargetInfo(request)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {request.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedShareRequest(request);
                          setShowDetailModal(true);
                        }}
                        className="inline-flex items-center px-3 py-1 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {shareRequests.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-base font-medium text-gray-500">{t('noShareRequests') || 'Belum Ada Permintaan'}</p>
              <p className="text-sm text-gray-400">{t('noShareRequestsDesc') || 'Anda belum membuat permintaan share'}</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {shareRequests.map((request) => (
                <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  {/* Header - Account and Status */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="w-6 h-6 flex-shrink-0">
                        {getPlatformIcon(request.platform)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{request.account_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{request.platform} Ads</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>

                  {/* Share Target */}
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500 mb-1">{t('shareTarget') || 'Target Share'}</p>
                    <div className="text-sm">
                      {getTargetInfo(request)}
                    </div>
                  </div>

                  {/* Request Date */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{t('requestDate') || 'Tanggal'}</span>
                    <span className="text-gray-900">
                      {new Date(request.created_at).toLocaleDateString('id-ID', { 
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Notes */}
                  {request.notes && (
                    <div className="bg-blue-50 rounded p-2">
                      <p className="text-xs text-gray-500 mb-1">{t('notes') || 'Catatan'}</p>
                      <p className="text-xs text-gray-700 break-words">{request.notes}</p>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      setSelectedShareRequest(request);
                      setShowDetailModal(true);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{t('viewDetails') || 'Lihat Detail'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Share className="w-5 h-5 mr-2 text-blue-600" />
                  {t('shareAccount') || 'Share Account'}
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Account Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getPlatformIcon(selectedAccount.platform)}
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedAccount.account_name}</h4>
                    <p className="text-sm text-gray-500 capitalize">{selectedAccount.platform} Ads</p>
                    <p className="text-xs text-gray-400 font-mono">{selectedAccount.account_id}</p>
                  </div>
                </div>
              </div>

              {/* Share Target Form */}
              <div className="space-y-4">
                {selectedAccount.platform === 'facebook' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('targetBmEmail') || 'Target BM ID or Email'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('enterBmIdEmail') || 'Enter BM ID or Email address'}
                      value={shareForm.target_bm_email}
                      onChange={(e) => setShareForm({ ...shareForm, target_bm_email: e.target.value })}
                    />
                  </div>
                )}

                {selectedAccount.platform === 'google' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('targetEmail') || 'Target Email'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('enterEmail') || 'Enter email address'}
                      value={shareForm.target_email}
                      onChange={(e) => setShareForm({ ...shareForm, target_email: e.target.value })}
                    />
                  </div>
                )}

                {selectedAccount.platform === 'tiktok' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('targetBcId') || 'Target BC ID'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('enterBcId') || 'Enter BC ID'}
                      value={shareForm.target_bc_id}
                      onChange={(e) => setShareForm({ ...shareForm, target_bc_id: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('notes') || 'Notes'} ({t('optional') || 'Optional'})
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder={t('addNotesOptional') || 'Add any additional notes...'}
                    value={shareForm.notes}
                    onChange={(e) => setShareForm({ ...shareForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
                  disabled={submitting}
                >
                  {submitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {submitting ? (t('submitting') || 'Submitting...') : (t('submitRequest') || 'Submit Request')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Share Modal */}
      {showBulkShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-600" />
                  {t('bulkShareAccounts') || 'Bulk Share Accounts'}
                </h3>
                <button
                  onClick={() => setShowBulkShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('selectedAccounts') || 'Selected Accounts'}
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                    <p className="font-medium text-sm mb-2">
                      {selectedAccounts.length} {t('accountsSelected') || 'accounts selected'}
                    </p>
                    <div className="space-y-2">
                      {filteredAccounts
                        .filter(account => selectedAccounts.includes(account.id))
                        .slice(0, 5)
                        .map(account => (
                          <div key={account.id} className="flex items-center space-x-2 text-sm">
                            {getPlatformIcon(account.platform)}
                            <span className="font-medium">{account.account_name}</span>
                            <span className="text-gray-500 capitalize">({account.platform})</span>
                          </div>
                        ))}
                      {selectedAccounts.length > 5 && (
                        <p className="text-gray-500 text-xs italic">
                          +{selectedAccounts.length - 5} {t('moreAccounts') || 'more accounts'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Target Selection - Same as single share */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('shareTarget') || 'Share Target'} <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Facebook BM Email */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">
                      {t('facebookBmEmail') || 'Facebook Business Manager Email'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="businessmanager@company.com"
                        value={bulkShareForm.target_bm_email}
                        onChange={(e) => setBulkShareForm({ ...bulkShareForm, target_bm_email: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Google Ads Email */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">
                      {t('googleAdsEmail') || 'Google Ads Email'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="googleads@company.com"
                        value={bulkShareForm.target_email}
                        onChange={(e) => setBulkShareForm({ ...bulkShareForm, target_email: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* TikTok BC ID */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">
                      {t('tiktokBcId') || 'TikTok Business Center ID'}
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1234567890"
                        value={bulkShareForm.target_bc_id}
                        onChange={(e) => setBulkShareForm({ ...bulkShareForm, target_bc_id: e.target.value })}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    {t('shareTargetNote') || 'Fill in the appropriate field(s) based on the platform(s) of your selected accounts'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('notes') || 'Notes'} ({t('optional') || 'Optional'})
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder={t('addBulkNotesOptional') || 'Add notes for all selected accounts (optional)...'}
                    value={bulkShareForm.notes}
                    onChange={(e) => setBulkShareForm({ ...bulkShareForm, notes: e.target.value })}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="w-5 h-5 text-blue-400 mr-2 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">{t('bulkShareNote') || 'Bulk Share Information'}</p>
                      <p className="text-blue-700 mt-1">
                        {t('bulkShareDescription') || 'This will create separate share requests for each selected account with the same target information. Each request will be processed individually by admin.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowBulkShareModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={bulkSubmitting}
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleBulkShare}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center"
                  disabled={bulkSubmitting}
                >
                  {bulkSubmitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {bulkSubmitting ? (t('submitting') || 'Submitting...') : (t('bulkShareAccounts') || 'Bulk Share Accounts')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Request Detail Modal */}
      {showDetailModal && selectedShareRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-blue-600" />
                  Detail Permintaan Share
                </h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedShareRequest(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Account Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Informasi Akun</h4>
                  <div className="flex items-center space-x-3">
                    {getPlatformIcon(selectedShareRequest.platform)}
                    <div>
                      <p className="font-medium text-gray-900">{selectedShareRequest.account_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{selectedShareRequest.platform} Ads</p>
                    </div>
                  </div>
                </div>

                {/* Target Share Info */}
                <div className="border rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Target Share</h4>
                  <div className="space-y-2">
                    {selectedShareRequest.platform === 'facebook' && selectedShareRequest.target_bm_email && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">BM ID / Email:</label>
                        {(Array.isArray(selectedShareRequest.target_bm_email) ? selectedShareRequest.target_bm_email : [selectedShareRequest.target_bm_email]).map((target, idx) => (
                          <div key={idx} className="flex items-center mt-1 p-2 bg-blue-50 rounded border border-blue-200">
                            <Building className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                            <span className="text-sm font-mono text-gray-900 break-all">{target}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedShareRequest.platform === 'google' && selectedShareRequest.target_email && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Email:</label>
                        {(Array.isArray(selectedShareRequest.target_email) ? selectedShareRequest.target_email : [selectedShareRequest.target_email]).map((target, idx) => (
                          <div key={idx} className="flex items-center mt-1 p-2 bg-red-50 rounded border border-red-200">
                            <Mail className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
                            <span className="text-sm font-mono text-gray-900 break-all">{target}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedShareRequest.platform === 'tiktok' && selectedShareRequest.target_bc_id && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">BC ID:</label>
                        {(Array.isArray(selectedShareRequest.target_bc_id) ? selectedShareRequest.target_bc_id : [selectedShareRequest.target_bc_id]).map((target, idx) => (
                          <div key={idx} className="flex items-center mt-1 p-2 bg-gray-50 rounded border border-gray-200">
                            <Hash className="w-4 h-4 mr-2 text-gray-600 flex-shrink-0" />
                            <span className="text-sm font-mono text-gray-900 break-all">{target}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="border rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Status Permintaan</h4>
                  {getStatusBadge(selectedShareRequest.status)}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Tanggal Request</h4>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedShareRequest.created_at).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {selectedShareRequest.status !== 'pending' && (
                    <div className="border rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Tanggal Diproses</h4>
                      <p className="text-sm text-gray-900">
                        {selectedShareRequest.processed_at 
                          ? new Date(selectedShareRequest.processed_at).toLocaleDateString('id-ID', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedShareRequest.notes && (
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Catatan Anda</h4>
                    <p className="text-sm text-gray-600">{selectedShareRequest.notes}</p>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedShareRequest.admin_notes && (
                  <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">Catatan Admin</h4>
                    <p className="text-sm text-yellow-700">{selectedShareRequest.admin_notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedShareRequest(null);
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {(showShareModal || showBulkShareModal || showDetailModal) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowShareModal(false);
            setShowBulkShareModal(false);
            setShowDetailModal(false);
            setSelectedShareRequest(null);
          }}
        />
      )}
        </div>
      </div>
    </div>
  );
};

export default ShareAccount;