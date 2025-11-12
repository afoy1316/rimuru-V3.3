#!/usr/bin/env python3

import sys
import os
import requests
sys.path.append('/app')

from backend_test import AdManagerAPITester

def main():
    """Debug wallet management transaction creation"""
    print("🚀 Starting Wallet Management Debug...")
    
    tester = AdManagerAPITester()
    
    # Test admin login first
    if not tester.test_admin_login():
        print("❌ Admin login failed, cannot proceed")
        return False
    
    # Test user login
    if not tester.test_user_login():
        print("❌ User login failed, cannot proceed")
        return False
    
    print("\n🔍 Step 1: Get all wallet top-up requests...")
    success, requests_response = tester.run_test(
        "GET All Wallet Top-Up Requests",
        "GET",
        "admin/wallet-topup-requests",
        200,
        use_admin_token=True
    )
    
    if success:
        print(f"Found {len(requests_response)} wallet top-up requests")
        for req in requests_response:
            print(f"  - ID: {req.get('id')}, Status: {req.get('status')}, Amount: {req.get('amount')}, Currency: {req.get('currency')}")
    
    print("\n🔍 Step 2: Get all transactions...")
    success, transactions_response = tester.run_test(
        "GET All Transactions",
        "GET",
        "transactions",
        200
    )
    
    if success:
        wallet_transactions = [t for t in transactions_response if t.get('type') == 'wallet_topup']
        print(f"Found {len(transactions_response)} total transactions")
        print(f"Found {len(wallet_transactions)} wallet_topup transactions")
        for t in wallet_transactions:
            print(f"  - ID: {t.get('id')}, Type: {t.get('type')}, Amount: {t.get('amount')}, Currency: {t.get('currency')}, Status: {t.get('status')}, Ref: {t.get('reference_id')}")
    
    # Find a verified wallet request
    target_request = None
    for req in requests_response:
        if req.get('status') == 'verified':
            target_request = req
            break
    
    if not target_request:
        print("\n❌ No verified wallet request found for testing")
        return False
    
    request_id = target_request['id']
    print(f"\n🔍 Step 3: Testing with verified request {request_id}")
    
    # Check if this request already has a transaction
    existing_transactions = [t for t in wallet_transactions if t.get('reference_id') == request_id]
    print(f"Existing transactions for this request: {len(existing_transactions)}")
    
    # Try to verify again (should create transaction if fix is working)
    print(f"\n🔍 Step 4: Re-verifying request {request_id}...")
    verify_data = {
        "status": "verified",
        "admin_notes": "Testing transaction creation fix"
    }
    
    headers = {'Authorization': f'Bearer {tester.admin_token}', 'Content-Type': 'application/json'}
    
    try:
        response = requests.put(
            f"{tester.api_url}/admin/wallet-topup-requests/{request_id}/status",
            json=verify_data,
            headers=headers,
            timeout=10
        )
        
        print(f"Verification response: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    # Check transactions again
    print(f"\n🔍 Step 5: Checking transactions after verification...")
    success, new_transactions_response = tester.run_test(
        "GET Transactions After Verification",
        "GET",
        "transactions",
        200
    )
    
    if success:
        new_wallet_transactions = [t for t in new_transactions_response if t.get('type') == 'wallet_topup']
        new_request_transactions = [t for t in new_wallet_transactions if t.get('reference_id') == request_id]
        
        print(f"Total wallet transactions after: {len(new_wallet_transactions)}")
        print(f"Transactions for request {request_id}: {len(new_request_transactions)}")
        
        if len(new_request_transactions) > len(existing_transactions):
            print("✅ New transaction created!")
            for t in new_request_transactions:
                if t not in existing_transactions:
                    print(f"  NEW: ID: {t.get('id')}, Amount: {t.get('amount')}, Currency: {t.get('currency')}, Status: {t.get('status')}")
        else:
            print("❌ No new transaction created")
    
    # Test proof file access
    print(f"\n🔍 Step 6: Testing proof file access for request {request_id}...")
    try:
        response = requests.get(
            f"{tester.api_url}/admin/wallet-topup-requests/{request_id}/proof-file",
            headers={'Authorization': f'Bearer {tester.admin_token}'},
            timeout=10
        )
        
        print(f"Proof file response: {response.status_code}")
        if response.status_code == 200:
            print(f"✅ Proof file accessible, Content-Type: {response.headers.get('content-type')}")
        elif response.status_code == 404:
            print("ℹ️ No proof file found (404) - this is expected if no file was uploaded")
        else:
            print(f"❌ Unexpected response: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    return True

if __name__ == "__main__":
    main()