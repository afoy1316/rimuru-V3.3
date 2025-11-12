#!/usr/bin/env python3
"""
Fix timezone issue: Remove +00:00 and ensure only Z suffix for all datetime strings in MongoDB
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv
import re

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

def fix_datetime_format(value):
    """Fix datetime format to have only Z suffix, not +00:00Z"""
    if not value:
        return value
    
    # If it's a datetime object, convert properly
    if isinstance(value, datetime):
        iso_str = value.isoformat()
        if '+00:00' in iso_str:
            iso_str = iso_str.replace('+00:00', 'Z')
        elif not iso_str.endswith('Z'):
            iso_str = iso_str + 'Z'
        return iso_str
    
    # If it's a string
    if isinstance(value, str):
        # Remove +00:00Z format (both +00:00 and Z)
        if '+00:00Z' in value:
            return value.replace('+00:00Z', 'Z')
        # Add Z if missing
        elif 'T' in value and not value.endswith('Z') and '+' not in value:
            return value + 'Z'
    
    return value

async def fix_datetime_fields():
    """Fix all datetime fields to have proper format"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Collections and their datetime fields
    collections_fields = {
        'wallet_topup_requests': ['claimed_at', 'created_at', 'verified_at', 'uploaded_at'],
        'topup_requests': ['claimed_at', 'created_at', 'verified_at', 'proof_uploaded_at'],
        'wallet_transfers': ['claimed_at', 'created_at', 'verified_at', 'processed_at'],
        'withdraw_requests': ['claimed_at', 'created_at', 'processed_at', 'verified_at'],
    }
    
    total_updated = 0
    
    for collection_name, datetime_fields in collections_fields.items():
        collection = db[collection_name]
        print(f"\n🔄 Processing collection: {collection_name}")
        
        # Get all documents
        documents = await collection.find({}).to_list(None)
        print(f"   Found {len(documents)} documents")
        
        for doc in documents:
            updates = {}
            
            for field in datetime_fields:
                if field in doc and doc[field]:
                    old_value = doc[field]
                    new_value = fix_datetime_format(old_value)
                    
                    if old_value != new_value:
                        updates[field] = new_value
                        doc_id_short = str(doc.get('id', ''))[:8]
                        print(f"   ✅ {doc_id_short}... {field}: {old_value} → {new_value}")
            
            # Update document if there are changes
            if updates:
                await collection.update_one(
                    {'_id': doc['_id']},
                    {'$set': updates}
                )
                total_updated += 1
    
    print(f"\n✅ Migration complete! Updated {total_updated} documents total")
    client.close()

if __name__ == '__main__':
    asyncio.run(fix_datetime_fields())
