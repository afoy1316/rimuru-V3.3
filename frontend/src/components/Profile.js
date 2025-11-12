import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { Eye, EyeOff, Upload, User } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now()); // Force image refresh
  
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    display_name: "",
    phone_number: "",
    address: "",
    company_name: "",
    profile_picture: ""
  });

  const [profileForm, setProfileForm] = useState({
    display_name: "",
    phone_number: "",
    address: "",
    company_name: "",
    current_password: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [profilePictureBlob, setProfilePictureBlob] = useState(null);
  const [loadingProfilePicture, setLoadingProfilePicture] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profileData.profile_picture) {
      // Clear old blob URL before fetching new one
      if (profilePictureBlob) {
        URL.revokeObjectURL(profilePictureBlob);
      }
      fetchProfilePictureBlob(profileData.profile_picture);
    }
    return () => {
      // Cleanup blob URL on unmount
      if (profilePictureBlob) {
        URL.revokeObjectURL(profilePictureBlob);
      }
    };
  }, [profileData.profile_picture]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProfileData(response.data);
      setProfileForm({
        display_name: response.data.display_name || "",
        phone_number: response.data.phone_number || "",
        address: response.data.address || "",
        company_name: response.data.company_name || "",
        current_password: ""
      });
    } catch (error) {
      toast.error("Failed to load profile");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPicture = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await axios.post(`${API}/profile/picture`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success("Profile picture uploaded successfully!");
      
      // Update profileData immediately with new profile_picture path from backend
      if (response.data.profile_picture) {
        setProfileData(prev => ({
          ...prev,
          profile_picture: response.data.profile_picture
        }));
      }
      
      // Clear selections and preview
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Clear old blob URL to force re-fetch from GCS
      if (profilePictureBlob) {
        URL.revokeObjectURL(profilePictureBlob);
        setProfilePictureBlob(null);
      }
      
      // Reload complete profile data from backend
      await fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to upload profile picture");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!profileForm.current_password) {
      toast.error("Current password is required");
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/profile`, profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Profile updated successfully!");
      setProfileForm({ ...profileForm, current_password: "" });
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/profile/password`, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Password changed successfully! Logging out...");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
      
      // Auto logout after password change (security best practice)
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userType");
        navigate("/login");
      }, 2000); // Wait 2 seconds to show success message
      
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (profileData.display_name) {
      return profileData.display_name.substring(0, 2).toUpperCase();
    }
    return profileData.username ? profileData.username.substring(0, 2).toUpperCase() : "U";
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>

      {/* Profile Picture Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
        
        <div className="flex items-start space-x-6">
          {/* Profile Picture Display */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center border-4 border-gray-300" style={{ backgroundColor: profilePictureBlob || previewUrl ? 'transparent' : '#e5e7eb' }}>
              {loadingProfilePicture ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              ) : previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              ) : profilePictureBlob ? (
                <img 
                  src={profilePictureBlob}
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-4xl font-bold text-gray-500">
                  {getInitials()}
                </div>
              )}
            </div>
          </div>

          {/* Upload Controls */}
          <div className="flex-grow">
            <p className="text-sm text-gray-600 mb-4">
              Upload a profile picture (JPEG, PNG, or WebP, max 5MB)
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              id="profile-pic-input"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex items-center space-x-3">
              <label
                htmlFor="profile-pic-input"
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </label>
              
              {selectedFile && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 break-all flex-1 min-w-0">{selectedFile.name}</span>
                  <button
                    onClick={handleUploadPicture}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex-shrink-0"
                  >
                    {loading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={profileData.username}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={profileForm.display_name}
              onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={profileForm.phone_number}
              onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={profileForm.company_name}
              onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword.current ? "text" : "password"}
                value={profileForm.current_password}
                onChange={(e) => setProfileForm({ ...profileForm, current_password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {showPassword.current ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-teal-600 text-white rounded-md shadow-sm font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showPassword.current ? "text" : "password"}
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {showPassword.current ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword.new ? "text" : "password"}
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {showPassword.new ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {showPassword.confirm ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-teal-600 text-white rounded-md shadow-sm font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
