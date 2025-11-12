"""
Scheduled Backup Script
Run this as a cron job for daily automated backups
"""

import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from backup_service import create_backup, cleanup_old_backups
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def run_scheduled_backup():
    """Run scheduled backup and cleanup"""
    try:
        logger.info("Starting scheduled backup...")
        
        # Get MongoDB connection
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.environ.get('DB_NAME', 'test_database')
        
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Create backup
        result = await create_backup(db, backup_type="scheduled")
        
        if result.get("success"):
            logger.info(f"✅ Scheduled backup created: {result['backup_id']}")
            logger.info(f"   Filename: {result['filename']}")
            logger.info(f"   GCS URL: {result.get('gcs_url')}")
        else:
            logger.error(f"❌ Backup failed: {result.get('error')}")
            return False
        
        # Cleanup old backups
        logger.info("Running backup cleanup...")
        await cleanup_old_backups(db, keep_daily=7, keep_weekly=4)
        logger.info("✅ Cleanup completed")
        
        # Close connection
        client.close()
        
        return True
        
    except Exception as e:
        logger.error(f"Error in scheduled backup: {e}")
        return False

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    # Run backup
    success = asyncio.run(run_scheduled_backup())
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)
