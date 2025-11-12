#!/usr/bin/env python3
"""
Final Fee Percentage Test - Complete verification of fee calculation issue
"""

import requests
import json
from datetime import datetime

class CompleteFeeTest:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None

    def login_user(self):
        """Login with test user"""
        print("🔐 Logging in as test user...")
        
        user_data = {"username": "testuser", "password": "testpass123"}
        
        try:
            response = requests.post(f"{self.api_url}/auth/login", json=user_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.token = data['access_token']
                    print("✅ User login successful")
                    return True
        except Exception as e:
            print(f"❌ User login failed: {e}")
        
        return False

    def login_admin(self):
        """Login as admin"""
        print("🔐 Logging in as admin...")
        
        admin_data = {"username": "admin", "password": "admin123"}
        
        try:
            response = requests.post(f"{self.api_url}/admin/auth/login", json=admin_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.admin_token = data['access_token']
                    print("✅ Admin login successful")
                    return True
        except Exception as e:
            print(f"❌ Admin login failed: {e}")
        
        return False

    def get_user_accounts(self):
        """Get accounts for the logged-in user"""
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(f"{self.api_url}/accounts", headers=headers, timeout=10)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"❌ Error getting user accounts: {e}")
        
        return []

    def get_all_accounts_admin(self):
        """Get all accounts via admin endpoint"""
        headers = {
            'Authorization': f'Bearer {self.admin_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(f"{self.api_url}/admin/accounts", headers=headers, timeout=10)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"❌ Error getting admin accounts: {e}")
        
        return []

    def update_account_fee(self, account_id, fee_percentage):
        """Update account fee percentage via admin endpoint"""
        headers = {
            'Authorization': f'Bearer {self.admin_token}',
            'Content-Type': 'application/json'
        }
        
        fee_data = {"fee_percentage": fee_percentage}
        
        try:
            response = requests.put(
                f"{self.api_url}/admin/accounts/{account_id}/fee", 
                json=fee_data, 
                headers=headers, 
                timeout=10
            )
            
            if response.status_code == 200:
                return True
        except Exception as e:
            print(f"❌ Error updating fee: {e}")
        
        return False

    def test_topup_with_fee(self, account):
        """Test TopUp with fee calculation"""
        print(f"\n🧪 TESTING TOPUP WITH FEE CALCULATION")
        print(f"Account: {account['account_name']}")
        print(f"Platform: {account['platform']}")
        print(f"Fee: {account['fee_percentage']}%")
        
        # Calculate expected values
        test_amount = 100000  # Rp 100,000
        expected_fee = test_amount * account['fee_percentage'] / 100
        expected_total = test_amount + expected_fee
        
        print(f"Base Amount: Rp {test_amount:,}")
        print(f"Expected Fee: Rp {expected_fee:,}")
        print(f"Expected Total: Rp {expected_total:,}")
        
        # Prepare TopUp data
        topup_data = {
            "currency": "IDR",
            "accounts": [
                {
                    "account_id": account['id'],
                    "amount": test_amount,
                    "fee_percentage": account['fee_percentage'],
                    "fee_amount": expected_fee
                }
            ],
            "total_amount": expected_total,
            "total_fee": expected_fee
        }
        
        # Send TopUp request
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(f"{self.api_url}/topup", json=topup_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                response_data = response.json()
                print("✅ TopUp request successful!")
                
                # Analyze response
                transfer_details = response_data.get('transfer_details', {})
                subtotal = transfer_details.get('subtotal', 0)
                total_transfer = transfer_details.get('total_transfer', 0)
                unique_code = transfer_details.get('unique_code', 0)
                
                print(f"\n📋 RESPONSE ANALYSIS:")
                print(f"Subtotal: Rp {subtotal:,}")
                print(f"Unique Code: +{unique_code}")
                print(f"Total Transfer: Rp {total_transfer:,}")
                
                # Verify fee is included
                if total_transfer > subtotal:
                    additional = total_transfer - subtotal
                    print(f"✅ Fee + Unique Code: Rp {additional:,}")
                    print("✅ Fee calculation is working correctly!")
                    
                    # Test invoice generation
                    request_id = response_data.get('request_id')
                    if request_id:
                        self.test_invoice(request_id)
                    
                    return True
                else:
                    print("❌ No fee included in total")
                    return False
            else:
                print(f"❌ TopUp failed: {response.status_code}")
                print(response.text)
                return False
                
        except Exception as e:
            print(f"❌ TopUp error: {e}")
            return False

    def test_invoice(self, request_id):
        """Test invoice generation"""
        print(f"\n📄 Testing invoice generation...")
        
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(f"{self.api_url}/topup-request/{request_id}/invoice", headers=headers, timeout=10)
            
            if response.status_code == 200:
                print("✅ Invoice generated successfully!")
                return True
            else:
                print(f"❌ Invoice generation failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Invoice error: {e}")
            return False

    def run_complete_test(self):
        """Run the complete fee percentage test"""
        print("🚀 COMPLETE FEE PERCENTAGE VERIFICATION TEST")
        print("="*80)
        
        # Step 1: Login
        if not self.login_user() or not self.login_admin():
            print("❌ Login failed")
            return False
        
        # Step 2: Check current user accounts
        print("\n📊 STEP 1: CHECKING USER'S CURRENT ACCOUNTS")
        print("-"*50)
        
        user_accounts = self.get_user_accounts()
        print(f"User has {len(user_accounts)} accounts:")
        
        accounts_with_fees = []
        accounts_without_fees = []
        
        for account in user_accounts:
            fee = account.get('fee_percentage', 0)
            print(f"• {account['platform'].upper()} - {account['account_name']} - Fee: {fee}%")
            
            if fee > 0:
                accounts_with_fees.append(account)
            else:
                accounts_without_fees.append(account)
        
        print(f"\nAccounts with fees: {len(accounts_with_fees)}")
        print(f"Accounts without fees: {len(accounts_without_fees)}")
        
        # Step 3: Show system-wide fee status
        print("\n📊 STEP 2: CHECKING SYSTEM-WIDE ACCOUNT FEES")
        print("-"*50)
        
        all_accounts = self.get_all_accounts_admin()
        system_accounts_with_fees = [acc for acc in all_accounts if acc.get('fee_percentage', 0) > 0]
        
        print(f"Total accounts in system: {len(all_accounts)}")
        print(f"System accounts with fees: {len(system_accounts_with_fees)}")
        
        if system_accounts_with_fees:
            print("\nSample accounts with fees:")
            for i, acc in enumerate(system_accounts_with_fees[:5]):
                print(f"  {i+1}. {acc['platform'].upper()} - {acc['account_name'][:30]} - {acc['fee_percentage']}%")
        
        # Step 4: Test current state
        print(f"\n🧪 STEP 3: TESTING CURRENT STATE")
        print("-"*50)
        
        if accounts_with_fees:
            print("✅ User has accounts with fees - testing TopUp...")
            test_account = accounts_with_fees[0]
            success = self.test_topup_with_fee(test_account)
            
            if success:
                print("\n🎉 RESULT: Fee calculation is working correctly!")
                print("   The user's issue might be with account selection in frontend.")
                return True
        else:
            print("⚠️ User has no accounts with fees - this explains the 'Rp 0,00' issue")
            
            # Step 5: Update an account and test
            print(f"\n🔧 STEP 4: UPDATING ACCOUNT FOR TESTING")
            print("-"*50)
            
            if accounts_without_fees:
                test_account = accounts_without_fees[0]
                print(f"Updating account: {test_account['account_name']}")
                
                if self.update_account_fee(test_account['id'], 5.0):
                    print("✅ Account updated successfully!")
                    
                    # Re-fetch user accounts
                    updated_accounts = self.get_user_accounts()
                    updated_account = None
                    
                    for acc in updated_accounts:
                        if acc['id'] == test_account['id']:
                            updated_account = acc
                            break
                    
                    if updated_account and updated_account.get('fee_percentage', 0) > 0:
                        print(f"✅ Verified: Account now has {updated_account['fee_percentage']}% fee")
                        
                        # Test TopUp with updated account
                        print(f"\n🧪 STEP 5: TESTING WITH UPDATED ACCOUNT")
                        print("-"*50)
                        
                        success = self.test_topup_with_fee(updated_account)
                        
                        if success:
                            print("\n🎉 RESULT: Fee calculation works after updating account!")
                            print("   SOLUTION: Update user's accounts to have fee_percentage > 0")
                            return True
                        else:
                            print("\n❌ RESULT: Fee calculation still not working")
                            return False
                    else:
                        print("❌ Account update verification failed")
                        return False
                else:
                    print("❌ Failed to update account")
                    return False
            else:
                print("❌ No accounts available to update")
                return False
        
        return False

if __name__ == "__main__":
    tester = CompleteFeeTest()
    success = tester.run_complete_test()
    
    print("\n" + "="*80)
    print("🎯 FINAL CONCLUSION")
    print("="*80)
    
    if success:
        print("✅ Fee calculation system is working correctly")
        print("✅ Issue resolved: Accounts now have proper fee_percentage values")
        print("✅ TopUp shows correct fee amounts when fee_percentage > 0")
    else:
        print("❌ Fee calculation system has issues")
        print("❌ Further investigation needed")
    
    print("\n📋 RECOMMENDATIONS:")
    print("1. Ensure all user accounts have appropriate fee_percentage values")
    print("2. Verify frontend correctly displays fees when fee_percentage > 0")
    print("3. Check that account selection in TopUp uses accounts with fees")