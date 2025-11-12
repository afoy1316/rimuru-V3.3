#!/usr/bin/env python3
"""
Migrate wallet top-up payment proofs from filesystem to database (base64 storage)
This fixes the Kubernetes multi-pod issue where files stored on local filesystem
are not accessible across different pods.
"""

import asyncio
import base64
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")

async def migrate_proofs():
    """Migrate all filesystem payment proofs to database storage"""
    
    print("🚀 Starting migration of wallet top-up payment proofs to database...")
    print(f"📊 Database: {DB_NAME}")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Find all payment proofs without storage_type (filesystem storage)
        old_proofs = await db.payment_proofs.find({
            "$or": [
                {"storage_type": {"$exists": False}},
                {"storage_type": "local"}
            ]
        }).to_list(None)
        
        print(f"📦 Found {len(old_proofs)} filesystem proofs to migrate")
        
        if len(old_proofs) == 0:
            print("✅ No proofs need migration!")
            return
        
        migrated = 0
        failed = 0
        skipped = 0
        
        for proof in old_proofs:
            proof_id = proof.get("id")
            file_path = proof.get("file_path")
            
            if not file_path:
                print(f"⚠️  Skipping proof {proof_id}: No file_path")
                skipped += 1
                continue
            
            # Construct absolute path
            file_path_obj = Path(file_path)
            if not file_path_obj.is_absolute():
                file_path_obj = Path("/app") / file_path
            
            # Check if file exists
            if not file_path_obj.exists():
                print(f"❌ File not found for proof {proof_id}: {file_path_obj}")
                failed += 1
                continue
            
            try:
                # Read file content
                with open(file_path_obj, 'rb') as f:
                    file_content = f.read()
                
                # Convert to base64
                file_base64 = base64.b64encode(file_content).decode('utf-8')
                
                # Update database record
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
                
                file_size_kb = len(file_content) / 1024
                print(f"✅ Migrated proof {proof_id}: {file_path_obj.name} ({file_size_kb:.1f} KB)")
                migrated += 1
                
            except Exception as e:
                print(f"❌ Error migrating proof {proof_id}: {e}")
                failed += 1
        
        print("\n" + "="*60)
        print("📊 MIGRATION SUMMARY")
        print("="*60)
        print(f"✅ Successfully migrated: {migrated}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Skipped: {skipped}")
        print(f"📦 Total processed: {len(old_proofs)}")
        print("="*60)
        
        if migrated > 0:
            print("\n🎉 Migration completed successfully!")
            print("💡 Old files are still on filesystem - you can delete them after verifying everything works")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(migrate_proofs())
