import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RequestAccount = ({ onRefresh }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); // Prevent double submission
  const toastShownRef = React.useRef(false); // Prevent duplicate toast
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    platform: "",
    account_name: "",
    // Facebook specific fields
    gmt: "",
    currency: "",
    delivery_method: "",
    bm_id_or_email: "",
    notes: ""
  });

  const [multipleAccounts, setMultipleAccounts] = useState([
    {
      id: 1,
      account_name: "",
      gmt: "",
      currency: "",
      delivery_method: "",
      recipients: [{ id: 1, value: "" }], // Changed to array of recipients
      notes: ""
    }
  ]);

  const [sharedSettings, setSharedSettings] = useState({
    gmt: "GMT+7", // Default to Indonesia timezone (Jakarta)
    currency: "IDR", // Default to Indonesian Rupiah
    delivery_method: "Email", // Default delivery method
    shared_recipients: [{ id: 1, value: "" }],
    bc_id: ""
  });

  const [useSharedSettings, setUseSharedSettings] = useState({
    gmt: true,  // GMT sharing enabled by default
    currency: true,  // ✅ Currency sharing enabled by default
    delivery_method: true,  // ✅ Delivery method sharing enabled by default
    bc_id: false // Disable BC ID sharing by default, let users set individual BC IDs
  });

  // Group Management State
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Google Ads State
  const [googleAccounts, setGoogleAccounts] = useState([
    {
      id: 1,
      account_name: "",
      gmt: "GMT+7", // Default to Indonesia timezone
      email: "",
      website: "",
      notes: ""
    }
  ]);

  // TikTok Ads State
  const [tiktokAccounts, setTiktokAccounts] = useState([
    {
      id: 1,
      account_name: "",
      gmt: "GMT+7", // Default to Indonesia timezone
      bc_id: "",
      website: "",
      notes: ""
    }
  ]);

  const [regionalPresets] = useState([
    { name: "Jakarta, Indonesia", gmt: "GMT+7", currency: "IDR", flag: "🇮🇩" },
    { name: "Singapore", gmt: "GMT+8", currency: "SGD", flag: "🇸🇬" },
    { name: "New York, USA", gmt: "GMT-5", currency: "USD", flag: "🇺🇸" },
    { name: "London, UK", gmt: "GMT+0", currency: "GBP", flag: "🇬🇧" },
    { name: "Tokyo, Japan", gmt: "GMT+9", currency: "JPY", flag: "🇯🇵" },
    { name: "Sydney, Australia", gmt: "GMT+10", currency: "AUD", flag: "🇦🇺" }
  ]);

  const gmtOptions = [
    "GMT-12", "GMT-11", "GMT-10", "GMT-9", "GMT-8", "GMT-7", "GMT-6", "GMT-5",
    "GMT-4", "GMT-3", "GMT-2", "GMT-1", "GMT+0", "GMT+1", "GMT+2", "GMT+3",
    "GMT+4", "GMT+5", "GMT+6", "GMT+7", "GMT+8", "GMT+9", "GMT+10", "GMT+11", "GMT+12"
  ];

  useEffect(() => {
    fetchAccounts();
    fetchGroups();
  }, []);

  // Auto-refresh accounts and groups data every 10 seconds
  // Only refreshes dropdown data, doesn't affect form inputs
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAccounts();
      fetchGroups();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get(`${API}/accounts`);
      console.log('ACCOUNTS DEBUG - Response data:', response.data);
      setAccounts(response.data);
    } catch (error) {
      toast.error(t('failedToLoadAccounts') || "Failed to load accounts");
    }
  };

  const addNewAccount = () => {
    setMultipleAccounts([...multipleAccounts, {
      id: Date.now(),
      account_name: "",
      gmt: useSharedSettings.gmt ? sharedSettings.gmt : "",
      currency: useSharedSettings.currency ? sharedSettings.currency : "",
      delivery_method: useSharedSettings.delivery_method ? sharedSettings.delivery_method : "",
      recipients: [{ id: 1, value: "" }],
      notes: ""
    }]);
  };

  const applyPresetToAccount = (accountId, preset) => {
    setMultipleAccounts(multipleAccounts.map(account => 
      account.id === accountId ? { 
        ...account, 
        gmt: preset.gmt, 
        currency: preset.currency 
      } : account
    ));
    toast.success(`${preset.flag} ${preset.name} settings applied!`);
  };

  const copySettingsFromAccount = (sourceAccountId, targetAccountId) => {
    const sourceAccount = multipleAccounts.find(acc => acc.id === sourceAccountId);
    if (sourceAccount) {
      setMultipleAccounts(multipleAccounts.map(account => 
        account.id === targetAccountId ? { 
          ...account, 
          gmt: sourceAccount.gmt, 
          currency: sourceAccount.currency 
        } : account
      ));
      toast.success(t('settingsCopied') || "Settings copied!");
    }
  };

  const removeAccount = (id) => {
    if (multipleAccounts.length > 1) {
      setMultipleAccounts(multipleAccounts.filter(account => account.id !== id));
    }
  };

  const updateAccount = (id, field, value) => {
    setMultipleAccounts(multipleAccounts.map(account => 
      account.id === id ? { ...account, [field]: value } : account
    ));
  };

  const addRecipient = (accountId) => {
    setMultipleAccounts(multipleAccounts.map(account => 
      account.id === accountId ? { 
        ...account, 
        recipients: [...account.recipients, { id: Date.now(), value: "" }]
      } : account
    ));
  };

  const updateRecipient = (accountId, recipientId, value) => {
    setMultipleAccounts(multipleAccounts.map(account => 
      account.id === accountId ? {
        ...account,
        recipients: account.recipients.map(recipient =>
          recipient.id === recipientId ? { ...recipient, value } : recipient
        )
      } : account
    ));
  };

  const removeRecipient = (accountId, recipientId) => {
    setMultipleAccounts(multipleAccounts.map(account => 
      account.id === accountId ? {
        ...account,
        recipients: account.recipients.length > 1 
          ? account.recipients.filter(recipient => recipient.id !== recipientId)
          : account.recipients // Keep at least one recipient
      } : account
    ));
  };

  // Shared recipients management functions
  const addSharedRecipient = () => {
    setSharedSettings({
      ...sharedSettings,
      shared_recipients: [...sharedSettings.shared_recipients, { id: Date.now(), value: "" }]
    });
  };

  const updateSharedRecipient = (recipientId, value) => {
    setSharedSettings({
      ...sharedSettings,
      shared_recipients: sharedSettings.shared_recipients.map(recipient =>
        recipient.id === recipientId ? { ...recipient, value } : recipient
      )
    });
  };

  const removeSharedRecipient = (recipientId) => {
    setSharedSettings({
      ...sharedSettings,
      shared_recipients: sharedSettings.shared_recipients.length > 1 
        ? sharedSettings.shared_recipients.filter(recipient => recipient.id !== recipientId)
        : sharedSettings.shared_recipients // Keep at least one recipient
    });
  };

  const copySettingsToAll = () => {
    if (sharedSettings.gmt && sharedSettings.currency && sharedSettings.delivery_method) {
      toast.success(t('settingsCopiedToAll') || "Settings copied to all accounts!");
    }
  };

  // Google Ads Management Functions
  const addGoogleAccount = () => {
    setGoogleAccounts([...googleAccounts, {
      id: Date.now(),
      account_name: "",
      gmt: useSharedSettings.gmt ? sharedSettings.gmt : "",
      email: "",
      website: "",
      notes: ""
    }]);
  };

  const updateGoogleAccount = (id, field, value) => {
    setGoogleAccounts(googleAccounts.map(account => 
      account.id === id ? { ...account, [field]: value } : account
    ));
  };

  const removeGoogleAccount = (id) => {
    if (googleAccounts.length > 1) {
      setGoogleAccounts(googleAccounts.filter(account => account.id !== id));
    }
  };

  // TikTok Ads Management Functions
  const addTiktokAccount = () => {
    setTiktokAccounts([...tiktokAccounts, {
      id: Date.now(),
      account_name: "",
      gmt: useSharedSettings.gmt ? sharedSettings.gmt : "",
      bc_id: useSharedSettings.bc_id ? sharedSettings.bc_id : "",
      website: "",
      notes: ""
    }]);
  };

  const updateTiktokAccount = (id, field, value) => {
    setTiktokAccounts(tiktokAccounts.map(account => 
      account.id === id ? { ...account, [field]: value } : account
    ));
  };

  const removeTiktokAccount = (id) => {
    if (tiktokAccounts.length > 1) {
      setTiktokAccounts(tiktokAccounts.filter(account => account.id !== id));
    }
  };

  // Group Management Functions
  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      // Use account-groups endpoint to sync with Kelola Akun
      const response = await axios.get(`${API}/account-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(response.data);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error(t('groupNameRequired') || "Group name is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      // Use account-groups endpoint to sync with Kelola Akun
      const response = await axios.post(`${API}/account-groups`, {
        name: newGroupName.trim(),
        description: ""
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGroups([...groups, response.data]);
      setSelectedGroup(response.data.id);
      setNewGroupName("");
      setShowCreateGroupModal(false);
      toast.success(t('groupCreated') || "Group created successfully");
    } catch (error) {
      toast.error(error.response?.data?.detail || t('groupCreationFailed') || "Failed to create group");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.platform) {
      toast.error(t('selectPlatformFirst') || "Please select platform first");
      return;
    }

    // Simple platforms (not Facebook, Google, or TikTok) - single account name only
    if (formData.platform !== "facebook" && formData.platform !== "google" && formData.platform !== "tiktok") {
      if (!formData.account_name) {
        toast.error(t('allFieldsRequired'));
        return;
      }

      setLoading(true);
      
      try {
        const response = await axios.post(`${API}/accounts/request`, {
          platform: formData.platform,
          account_name: formData.account_name
        });
        
        // Enhanced success feedback
        toast.success(`✅ Permintaan akun ${formData.platform.toUpperCase()} berhasil dikirim!`, {
          description: "Admin akan memproses permintaan Anda. Cek status di Dashboard Home.",
          duration: 4000
        });
        
        setFormData({ 
          platform: "", 
          account_name: "",
          gmt: "",
          currency: "",
          delivery_method: "",
          bm_id_or_email: "",
          notes: ""
        });
        fetchAccounts();
        onRefresh && onRefresh();
        
        // Redirect to dashboard home after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
        
      } catch (error) {
        console.error('Request error:', error.response?.data);
        const errorMessage = error.response?.data?.detail || t('requestFailed');
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Group is optional, no validation needed

    // Google Ads Validation
    if (formData.platform === "google") {
      // Validate each Google account
      for (let account of googleAccounts) {
        if (!account.account_name || !account.email || !account.website) {
          toast.error(`${t('allGoogleFieldsRequired') || 'All fields required for Google account'}: ${account.account_name || 'Unnamed'}`);
          return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(account.email)) {
          toast.error(`${t('invalidEmailFormat') || 'Invalid email format for'}: ${account.account_name}`);
          return;
        }
        
        // Validate website URL
        try {
          new URL(account.website);
        } catch {
          toast.error(`${t('invalidWebsiteFormat') || 'Invalid website URL for'}: ${account.account_name}`);
          return;
        }

        // Check individual GMT
        const finalGMT = useSharedSettings.gmt ? sharedSettings.gmt : account.gmt;
        if (!finalGMT) {
          toast.error(`${t('gmtRequired') || 'GMT required for'}: ${account.account_name}`);
          return;
        }
      }
    }

    // TikTok Ads Validation
    if (formData.platform === "tiktok") {
      // Validate shared BC ID if enabled
      if (useSharedSettings.bc_id && !sharedSettings.bc_id) {
        toast.error(t('sharedBcIdRequired') || "Shared BC ID is required when BC ID sharing is enabled");
        return;
      }
      
      // Validate shared BC ID format
      if (useSharedSettings.bc_id && sharedSettings.bc_id) {
        const bcIdRegex = /^[a-zA-Z0-9]+$/;
        if (!bcIdRegex.test(sharedSettings.bc_id)) {
          toast.error(t('invalidSharedBcIdFormat') || "Invalid shared BC ID format");
          return;
        }
      }

      // Validate each TikTok account
      for (let account of tiktokAccounts) {
        const finalBcId = useSharedSettings.bc_id ? sharedSettings.bc_id : account.bc_id;
        
        if (!account.account_name || !finalBcId || !account.website) {
          toast.error(`${t('allTiktokFieldsRequired') || 'All fields required for TikTok account'}: ${account.account_name || 'Unnamed'}`);
          return;
        }
        
        // Validate individual BC ID format (if not shared)
        if (!useSharedSettings.bc_id) {
          const bcIdRegex = /^[a-zA-Z0-9]+$/;
          if (!bcIdRegex.test(account.bc_id)) {
            toast.error(`${t('invalidBcIdFormat') || 'Invalid BC ID format for'}: ${account.account_name}`);
            return;
          }
        }
        
        // Validate website URL
        try {
          new URL(account.website);
        } catch {
          toast.error(`${t('invalidWebsiteFormat') || 'Invalid website URL for'}: ${account.account_name}`);
          return;
        }

        // Check individual GMT
        const finalGMT = useSharedSettings.gmt ? sharedSettings.gmt : account.gmt;
        if (!finalGMT) {
          toast.error(`${t('gmtRequired') || 'GMT required for'}: ${account.account_name}`);
          return;
        }
      }
    }

    // Facebook Ads Validation - only for Facebook platform
    if (formData.platform === "facebook") {
      // Validate shared delivery method and recipients if enabled
      if (useSharedSettings.delivery_method) {
        if (!sharedSettings.delivery_method) {
          toast.error(t('deliveryMethodRequired') || "Delivery method is required");
          return;
        }
        
        const validSharedRecipients = sharedSettings.shared_recipients.filter(recipient => recipient.value && recipient.value.trim() !== "");
        if (validSharedRecipients.length === 0) {
          toast.error(t('sharedRecipientsRequired') || "At least one shared recipient is required");
          return;
        }
      }

      // Validate each Facebook account
      for (let account of multipleAccounts) {
        if (!account.account_name) {
          toast.error(t('accountNameRequired') || `Account name required for account: ${account.account_name || 'Unnamed'}`);
          return;
        }

        // Check individual GMT, Currency, and Delivery Method (Facebook only)
        const finalGMT = useSharedSettings.gmt ? sharedSettings.gmt : account.gmt;
        const finalCurrency = useSharedSettings.currency ? sharedSettings.currency : account.currency;
        const finalDeliveryMethod = useSharedSettings.delivery_method ? sharedSettings.delivery_method : account.delivery_method;
        
        if (!finalGMT || !finalCurrency || !finalDeliveryMethod) {
          toast.error(`${t('allRequiredFieldsMissing') || 'GMT, Currency, and Delivery Method required for'}: ${account.account_name}`);
          return;
        }

        // Check individual recipients if delivery method is not shared
        if (!useSharedSettings.delivery_method) {
          const validRecipients = account.recipients.filter(recipient => recipient.value && recipient.value.trim() !== "");
          if (validRecipients.length === 0) {
            toast.error(`${t('recipientRequired') || 'At least one recipient required for'}: ${account.account_name}`);
            return;
          }
        }
      }
    }

    // CHECK FOR DUPLICATE ACCOUNT NAMES - ALL PLATFORMS
    let accountNamesToCheck = [];
    
    if (formData.platform === "facebook") {
      accountNamesToCheck = multipleAccounts.map(acc => acc.account_name?.trim().toLowerCase()).filter(Boolean);
    } else if (formData.platform === "google") {
      accountNamesToCheck = googleAccounts.map(acc => acc.account_name?.trim().toLowerCase()).filter(Boolean);
    } else if (formData.platform === "tiktok") {
      accountNamesToCheck = tiktokAccounts.map(acc => acc.account_name?.trim().toLowerCase()).filter(Boolean);
    }
    
    // Find duplicates
    const duplicates = accountNamesToCheck.filter((name, index) => accountNamesToCheck.indexOf(name) !== index);
    if (duplicates.length > 0) {
      const uniqueDuplicates = [...new Set(duplicates)];
      toast.error(`Nama akun tidak boleh sama! Duplicate: ${uniqueDuplicates.join(', ')}`);
      return;
    }

    // Prevent double submission
    if (submitting) {
      toast.warning("Sedang memproses, mohon tunggu...");
      return;
    }
    
    setLoading(true);
    setSubmitting(true);
    
    try {
      let successCount = 0;
      let failCount = 0;
      let totalRequests = 0;
      let processedRequests = 0;

      // Google Ads Submission
      if (formData.platform === "google") {
        totalRequests = googleAccounts.length;

        for (let i = 0; i < googleAccounts.length; i++) {
          const account = googleAccounts[i];
          
          try {
            const requestData = {
              platform: "google",
              account_name: account.account_name,
              group_id: selectedGroup || null,
              gmt: useSharedSettings.gmt ? sharedSettings.gmt : account.gmt,
              currency: "USD", // Fixed for Google Ads
              email: account.email,
              website: account.website,
              notes: account.notes
            };

            await axios.post(`${API}/accounts/request`, requestData, {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            successCount++;
            
          } catch (error) {
            failCount++;
            console.error(`Failed to create Google account ${account.account_name}:`, error);
            // Show specific error message to user
            const errorMsg = error.response?.data?.detail || `Gagal membuat akun ${account.account_name}`;
            toast.error(errorMsg);
          }
          
          processedRequests++;
          // REMOVED: toast.info (causes duplicate feedback)
        }
        
        // Show success message  
        if (successCount > 0) {
          toast.success(`✅ Berhasil mengirim ${successCount} permintaan akun Google Ads!`, {
            description: `${successCount} permintaan sedang diproses admin. Cek status di Dashboard Home.`,
            duration: 4000
          });
          
          setGoogleAccounts([{
            id: 1,
            account_name: "",
            gmt: "",
            email: "",
            website: "",
            notes: ""
          }]);
          setSelectedGroup("");
          setUseSharedSettings({
            gmt: true,
            currency: true,
            delivery_method: false,
            bc_id: true
          });
          setSharedSettings({
            gmt: "GMT+7", // Default to Indonesia timezone (Jakarta)
            currency: "IDR", // Default to Indonesian Rupiah
            delivery_method: "Email", // Default delivery method
            shared_recipients: [{ id: 1, value: "" }],
            bc_id: ""
          });
          
          fetchAccounts();
          onRefresh && onRefresh();
          
          // Redirect to dashboard home after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
          
        } else if (failCount > 0) {
          toast.error("Semua permintaan gagal");
        }
      }

      // TikTok Ads Submission
      else if (formData.platform === "tiktok") {
        totalRequests = tiktokAccounts.length;

        for (let i = 0; i < tiktokAccounts.length; i++) {
          const account = tiktokAccounts[i];
          
          try {
            const requestData = {
              platform: "tiktok",
              account_name: account.account_name,
              group_id: selectedGroup || null,
              gmt: useSharedSettings.gmt ? sharedSettings.gmt : account.gmt,
              currency: "USD", // Fixed for TikTok Ads
              bc_id: useSharedSettings.bc_id ? sharedSettings.bc_id : account.bc_id,
              website: account.website,
              notes: account.notes || ""
            };

            const response = await axios.post(`${API}/accounts/request`, requestData, {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            
            successCount++;
          } catch (error) {
            failCount++;
            console.error(`Failed to create TikTok account ${account.account_name}:`, error);
            // Show specific error message to user
            const errorMsg = error.response?.data?.detail || `Gagal membuat akun ${account.account_name}`;
            toast.error(errorMsg);
          }
          
          processedRequests++;
          // REMOVED: toast.info (causes duplicate feedback)
        }
        
        // Show success message  
        if (successCount > 0) {
          toast.success(`✅ Berhasil mengirim ${successCount} permintaan akun TikTok Ads!`, {
            description: `${successCount} permintaan sedang diproses admin. Cek status di Dashboard Home.`,
            duration: 4000
          });
          
          setTiktokAccounts([{
            id: 1,
            account_name: "",
            gmt: "",
            bc_id: "",
            website: "",
            notes: ""
          }]);
          setSelectedGroup("");
          setUseSharedSettings({
            gmt: true,
            currency: true,
            delivery_method: false,
            bc_id: true
          });
          setSharedSettings({
            gmt: "GMT+7", // Default to Indonesia timezone (Jakarta)
            currency: "IDR", // Default to Indonesian Rupiah
            delivery_method: "Email", // Default delivery method
            shared_recipients: [{ id: 1, value: "" }],
            bc_id: ""
          });
          
          fetchAccounts();
          onRefresh && onRefresh();
          
          // Redirect to dashboard home after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
          
        } else if (failCount > 0) {
          toast.error("Semua permintaan gagal");
        }
      }

      // Facebook Ads Submission
      else if (formData.platform === "facebook") {
        // FIXED: Total requests = number of ACCOUNTS, not BM IDs
        // Each account can have multiple BM IDs as recipients
        totalRequests = multipleAccounts.length;

        for (let i = 0; i < multipleAccounts.length; i++) {
          const account = multipleAccounts[i];
          
          // Get recipients: shared or individual
          let recipientsToUse = [];
          if (useSharedSettings.delivery_method) {
            recipientsToUse = sharedSettings.shared_recipients.filter(r => r.value && r.value.trim() !== "");
          } else {
            recipientsToUse = account.recipients.filter(r => r.value && r.value.trim() !== "");
          }
          
          // FIXED: Create ONE request with ARRAY of BM IDs (not one per BM)
          try {
            const bmIds = recipientsToUse.map(r => r.value);
            
            const requestData = {
              platform: "facebook",
              account_name: account.account_name,
              group_id: selectedGroup || null,
              gmt: useSharedSettings.gmt ? sharedSettings.gmt : account.gmt,
              currency: useSharedSettings.currency ? sharedSettings.currency : account.currency,
              delivery_method: useSharedSettings.delivery_method ? sharedSettings.delivery_method : account.delivery_method,
              bm_ids: bmIds,  // NEW: Send array of BM IDs
              notes: account.notes
            };

            await axios.post(`${API}/accounts/request`, requestData, {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            successCount++;
            processedRequests++;
            // REMOVED: toast.info (causes duplicate feedback)
            
          } catch (error) {
            failCount++;
            console.error(`Failed to create account ${account.account_name}:`, error);
            // Show specific error message to user
            const errorMsg = error.response?.data?.detail || `Gagal membuat akun ${account.account_name}`;
            toast.error(errorMsg);
          }
        }
        
        // Show success message for Facebook
        if (successCount > 0) {
          toast.success(`✅ Berhasil mengirim ${successCount} permintaan akun Facebook Ads!`, {
            description: `${successCount} permintaan sedang diproses admin. Cek status di Dashboard Home.`,
            duration: 4000
          });
          
          setMultipleAccounts([{
            id: 1,
            account_name: "",
            gmt: "",
            currency: "",
            delivery_method: "",
            recipients: [{ id: 1, value: "" }],
            notes: ""
          }]);
          setSharedSettings({
            gmt: "",
            currency: "",
            delivery_method: "",
            shared_recipients: [{ id: 1, value: "" }]
          });
          setFormData({ 
            platform: "", 
            account_name: "",
            gmt: "",
            currency: "",
            delivery_method: "",
            bm_id_or_email: "",
            notes: ""
          });
          fetchAccounts();
          onRefresh && onRefresh();
          
          // Redirect to dashboard home after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
          
        } else if (failCount > 0) {
          toast.error("Semua permintaan Facebook gagal");
        }
      }
      
    } catch (error) {
      toast.error(t('bulkRequestFailed') || "Bulk request failed");
    } finally {
      setLoading(false);
      setSubmitting(false); // Reset submitting state
    }
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: (
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
      ),
      google: (
        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
      ),
      tiktok: (
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        </div>
      )
    };
    return icons[platform] || icons.facebook;
  };

  const getStatusBadge = (status) => {
    console.log('STATUS BADGE DEBUG - Input status:', status);
    const statusConfig = {
      pending: { text: t('pending'), class: "bg-yellow-100 text-yellow-700" },
      active: { text: t('active'), class: "bg-green-100 text-green-700" },
      sharing: { text: "Proses Share", class: "bg-blue-100 text-blue-700" },  // NEW: Handle sharing status
      processing: { text: "Processing", class: "bg-purple-100 text-purple-700" },  // NEW: Handle processing status
      suspended: { text: t('suspended'), class: "bg-red-100 text-red-700" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    console.log('STATUS BADGE DEBUG - Config used:', config);
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const platforms = [
    { value: "facebook", label: t('facebookAds'), description: t('facebookDesc') },
    { value: "google", label: t('googleAds'), description: t('googleDesc') },
    { value: "tiktok", label: t('tiktokAds'), description: t('tiktokDesc') }
  ];

  return (
    <div className="space-y-6 fade-in max-w-full overflow-hidden px-1 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{t('requestAccount')}</h1>
        <p className="text-sm sm:text-base text-gray-600 break-words [overflow-wrap:anywhere]">{t('requestAccountDesc') || 'Ajukan permintaan akun iklan untuk platform yang dibutuhkan'}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 max-w-full overflow-hidden">
        {/* Form Request */}
        <Card className="glass-card max-w-full overflow-hidden">
          <CardHeader>
            <CardTitle>{t('requestNewAccount')}</CardTitle>
            <CardDescription>
              {t('selectPlatformAndName')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">{t('adPlatform')}</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData({ ...formData, platform: value })}
                  data-testid="platform-select"
                >
                  <SelectTrigger className="focus-ring">
                    <SelectValue placeholder={t('selectAdPlatform')} />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        <div className="flex items-center space-x-2">
                          <span>{platform.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="group_select">{t('selectGroup') || 'Pilih Grup'} ({t('optional') || 'Opsional'})</Label>
                <Select
                  value={selectedGroup === "" ? "no_group" : selectedGroup}
                  onValueChange={(value) => {
                    if (value === "create_new") {
                      setShowCreateGroupModal(true);
                    } else if (value === "no_group") {
                      setSelectedGroup(""); // Set empty string for no group
                    } else {
                      setSelectedGroup(value);
                    }
                  }}
                >
                  <SelectTrigger className="focus-ring">
                    <SelectValue placeholder={t('selectGroupPlaceholder') || 'Pilih grup atau biarkan kosong'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_group">{t('noGroup') || 'Tanpa Grup'}</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        📁 {group.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="create_new" className="font-medium text-green-700 border-t mt-1 pt-2">
                      ➕ {t('createNewGroup') || 'Buat Grup Baru'}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 break-words [overflow-wrap:anywhere]">
                  {t(`groupSelectHint${formData.platform.charAt(0).toUpperCase() + formData.platform.slice(1)}`) || t('groupSelectHint') || 'Grup membantu mengorganisir dan mengelola akun Anda'}
                </p>
              </div>

              {/* Facebook Bulk Request Interface */}
              {formData.platform === "facebook" && (
                <div className="space-y-6">
                  {/* Flexible Settings */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-blue-900">{t('facebookSettings') || 'Facebook Settings'}</h4>
                      <div className="text-xs text-blue-600">
                        {t('flexibleSettings') || 'Flexible Settings: Share or Individual'}
                      </div>
                    </div>

                    {/* Regional Presets */}
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-blue-800 mb-2 block">
                        🌍 {t('regionalPresets') || 'Regional Presets'}
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {regionalPresets.map((preset, index) => (
                          <Button
                            key={index}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSharedSettings({
                                ...sharedSettings,
                                gmt: preset.gmt,
                                currency: preset.currency
                              });
                            }}
                            className="text-xs h-8 border-blue-300 text-blue-700 hover:bg-blue-100"
                          >
                            {preset.flag} {preset.name.split(',')[0]}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Shared vs Individual Toggle - Improved Responsive Layout */}
                    <div className="space-y-4 mb-4">
                      {/* Row 1: GMT and Currency */}
                      <div className="grid gap-4 md:grid-cols-2 grid-cols-1">
                        {/* GMT Section */}
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2 mb-3">
                            <input
                              type="checkbox"
                              id="share-gmt"
                              checked={useSharedSettings.gmt}
                              onChange={(e) => setUseSharedSettings({...useSharedSettings, gmt: e.target.checked})}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="share-gmt" className="text-xs font-medium leading-tight">
                              {t('shareGMT') || 'Bagikan GMT'}
                            </Label>
                          </div>
                          <div>
                            {useSharedSettings.gmt ? (
                              <Select
                                value={sharedSettings.gmt}
                                onValueChange={(value) => setSharedSettings({ ...sharedSettings, gmt: value })}
                              >
                                <SelectTrigger className="focus-ring w-full">
                                  <SelectValue placeholder={t('selectGMT') || 'Pilih GMT'} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="GMT-12">GMT-12 (Baker Island)</SelectItem>
                                  <SelectItem value="GMT-11">GMT-11 (American Samoa)</SelectItem>
                                  <SelectItem value="GMT-10">GMT-10 (Hawaii)</SelectItem>
                                  <SelectItem value="GMT-9">GMT-9 (Alaska)</SelectItem>
                                  <SelectItem value="GMT-8">GMT-8 (Los Angeles, PST)</SelectItem>
                                  <SelectItem value="GMT-7">GMT-7 (Denver, MST)</SelectItem>
                                  <SelectItem value="GMT-6">GMT-6 (Chicago, CST)</SelectItem>
                                  <SelectItem value="GMT-5">GMT-5 (New York, EST)</SelectItem>
                                  <SelectItem value="GMT-4">GMT-4 (Atlantic Time)</SelectItem>
                                  <SelectItem value="GMT-3">GMT-3 (Buenos Aires)</SelectItem>
                                  <SelectItem value="GMT-2">GMT-2 (South Georgia)</SelectItem>
                                  <SelectItem value="GMT-1">GMT-1 (Cape Verde)</SelectItem>
                                  <SelectItem value="GMT+0">GMT+0 (London, UTC)</SelectItem>
                                  <SelectItem value="GMT+1">GMT+1 (Berlin, CET)</SelectItem>
                                  <SelectItem value="GMT+2">GMT+2 (Cairo, EET)</SelectItem>
                                  <SelectItem value="GMT+3">GMT+3 (Moscow, MSK)</SelectItem>
                                  <SelectItem value="GMT+4">GMT+4 (Dubai, GST)</SelectItem>
                                  <SelectItem value="GMT+5">GMT+5 (Karachi, PKT)</SelectItem>
                                  <SelectItem value="GMT+6">GMT+6 (Dhaka, BST)</SelectItem>
                                  <SelectItem value="GMT+7">GMT+7 (Jakarta, WIB)</SelectItem>
                                  <SelectItem value="GMT+8">GMT+8 (Singapore, WITA)</SelectItem>
                                  <SelectItem value="GMT+9">GMT+9 (Tokyo, WIT)</SelectItem>
                                  <SelectItem value="GMT+10">GMT+10 (Sydney, AEST)</SelectItem>
                                  <SelectItem value="GMT+11">GMT+11 (Solomon Islands)</SelectItem>
                                  <SelectItem value="GMT+12">GMT+12 (New Zealand, NZST)</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="h-10 flex items-center text-sm text-gray-500 italic">
                                {t('individualPerAccount') || 'Individual per Account'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Currency Section */}
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2 mb-3">
                            <input
                              type="checkbox"
                              id="share-currency"
                              checked={useSharedSettings.currency}
                              onChange={(e) => setUseSharedSettings({...useSharedSettings, currency: e.target.checked})}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="share-currency" className="text-xs font-medium leading-tight">
                              {t('shareCurrency') || 'Bagikan Mata Uang'}
                            </Label>
                          </div>
                          <div>
                            {useSharedSettings.currency ? (
                              <Select
                                value={sharedSettings.currency}
                                onValueChange={(value) => setSharedSettings({ ...sharedSettings, currency: value })}
                              >
                                <SelectTrigger className="focus-ring w-full">
                                  <SelectValue placeholder={t('selectCurrency') || 'Pilih mata uang'} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="IDR">{t('idr')}</SelectItem>
                                  <SelectItem value="USD">{t('usd')}</SelectItem>
                                  <SelectItem value="SGD">SGD (Singapore Dollar)</SelectItem>
                                  <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                                  <SelectItem value="JPY">JPY (Japanese Yen)</SelectItem>
                                  <SelectItem value="AUD">AUD (Australian Dollar)</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="h-10 flex items-center text-sm text-gray-500 italic">
                                {t('individualPerAccount') || 'Individual per Account'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Delivery Method with Multiple Recipients */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="share-delivery"
                            checked={useSharedSettings.delivery_method}
                            onChange={(e) => setUseSharedSettings({...useSharedSettings, delivery_method: e.target.checked})}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="share-delivery" className="text-xs font-medium leading-tight">
                            {t('shareDeliveryMethod') || 'Bagikan Metode Pengiriman'}
                          </Label>
                        </div>
                        
                        {useSharedSettings.delivery_method ? (
                          <div className="space-y-4">
                            {/* Delivery Method Selection */}
                            <div>
                              <Select
                                value={sharedSettings.delivery_method}
                                onValueChange={(value) => setSharedSettings({ ...sharedSettings, delivery_method: value })}
                              >
                                <SelectTrigger className="focus-ring">
                                  <SelectValue placeholder={t('selectDeliveryMethod') || 'Pilih metode pengiriman'} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="BM_ID">{t('businessManagerId')}</SelectItem>
                                  <SelectItem value="EMAIL">{t('emailMethod')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Multiple Recipients for Shared Settings */}
                            {sharedSettings.delivery_method && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs font-medium">
                                    {sharedSettings.delivery_method === "BM_ID" 
                                      ? t('bmIds') || 'BM IDs' 
                                      : t('emailAddresses') || 'Email Addresses'} * ({sharedSettings.shared_recipients.length})
                                  </Label>
                                  <Button
                                    type="button"
                                    onClick={addSharedRecipient}
                                    variant="outline"
                                    size="sm"
                                    className="border-green-300 text-green-700 hover:bg-green-50 text-xs h-7"
                                  >
                                    ➕ {t('addRecipient') || 'Add Recipient'}
                                  </Button>
                                </div>
                                
                                <div className="space-y-2">
                                  {sharedSettings.shared_recipients.map((recipient, recipientIndex) => (
                                    <div key={recipient.id} className="flex items-center space-x-2">
                                      <div className="flex-1">
                                        <Input
                                          type={sharedSettings.delivery_method === "EMAIL" ? "email" : "text"}
                                          placeholder={`${sharedSettings.delivery_method === "BM_ID" 
                                            ? t('enterBMId') || 'Enter BM ID'
                                            : t('enterEmail') || 'Enter Email'} ${recipientIndex + 1}`}
                                          value={recipient.value}
                                          onChange={(e) => updateSharedRecipient(recipient.id, e.target.value)}
                                          className="focus-ring"
                                        />
                                      </div>
                                      {sharedSettings.shared_recipients.length > 1 && (
                                        <Button
                                          type="button"
                                          onClick={() => removeSharedRecipient(recipient.id)}
                                          variant="outline"
                                          size="sm"
                                          className="border-red-200 text-red-600 hover:bg-red-50 px-2 h-9"
                                        >
                                          🗑️
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-10 flex items-center text-sm text-gray-500 italic">
                            {t('individualPerAccount') || 'Individual per Account'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Multiple Accounts */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        {t('facebookAccounts') || 'Facebook Accounts'} ({multipleAccounts.length})
                      </h4>
                      <Button
                        type="button"
                        onClick={addNewAccount}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        data-testid="add-account-button"
                      >
                        ➕ {t('addAnotherAccount') || 'Add Another Account'}
                      </Button>
                    </div>

                    {multipleAccounts.map((account, index) => (
                      <div key={account.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-700">
                            {t('account')} #{index + 1}
                          </h5>
                          {multipleAccounts.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeAccount(account.id)}
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              data-testid={`remove-account-${account.id}`}
                            >
                              🗑️ {t('remove')}
                            </Button>
                          )}
                        </div>

                        <div className="space-y-4">
                          {/* Account Name */}
                          <div className="space-y-2">
                            <Label>{t('accountName')} *</Label>
                            <Input
                              type="text"
                              placeholder={t('accountNamePlaceholder')}
                              value={account.account_name}
                              onChange={(e) => updateAccount(account.id, 'account_name', e.target.value)}
                              className="focus-ring"
                              data-testid={`account-name-${account.id}`}
                            />
                          </div>

                          {/* Individual Delivery Method Selection - Show FIRST when not shared */}
                          {!useSharedSettings.delivery_method && (
                            <div className="space-y-2">
                              <Label>{t('deliveryMethod')} *</Label>
                              <Select
                                value={account.delivery_method}
                                onValueChange={(value) => updateAccount(account.id, 'delivery_method', value)}
                              >
                                <SelectTrigger className="focus-ring">
                                  <SelectValue placeholder={t('selectDeliveryMethod') || 'Pilih metode pengiriman'} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="BM_ID">{t('businessManagerId')}</SelectItem>
                                  <SelectItem value="EMAIL">{t('emailMethod')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Multiple Recipients Section - Show AFTER delivery method selection */}
                          {!useSharedSettings.delivery_method && account.delivery_method && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label>
                                  {account.delivery_method === "BM_ID" ? t('bmIds') || 'BM IDs' : t('emailAddresses') || 'Email Addresses'} * ({account.recipients.length})
                                </Label>
                                <Button
                                  type="button"
                                  onClick={() => addRecipient(account.id)}
                                  variant="outline"
                                  size="sm"
                                  className="border-green-300 text-green-700 hover:bg-green-50 text-xs h-7"
                                >
                                  ➕ {t('addRecipient') || 'Add Recipient'}
                                </Button>
                              </div>
                              
                              <div className="space-y-2">
                                {account.recipients.map((recipient, recipientIndex) => (
                                  <div key={recipient.id} className="flex items-center space-x-2">
                                    <div className="flex-1">
                                      <Input
                                        type={account.delivery_method === "EMAIL" ? "email" : "text"}
                                        placeholder={account.delivery_method === "BM_ID" 
                                          ? `${t('enterBMId')} ${recipientIndex + 1}` 
                                          : `${t('enterEmail')} ${recipientIndex + 1}`}
                                        value={recipient.value}
                                        onChange={(e) => updateRecipient(account.id, recipient.id, e.target.value)}
                                        className="focus-ring"
                                        data-testid={`recipient-${account.id}-${recipient.id}`}
                                      />
                                    </div>
                                    {account.recipients.length > 1 && (
                                      <Button
                                        type="button"
                                        onClick={() => removeRecipient(account.id, recipient.id)}
                                        variant="outline"
                                        size="sm"
                                        className="border-red-200 text-red-600 hover:bg-red-50 px-2 h-9"
                                      >
                                        🗑️
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Show notification when delivery method is shared */}
                          {useSharedSettings.delivery_method && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-700">
                                📨 {t('usingSharedDeliveryMethod') || 'Menggunakan metode pengiriman dan penerima yang dibagikan'}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Individual Settings when not shared */}
                        {(!useSharedSettings.gmt || !useSharedSettings.currency || !useSharedSettings.delivery_method) && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-sm font-medium text-orange-700">
                                ⚙️ {t('individualSettings') || 'Individual Settings'}
                              </Label>
                              <div className="flex space-x-1">
                                {regionalPresets.slice(0, 4).map((preset, presetIndex) => (
                                  <Button
                                    key={presetIndex}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyPresetToAccount(account.id, preset)}
                                    className="text-xs h-6 px-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                                    title={`Apply ${preset.name} settings`}
                                  >
                                    {preset.flag}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            
                            <div className="grid gap-4 xl:grid-cols-3 lg:grid-cols-2 md:grid-cols-1">
                              {!useSharedSettings.gmt && (
                                <div className="flex flex-col">
                                  <Label className="text-sm font-medium mb-2">{t('gmt')} *</Label>
                                  <Select
                                    value={account.gmt}
                                    onValueChange={(value) => updateAccount(account.id, 'gmt', value)}
                                  >
                                    <SelectTrigger className="focus-ring w-full">
                                      <SelectValue placeholder={t('selectGMT') || 'Pilih GMT'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="GMT-12">GMT-12 (Baker Island)</SelectItem>
                                      <SelectItem value="GMT-11">GMT-11 (American Samoa)</SelectItem>
                                      <SelectItem value="GMT-10">GMT-10 (Hawaii)</SelectItem>
                                      <SelectItem value="GMT-9">GMT-9 (Alaska)</SelectItem>
                                      <SelectItem value="GMT-8">GMT-8 (Los Angeles)</SelectItem>
                                      <SelectItem value="GMT-7">GMT-7 (Denver)</SelectItem>
                                      <SelectItem value="GMT-6">GMT-6 (Chicago)</SelectItem>
                                      <SelectItem value="GMT-5">GMT-5 (New York)</SelectItem>
                                      <SelectItem value="GMT-4">GMT-4 (Atlantic)</SelectItem>
                                      <SelectItem value="GMT-3">GMT-3 (Buenos Aires)</SelectItem>
                                      <SelectItem value="GMT-2">GMT-2 (South Georgia)</SelectItem>
                                      <SelectItem value="GMT-1">GMT-1 (Cape Verde)</SelectItem>
                                      <SelectItem value="GMT+0">GMT+0 (London)</SelectItem>
                                      <SelectItem value="GMT+1">GMT+1 (Berlin)</SelectItem>
                                      <SelectItem value="GMT+2">GMT+2 (Cairo)</SelectItem>
                                      <SelectItem value="GMT+3">GMT+3 (Moscow)</SelectItem>
                                      <SelectItem value="GMT+4">GMT+4 (Dubai)</SelectItem>
                                      <SelectItem value="GMT+5">GMT+5 (Karachi)</SelectItem>
                                      <SelectItem value="GMT+6">GMT+6 (Dhaka)</SelectItem>
                                      <SelectItem value="GMT+7">GMT+7 (Jakarta)</SelectItem>
                                      <SelectItem value="GMT+8">GMT+8 (Singapore)</SelectItem>
                                      <SelectItem value="GMT+9">GMT+9 (Tokyo)</SelectItem>
                                      <SelectItem value="GMT+10">GMT+10 (Sydney)</SelectItem>
                                      <SelectItem value="GMT+11">GMT+11 (Solomon Islands)</SelectItem>
                                      <SelectItem value="GMT+12">GMT+12 (New Zealand)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              {!useSharedSettings.currency && (
                                <div className="flex flex-col">
                                  <Label className="text-sm font-medium mb-2">{t('currency')} *</Label>
                                  <Select
                                    value={account.currency}
                                    onValueChange={(value) => updateAccount(account.id, 'currency', value)}
                                  >
                                    <SelectTrigger className="focus-ring w-full">
                                      <SelectValue placeholder={t('selectCurrency') || 'Pilih mata uang'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="IDR">IDR (Indonesian Rupiah)</SelectItem>
                                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                                      <SelectItem value="SGD">SGD (Singapore Dollar)</SelectItem>
                                      <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                                      <SelectItem value="JPY">JPY (Japanese Yen)</SelectItem>
                                      <SelectItem value="AUD">AUD (Australian Dollar)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                            </div>
                          </div>
                        )}

                        <div className="mt-4 space-y-2">
                          <Label>{t('notes')} ({t('optional') || 'Optional'})</Label>
                          <Input
                            type="text"
                            placeholder={t('notesPlaceholder')}
                            value={account.notes}
                            onChange={(e) => updateAccount(account.id, 'notes', e.target.value)}
                            className="focus-ring"
                            data-testid={`notes-${account.id}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bulk Request Summary */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">
                      📋 {t('requestSummary') || 'Request Summary'}
                    </h5>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>• {t('totalAccounts')}: <span className="font-semibold">{multipleAccounts.length}</span></p>
                      <p>• GMT: <span className="font-semibold">
                        {useSharedSettings.gmt ? (sharedSettings.gmt || t('notSelected')) : t('individualPerAccount') || 'Individual per Account'}
                      </span></p>
                      <p>• {t('currency')}: <span className="font-semibold">
                        {useSharedSettings.currency ? (sharedSettings.currency || t('notSelected')) : t('individualPerAccount') || 'Individual per Account'}
                      </span></p>
                      <p>• {t('deliveryMethod')}: <span className="font-semibold">
                        {useSharedSettings.delivery_method ? (sharedSettings.delivery_method || t('notSelected')) : t('individualPerAccount') || 'Individual per Account'}
                      </span></p>
                      
                      {/* Show shared recipients when delivery method is shared */}
                      {useSharedSettings.delivery_method && sharedSettings.delivery_method && (
                        <div className="mt-2 pt-2 border-t border-green-300">
                          <p>• {t('sharedRecipients') || 'Shared Recipients'}: <span className="font-semibold">{sharedSettings.shared_recipients.filter(r => r.value && r.value.trim() !== "").length}</span></p>
                          <div className="ml-4 mt-1 space-y-1">
                            {sharedSettings.shared_recipients
                              .filter(r => r.value && r.value.trim() !== "")
                              .map((recipient, index) => (
                                <p key={recipient.id} className="text-xs">
                                  {index + 1}. {recipient.value}
                                </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Google Ads Interface */}
              {formData.platform === "google" && (
                <div className="space-y-6">
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {t('googleAdsSettings') || 'Google Ads Settings'}
                    </h3>
                    
                    {/* GMT Shared Setting */}
                    <div className="mb-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <input
                          type="checkbox"
                          id="google-share-gmt"
                          checked={useSharedSettings.gmt}
                          onChange={(e) => setUseSharedSettings({...useSharedSettings, gmt: e.target.checked})}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="google-share-gmt" className="text-xs font-medium">
                          {t('shareGMT') || 'Bagikan GMT'}
                        </Label>
                      </div>
                      
                      {useSharedSettings.gmt && (
                        <Select
                          value={sharedSettings.gmt}
                          onValueChange={(value) => setSharedSettings({ ...sharedSettings, gmt: value })}
                        >
                          <SelectTrigger className="focus-ring max-w-md">
                            <SelectValue placeholder={t('selectGMT') || 'Pilih GMT'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GMT-12">GMT-12 (Baker Island)</SelectItem>
                            <SelectItem value="GMT-11">GMT-11 (American Samoa)</SelectItem>
                            <SelectItem value="GMT-10">GMT-10 (Hawaii)</SelectItem>
                            <SelectItem value="GMT-9">GMT-9 (Alaska)</SelectItem>
                            <SelectItem value="GMT-8">GMT-8 (Los Angeles, PST)</SelectItem>
                            <SelectItem value="GMT-7">GMT-7 (Denver, MST)</SelectItem>
                            <SelectItem value="GMT-6">GMT-6 (Chicago, CST)</SelectItem>
                            <SelectItem value="GMT-5">GMT-5 (New York, EST)</SelectItem>
                            <SelectItem value="GMT-4">GMT-4 (Atlantic Time)</SelectItem>
                            <SelectItem value="GMT-3">GMT-3 (Buenos Aires)</SelectItem>
                            <SelectItem value="GMT-2">GMT-2 (South Georgia)</SelectItem>
                            <SelectItem value="GMT-1">GMT-1 (Cape Verde)</SelectItem>
                            <SelectItem value="GMT+0">GMT+0 (London, UTC)</SelectItem>
                            <SelectItem value="GMT+1">GMT+1 (Berlin, CET)</SelectItem>
                            <SelectItem value="GMT+2">GMT+2 (Cairo, EET)</SelectItem>
                            <SelectItem value="GMT+3">GMT+3 (Moscow, MSK)</SelectItem>
                            <SelectItem value="GMT+4">GMT+4 (Dubai, GST)</SelectItem>
                            <SelectItem value="GMT+5">GMT+5 (Karachi, PKT)</SelectItem>
                            <SelectItem value="GMT+6">GMT+6 (Dhaka, BST)</SelectItem>
                            <SelectItem value="GMT+7">GMT+7 (Jakarta, WIB)</SelectItem>
                            <SelectItem value="GMT+8">GMT+8 (Singapore, WITA)</SelectItem>
                            <SelectItem value="GMT+9">GMT+9 (Tokyo, WIT)</SelectItem>
                            <SelectItem value="GMT+10">GMT+10 (Sydney, AEST)</SelectItem>
                            <SelectItem value="GMT+11">GMT+11 (Solomon Islands)</SelectItem>
                            <SelectItem value="GMT+12">GMT+12 (New Zealand, NZST)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Currency Info */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="text-blue-600">💱</div>
                        <div>
                          <p className="font-medium text-blue-900">{t('defaultCurrency') || 'Default Currency'}</p>
                          <p className="text-sm text-blue-700">
                            USD (US Dollar) - {t('googleAdsCurrencyNote') || 'Fixed currency untuk Google Ads, tidak bisa dirubah'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Google Ads Accounts */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          {t('googleAdsAccounts') || 'Google Ads Accounts'} ({googleAccounts.length})
                        </h4>
                        <Button
                          type="button"
                          onClick={addGoogleAccount}
                          variant="outline"
                          size="sm"
                          className="border-green-300 text-green-700 hover:bg-green-50"
                        >
                          ➕ {t('addGoogleAccount') || 'Add Google Account'}
                        </Button>
                      </div>

                      {googleAccounts.map((account, index) => (
                        <Card key={account.id} className="border border-gray-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                {t('googleAccount') || 'Google Account'} #{index + 1}
                              </CardTitle>
                              {googleAccounts.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => removeGoogleAccount(account.id)}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  🗑️ {t('remove') || 'Remove'}
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Account Name */}
                            <div className="space-y-2">
                              <Label>{t('accountName')} *</Label>
                              <Input
                                type="text"
                                placeholder={t('googleAccountNamePlaceholder') || 'Contoh: Google Ads Toko Online'}
                                value={account.account_name}
                                onChange={(e) => updateGoogleAccount(account.id, 'account_name', e.target.value)}
                                className="focus-ring"
                              />
                            </div>

                            {/* Individual GMT (if not shared) */}
                            {!useSharedSettings.gmt && (
                              <div className="space-y-2">
                                <Label>{t('gmt')} *</Label>
                                <Select
                                  value={account.gmt}
                                  onValueChange={(value) => updateGoogleAccount(account.id, 'gmt', value)}
                                >
                                  <SelectTrigger className="focus-ring">
                                    <SelectValue placeholder={t('selectGMT') || 'Pilih GMT'} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="GMT-12">GMT-12 (Baker Island)</SelectItem>
                                    <SelectItem value="GMT-11">GMT-11 (American Samoa)</SelectItem>
                                    <SelectItem value="GMT-10">GMT-10 (Hawaii)</SelectItem>
                                    <SelectItem value="GMT-9">GMT-9 (Alaska)</SelectItem>
                                    <SelectItem value="GMT-8">GMT-8 (Los Angeles)</SelectItem>
                                    <SelectItem value="GMT-7">GMT-7 (Denver)</SelectItem>
                                    <SelectItem value="GMT-6">GMT-6 (Chicago)</SelectItem>
                                    <SelectItem value="GMT-5">GMT-5 (New York)</SelectItem>
                                    <SelectItem value="GMT-4">GMT-4 (Atlantic)</SelectItem>
                                    <SelectItem value="GMT-3">GMT-3 (Buenos Aires)</SelectItem>
                                    <SelectItem value="GMT-2">GMT-2 (South Georgia)</SelectItem>
                                    <SelectItem value="GMT-1">GMT-1 (Cape Verde)</SelectItem>
                                    <SelectItem value="GMT+0">GMT+0 (London)</SelectItem>
                                    <SelectItem value="GMT+1">GMT+1 (Berlin)</SelectItem>
                                    <SelectItem value="GMT+2">GMT+2 (Cairo)</SelectItem>
                                    <SelectItem value="GMT+3">GMT+3 (Moscow)</SelectItem>
                                    <SelectItem value="GMT+4">GMT+4 (Dubai)</SelectItem>
                                    <SelectItem value="GMT+5">GMT+5 (Karachi)</SelectItem>
                                    <SelectItem value="GMT+6">GMT+6 (Dhaka)</SelectItem>
                                    <SelectItem value="GMT+7">GMT+7 (Jakarta)</SelectItem>
                                    <SelectItem value="GMT+8">GMT+8 (Singapore)</SelectItem>
                                    <SelectItem value="GMT+9">GMT+9 (Tokyo)</SelectItem>
                                    <SelectItem value="GMT+10">GMT+10 (Sydney)</SelectItem>
                                    <SelectItem value="GMT+11">GMT+11 (Solomon Islands)</SelectItem>
                                    <SelectItem value="GMT+12">GMT+12 (New Zealand)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Email */}
                            <div className="space-y-2">
                              <Label>{t('email')} *</Label>
                              <Input
                                type="email"
                                placeholder={t('googleEmailPlaceholder') || 'user@domain.com'}
                                value={account.email}
                                onChange={(e) => updateGoogleAccount(account.id, 'email', e.target.value)}
                                className="focus-ring"
                              />
                              <p className="text-xs text-orange-600">
                                ⚠️ {t('googleEmailNote') || 'Gunakan email yang belum pernah tertaut dengan Google Ads sebelumnya'}
                              </p>
                            </div>

                            {/* Website */}
                            <div className="space-y-2">
                              <Label>{t('website')} *</Label>
                              <Input
                                type="url"
                                placeholder={t('websitePlaceholder') || 'https://www.contoh.com'}
                                value={account.website}
                                onChange={(e) => updateGoogleAccount(account.id, 'website', e.target.value)}
                                className="focus-ring"
                              />
                              <p className="text-xs text-gray-500">
                                {t('websiteHint') || 'URL lengkap website yang akan dipromosikan'}
                              </p>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                              <Label>{t('notes')} ({t('optional') || 'Optional'})</Label>
                              <Input
                                type="text"
                                placeholder={t('notesPlaceholder')}
                                value={account.notes}
                                onChange={(e) => updateGoogleAccount(account.id, 'notes', e.target.value)}
                                className="focus-ring"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Google Ads Summary */}
                      {googleAccounts.length > 1 && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h5 className="font-medium text-green-900 mb-2">
                            📋 {t('googleRequestSummary') || 'Google Ads Request Summary'}
                          </h5>
                          <div className="text-sm text-green-700 space-y-1">
                            <p>• {t('totalGoogleAccounts') || 'Total Google Accounts'}: <span className="font-semibold">{googleAccounts.length}</span></p>
                            <p>• GMT: <span className="font-semibold">
                              {useSharedSettings.gmt ? (sharedSettings.gmt || t('notSelected')) : t('individualPerAccount') || 'Individual per Account'}
                            </span></p>
                            <p>• {t('currency')}: <span className="font-semibold">USD (Fixed)</span></p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TikTok Ads Interface */}
              {formData.platform === "tiktok" && (
                <div className="space-y-6">
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {t('tiktokAdsSettings') || 'TikTok Ads Settings'}
                    </h3>
                    
                    {/* GMT Shared Setting */}
                    <div className="mb-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <input
                          type="checkbox"
                          id="tiktok-share-gmt"
                          checked={useSharedSettings.gmt}
                          onChange={(e) => setUseSharedSettings({...useSharedSettings, gmt: e.target.checked})}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="tiktok-share-gmt" className="text-xs font-medium">
                          {t('shareGMT') || 'Bagikan GMT'}
                        </Label>
                      </div>
                      
                      {useSharedSettings.gmt && (
                        <Select
                          value={sharedSettings.gmt}
                          onValueChange={(value) => setSharedSettings({...sharedSettings, gmt: value})}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('selectGMT') || 'Pilih GMT'} />
                          </SelectTrigger>
                          <SelectContent>
                            {gmtOptions.map((gmt) => (
                              <SelectItem key={gmt} value={gmt}>{gmt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* BC ID Shared Setting */}
                    <div className="mb-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <input
                          type="checkbox"
                          id="tiktok-share-bc-id"
                          checked={useSharedSettings.bc_id}
                          onChange={(e) => setUseSharedSettings({...useSharedSettings, bc_id: e.target.checked})}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="tiktok-share-bc-id" className="text-xs font-medium">
                          {t('shareBcId') || 'Bagikan BC ID'}
                        </Label>
                      </div>
                      
                      {useSharedSettings.bc_id && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-red-700">
                            {t('sharedBcId') || 'BC ID Bersama'}
                          </Label>
                          <input
                            type="text"
                            value={sharedSettings.bc_id}
                            onChange={(e) => setSharedSettings({...sharedSettings, bc_id: e.target.value})}
                            className="w-full px-3 py-2 text-sm border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder={t('bcIdPlaceholder') || 'Masukkan BC ID TikTok Business Center'}
                          />
                        </div>
                      )}
                    </div>

                    {/* Fixed USD Currency Info */}
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-600">💰</span>
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            {t('fixedCurrencyUSD') || 'Mata Uang: USD (Tetap)'}
                          </p>
                          <p className="text-xs text-yellow-600">
                            {t('tiktokUsdNote') || 'TikTok Ads menggunakan mata uang USD dan tidak dapat dirubah'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* TikTok Ads Accounts */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-md font-medium text-gray-800">
                          {t('tiktokAdsAccounts') || 'TikTok Ads Accounts'} ({tiktokAccounts.length})
                        </h4>
                        <Button
                          type="button"
                          onClick={addTiktokAccount}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          ➕ {t('addTiktokAccount') || 'Tambah Akun TikTok'}
                        </Button>
                      </div>

                      {tiktokAccounts.map((account, index) => (
                        <Card key={account.id} className="border-red-200 bg-red-50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm text-red-800">
                                🎵 TikTok Account #{index + 1}
                              </CardTitle>
                              {tiktokAccounts.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => removeTiktokAccount(account.id)}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs text-red-600 border-red-300 hover:bg-red-100"
                                >
                                  🗑️ {t('remove') || 'Hapus'}
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Account Name */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-red-700">
                                {t('accountName') || 'Nama Akun'} *
                              </Label>
                              <input
                                type="text"
                                value={account.account_name}
                                onChange={(e) => updateTiktokAccount(account.id, 'account_name', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder={t('tiktokAccountPlaceholder') || 'Masukkan nama akun TikTok Ads'}
                              />
                            </div>

                            {/* GMT Selection (Individual or Shared) */}
                            {!useSharedSettings.gmt && (
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-red-700">
                                  {t('gmt') || 'GMT'} *
                                </Label>
                                <Select
                                  value={account.gmt}
                                  onValueChange={(value) => updateTiktokAccount(account.id, 'gmt', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('selectGMT') || 'Pilih GMT'} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {gmtOptions.map((gmt) => (
                                      <SelectItem key={gmt} value={gmt}>{gmt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* BC ID (Individual or Shared) */}
                            {!useSharedSettings.bc_id && (
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-red-700">
                                  {t('bcId') || 'BC ID (Business Center ID)'} *
                                </Label>
                                <input
                                  type="text"
                                  value={account.bc_id}
                                  onChange={(e) => updateTiktokAccount(account.id, 'bc_id', e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                  placeholder={t('bcIdPlaceholder') || 'Masukkan BC ID TikTok Business Center'}
                                />
                              </div>
                            )}

                            {/* Website */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-red-700">
                                {t('website') || 'Website'} *
                              </Label>
                              <input
                                type="url"
                                value={account.website}
                                onChange={(e) => updateTiktokAccount(account.id, 'website', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="https://example.com"
                              />
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-red-700">
                                {t('notes') || 'Catatan'} ({t('optional') || 'Opsional'})
                              </Label>
                              <textarea
                                value={account.notes}
                                onChange={(e) => updateTiktokAccount(account.id, 'notes', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder={t('notesPlaceholder') || 'Tambahan informasi untuk akun ini'}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">{t('requestSummary') || 'Ringkasan Request'}:</h4>
                      <div className="space-y-1 text-sm text-red-700">
                        {tiktokAccounts.length > 1 && (
                          <div className="space-y-1">
                            <p>• {t('totalTiktokAccounts') || 'Total TikTok Accounts'}: <span className="font-semibold">{tiktokAccounts.length}</span></p>
                          </div>
                        )}
                        <p>• {t('platform') || 'Platform'}: <span className="font-semibold">TikTok Ads</span></p>
                        <p>• {t('currency') || 'Mata Uang'}: <span className="font-semibold">USD</span></p>
                        <p>• {t('gmt') || 'GMT'}: <span className="font-semibold">{useSharedSettings.gmt ? sharedSettings.gmt || t('notSelected') : t('individual')}</span></p>
                        <p>• {t('bcId') || 'BC ID'}: <span className="font-semibold">{useSharedSettings.bc_id ? sharedSettings.bc_id || t('notSelected') : t('individual')}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white btn-hover"
                disabled={loading || submitting}
                data-testid="request-account-submit-button"
              >
                {loading || submitting ? (
                  <>
                    <div className="spinner mr-2"></div>
                    {t('sendingRequest')}
                  </>
                ) : (
                  t('sendRequest')
                )}
              </Button>
            </form>

            {/* Platform Info */}
            <div className="mt-6 space-y-3">
              <h4 className="font-medium text-gray-900">{t('availablePlatforms') || 'Platform Tersedia'}</h4>
              {platforms.map((platform) => (
                <div key={platform.value} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12">
                    {getPlatformIcon(platform.value)}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-medium text-gray-900 mb-1">{platform.label}</p>
                    <p className="text-sm text-gray-600 break-words [overflow-wrap:anywhere] leading-relaxed">{platform.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Existing Accounts */}
        <Card className="glass-card max-w-full overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t('yourAccounts') || 'Your Accounts'}
              <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                {accounts.length} {t('accounts') || 'Accounts'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {t('existingAccountsList') || 'List of your existing ad accounts'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accounts.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-gray-500">{t('noAccounts')}</p>
                  <p className="text-sm text-gray-400 mt-1">{t('createFirstAccountHint') || 'Request your first account using the form on the left'}</p>
                </div>
              ) : (
                <>
                  {accounts.slice(0, 5).map((account) => (
                    <div key={account.id} className="p-3 sm:p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                      {/* Mobile: Stack vertically, Desktop: Horizontal */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Icon and Main Info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {getPlatformIcon(account.platform)}
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* Account Name and Status */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-medium text-gray-900 break-words [overflow-wrap:anywhere] flex-1" title={account.account_name}>
                                {account.account_name && account.account_name.length > 30 
                                  ? account.account_name.substring(0, 30) + '...' 
                                  : account.account_name}
                              </p>
                              <div className="flex-shrink-0">{getStatusBadge(account.status)}</div>
                            </div>
                            {/* Account ID and Platform */}
                            <p className="text-sm text-gray-500 break-all">ID: {account.account_id}</p>
                            <p className="text-sm text-gray-500">
                              {t('platform')}: {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                            </p>
                            {/* Facebook-specific details */}
                            {account.platform === "facebook" && account.gmt && (
                              <div className="mt-2 text-xs text-blue-600 space-y-1">
                                <div className="break-words">GMT: {account.gmt} | {t('currency')}: {account.currency}</div>
                                <div className="break-words">{t('deliveryMethod')}: {account.delivery_method}</div>
                                <div className="break-words">Contact: {account.bm_id_or_email}</div>
                                {account.notes && <div className="break-words">{t('notes')}: {account.notes}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Balance - Mobile: Full width, Desktop: Right aligned */}
                        <div className="flex justify-between sm:flex-col sm:items-end sm:text-right pl-11 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                          <p className="text-sm font-medium text-gray-900">{t('balance') || 'Saldo'}</p>
                          <p className="text-base sm:text-lg font-bold text-teal-600 break-all">
                            {account.currency === 'USD' ? '$' : account.currency === 'IDR' ? 'Rp' : account.currency} {account.balance?.toLocaleString(account.currency === 'USD' ? 'en-US' : 'id-ID') || '0'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {accounts.length > 5 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2 border-teal-600 text-teal-600 hover:bg-teal-50"
                      onClick={() => window.location.href = '/dashboard/kelola-akun'}
                    >
                      Lihat Semua di Kelola Akun ({accounts.length} akun)
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Group Modal */}
      <Dialog open={showCreateGroupModal} onOpenChange={setShowCreateGroupModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('createNewGroup') || 'Buat Grup Baru'}</DialogTitle>
            <DialogDescription>
              {t(`createGroupDescription${formData.platform.charAt(0).toUpperCase() + formData.platform.slice(1)}`) || t('createGroupDescription') || 'Buat grup untuk mengorganisir akun Anda berdasarkan project atau campaign.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-group-name">{t('groupName') || 'Nama Grup'} *</Label>
              <Input
                id="new-group-name"
                placeholder={t('groupNamePlaceholder') || 'Contoh: Facebook Accounts Toko Online Q4 2024'}
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="focus-ring"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    createGroup();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateGroupModal(false);
                setNewGroupName("");
              }}
            >
              {t('cancel') || 'Batal'}
            </Button>
            <Button
              type="button"
              onClick={createGroup}
              className="bg-teal-600 hover:bg-teal-700"
              disabled={!newGroupName.trim()}
            >
              {t('createGroup') || 'Buat Grup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestAccount;