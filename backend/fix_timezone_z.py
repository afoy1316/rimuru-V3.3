#!/usr/bin/env python3
"""
Fix timezone issue: Add 'Z' suffix to all datetime strings in MongoDB
that don't have it to indicate UTC timezone.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

async def fix_datetime_fields():
    """Add 'Z' suffix to datetime fields that don't have it"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Collections and their datetime fields
    collections_fields = {
        'wallet_topup_requests': ['claimed_at', 'created_at', 'verified_at', 'uploaded_at'],
        'topup_requests': ['claimed_at', 'created_at', 'verified_at', 'proof_uploaded_at'],
        'wallet_transfers': ['claimed_at', 'created_at', 'verified_at', 'processed_at'],
        'withdraws': ['claimed_at', 'created_at', 'processed_at', 'verified_at'],
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
                    value = doc[field]
                    
                    # If it's a datetime object, convert to ISO with Z
                    if isinstance(value, datetime):
                        iso_with_z = value.isoformat() + 'Z' if value.tzinfo else value.isoformat() + 'Z'
                        updates[field] = iso_with_z
                        print(f"   ✅ {doc['id'][:8]}... {field}: datetime object → {iso_with_z}")
                    
                    # If it's a string without Z, add Z
                    elif isinstance(value, str) and 'T' in value and not value.endswith('Z'):
                        updates[field] = value + 'Z'
                        print(f"   ✅ {doc['id'][:8]}... {field}: {value} → {value}Z")
            
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
