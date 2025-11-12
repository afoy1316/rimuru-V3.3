import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

export const useRequestClaim = (requestType) => {
  const [claimedRequests, setClaimedRequests] = useState(new Map());
  const [pollingInterval, setPollingInterval] = useState(null);

  const checkClaimStatus = useCallback(async (requestId) => {
    // This will be called by parent component after fetching requests
    // to update claimed status from server response
  }, []);

  const claimRequest = async (requestId) => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await axios.post(
        `${API}/api/admin/requests/${requestType}/${requestId}/claim`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success(response.data.message || 'Request berhasil diklaim');
      return true;
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Gagal mengklaim request');
      }
      return false;
    }
  };

  const releaseRequest = async (requestId) => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await axios.post(
        `${API}/api/admin/requests/${requestType}/${requestId}/release`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success(response.data.message || 'Request berhasil direlease');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal merelease request');
      return false;
    }
  };

  const forceReleaseRequest = async (requestId) => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await axios.post(
        `${API}/api/admin/requests/${requestType}/${requestId}/force-release`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success(response.data.message || 'Request berhasil di-force release');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal force release request');
      return false;
    }
  };

  const isClaimedByMe = (request) => {
    const currentAdminUsername = localStorage.getItem('admin_username');
    return request?.claimed_by_username === currentAdminUsername;
  };

  const isClaimedByOther = (request) => {
    const currentAdminUsername = localStorage.getItem('admin_username');
    return request?.claimed_by && request?.claimed_by_username !== currentAdminUsername;
  };

  const getClaimTimeElapsed = (claimedAt) => {
    if (!claimedAt) return null;
    
    const claimTime = new Date(claimedAt);
    const now = new Date();
    const diffMs = now - claimTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} jam yang lalu`;
  };

  return {
    claimRequest,
    releaseRequest,
    forceReleaseRequest,
    isClaimedByMe,
    isClaimedByOther,
    getClaimTimeElapsed
  };
};
