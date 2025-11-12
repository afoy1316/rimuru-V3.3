#!/usr/bin/env python3
"""
Script to fix admin fields to match AdminUser model requirements.
"""

import os
import sys
import hashlib
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv
import uuid
from datetime import datetime, timezone

def fix_admin_fields():
    """Fix admin fields to match model requirements"""
    
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
        
        # Update admin fields to match AdminUser model
        update_result = db.admin_users.update_one(
            {"username": "admin"},
            {
                "$set": {
                    "full_name": "System Administrator",  # Required by AdminUser model
                    "is_active": True,  # Add missing field
                    "updated_at": datetime.now(timezone.utc)
                },
                "$unset": {
                    "name": ""  # Remove old field name
                }
            }
        )
        
        if update_result.modified_count > 0:
            print("✅ Admin fields updated successfully!")
            
            # Verify admin data
            admin = db.admin_users.find_one({"username": "admin"})
            if admin:
                print("\n📋 Updated Admin Data:")
                print(f"   ID: {admin.get('id')}")
                print(f"   Username: {admin.get('username')}")
                print(f"   Email: {admin.get('email')}")
                print(f"   Full Name: {admin.get('full_name')}")  # Now using full_name
                print(f"   Is Super Admin: {admin.get('is_super_admin')}")
                print(f"   Is Active: {admin.get('is_active')}")
                print(f"   WhatsApp: {admin.get('whatsapp_number')}")
                
                # Check all required fields are present
                required_fields = ['id', 'username', 'email', 'password_hash', 'full_name']
                missing_fields = [field for field in required_fields if not admin.get(field)]
                
                if missing_fields:
                    print(f"⚠️  Missing fields: {missing_fields}")
                else:
                    print("✅ All required fields present!")
            
        else:
            print("⚠️  No admin found or already up to date")
            return False
            
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error fixing admin fields: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔧 Fixing Admin Fields for Model Compatibility")
    print("=" * 50)
    
    success = fix_admin_fields()
    
    if success:
        print("\n🎯 SUCCESS: Admin fields fixed!")
        print("🔑 Admin authentication should now work properly")
    else:
        print("\n❌ FAILED: Could not fix admin fields.")
        sys.exit(1)