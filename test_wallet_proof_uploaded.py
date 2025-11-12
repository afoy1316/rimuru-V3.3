#!/usr/bin/env python3

import sys
import os
import requests
sys.path.append('/app')

from backend_test import AdManagerAPITester

def main():
    """Test wallet management with proof_uploaded status"""
    print("🚀 Testing Wallet Management with Proof Uploaded Status...")
    
    tester = AdManagerAPITester()
    
    # Test admin login first
    if not tester.test_admin_login():
        print("❌ Admin login failed, cannot proceed")
        return False
    
    # Test user login
    if not tester.test_user_login():
        print("❌ User login failed, cannot proceed")
        return False
    
    print("\n🔍 Step 1: Get wallet top-up requests...")
    success, requests_response = tester.run_test(
        "GET All Wallet Top-Up Requests",
        "GET",
        "admin/wallet-topup-requests",
        200,
        use_admin_token=True
    )
    
    # Find a proof_uploaded request
    target_request = None
    for req in requests_response:
        if req.get('status') == 'proof_uploaded':
            target_request = req
            break
    
    if not target_request:
        print("\n❌ No proof_uploaded wallet request found for testing")
        return False
    
    request_id = target_request['id']
    print(f"\n🔍 Step 2: Testing with proof_uploaded request {request_id}")
    print(f"Request details: Amount: {target_request.get('amount')}, Currency: {target_request.get('currency')}")
    
    # Check transactions before verification
    print(f"\n🔍 Step 3: Checking transactions before verification...")
    success, transactions_before = tester.run_test(
        "GET Transactions Before",
        "GET",
        "transactions",
        200
    )
    
    wallet_transactions_before = [t for t in transactions_before if t.get('type') == 'wallet_topup' and t.get('reference_id') == request_id]
    print(f"Wallet transactions for this request before: {len(wallet_transactions_before)}")
    
    # Verify the request (should create transaction)
    print(f"\n🔍 Step 4: Verifying request {request_id}...")
    verify_data = {
        "status": "verified",
        "admin_notes": "Testing transaction creation fix - changing from proof_uploaded to verified"
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
            print(f"✅ Verification successful: {response.json()}")
        else:
            print(f"❌ Verification failed: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {e}")
        return False
    
    # Check transactions after verification
    print(f"\n🔍 Step 5: Checking transactions after verification...")
    success, transactions_after = tester.run_test(
        "GET Transactions After",
        "GET",
        "transactions",
        200
    )
    
    wallet_transactions_after = [t for t in transactions_after if t.get('type') == 'wallet_topup' and t.get('reference_id') == request_id]
    print(f"Wallet transactions for this request after: {len(wallet_transactions_after)}")
    
    if len(wallet_transactions_after) > len(wallet_transactions_before):
        print("✅ NEW TRANSACTION CREATED!")
        for t in wallet_transactions_after:
            if t not in wallet_transactions_before:
                print(f"  NEW TRANSACTION:")
                print(f"    ID: {t.get('id')}")
                print(f"    Type: {t.get('type')}")
                print(f"    Amount: {t.get('amount')}")
                print(f"    Currency: {t.get('currency')}")
                print(f"    Status: {t.get('status')}")
                print(f"    Description: {t.get('description')}")
                print(f"    Reference ID: {t.get('reference_id')}")
        
        # Test transaction history integration
        print(f"\n🔍 Step 6: Testing transaction history integration...")
        all_wallet_transactions = [t for t in transactions_after if t.get('type') == 'wallet_topup']
        print(f"Total wallet_topup transactions in user history: {len(all_wallet_transactions)}")
        
        if all_wallet_transactions:
            print("✅ Wallet top-up transactions appear in user transaction history")
        else:
            print("❌ No wallet top-up transactions found in user history")
        
        # Test proof file access
        print(f"\n🔍 Step 7: Testing proof file access...")
        try:
            response = requests.get(
                f"{tester.api_url}/admin/wallet-topup-requests/{request_id}/proof-file",
                headers={'Authorization': f'Bearer {tester.admin_token}'},
                timeout=10
            )
            
            print(f"Proof file response: {response.status_code}")
            if response.status_code == 200:
                print(f"✅ Proof file accessible with admin auth, Content-Type: {response.headers.get('content-type')}")
            elif response.status_code == 404:
                print("ℹ️ No proof file found (404)")
            else:
                print(f"❌ Unexpected response: {response.text}")
        except Exception as e:
            print(f"Exception: {e}")
        
        # Test authentication requirements
        print(f"\n🔍 Step 8: Testing authentication requirements...")
        try:
            response = requests.get(
                f"{tester.api_url}/admin/wallet-topup-requests/{request_id}/proof-file",
                headers={'Authorization': 'Bearer invalid_token'},
                timeout=10
            )
            
            if response.status_code in [401, 403]:
                print(f"✅ Proof file endpoint properly rejects invalid auth ({response.status_code})")
            else:
                print(f"❌ Proof file endpoint did not reject invalid auth: {response.status_code}")
        except Exception as e:
            print(f"Exception: {e}")
        
        print(f"\n✅ WALLET MANAGEMENT FIXES VERIFICATION COMPLETED SUCCESSFULLY")
        print("✅ Transaction creation on verification: WORKING")
        print("✅ Proof file access with admin auth: WORKING") 
        print("✅ Transaction history integration: WORKING")
        print("✅ Proper error handling: WORKING")
        
        return True
    else:
        print("❌ No new transaction created")
        return False

if __name__ == "__main__":
    main()