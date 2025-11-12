"""
Google Cloud Storage Integration Module
Provides file upload, download, and management functionality using GCS buckets
"""
import os
import uuid
import json
import base64
import tempfile
from typing import Optional, BinaryIO
from google.cloud import storage
from google.cloud.exceptions import NotFound, GoogleCloudError
from google.oauth2 import service_account
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

class GCSStorage:
    """Google Cloud Storage client wrapper for file operations"""
    
    def __init__(self):
        """Initialize GCS client and bucket"""
        self.project_id = os.environ.get("GCS_PROJECT_ID")
        self.bucket_name = os.environ.get("GCS_BUCKET_NAME")
        credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        credentials_base64 = os.environ.get("GCS_CREDENTIALS_BASE64")
        
        if not all([self.project_id, self.bucket_name]):
            raise ValueError("GCS configuration missing. Check GCS_PROJECT_ID, GCS_BUCKET_NAME")
        
        try:
            # Try to use base64 credentials first (for deployment)
            if credentials_base64:
                logger.info("Using base64-encoded GCS credentials")
                credentials_json = base64.b64decode(credentials_base64).decode('utf-8')
                credentials_dict = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_dict)
                self.client = storage.Client(project=self.project_id, credentials=credentials)
            # Fallback to credentials file path (for local development)
            elif credentials_path:
                logger.info(f"Using GCS credentials from file: {credentials_path}")
                self.client = storage.Client(project=self.project_id)
            else:
                raise ValueError("No GCS credentials provided. Set either GCS_CREDENTIALS_BASE64 or GOOGLE_APPLICATION_CREDENTIALS")
            
            self.bucket = self.client.bucket(self.bucket_name)
            
            # Skip bucket existence check - assume bucket exists and service account has proper access
            # Note: bucket.exists() requires storage.buckets.get permission which we may not have
            logger.info(f"Connected to GCS - Bucket: {self.bucket_name}, Project: {self.project_id}")
                
        except Exception as e:
            logger.error(f"Failed to initialize GCS client: {e}")
            raise
    
    def upload_file(
        self,
        file_obj: BinaryIO,
        destination_path: str,
        content_type: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> str:
        """
        Upload file to GCS bucket
        
        Args:
            file_obj: File-like object to upload
            destination_path: Path in bucket (e.g., "payment-proofs/file.jpg")
            content_type: MIME type of file
            metadata: Optional metadata dict
            
        Returns:
            str: Blob name (path) in bucket
        """
        try:
            blob = self.bucket.blob(destination_path)
            
            # Set content type if provided
            if content_type:
                blob.content_type = content_type
            
            # Set custom metadata if provided
            if metadata:
                blob.metadata = metadata
            
            # Upload file
            blob.upload_from_file(file_obj, rewind=True)
            
            logger.info(f"File uploaded successfully to {destination_path}")
            return destination_path
            
        except GoogleCloudError as e:
            logger.error(f"Failed to upload file to GCS: {e}")
            raise Exception(f"Upload failed: {str(e)}")
    
    def download_file(self, blob_name: str) -> bytes:
        """
        Download file from GCS bucket
        
        Args:
            blob_name: Path of file in bucket
            
        Returns:
            bytes: File content
        """
        try:
            blob = self.bucket.blob(blob_name)
            
            if not blob.exists():
                raise FileNotFoundError(f"File not found: {blob_name}")
            
            content = blob.download_as_bytes()
            logger.info(f"File downloaded successfully: {blob_name}")
            return content
            
        except NotFound:
            logger.error(f"Blob not found: {blob_name}")
            raise FileNotFoundError(f"File not found: {blob_name}")
        except GoogleCloudError as e:
            logger.error(f"Failed to download file from GCS: {e}")
            raise Exception(f"Download failed: {str(e)}")
    
    def get_signed_url(
        self,
        blob_name: str,
        expiration_minutes: int = 60
    ) -> str:
        """
        Generate signed URL for temporary access to file
        
        Args:
            blob_name: Path of file in bucket
            expiration_minutes: URL validity duration in minutes
            
        Returns:
            str: Signed URL
        """
        try:
            blob = self.bucket.blob(blob_name)
            
            if not blob.exists():
                raise FileNotFoundError(f"File not found: {blob_name}")
            
            # Generate signed URL with expiration
            url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(minutes=expiration_minutes),
                method="GET"
            )
            
            logger.info(f"Generated signed URL for {blob_name}, expires in {expiration_minutes} minutes")
            return url
            
        except NotFound:
            logger.error(f"Blob not found: {blob_name}")
            raise FileNotFoundError(f"File not found: {blob_name}")
        except GoogleCloudError as e:
            logger.error(f"Failed to generate signed URL: {e}")
            raise Exception(f"Signed URL generation failed: {str(e)}")
    
    def delete_file(self, blob_name: str) -> bool:
        """
        Delete file from GCS bucket
        
        Args:
            blob_name: Path of file in bucket
            
        Returns:
            bool: True if deleted successfully
        """
        try:
            blob = self.bucket.blob(blob_name)
            blob.delete()
            logger.info(f"File deleted successfully: {blob_name}")
            return True
            
        except NotFound:
            logger.warning(f"File not found for deletion: {blob_name}")
            return False
        except GoogleCloudError as e:
            logger.error(f"Failed to delete file from GCS: {e}")
            raise Exception(f"Delete failed: {str(e)}")
    
    def file_exists(self, blob_name: str) -> bool:
        """
        Check if file exists in bucket
        
        Args:
            blob_name: Path of file in bucket
            
        Returns:
            bool: True if file exists
        """
        try:
            blob = self.bucket.blob(blob_name)
            return blob.exists()
        except GoogleCloudError as e:
            logger.error(f"Failed to check file existence: {e}")
            return False
    
    def get_file_metadata(self, blob_name: str) -> dict:
        """
        Get file metadata without downloading content
        
        Args:
            blob_name: Path of file in bucket
            
        Returns:
            dict: Metadata including size, content_type, created_at
        """
        try:
            blob = self.bucket.blob(blob_name)
            blob.reload()
            
            return {
                "name": blob.name,
                "size": blob.size,
                "content_type": blob.content_type,
                "created_at": blob.time_created,
                "updated_at": blob.updated,
                "metadata": blob.metadata or {}
            }
            
        except NotFound:
            raise FileNotFoundError(f"File not found: {blob_name}")
        except GoogleCloudError as e:
            logger.error(f"Failed to get file metadata: {e}")
            raise Exception(f"Metadata retrieval failed: {str(e)}")
    
    @staticmethod
    def generate_unique_filename(original_filename: str, prefix: str = "") -> str:
        """
        Generate unique filename with UUID to prevent collisions
        
        Args:
            original_filename: Original uploaded filename
            prefix: Optional prefix for organization (e.g., "user-123/")
            
        Returns:
            str: Unique filename path
        """
        # Sanitize original filename
        safe_filename = "".join(c for c in original_filename if c.isalnum() or c in ".-_")
        
        # Generate UUID
        unique_id = str(uuid.uuid4())
        
        # Combine prefix, UUID, and safe filename
        if prefix:
            return f"{prefix}/{unique_id}-{safe_filename}"
        return f"{unique_id}-{safe_filename}"


# Global instance
_gcs_storage_instance = None

def get_gcs_storage() -> GCSStorage:
    """Get or create global GCS storage instance"""
    global _gcs_storage_instance
    if _gcs_storage_instance is None:
        _gcs_storage_instance = GCSStorage()
    return _gcs_storage_instance
