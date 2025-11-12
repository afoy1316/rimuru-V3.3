#!/usr/bin/env python3
"""
Script to fix admin password with correct SHA-256 hashing method.
"""

import os
import sys
import hashlib
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv
import uuid
from datetime import datetime, timezone

def fix_admin_password():
    """Fix admin password with SHA-256 hashing"""
    
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
        
        # Create correct SHA-256 hash for 'admin123'
        password = "admin123"
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        print(f"🔐 Generated SHA-256 hash: {password_hash}")
        
        # Delete existing admin and recreate with correct hash
        delete_result = db.admin_users.delete_many({"username": "admin"})
        print(f"🗑️  Deleted {delete_result.deleted_count} existing admin(s)")
        
        # Create admin with correct SHA-256 hash
        admin_data = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "email": "admin@rimuru.com",
            "name": "System Administrator",
            "password_hash": password_hash,  # SHA-256 hash
            "is_active": True,
            "is_super_admin": True,
            "whatsapp_number": "+628123456789",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Insert admin
        result = db.admin_users.insert_one(admin_data)
        
        if result.inserted_id:
            print("✅ Admin created with correct SHA-256 password hash!")
            print("📋 Admin Credentials:")
            print(f"   Username: {admin_data['username']}")
            print(f"   Password: {password}")
            print(f"   Hash Method: SHA-256")
            print(f"   Hash: {password_hash}")
        else:
            print("❌ Failed to create admin")
            return False
            
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error fixing admin: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔧 Fixing Admin Password Hash Method")
    print("=" * 45)
    
    success = fix_admin_password()
    
    if success:
        print("\n🎯 SUCCESS: Admin password fixed!")
        print("🔑 You can now login with admin/admin123")
    else:
        print("\n❌ FAILED: Could not fix admin password.")
        sys.exit(1)