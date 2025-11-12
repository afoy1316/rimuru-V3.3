#!/usr/bin/env python3
"""
Debug fee percentage update issue
"""

import requests
import json

def test_admin_endpoints():
    base_url = "https://admin-proof-fix.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # Login as admin
    admin_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{api_url}/admin/auth/login", json=admin_data)
    
    if response.status_code != 200:
        print("❌ Admin login failed")
        return
    
    admin_token = response.json()['access_token']
    headers = {
        'Authorization': f'Bearer {admin_token}',
        'Content-Type': 'application/json'
    }
    
    # Get all accounts via admin endpoint
    print("🔍 Getting accounts via admin endpoint...")
    response = requests.get(f"{api_url}/admin/accounts", headers=headers)
    
    if response.status_code == 200:
        accounts = response.json()
        print(f"Found {len(accounts)} accounts via admin endpoint:")
        
        for i, account in enumerate(accounts):
            print(f"{i+1}. ID: {account.get('id')}")
            print(f"   Name: {account.get('account_name')}")
            print(f"   Platform: {account.get('platform')}")
            print(f"   Fee: {account.get('fee_percentage', 'N/A')}%")
            print(f"   User: {account.get('user_name', 'N/A')}")
            print()
        
        if accounts:
            # Test updating the first account
            test_account = accounts[0]
            account_id = test_account['id']
            
            print(f"🔧 Testing fee update for account: {account_id}")
            
            fee_data = {"fee_percentage": 7.5}
            response = requests.put(f"{api_url}/admin/accounts/{account_id}/fee", json=fee_data, headers=headers)
            
            print(f"Update response: {response.status_code}")
            if response.status_code == 200:
                print("✅ Update successful")
                print(response.json())
                
                # Verify the update
                print("\n🔍 Verifying update...")
                response = requests.get(f"{api_url}/admin/accounts", headers=headers)
                if response.status_code == 200:
                    updated_accounts = response.json()
                    for account in updated_accounts:
                        if account['id'] == account_id:
                            print(f"Updated account fee: {account.get('fee_percentage', 'N/A')}%")
                            break
            else:
                print("❌ Update failed")
                print(response.text)
    else:
        print(f"❌ Failed to get admin accounts: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_admin_endpoints()