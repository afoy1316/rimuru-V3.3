#!/usr/bin/env python3
"""
Script to clean all testing data from MongoDB database before production deployment.
This will remove all users, admins, requests, transactions, notifications, etc.
"""

import os
import sys
from pathlib import Path
from pymongo import MongoClient
from datetime import datetime

# Add backend to path to import database connection
sys.path.append(str(Path(__file__).parent.parent / 'backend'))

def clean_database():
    """Clean all testing data from MongoDB"""
    
    # Get MongoDB URL from environment
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/rimuru')
    
    print(f"🔄 Connecting to MongoDB: {mongo_url}")
    
    try:
        # Connect to MongoDB
        client = MongoClient(mongo_url)
        db = client.get_default_database()
        
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
            'withdraw_requests'         # All withdraw requests (if any)
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
                print(f"  📁 {collection_name}: Collection doesn't exist")
        
        print(f"\n✅ Database cleanup completed!")
        print(f"📊 Total documents deleted: {total_deleted}")
        
        # Verify collections are empty
        print("\n🔍 Verifying cleanup...")
        all_clean = True
        
        for collection_name in collections_to_clean:
            if collection_name in db.list_collection_names():
                count = db[collection_name].count_documents({})
                if count > 0:
                    print(f"  ⚠️  {collection_name}: Still has {count} documents")
                    all_clean = False
                else:
                    print(f"  ✅ {collection_name}: Clean (0 documents)")
        
        if all_clean:
            print("\n🎉 All collections are clean and ready for production!")
        else:
            print("\n⚠️  Some collections still have data. Please check manually.")
            
        # Show database stats
        print(f"\n📈 Database Statistics:")
        for collection_name in db.list_collection_names():
            count = db[collection_name].count_documents({})
            print(f"  - {collection_name}: {count} documents")
            
    except Exception as e:
        print(f"❌ Error cleaning database: {str(e)}")
        return False
        
    finally:
        if 'client' in locals():
            client.close()
            print("🔌 MongoDB connection closed")
    
    return True

def confirm_cleanup():
    """Ask for confirmation before cleaning database"""
    
    print("⚠️  DATABASE CLEANUP WARNING ⚠️")
    print("This will permanently delete ALL testing data including:")
    print("  - All user accounts")
    print("  - All admin accounts") 
    print("  - All ad account requests")
    print("  - All transactions")
    print("  - All notifications")
    print("  - All payment records")
    print("  - And more...")
    print("\n❗ This action CANNOT be undone!")
    
    response = input("\nAre you sure you want to proceed? Type 'YES' to confirm: ")
    
    if response.strip() == 'YES':
        return True
    else:
        print("❌ Database cleanup cancelled.")
        return False

if __name__ == "__main__":
    print("🚀 Rimuru Database Cleanup Script")
    print("=" * 50)
    
    # Load environment variables
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / 'backend' / '.env'
    load_dotenv(env_path)
    
    if confirm_cleanup():
        print("\n🔄 Starting cleanup process...")
        success = clean_database()
        
        if success:
            print("\n🎯 Database is now clean and ready for production deployment!")
            print("💡 Next steps:")
            print("  1. Create your first admin account")
            print("  2. Configure any necessary settings")
            print("  3. Deploy to production")
        else:
            print("\n❌ Cleanup failed. Please check the errors above.")
            sys.exit(1)
    else:
        print("👋 Cleanup cancelled. Database remains unchanged.")