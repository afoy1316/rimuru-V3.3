#!/usr/bin/env python3
"""
Withdrawal Structure Analysis - Check the structure of withdrawal data
"""

import requests
import json
import sys

class WithdrawalStructureAnalyzer:
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

    def analyze_withdrawal_structure(self):
        """Analyze the structure of withdrawal data"""
        print("🔍 Analyzing Withdrawal Data Structure...")
        
        if not self.authenticate_admin():
            print("❌ Failed to authenticate as admin")
            return False
        
        # Get all withdrawals
        status, withdrawals = self.run_api_call("GET", "admin/withdraws", use_admin_token=True)
        
        if status != 200:
            print(f"❌ Failed to get withdrawals: {status}")
            return False
        
        print(f"📊 Found {len(withdrawals)} withdrawals")
        
        if withdrawals:
            print(f"\n🔍 SAMPLE WITHDRAWAL STRUCTURE:")
            sample_withdrawal = withdrawals[0]
            print(json.dumps(sample_withdrawal, indent=2, default=str))
            
            print(f"\n📋 WITHDRAWAL FIELDS ANALYSIS:")
            for i, withdrawal in enumerate(withdrawals[:5]):  # Check first 5
                print(f"\nWithdrawal {i+1} ({withdrawal.get('id', 'Unknown')[:8]}...):")
                print(f"   Status: {withdrawal.get('status', 'Unknown')}")
                print(f"   Account field: {withdrawal.get('account', 'Missing')}")
                print(f"   Account ID field: {withdrawal.get('account_id', 'Missing')}")
                print(f"   User ID: {withdrawal.get('user_id', 'Missing')}")
                print(f"   Platform: {withdrawal.get('platform', 'Missing')}")
                print(f"   Account Name: {withdrawal.get('account_name', 'Missing')}")
                
                # Check if account field is a dict
                account_field = withdrawal.get('account')
                if isinstance(account_field, dict):
                    print(f"   Account dict keys: {list(account_field.keys())}")
                    print(f"   Account dict ID: {account_field.get('id', 'Missing')}")
                elif account_field:
                    print(f"   Account field type: {type(account_field)}")
        
        return True

if __name__ == "__main__":
    analyzer = WithdrawalStructureAnalyzer()
    analyzer.analyze_withdrawal_structure()