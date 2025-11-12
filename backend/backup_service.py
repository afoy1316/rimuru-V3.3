"""
Database Backup Service
Handles backup and restore operations for MongoDB collections
"""

import os
import json
import gzip
from datetime import datetime, timezone
from typing import List, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging
from gcs_storage import get_gcs_storage

logger = logging.getLogger(__name__)

# Collections to backup
BACKUP_COLLECTIONS = [
    # User & Admin Data
    'users',
    'admin_users',
    
    # Request & Transaction Data
    'topup_requests',
    'ad_account_requests',
    'wallet_topup_requests',
    'wallet_transfers',
    'withdraw_requests',
    'share_requests',
    'transactions',
    
    # Account Data
    'ad_accounts',
    'account_groups',
    
    # Notification Data
    'notifications',
    'client_notifications',
    'admin_notifications',
    
    # Supporting Data
    'payment_proofs',
    'admin_settings',
    'admin_actions',
    'currency_exchanges',
    
    # Backup/Restore History (for audit trail)
    'backup_history',
    'restore_history'
]

def serialize_mongo_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    
    if isinstance(doc, list):
        return [serialize_mongo_doc(item) for item in doc]
    
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                continue  # Skip MongoDB ObjectId
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, (dict, list)):
                result[key] = serialize_mongo_doc(value)
            else:
                result[key] = value
        return result
    
    return doc

def remove_object_id(doc):
    """Remove _id field from MongoDB document"""
    if isinstance(doc, dict):
        doc.pop('_id', None)
        return doc
    return doc

async def create_backup(db: AsyncIOMotorDatabase, backup_type: str = "manual") -> Dict:
    """
    Create a full database backup
    
    Args:
        db: MongoDB database instance
        backup_type: "manual", "incremental", or "scheduled"
    
    Returns:
        Dict with backup metadata and file path
    """
    try:
        timestamp = datetime.now(timezone.utc)
        backup_id = timestamp.strftime("%Y%m%d_%H%M%S")
        
        backup_data = {
            "backup_id": backup_id,
            "backup_date": timestamp.isoformat(),
            "backup_type": backup_type,
            "collections": {}
        }
        
        # Backup each collection
        for collection_name in BACKUP_COLLECTIONS:
            try:
                collection = db[collection_name]
                documents = await collection.find().to_list(length=None)
                
                # Serialize documents
                serialized_docs = [serialize_mongo_doc(doc) for doc in documents]
                
                backup_data["collections"][collection_name] = {
                    "count": len(serialized_docs),
                    "documents": serialized_docs
                }
                
                logger.info(f"Backed up {len(serialized_docs)} documents from {collection_name}")
                
            except Exception as e:
                logger.error(f"Error backing up collection {collection_name}: {e}")
                backup_data["collections"][collection_name] = {
                    "error": str(e),
                    "count": 0,
                    "documents": []
                }
        
        # Convert to JSON
        json_data = json.dumps(backup_data, indent=2, ensure_ascii=False)
        
        # Compress with gzip
        compressed_data = gzip.compress(json_data.encode('utf-8'))
        
        # Create filename
        filename = f"backup_{backup_type}_{backup_id}.json.gz"
        local_path = f"/tmp/{filename}"
        
        # Save locally (temporary)
        with open(local_path, 'wb') as f:
            f.write(compressed_data)
        
        # Upload to GCS
        gcs_folder = "database_backups"
        gcs_path = f"{gcs_folder}/{filename}"
        
        try:
            gcs_storage = get_gcs_storage()
            with open(local_path, 'rb') as f:
                gcs_url = gcs_storage.upload_file(f, gcs_path, content_type='application/gzip')
            logger.info(f"Backup uploaded to GCS: {gcs_url}")
        except Exception as e:
            logger.error(f"Failed to upload backup to GCS: {e}")
            gcs_url = None
        
        # Save backup metadata to database
        backup_metadata = {
            "backup_id": backup_id,
            "backup_date": timestamp.isoformat(),
            "backup_type": backup_type,
            "filename": filename,
            "gcs_url": gcs_url,
            "local_path": local_path,
            "file_size": len(compressed_data),
            "collections_count": len(backup_data["collections"]),
            "total_documents": sum(
                coll.get("count", 0) 
                for coll in backup_data["collections"].values()
            ),
            "status": "completed"
        }
        
        await db.backup_history.insert_one(backup_metadata)
        
        return {
            "success": True,
            "backup_id": backup_id,
            "filename": filename,
            "gcs_url": gcs_url,
            "local_path": local_path,
            "metadata": backup_metadata
        }
        
    except Exception as e:
        logger.error(f"Error creating backup: {e}")
        return {
            "success": False,
            "error": str(e)
        }

async def get_backup_history(db: AsyncIOMotorDatabase, limit: int = 20) -> List[Dict]:
    """Get list of available backups"""
    try:
        backups = await db.backup_history.find().sort("backup_date", -1).limit(limit).to_list(length=limit)
        
        result = []
        for backup in backups:
            # Remove MongoDB _id
            backup.pop('_id', None)
            result.append(backup)
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting backup history: {e}")
        return []

async def restore_backup(db: AsyncIOMotorDatabase, backup_file_path: str, selected_collections: Optional[List[str]] = None) -> Dict:
    """
    Restore database from backup file
    
    Args:
        db: MongoDB database instance
        backup_file_path: Path to backup file
        selected_collections: List of collections to restore (None = all)
    
    Returns:
        Dict with restore results
    """
    try:
        # Read and decompress backup file
        with gzip.open(backup_file_path, 'rb') as f:
            json_data = f.read().decode('utf-8')
        
        backup_data = json.loads(json_data)
        
        collections_to_restore = selected_collections or list(backup_data["collections"].keys())
        
        restore_results = {
            "backup_id": backup_data.get("backup_id"),
            "backup_date": backup_data.get("backup_date"),
            "collections": {}
        }
        
        for collection_name in collections_to_restore:
            try:
                if collection_name not in backup_data["collections"]:
                    restore_results["collections"][collection_name] = {
                        "status": "skipped",
                        "reason": "not found in backup"
                    }
                    continue
                
                collection_data = backup_data["collections"][collection_name]
                documents = collection_data.get("documents", [])
                
                if not documents:
                    restore_results["collections"][collection_name] = {
                        "status": "skipped",
                        "reason": "no documents"
                    }
                    continue
                
                # Clear existing collection
                collection = db[collection_name]
                delete_result = await collection.delete_many({})
                
                # Insert backup documents
                if documents:
                    await collection.insert_many(documents)
                
                restore_results["collections"][collection_name] = {
                    "status": "success",
                    "deleted": delete_result.deleted_count,
                    "inserted": len(documents)
                }
                
                logger.info(f"Restored {len(documents)} documents to {collection_name}")
                
            except Exception as e:
                logger.error(f"Error restoring collection {collection_name}: {e}")
                restore_results["collections"][collection_name] = {
                    "status": "error",
                    "error": str(e)
                }
        
        # Save restore metadata
        restore_metadata = {
            "restore_date": datetime.now(timezone.utc).isoformat(),
            "backup_id": backup_data.get("backup_id"),
            "backup_date": backup_data.get("backup_date"),
            "collections_restored": collections_to_restore,
            "results": restore_results
        }
        
        await db.restore_history.insert_one(restore_metadata)
        
        return {
            "success": True,
            "results": restore_results
        }
        
    except Exception as e:
        logger.error(f"Error restoring backup: {e}")
        return {
            "success": False,
            "error": str(e)
        }

