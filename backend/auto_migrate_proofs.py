"""
Auto-migration script that runs on backend startup
Ensures all payment proofs are migrated to database storage
"""

import asyncio
import base64
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv('/app/backend/.env')

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")

async def auto_migrate_proofs():
    """Auto-migrate filesystem payment proofs to database storage on startup"""
    
    logger.info("🔄 Starting auto-migration check for payment proofs...")
    
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Find proofs that need migration
        old_proofs = await db.payment_proofs.find({
            "$or": [
                {"storage_type": {"$exists": False}},
                {"storage_type": "local"}
            ]
        }).to_list(None)
        
        if len(old_proofs) == 0:
            logger.info("✅ No proofs need migration - all already in database")
            client.close()
            return
        
        logger.info(f"📦 Found {len(old_proofs)} proofs to migrate")
        
        migrated = 0
        failed = 0
        
        for proof in old_proofs:
            proof_id = proof.get("id")
            file_path = proof.get("file_path")
            
            if not file_path:
                failed += 1
                continue
            
            file_path_obj = Path(file_path)
            if not file_path_obj.is_absolute():
                file_path_obj = Path("/app") / file_path
            
            if not file_path_obj.exists():
                logger.warning(f"⚠️  File not found: {file_path_obj}")
                failed += 1
                continue
            
            try:
                with open(file_path_obj, 'rb') as f:
                    file_content = f.read()
                
                file_base64 = base64.b64encode(file_content).decode('utf-8')
                
                await db.payment_proofs.update_one(
                    {"id": proof_id},
                    {
                        "$set": {
                            "file_data": file_base64,
                            "storage_type": "database",
                            "migrated_from_filesystem": True,
                            "original_file_path": file_path
                        }
                    }
                )
                
                migrated += 1
                
            except Exception as e:
                logger.error(f"❌ Failed to migrate {proof_id}: {e}")
                failed += 1
        
        logger.info(f"✅ Auto-migration complete: {migrated} migrated, {failed} failed")
        client.close()
        
    except Exception as e:
        logger.error(f"❌ Auto-migration error: {e}")

if __name__ == "__main__":
    asyncio.run(auto_migrate_proofs())
