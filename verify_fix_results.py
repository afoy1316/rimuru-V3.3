#!/usr/bin/env python3
"""
Verify that the last_topup_date fix is working by checking accounts after verification
"""

import requests
import sys
import json
from datetime import datetime

def test_fix_verification():
    """Verify the fix results"""
    base_url = "https://admin-proof-fix.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # Login as testuser
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    response = requests.post(f"{api_url}/auth/login", json=login_data)
    if response.status_code != 200:
        print("❌ Failed to login")
        return False
    
    token = response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Get accounts after verification
    response = requests.get(f"{api_url}/accounts", headers=headers)
    if response.status_code != 200:
        print("❌ Failed to get accounts")
        return False
    
    accounts = response.json()
    
    print("🔍 VERIFICATION RESULTS - Accounts after top-up verification:")
    print("=" * 80)
    
    accounts_with_balance = 0
    accounts_with_topup_date = 0
    accounts_can_withdraw = 0
    
    for account in accounts:
        account_name = account.get('account_name', 'Unknown')
        balance = account.get('balance', 0)
        last_topup_date = account.get('last_topup_date')
        can_withdraw = account.get('can_withdraw')
        
        print(f"Account: {account_name}")
        print(f"  Balance: {balance}")
        print(f"  last_topup_date: {last_topup_date}")
        print(f"  can_withdraw: {can_withdraw}")
        print()
        
        if balance > 0:
            accounts_with_balance += 1
        if last_topup_date is not None:
            accounts_with_topup_date += 1
        if can_withdraw:
            accounts_can_withdraw += 1
    
    print("=" * 80)
    print("📊 SUMMARY:")
    print(f"Total accounts: {len(accounts)}")
    print(f"Accounts with balance > 0: {accounts_with_balance}")
    print(f"Accounts with last_topup_date: {accounts_with_topup_date}")
    print(f"Accounts that can withdraw: {accounts_can_withdraw}")
    
    # Check if the fix is working
    if accounts_with_balance > 0 and accounts_with_topup_date > 0:
        print("✅ FIX IS WORKING: Accounts with balance now have last_topup_date!")
    elif accounts_with_balance == 0:
        print("ℹ️  No accounts with balance found - verification may not have processed yet")
    else:
        print("❌ FIX MAY NOT BE WORKING: Accounts with balance still missing last_topup_date")
    
    return True

if __name__ == "__main__":
    test_fix_verification()