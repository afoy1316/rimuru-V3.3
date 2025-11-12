#!/usr/bin/env python3
"""
Balance Verification Test - Verify that account balances are set to 0 after withdrawal approval
"""

import requests
import json
import sys

class BalanceVerificationTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None

    def run_api_call(self, method, endpoint, data=None, use_admin_token=False):
        """Make API call with proper authentication"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if use_admin_token and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'
        elif self.user_token:
            headers['Authorization'] = f'Bearer {self.user_token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
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
        
        status, response = self.run_api_call("POST", "admin/auth/login", admin_login_data)
        
        if status == 200 and 'access_token' in response:
            self.admin_token = response['access_token']
            return True
        return False

    def authenticate_user(self):
        """Authenticate as testuser"""
        user_login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        status, response = self.run_api_call("POST", "auth/login", user_login_data)
        
        if status == 200 and 'access_token' in response:
            self.user_token = response['access_token']
            return True
        return False

    def check_balance_update_effectiveness(self):
        """Check if balance updates are working effectively"""
        print("🔍 Checking Balance Update Effectiveness...")
        
        if not self.authenticate_admin():
            print("❌ Failed to authenticate as admin")
            return False
        
        if not self.authenticate_user():
            print("❌ Failed to authenticate as user")
            return False
        
        # Get all withdrawals
        status, withdrawals = self.run_api_call("GET", "admin/withdraws", use_admin_token=True)
        
        if status != 200:
            print(f"❌ Failed to get withdrawals: {status}")
            return False
        
        # Get user accounts
        status, accounts = self.run_api_call("GET", "accounts")
        
        if status != 200:
            print(f"❌ Failed to get accounts: {status}")
            return False
        
        print(f"📊 Found {len(withdrawals)} withdrawals and {len(accounts)} accounts")
        
        # Check approved/completed withdrawals and their corresponding account balances
        approved_withdrawals = [w for w in withdrawals if w.get('status') in ['approved', 'completed']]
        accounts_with_balance = [a for a in accounts if a.get('balance', 0) > 0]
        
        print(f"📊 Analysis:")
        print(f"   - Approved/Completed withdrawals: {len(approved_withdrawals)}")
        print(f"   - Accounts with balance > 0: {len(accounts_with_balance)}")
        
        # Check if approved withdrawals have their account balance set to 0
        balance_issues = []
        balance_correct = []
        account_not_found = []
        
        for withdrawal in approved_withdrawals:
            account_id = withdrawal.get('account_id')  # Direct field, not nested
            withdrawal_id = withdrawal.get('id')
            status = withdrawal.get('status')
            account_name_from_withdrawal = withdrawal.get('account_name', 'Unknown')
            
            print(f"🔍 Checking withdrawal {withdrawal_id[:8]}... (Status: {status})")
            print(f"   Withdrawal account name: {account_name_from_withdrawal}")
            print(f"   Looking for account ID: {account_id}")
            
            # Find corresponding account
            account = None
            for acc in accounts:
                if acc.get('id') == account_id:
                    account = acc
                    break
            
            if account:
                balance = account.get('balance', 0)
                account_name = account.get('account_name', 'Unknown')
                
                print(f"   Found account: {account_name} (Balance: {balance})")
                
                if balance == 0 or balance == 0.0:
                    balance_correct.append({
                        'withdrawal_id': withdrawal_id,
                        'account_name': account_name,
                        'status': status,
                        'balance': balance
                    })
                else:
                    balance_issues.append({
                        'withdrawal_id': withdrawal_id,
                        'account_name': account_name,
                        'status': status,
                        'balance': balance
                    })
            else:
                print(f"   ❌ Account not found in user's accounts")
                account_not_found.append({
                    'withdrawal_id': withdrawal_id,
                    'account_id': account_id,
                    'status': status,
                    'account_name_from_withdrawal': account_name_from_withdrawal
                })
        
        print(f"\n🔍 ACCOUNT MATCHING RESULTS:")
        print(f"   - Accounts found and matched: {len(balance_correct) + len(balance_issues)}")
        print(f"   - Accounts not found: {len(account_not_found)}")
        
        if account_not_found:
            print(f"\n❓ ACCOUNTS NOT FOUND ({len(account_not_found)}):")
            for item in account_not_found:
                account_id_short = item['account_id'][:8] if item['account_id'] else 'None'
            print(f"   - Withdrawal {item['withdrawal_id'][:8]}... ({item['account_name_from_withdrawal']}) looking for account {account_id_short}... (Status: {item['status']})")
            
            print(f"\n📋 AVAILABLE USER ACCOUNTS:")
            for acc in accounts:
                print(f"   - {acc.get('account_name', 'Unknown')}: ID = {acc.get('id', 'Unknown')[:8]}..., Balance = {acc.get('balance', 0)}")
        
        print(f"\n✅ CORRECT BALANCE UPDATES ({len(balance_correct)}):")
        for item in balance_correct:
            print(f"   - {item['account_name']}: Balance = {item['balance']} (Status: {item['status']})")
        
        print(f"\n❌ BALANCE UPDATE ISSUES ({len(balance_issues)}):")
        for item in balance_issues:
            print(f"   - {item['account_name']}: Balance = {item['balance']} (Status: {item['status']}) - SHOULD BE 0")
        
        # Calculate success rate
        total_approved = len(approved_withdrawals)
        correct_balances = len(balance_correct)
        
        if total_approved > 0:
            success_rate = (correct_balances / total_approved) * 100
            print(f"\n📊 BALANCE UPDATE SUCCESS RATE: {success_rate:.1f}% ({correct_balances}/{total_approved})")
            
            if success_rate >= 90:
                print("✅ EXCELLENT: Balance update logic is working correctly")
                return True
            elif success_rate >= 70:
                print("⚠️  GOOD: Most balance updates are working, but some issues remain")
                return True
            else:
                print("❌ CRITICAL: Balance update logic has significant issues")
                return False
        else:
            print("ℹ️  No approved withdrawals found for testing")
            return True

if __name__ == "__main__":
    tester = BalanceVerificationTester()
    
    success = tester.check_balance_update_effectiveness()
    
    if success:
        print("\n✅ Balance verification completed!")
        sys.exit(0)
    else:
        print("\n❌ Balance verification failed!")
        sys.exit(1)