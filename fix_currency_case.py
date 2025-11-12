#!/usr/bin/env python3
"""
Fix currency case in transactions - convert lowercase 'idr'/'usd' to uppercase 'IDR'/'USD'
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

MONGO_URL = os.getenv('MONGO_URL')

async def fix_currency_case():
    """Fix currency case in all transactions"""
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.rimuru_db
    
    # Find transactions with lowercase currency
    print("\nSearching for transactions with lowercase currency...")
    transactions = await db.transactions.find({
        "$or": [
            {"currency": "idr"},
            {"currency": "usd"}
        ]
    }).to_list(1000)
    
    print(f"Found {len(transactions)} transactions with lowercase currency")
    
    if len(transactions) == 0:
        print("No transactions need fixing!")
        return
    
    # Update each transaction
    updated_count = 0
    for tx in transactions:
        old_currency = tx['currency']
        new_currency = old_currency.upper()
        
        result = await db.transactions.update_one(
            {"id": tx['id']},
            {"$set": {"currency": new_currency}}
        )
        
        if result.modified_count > 0:
            updated_count += 1
            print(f"✓ Updated transaction {tx['id'][:8]}... : {old_currency} -> {new_currency}")
    
    print(f"\n✅ Successfully updated {updated_count} transactions")
    
    # Verify the fix
    print("\nVerifying fix...")
    remaining = await db.transactions.count_documents({
        "$or": [
            {"currency": "idr"},
            {"currency": "usd"}
        ]
    })
    
    if remaining == 0:
        print("✅ All transactions now have uppercase currency!")
    else:
        print(f"⚠️  Warning: {remaining} transactions still have lowercase currency")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_currency_case())
