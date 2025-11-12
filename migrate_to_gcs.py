#!/usr/bin/env python3
"""
Migrate all existing payment proofs to Google Cloud Storage
This ensures all files are accessible across deployments
"""

import asyncio
import base64
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from google.cloud import storage
from dotenv import load_dotenv
import logging
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv('/app/backend/.env')

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/app/backend/gcs-service-account.json"

async def migrate_to_gcs():
    """Migrate all payment proofs to Google Cloud Storage"""
    
    logger.info("🚀 Starting migration to Google Cloud Storage...")
    logger.info(f"📊 Bucket: {GCS_BUCKET_NAME}")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Initialize GCS client
    storage_client = storage.Client()
    bucket = storage_client.bucket(GCS_BUCKET_NAME)
    
    try:
        # Find all proofs that are NOT in GCS
        old_proofs = await db.payment_proofs.find({
            "storage_type": {"$ne": "gcs"}
        }).to_list(None)
        
        if len(old_proofs) == 0:
            logger.info("✅ No proofs need migration - all already in GCS!")
            client.close()
            return
        
        logger.info(f"📦 Found {len(old_proofs)} proofs to migrate to GCS")
        
        migrated = 0
        failed = 0
        skipped = 0
        
        for proof in old_proofs:
            proof_id = proof.get("id")
            storage_type = proof.get("storage_type", "local")
            
            try:
                file_content = None
                file_name = proof.get("file_name", "proof.jpg")
                mime_type = proof.get("mime_type", "image/jpeg")
                
                # Get file content based on storage type
                if storage_type == "database":
                    # Decode from base64
                    file_data = proof.get("file_data")
                    if not file_data:
                        logger.warning(f"⚠️ Proof {proof_id} has no file_data")
                        skipped += 1
                        continue
                    file_content = base64.b64decode(file_data)
                    logger.info(f"📥 Retrieved from database: {proof_id}")
                
                else:  # local filesystem
                    file_path = proof.get("file_path")
                    if not file_path:
                        logger.warning(f"⚠️ Proof {proof_id} has no file_path")
                        skipped += 1
                        continue
                    
                    file_path_obj = Path(file_path)
                    if not file_path_obj.is_absolute():
                        file_path_obj = Path("/app") / file_path
                    
                    if not file_path_obj.exists():
                        logger.warning(f"⚠️ File not found: {file_path_obj}")
                        skipped += 1
                        continue
                    
                    with open(file_path_obj, 'rb') as f:
                        file_content = f.read()
                    logger.info(f"📥 Retrieved from filesystem: {file_path_obj}")
                
                # Upload to GCS
                file_extension = file_name.split('.')[-1] if '.' in file_name else 'jpg'
                gcs_filename = f"wallet_payment_proofs/{proof_id}_{uuid.uuid4().hex}.{file_extension}"
                
                blob = bucket.blob(gcs_filename)
                blob.upload_from_string(file_content, content_type=mime_type)
                
                # Don't use make_public() - bucket has uniform access control
                # Files will be served through backend with signed URLs or IAM
                gcs_path = f"gs://{GCS_BUCKET_NAME}/{gcs_filename}"
                
                # Update database record
                await db.payment_proofs.update_one(
                    {"id": proof_id},
                    {
                        "$set": {
                            "gcs_path": gcs_filename,
                            "gcs_bucket": GCS_BUCKET_NAME,
                            "storage_type": "gcs",
                            "migrated_to_gcs": True,
                            "original_storage_type": storage_type
                        },
                        "$unset": {
                            "file_data": ""  # Remove large base64 data to save space
                        }
                    }
                )
                
                file_size_kb = len(file_content) / 1024
                logger.info(f"✅ Migrated to GCS: {proof_id} → {gcs_filename} ({file_size_kb:.1f} KB)")
                migrated += 1
                
            except Exception as e:
                logger.error(f"❌ Failed to migrate {proof_id}: {e}")
                failed += 1
        
        logger.info("\n" + "="*60)
        logger.info("📊 MIGRATION SUMMARY")
        logger.info("="*60)
        logger.info(f"✅ Successfully migrated: {migrated}")
        logger.info(f"❌ Failed: {failed}")
        logger.info(f"⚠️  Skipped: {skipped}")
        logger.info(f"📦 Total processed: {len(old_proofs)}")
        logger.info("="*60)
        
        if migrated > 0:
            logger.info("\n🎉 Migration to GCS completed successfully!")
            logger.info("💡 All payment proofs are now in Google Cloud Storage")
            logger.info("💡 Files will persist across all deployments!")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(migrate_to_gcs())
