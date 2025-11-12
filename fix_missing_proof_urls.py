#!/usr/bin/env python3
"""
Migration script to fix missing proof URLs in wallet_transfers and topup_requests
This script scans uploaded files and matches them to database records based on ID patterns
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from pathlib import Path
import re

async def fix_wallet_transfer_proofs():
    """Fix missing spend_limit_proof_url and budget_aspire_proof_url in wallet_transfers"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.rimuru_db
    
    # Get all wallet transfers
    wallet_transfers = await db.wallet_transfers.find().to_list(10000)
    
    # Get all files in verification_files directory
    upload_dir = Path("/app/uploads/verification_files")
    if not upload_dir.exists():
        print("Upload directory does not exist!")
        return
    
    all_files = list(upload_dir.glob("*"))
    print(f"Found {len(all_files)} files in verification_files directory")
    print(f"Found {len(wallet_transfers)} wallet transfer records")
    
    updated_count = 0
    
    for transfer in wallet_transfers:
        transfer_id = transfer.get('id')
        needs_update = False
        update_fields = {}
        
        # Look for spend_limit_proof file
        if not transfer.get('spend_limit_proof_url'):
            # Pattern: {transfer_id}_spend_limit_proof_*.jpg/png/pdf
            pattern = f"{transfer_id}_spend_limit_proof_"
            for file_path in all_files:
                if pattern in file_path.name:
                    relative_path = f"uploads/verification_files/{file_path.name}"
                    update_fields['spend_limit_proof_url'] = relative_path
                    print(f"  Found spend_limit: {file_path.name}")
                    needs_update = True
                    break
        
        # Look for budget_aspire_proof file
        if not transfer.get('budget_aspire_proof_url'):
            # Pattern: {transfer_id}_budget_aspire_proof_*.jpg/png/pdf
            pattern = f"{transfer_id}_budget_aspire_proof_"
            for file_path in all_files:
                if pattern in file_path.name:
                    relative_path = f"uploads/verification_files/{file_path.name}"
                    update_fields['budget_aspire_proof_url'] = relative_path
                    print(f"  Found budget_aspire: {file_path.name}")
                    needs_update = True
                    break
        
        if needs_update:
            await db.wallet_transfers.update_one(
                {"id": transfer_id},
                {"$set": update_fields}
            )
            updated_count += 1
            print(f"✓ Updated wallet_transfer: {transfer_id} ({transfer.get('target_account_name')})")
            print(f"  Fields added: {list(update_fields.keys())}")
    
    print(f"\n{'='*60}")
    print(f"WALLET TRANSFERS: Updated {updated_count} records")
    
    client.close()

async def fix_topup_account_proofs():
    """Fix missing proof URLs in account objects within topup_requests"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.rimuru_db
    
    # Get all topup requests
    topup_requests = await db.topup_requests.find().to_list(10000)
    
    # Get all files in verification_files directory
    upload_dir = Path("/app/uploads/verification_files")
    all_files = list(upload_dir.glob("*"))
    
    print(f"\nChecking {len(topup_requests)} topup request records...")
    
    updated_count = 0
    
    for req in topup_requests:
        request_id = req.get('id')
        accounts = req.get('accounts', [])
        
        if not accounts:
            continue
        
        accounts_updated = False
        
        for account in accounts:
            account_id = account.get('account_id')
            
            # Look for spend_limit_proof file for this account
            if not account.get('spend_limit_proof_url'):
                # Pattern: {request_id}_{account_id}_spend_limit_proof_*.jpg
                patterns = [
                    f"{request_id}_{account_id}_spend_limit_proof_",
                    f"{request_id}_spend_limit_proof_"  # Fallback if account_id not in filename
                ]
                
                for pattern in patterns:
                    for file_path in all_files:
                        if pattern in file_path.name:
                            relative_path = f"uploads/verification_files/{file_path.name}"
                            account['spend_limit_proof_url'] = relative_path
                            print(f"  Found spend_limit for account: {account.get('account_name')}")
                            accounts_updated = True
                            break
                    if accounts_updated:
                        break
            
            # Look for budget_aspire_proof file for this account
            if not account.get('budget_aspire_proof_url'):
                patterns = [
                    f"{request_id}_{account_id}_budget_aspire_proof_",
                    f"{request_id}_budget_aspire_proof_"
                ]
                
                for pattern in patterns:
                    for file_path in all_files:
                        if pattern in file_path.name:
                            relative_path = f"uploads/verification_files/{file_path.name}"
                            account['budget_aspire_proof_url'] = relative_path
                            print(f"  Found budget_aspire for account: {account.get('account_name')}")
                            accounts_updated = True
                            break
                    if accounts_updated:
                        break
        
        if accounts_updated:
            await db.topup_requests.update_one(
                {"id": request_id},
                {"$set": {"accounts": accounts}}
            )
            updated_count += 1
            print(f"✓ Updated topup_request: {request_id}")
    
    print(f"\n{'='*60}")
    print(f"TOPUP REQUESTS: Updated {updated_count} records")
    
    client.close()

async def main():
    print("="*60)
    print("MIGRATION: Fix Missing Proof URLs")
    print("="*60)
    
    # Fix wallet transfers
    await fix_wallet_transfer_proofs()
    
    # Fix topup requests accounts
    await fix_topup_account_proofs()
    
    print("\n" + "="*60)
    print("MIGRATION COMPLETE!")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
