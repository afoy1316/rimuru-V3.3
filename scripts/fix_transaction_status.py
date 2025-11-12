#!/usr/bin/env python3
"""
Fix transaction status for account requests that are already approved/rejected
but transaction status is still pending
"""

import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime, timezone

# Add the parent directory to sys.path to import from backend
sys.path.append(str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

# Load environment
ROOT_DIR = Path(__file__).parent.parent
backend_env_path = ROOT_DIR / 'backend' / '.env'
load_dotenv(backend_env_path)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL')
if not MONGO_URL:
    # Fallback to localhost if not found
    MONGO_URL = "mongodb://localhost:27017/rimuru_db"
    print(f"Using fallback MONGO_URL: {MONGO_URL}")

client = AsyncIOMotorClient(MONGO_URL)
db = client.rimuru_db

async def fix_transaction_status():
    """Fix transaction status for account requests"""
    
    try:
        # Find all account requests that are completed, rejected, or failed
        requests = await db.ad_account_requests.find({
            "status": {"$in": ["completed", "selesai", "rejected", "ditolak", "failed"]}
        }).to_list(None)
        
        print(f"Found {len(requests)} approved/rejected requests")
        
        updated_count = 0
        
        for request in requests:
            try:
                # Determine the correct transaction status
                if request["status"] in ["completed", "selesai"]:
                    transaction_status = "completed"
                elif request["status"] in ["rejected", "ditolak"]:
                    transaction_status = "failed"
                else:  # pending, processing, approved, etc.
                    transaction_status = "pending"
                
                # Build the correct description pattern based on platform
                if request['platform'] == "facebook":
                    description_pattern = f"Request Facebook ads account: {request['account_name']}"
                else:
                    description_pattern = f"Request {request['platform']} ads account: {request['account_name']}"
                
                # Find and update the corresponding transaction
                result = await db.transactions.update_one(
                    {
                        "user_id": request["user_id"],
                        "type": "account_request",
                        "description": {"$regex": f"^{description_pattern}"}
                    },
                    {"$set": {"status": transaction_status}}
                )
                
                if result.modified_count > 0:
                    print(f"✅ Updated transaction for request {request['id']} ({request['platform']}: {request['account_name']}) -> {transaction_status}")
                    updated_count += 1
                else:
                    # Try with more flexible pattern if exact match fails
                    result = await db.transactions.update_one(
                        {
                            "user_id": request["user_id"],
                            "type": "account_request",
                            "description": {"$regex": f"{request['account_name']}"}
                        },
                        {"$set": {"status": transaction_status}}
                    )
                    
                    if result.modified_count > 0:
                        print(f"✅ Updated transaction (flexible match) for request {request['id']} ({request['platform']}: {request['account_name']}) -> {transaction_status}")
                        updated_count += 1
                    else:
                        print(f"❌ No matching transaction found for request {request['id']} ({request['platform']}: {request['account_name']})")
                        
                        # Debug: Show existing transactions for this user
                        existing_transactions = await db.transactions.find({
                            "user_id": request["user_id"],
                            "type": "account_request"
                        }).to_list(None)
                        
                        print(f"   Existing transactions for user {request['user_id']}:")
                        for txn in existing_transactions:
                            print(f"     - {txn.get('description', 'No description')} (Status: {txn.get('status', 'No status')})")
                
            except Exception as e:
                print(f"❌ Error processing request {request['id']}: {e}")
                continue
        
        print(f"\n✅ Fixed {updated_count} transaction statuses")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

async def main():
    """Main function"""
    print("🔧 Fixing transaction status for account requests...")
    print("=" * 60)
    
    success = await fix_transaction_status()
    
    if success:
        print("\n🎉 Transaction status fix completed successfully!")
    else:
        print("\n❌ Transaction status fix failed!")
        sys.exit(1)
    
    # Close MongoDB connection
    client.close()

if __name__ == "__main__":
    asyncio.run(main())