import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone

async def fix_duplicate_transactions():
    mongo_url = os.getenv('MONGO_URL', 'mongodb://mongodb:27017/rimuru')
    client = AsyncIOMotorClient(mongo_url)
    db = client.rimuru
    
    print("=== Fixing Duplicate Wallet Transfer Transactions ===\n")
    
    # Get all users
    users = await db.users.find().to_list(1000)
    
    for user in users:
        user_id = user['id']
        username = user.get('username', 'Unknown')
        
        print(f"\nChecking user: {username} ({user_id})")
        
        # Get all wallet transfer transactions for this user
        transactions = await db.transactions.find({
            "user_id": user_id,
            "type": "wallet_to_account_transfer"
        }).sort("created_at", 1).to_list(1000)
        
        if len(transactions) == 0:
            print(f"  No wallet transfer transactions found")
            continue
        
        print(f"  Found {len(transactions)} wallet transfer transactions")
        
        # Group by account_id and amount (to find duplicates)
        grouped = {}
        for tx in transactions:
            key = (tx.get('account_id'), tx.get('amount'))
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(tx)
        
        # Process each group
        for key, txs in grouped.items():
            if len(txs) <= 1:
                continue  # No duplicates
            
            account_id, amount = key
            print(f"\n  Found {len(txs)} duplicate transactions for account {account_id}, amount {amount}")
            
            # Keep the FIRST transaction (oldest), delete the rest
            keep_tx = txs[0]
            delete_txs = txs[1:]
            
            print(f"    Keeping: {keep_tx['id'][:8]} - Status: {keep_tx['status']} - {keep_tx.get('description', 'No desc')[:50]}")
            
            for tx in delete_txs:
                print(f"    Deleting: {tx['id'][:8]} - Status: {tx['status']} - {tx.get('description', 'No desc')[:50]}")
                await db.transactions.delete_one({"id": tx['id']})
            
            # If the kept transaction is pending, check if there's an approved wallet_transfer
            if keep_tx['status'] == 'pending':
                # Find the wallet_transfer record
                wallet_transfer = await db.wallet_transfers.find_one({
                    "user_id": user_id,
                    "target_account_id": account_id,
                    "amount": amount
                })
                
                if wallet_transfer and wallet_transfer.get('status') == 'approved':
                    print(f"    Updating kept transaction to 'completed' (wallet_transfer is approved)")
                    await db.transactions.update_one(
                        {"id": keep_tx['id']},
                        {"$set": {
                            "status": "completed",
                            "description": keep_tx.get('description', '').replace('Menunggu', 'Disetujui'),
                            "updated_at": datetime.now(timezone.utc)
                        }}
                    )
    
    print("\n\n=== Cleanup Complete ===")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_duplicate_transactions())
