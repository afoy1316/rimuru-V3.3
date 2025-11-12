#!/usr/bin/env python3
"""
Script to check admin user in database and debug login issues.
"""

import os
import sys
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv
import bcrypt
import json

def check_admin_data():
    """Check admin data in database"""
    
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
        
        # Check admin users collection
        admin_count = db.admin_users.count_documents({})
        print(f"\n📊 Total admin users: {admin_count}")
        
        # Get all admin users
        admins = list(db.admin_users.find({}))
        
        if not admins:
            print("❌ No admin users found in database!")
            return False
        
        print(f"\n👑 Admin Users Found:")
        for i, admin in enumerate(admins, 1):
            print(f"\n--- Admin {i} ---")
            print(f"ID: {admin.get('id', 'N/A')}")
            print(f"Username: {admin.get('username', 'N/A')}")
            print(f"Email: {admin.get('email', 'N/A')}")
            print(f"Name: {admin.get('name', 'N/A')}")
            print(f"Is Active: {admin.get('is_active', 'N/A')}")
            print(f"Is Super Admin: {admin.get('is_super_admin', 'N/A')}")
            print(f"Password Hash: {admin.get('password_hash', 'N/A')[:20]}...")
            print(f"Created At: {admin.get('created_at', 'N/A')}")
            
            # Test password verification
            stored_hash = admin.get('password_hash', '')
            if stored_hash:
                try:
                    # Test with admin123
                    password_correct = bcrypt.checkpw('admin123'.encode('utf-8'), stored_hash.encode('utf-8'))
                    print(f"Password 'admin123' Valid: {password_correct}")
                except Exception as e:
                    print(f"Password Check Error: {e}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error checking admin: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔍 Admin Database Check")
    print("=" * 30)
    
    check_admin_data()