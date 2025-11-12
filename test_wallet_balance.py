#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class WalletBalanceTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None

    def test_user_login(self):
        """Test user login"""
        print("🔍 Testing User Login...")
        
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        response = requests.post(f"{self.api_url}/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 200 and 'access_token' in response.json():
            self.token = response.json()['access_token']
            print("✅ Login successful")
            return True
        else:
            print(f"❌ Login failed: {response.status_code}")
            return False

    def check_wallet_balance(self):
        """Check user wallet balance"""
        print("\n💰 Checking Wallet Balance...")
        
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.get(f"{self.api_url}/auth/me", headers=headers, timeout=10)
        
        if response.status_code == 200:
            user_data = response.json()
            idr_balance = user_data.get('wallet_balance_idr', 0)
            usd_balance = user_data.get('wallet_balance_usd', 0)
            
            print(f"💵 IDR Wallet Balance: Rp {idr_balance:,.2f}")
            print(f"💵 USD Wallet Balance: ${usd_balance:.2f}")
            
            return idr_balance, usd_balance
        else:
            print(f"❌ Failed to get wallet balance: {response.status_code}")
            return 0, 0

    def test_transfer_request_with_balance(self, account_id, amount):
        """Test transfer request with specific amount"""
        print(f"\n🔄 Testing Transfer Request: Rp {amount:,.2f}")
        
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.post(
            f"{self.api_url}/transfer-request?account_id={account_id}&amount={amount}",
            headers=headers,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Transfer request created: {result}")
            return True, result
        else:
            try:
                error = response.json()
                print(f"❌ Transfer request failed: {error}")
            except:
                print(f"❌ Transfer request failed: {response.text}")
            return False, {}

    def run_test(self):
        """Run the wallet balance and transfer test"""
        print("🚀 Starting Wallet Balance and Transfer Test...")
        print("=" * 60)
        
        if not self.test_user_login():
            return
        
        idr_balance, usd_balance = self.check_wallet_balance()
        
        # Get user accounts
        print("\n📋 Getting User Accounts...")
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.get(f"{self.api_url}/accounts", headers=headers, timeout=10)
        
        if response.status_code == 200:
            accounts = response.json()
            print(f"Found {len(accounts)} accounts")
            
            if accounts:
                test_account = accounts[0]
                account_id = test_account.get('id')
                account_name = test_account.get('account_name', 'Unknown')
                
                print(f"Using account: {account_name} (ID: {account_id})")
                
                # Test different amounts based on wallet balance
                if idr_balance > 0:
                    # Test with small amount first
                    test_amounts = [1000, 5000, 10000, min(25000, idr_balance)]
                    
                    for amount in test_amounts:
                        if amount <= idr_balance:
                            success, result = self.test_transfer_request_with_balance(account_id, amount)
                            if success:
                                print(f"✅ Transfer successful with amount: Rp {amount:,.2f}")
                                break
                        else:
                            print(f"⚠️ Skipping amount Rp {amount:,.2f} (exceeds balance)")
                else:
                    print("❌ No IDR balance available for testing")
            else:
                print("❌ No accounts available for testing")
        else:
            print(f"❌ Failed to get accounts: {response.status_code}")

if __name__ == "__main__":
    tester = WalletBalanceTester()
    tester.run_test()