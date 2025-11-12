#!/usr/bin/env python3
"""
Script to create default admin for production deployment.
"""

import os
import sys
import bcrypt
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv
import uuid
from datetime import datetime, timezone

def create_default_admin():
    """Create default admin user for production"""
    
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
        
        # Check if admin already exists
        existing_admin = db.admin_users.find_one({"username": "admin"})
        if existing_admin:
            print("⚠️  Default admin already exists. Skipping creation.")
            return True
        
        # Create default admin
        admin_data = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "email": "admin@rimuru.com",
            "name": "System Administrator",
            "password_hash": bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            "is_active": True,
            "is_super_admin": True,
            "whatsapp_number": "+628123456789",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Insert admin
        result = db.admin_users.insert_one(admin_data)
        
        if result.inserted_id:
            print("✅ Default admin created successfully!")
            print("📋 Admin Credentials:")
            print(f"   Username: {admin_data['username']}")
            print(f"   Password: admin123")
            print(f"   Email: {admin_data['email']}")
            print(f"   Name: {admin_data['name']}")
            print()
            print("⚠️  IMPORTANT: Please change the default password after first login!")
        else:
            print("❌ Failed to create default admin")
            return False
            
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin: {str(e)}")
        return False

if __name__ == "__main__":
    print("👑 Creating Default Admin for Production")
    print("=" * 45)
    
    success = create_default_admin()
    
    if success:
        print("\n🎯 SUCCESS: Default admin ready for production!")
        print("🔑 You can now login to admin panel with the credentials above.")
    else:
        print("\n❌ FAILED: Could not create default admin.")
        sys.exit(1)