async def create_incremental_backup(db: AsyncIOMotorDatabase, changed_collections: List[str]) -> Dict:
    """
    Create incremental backup for specific collections
    
    Args:
        db: MongoDB database instance
        changed_collections: List of collection names that changed
    
    Returns:
        Dict with backup metadata
    """
    try:
        timestamp = datetime.now(timezone.utc)
        backup_id = timestamp.strftime("%Y%m%d_%H%M%S")
        
        # Check throttling - only create backup if last backup was > 5 minutes ago
        last_backup = await db.backup_history.find_one(
            {"backup_type": "incremental"},
            sort=[("backup_date", -1)]
        )
        
        if last_backup:
            from dateutil import parser
            last_backup_date = parser.parse(last_backup["backup_date"])
            time_diff = (timestamp - last_backup_date).total_seconds()
            
            if time_diff < 300:  # 5 minutes
                logger.info(f"Throttling: Last incremental backup was {time_diff}s ago. Skipping.")
                return {
                    "success": True,
                    "throttled": True,
                    "message": "Backup throttled (< 5 minutes since last backup)"
                }
        
        backup_data = {
            "backup_id": backup_id,
            "backup_date": timestamp.isoformat(),
            "backup_type": "incremental",
            "changed_collections": changed_collections,
            "collections": {}
        }
        
        # Backup only changed collections
        for collection_name in changed_collections:
            if collection_name not in BACKUP_COLLECTIONS:
                continue
                
            try:
                collection = db[collection_name]
                documents = await collection.find().to_list(length=None)
                serialized_docs = [serialize_mongo_doc(doc) for doc in documents]
                
                backup_data["collections"][collection_name] = {
                    "count": len(serialized_docs),
                    "documents": serialized_docs
                }
                
            except Exception as e:
                logger.error(f"Error in incremental backup for {collection_name}: {e}")
        
        # Save to GCS
        json_data = json.dumps(backup_data, indent=2, ensure_ascii=False)
        compressed_data = gzip.compress(json_data.encode('utf-8'))
        
        filename = f"backup_incremental_{backup_id}.json.gz"
        local_path = f"/tmp/{filename}"
        
        with open(local_path, 'wb') as f:
            f.write(compressed_data)
        
        gcs_path = f"database_backups/{filename}"
        try:
            gcs_storage = get_gcs_storage()
            with open(local_path, 'rb') as f:
                gcs_url = gcs_storage.upload_file(f, gcs_path, content_type='application/gzip')
        except Exception as e:
            logger.error(f"Failed to upload incremental backup to GCS: {e}")
            gcs_url = None
        
        # Save metadata
        backup_metadata = {
            "backup_id": backup_id,
            "backup_date": timestamp.isoformat(),
            "backup_type": "incremental",
            "filename": filename,
            "gcs_url": gcs_url,
            "changed_collections": changed_collections,
            "file_size": len(compressed_data),
            "status": "completed"
        }
        
        await db.backup_history.insert_one(backup_metadata)
        
        return {
            "success": True,
            "backup_id": backup_id,
            "throttled": False
        }
        
    except Exception as e:
        logger.error(f"Error creating incremental backup: {e}")
        return {
            "success": False,
            "error": str(e)
        }

async def cleanup_old_backups(db: AsyncIOMotorDatabase, keep_daily: int = 7, keep_weekly: int = 4):
    """
    Cleanup old backups keeping only recent ones
    
    Args:
        db: MongoDB database instance
        keep_daily: Number of daily backups to keep
        keep_weekly: Number of weekly backups to keep
    """
    try:
        # Get all backups
        all_backups = await db.backup_history.find().sort("backup_date", -1).to_list(length=None)
        
        daily_backups = []
        weekly_backups = []
        incremental_backups = []
        
        for backup in all_backups:
            backup_type = backup.get("backup_type", "manual")
            if backup_type == "scheduled":
                if len(daily_backups) < keep_daily:
                    daily_backups.append(backup)
            elif backup_type == "incremental":
                if len(incremental_backups) < 50:  # Keep last 50 incremental
                    incremental_backups.append(backup)
        
        # Delete old backups
        backups_to_keep_ids = [b["backup_id"] for b in daily_backups + weekly_backups + incremental_backups]
        
        for backup in all_backups:
            if backup["backup_id"] not in backups_to_keep_ids:
                # Delete from GCS
                # Note: Implement GCS deletion if needed
                
                # Delete from database
                await db.backup_history.delete_one({"backup_id": backup["backup_id"]})
                logger.info(f"Deleted old backup: {backup['backup_id']}")
        
    except Exception as e:
        logger.error(f"Error cleaning up old backups: {e}")
