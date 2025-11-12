import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')
MONGO_URL = os.getenv('MONGO_URL')

async def check():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.rimuru_db
    
    # Find wallet_topup transactions
    txs = await db.transactions.find({"type": "wallet_topup"}).sort("created_at", -1).limit(5).to_list(5)
    
    print(f"Found {len(txs)} wallet_topup transactions:\n")
    for tx in txs:
        print(f"ID: {tx['id']}")
        print(f"Description: {tx.get('description')}")
        print(f"Amount: {tx.get('amount')}")
        print(f"Currency: {tx.get('currency')}")
        print(f"Created: {tx.get('created_at')}")
        print("-" * 50)
    
    client.close()

asyncio.run(check())
