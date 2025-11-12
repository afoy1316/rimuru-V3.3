#!/usr/bin/env python3

import sys
import os
import requests
import json
sys.path.append('/app')

from backend_test import AdManagerAPITester

def main():
    """Debug wallet request data structure"""
    print("🚀 Debugging Wallet Request Data Structure...")
    
    tester = AdManagerAPITester()
    
    # Test admin login first
    if not tester.test_admin_login():
        print("❌ Admin login failed, cannot proceed")
        return False
    
    print("\n🔍 Step 1: Get wallet top-up requests with full details...")
    
    headers = {'Authorization': f'Bearer {tester.admin_token}'}
    
    try:
        response = requests.get(
            f"{tester.api_url}/admin/wallet-topup-requests",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            requests_data = response.json()
            print(f"Found {len(requests_data)} wallet requests")
            
            for i, req in enumerate(requests_data):
                print(f"\n--- Request {i+1} ---")
                print(f"ID: {req.get('id')}")
                print(f"Status: {req.get('status')}")
                print(f"Amount: {req.get('amount')} (type: {type(req.get('amount'))})")
                print(f"Currency: '{req.get('currency')}' (type: {type(req.get('currency'))})")
                print(f"User ID: {req.get('user_id')}")
                print(f"Wallet Type: {req.get('wallet_type')}")
                print(f"Payment Method: {req.get('payment_method')}")
                print(f"Created At: {req.get('created_at')}")
                print(f"Verified At: {req.get('verified_at')}")
                
                # Check if user exists
                if req.get('user_id'):
                    user_response = requests.get(
                        f"{tester.api_url}/admin/clients/{req.get('user_id')}",
                        headers=headers,
                        timeout=10
                    )
                    if user_response.status_code == 200:
                        user_data = user_response.json()
                        print(f"User exists: {user_data.get('username')} ({user_data.get('email')})")
                        print(f"User wallet fields: main_wallet_idr={user_data.get('main_wallet_idr', 'N/A')}, main_wallet_usd={user_data.get('main_wallet_usd', 'N/A')}")
                    else:
                        print(f"❌ User not found or error: {user_response.status_code}")
        else:
            print(f"❌ Failed to get wallet requests: {response.status_code}")
            return False
    except Exception as e:
        print(f"Exception: {e}")
        return False
    
    # Check transactions collection directly
    print(f"\n🔍 Step 2: Check transactions collection...")
    
    # Login as a user to get transactions
    if not tester.test_user_login():
        print("❌ User login failed")
        return False
    
    user_headers = {'Authorization': f'Bearer {tester.token}'}
    
    try:
        response = requests.get(
            f"{tester.api_url}/transactions",
            headers=user_headers,
            timeout=10
        )
        
        if response.status_code == 200:
            transactions = response.json()
            print(f"Found {len(transactions)} total transactions for user")
            
            wallet_transactions = [t for t in transactions if t.get('type') == 'wallet_topup']
            print(f"Found {len(wallet_transactions)} wallet_topup transactions")
            
            for t in wallet_transactions:
                print(f"  - ID: {t.get('id')}, Amount: {t.get('amount')}, Currency: {t.get('currency')}, Ref: {t.get('reference_id')}")
        else:
            print(f"❌ Failed to get transactions: {response.status_code}")
    except Exception as e:
        print(f"Exception: {e}")
    
    return True

if __name__ == "__main__":
    main()