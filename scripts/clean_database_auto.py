#!/usr/bin/env python3
"""
Automated script to clean all testing data from MongoDB database.
"""

import os
import sys
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

def clean_database():
    """Clean all testing data from MongoDB"""
    
    # Load environment variables
    env_path = Path(__file__).parent.parent / 'backend' / '.env'
    load_dotenv(env_path)
    
    # Get MongoDB URL and DB name from environment
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    print(f"🔄 Connecting to MongoDB: {mongo_url}")
    print(f"📁 Database: {db_name}")
    
    try:
        # Connect to MongoDB
        client = MongoClient(mongo_url)
        db = client[db_name]
        
        print("✅ Connected to MongoDB successfully")
        
        # Collections to clean (remove all documents)
        collections_to_clean = [
            'users',                    # All user accounts
            'admin_users',              # All admin accounts  
            'ad_account_requests',      # All account requests
            'ad_accounts',              # All ad accounts
            'topup_requests',           # All top-up requests
            'payment_proofs',           # All payment proof files
            'transactions',             # All transactions
            'notifications',            # All admin notifications
            'client_notifications',     # All client notifications
            'share_requests',           # All share requests
            'groups',                   # All groups
        ]
        
        print("\n🧹 Starting database cleanup...")
        
        total_deleted = 0
        
        for collection_name in collections_to_clean:
            if collection_name in db.list_collection_names():
                collection = db[collection_name]
                count_before = collection.count_documents({})
                
                if count_before > 0:
                    result = collection.delete_many({})
                    deleted_count = result.deleted_count
                    total_deleted += deleted_count
                    
                    print(f"  📁 {collection_name}: Deleted {deleted_count} documents")
                else:
                    print(f"  📁 {collection_name}: Already empty")
            else:
                print(f"  📁 {collection_name}: Collection doesn't exist (OK)")
        
        print(f"\n✅ Database cleanup completed!")
        print(f"📊 Total documents deleted: {total_deleted}")
        
        # Show final database stats
        print(f"\n📈 Final Database State:")
        for collection_name in db.list_collection_names():
            count = db[collection_name].count_documents({})
            print(f"  - {collection_name}: {count} documents")
            
        client.close()
        print("\n🎉 Database is now clean and ready for production!")
        return True
        
    except Exception as e:
        print(f"❌ Error cleaning database: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Rimuru Database Auto-Cleanup")
    print("=" * 40)
    
    success = clean_database()
    
    if success:
        print("\n🎯 SUCCESS: Database cleanup completed!")
        print("💡 Your database is now production-ready.")
    else:
        print("\n❌ FAILED: Database cleanup encountered errors.")
        sys.exit(1)