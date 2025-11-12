#!/usr/bin/env python3
"""
Test specific balance update for the problematic IDR Currency Test Account
"""

import requests
import json
import sys

class SpecificBalanceUpdateTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None

    def run_api_call(self, method, endpoint, data=None, use_admin_token=False):
        """Make API call with proper authentication"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if use_admin_token and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            
            return response.status_code, response.json() if response.content else {}
        except Exception as e:
            return 500, {"error": str(e)}

    def authenticate_admin(self):
        """Authenticate as admin"""
        admin_login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        url = f"{self.api_url}/admin/auth/login"
        headers = {'Content-Type': 'application/json'}
        
        try:
            response = requests.post(url, json=admin_login_data, headers=headers, timeout=10)
            status = response.status_code
            response_data = response.json() if response.content else {}
        except Exception as e:
            return False
        
        if status == 200 and 'access_token' in response_data:
            self.admin_token = response_data['access_token']
            return True
        return False

    def test_problematic_account_balance_update(self):
        """Test balance update for the problematic IDR Currency Test Account"""
        print("🎯 Testing Balance Update for Problematic IDR Currency Test Account...")
        
        if not self.authenticate_admin():
            print("❌ Failed to authenticate as admin")
            return False
        
        # Find the specific withdrawal for IDR Currency Test Account
        status, withdrawals = self.run_api_call("GET", "admin/withdraws", use_admin_token=True)
        
        if status != 200:
            print(f"❌ Failed to get withdrawals: {status}")
            return False
        
        # Find the withdrawal for account 6401369f-35c1-4243-82e9-1903e1305610
        target_account_id = "6401369f-35c1-4243-82e9-1903e1305610"
        target_withdrawal = None
        
        for withdrawal in withdrawals:
            if withdrawal.get('account_id') == target_account_id and withdrawal.get('status') == 'approved':
                target_withdrawal = withdrawal
                break
        
        if not target_withdrawal:
            print(f"❌ Could not find approved withdrawal for account {target_account_id}")
            return False
        
        withdrawal_id = target_withdrawal.get('id')
        print(f"✅ Found target withdrawal: {withdrawal_id}")
        print(f"   Account: {target_withdrawal.get('account_name')}")
        print(f"   Status: {target_withdrawal.get('status')}")
        print(f"   Account ID: {target_account_id}")
        
        # Update to completed status to trigger the safety net
        completion_data = {
            "status": "completed",
            "admin_notes": "Testing enhanced balance update fix for IDR Currency Test Account"
        }
        
        print(f"🔧 Updating withdrawal to 'completed' to trigger balance update safety net...")
        
        status, response = self.run_api_call(
            "PUT",
            f"admin/withdraws/{withdrawal_id}/status",
            completion_data,
            use_admin_token=True
        )
        
        if status == 200:
            print(f"✅ Successfully updated withdrawal to completed")
            print(f"🔍 Check backend logs for balance update messages for account {target_account_id}")
            return True
        else:
            print(f"❌ Failed to update withdrawal: Status {status}, Response: {response}")
            return False

if __name__ == "__main__":
    tester = SpecificBalanceUpdateTester()
    success = tester.test_problematic_account_balance_update()
    
    if success:
        print("\n✅ Balance update test completed! Check logs and re-run balance verification.")
    else:
        print("\n❌ Balance update test failed!")