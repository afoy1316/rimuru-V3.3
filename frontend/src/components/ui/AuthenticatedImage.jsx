import React, { useState, useEffect } from 'react';

/**
 * Component to display images that require authentication
 * Fetches the image with Bearer token and creates a blob URL
 */
const AuthenticatedImage = ({ 
  src, 
  alt, 
  className, 
  onError,
  fallbackText = "Preview not available" 
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    let objectUrl = null;

    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(false);

        const token = localStorage.getItem('admin_token');
        if (!token) {
          throw new Error('No authentication token');
        }

        const response = await fetch(src, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);

        if (mounted) {
          setImageSrc(objectUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load authenticated image:', err);
        if (mounted) {
          setError(true);
          setLoading(false);
          if (onError) onError(err);
        }
      }
    };

    if (src) {
      fetchImage();
    }

    // Cleanup function to revoke blob URL
    return () => {
      mounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]); // Removed onError from dependencies to prevent unnecessary re-runs

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className || ''}`}>
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className || ''}`}>
        <div className="text-gray-400 text-sm">{fallbackText}</div>
      </div>
    );
  }

  return (
    <img 
      src={imageSrc} 
      alt={alt} 
      className={className}
      onError={(e) => {
        setError(true);
        if (onError) onError(e);
      }}
    />
  );
};

export default AuthenticatedImage;
