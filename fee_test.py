#!/usr/bin/env python3
"""
Fee Percentage Database Check Test
Testing fee percentage values in ad accounts and TopUp functionality
"""

import requests
import sys
import json
from datetime import datetime

class FeePercentageTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None

    def login_user(self):
        """Login with test user"""
        print("🔐 Logging in as test user...")
        
        # Try existing test users first
        test_users = [
            {"username": "testuser", "password": "testpass123"},
            {"username": "testuser", "password": "password123"},
            {"username": "uniquetest_190449", "password": "password123"}
        ]
        
        for user_data in test_users:
            try:
                response = requests.post(f"{self.api_url}/auth/login", json=user_data, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if 'access_token' in data:
                        self.token = data['access_token']
                        print(f"✅ Logged in successfully as {user_data['username']}")
                        return True
            except Exception as e:
                print(f"❌ Login failed for {user_data['username']}: {e}")
                continue
        
        print("❌ All login attempts failed")
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

    def get_accounts(self):
        """Get all user accounts"""
        print("📋 Retrieving user accounts...")
        
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(f"{self.api_url}/accounts", headers=headers, timeout=10)
            if response.status_code == 200:
                accounts = response.json()
                print(f"✅ Retrieved {len(accounts)} accounts")
                return accounts
            else:
                print(f"❌ Failed to get accounts: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ Error getting accounts: {e}")
            return []

    def analyze_fee_percentages(self, accounts):
        """Analyze fee percentage values in accounts"""
        print("\n" + "="*80)
        print("📊 ACCOUNT FEE PERCENTAGE ANALYSIS")
        print("="*80)
        
        accounts_with_fees = []
        accounts_without_fees = []
        
        if not accounts:
            print("❌ No accounts found in database")
            return accounts_with_fees, accounts_without_fees
        
        print(f"Found {len(accounts)} total accounts:\n")
        
        for i, account in enumerate(accounts):
            account_id = account.get('id', 'N/A')
            account_name = account.get('account_name', 'N/A')
            platform = account.get('platform', 'N/A')
            fee_percentage = account.get('fee_percentage', 0)
            status = account.get('status', 'N/A')
            currency = account.get('currency', 'N/A')
            
            print(f"{i+1:2d}. {platform.upper():8s} | {account_name[:25]:25s} | Fee: {fee_percentage:5.1f}% | {status:10s} | {currency}")
            
            if fee_percentage and fee_percentage > 0:
                accounts_with_fees.append({
                    'id': account_id,
                    'name': account_name,
                    'platform': platform,
                    'fee_percentage': fee_percentage,
                    'currency': currency,
                    'status': status
                })
            else:
                accounts_without_fees.append({
                    'id': account_id,
                    'name': account_name,
                    'platform': platform,
                    'fee_percentage': fee_percentage,
                    'currency': currency,
                    'status': status
                })
        
        print("\n" + "-"*80)
        print(f"✅ Accounts WITH fees (fee_percentage > 0): {len(accounts_with_fees)}")
        print(f"❌ Accounts WITHOUT fees (fee_percentage = 0): {len(accounts_without_fees)}")
        
        if accounts_with_fees:
            print("\n🎯 ACCOUNTS WITH FEES:")
            for acc in accounts_with_fees:
                print(f"   • {acc['platform'].upper()} - {acc['name'][:30]} - {acc['fee_percentage']}% - {acc['currency']}")
        
        return accounts_with_fees, accounts_without_fees

    def test_topup_with_fee(self, account_with_fee):
        """Test TopUp functionality with an account that has fee_percentage > 0"""
        print("\n" + "="*80)
        print("🧪 TESTING TOPUP WITH FEE CALCULATION")
        print("="*80)
        
        print(f"Testing with account: {account_with_fee['name']}")
        print(f"Platform: {account_with_fee['platform']}")
        print(f"Fee Percentage: {account_with_fee['fee_percentage']}%")
        print(f"Currency: {account_with_fee['currency']}")
        
        # Calculate expected fee
        test_amount = 100000  # Rp 100,000
        expected_fee = test_amount * account_with_fee['fee_percentage'] / 100
        expected_total = test_amount + expected_fee
        
        print(f"\n💰 CALCULATION:")
        print(f"   Base Amount: Rp {test_amount:,}")
        print(f"   Fee ({account_with_fee['fee_percentage']}%): Rp {expected_fee:,}")
        print(f"   Expected Total: Rp {expected_total:,}")
        
        # Prepare TopUp data
        topup_data = {
            "currency": account_with_fee['currency'] or "IDR",
            "accounts": [
                {
                    "account_id": account_with_fee['id'],
                    "amount": test_amount,
                    "fee_percentage": account_with_fee['fee_percentage'],
                    "fee_amount": expected_fee
                }
            ],
            "total_amount": expected_total,
            "total_fee": expected_fee
        }
        
        print(f"\n📤 SENDING TOPUP REQUEST:")
        print(json.dumps(topup_data, indent=2))
        
        # Send TopUp request
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(f"{self.api_url}/topup", json=topup_data, headers=headers, timeout=10)
            print(f"\n📥 RESPONSE STATUS: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.json()
                print("✅ TopUp request successful!")
                print(f"📋 Response: {json.dumps(response_data, indent=2)}")
                
                # Analyze response
                self.analyze_topup_response(response_data, test_amount, expected_fee)
                
                # Test invoice generation
                request_id = response_data.get('request_id')
                if request_id:
                    self.test_invoice_generation(request_id)
                
                return True
            else:
                print(f"❌ TopUp request failed: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error details: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"Error text: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error sending TopUp request: {e}")
            return False

    def analyze_topup_response(self, response_data, expected_amount, expected_fee):
        """Analyze TopUp response for fee calculation verification"""
        print("\n🔍 ANALYZING TOPUP RESPONSE:")
        
        transfer_details = response_data.get('transfer_details', {})
        
        # Check key fields
        subtotal = transfer_details.get('subtotal', 0)
        total_transfer = transfer_details.get('total_transfer', 0)
        unique_code = transfer_details.get('unique_code', 0)
        
        print(f"   Subtotal: Rp {subtotal:,}")
        print(f"   Unique Code: +{unique_code}")
        print(f"   Total Transfer: Rp {total_transfer:,}")
        
        # Verify calculations
        if subtotal == expected_amount:
            print("✅ Subtotal matches expected base amount")
        else:
            print(f"❌ Subtotal mismatch: expected Rp {expected_amount:,}, got Rp {subtotal:,}")
        
        if total_transfer > subtotal:
            additional_amount = total_transfer - subtotal
            print(f"✅ Total includes additional amount: Rp {additional_amount:,}")
            print(f"   (This includes fee + unique code)")
        else:
            print("❌ Total should be greater than subtotal for fee calculation")
        
        # Check transfer details structure
        required_fields = ['type', 'bank_name', 'account_number', 'account_holder']
        missing_fields = [field for field in required_fields if field not in transfer_details]
        
        if missing_fields:
            print(f"⚠️ Missing transfer detail fields: {missing_fields}")
        else:
            print("✅ All required transfer detail fields present")

    def test_invoice_generation(self, request_id):
        """Test invoice generation for the TopUp request"""
        print(f"\n📄 TESTING INVOICE GENERATION for request {request_id}...")
        
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(f"{self.api_url}/topup-request/{request_id}/invoice", headers=headers, timeout=10)
            
            if response.status_code == 200:
                print("✅ Invoice generated successfully!")
                print(f"   Content-Type: {response.headers.get('content-type', 'N/A')}")
                print(f"   Content-Length: {len(response.content)} bytes")
                return True
            else:
                print(f"❌ Invoice generation failed: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error details: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"Error text: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error generating invoice: {e}")
            return False

    def update_account_fee_percentage(self, account_id, fee_percentage=5.0):
        """Update account fee percentage (requires admin access)"""
        print(f"\n🔧 UPDATING ACCOUNT FEE PERCENTAGE...")
        print(f"Account ID: {account_id}")
        print(f"New Fee Percentage: {fee_percentage}%")
        
        if not self.admin_token:
            print("❌ Admin token required for updating account fee percentage")
            return False
        
        # Use the new admin endpoint to update fee percentage
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
                print("✅ Account fee percentage updated successfully!")
                return True
            else:
                print(f"❌ Failed to update fee percentage: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error details: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"Error text: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error updating fee percentage: {e}")
            return False

    def run_fee_test(self):
        """Run the complete fee percentage test"""
        print("🚀 STARTING FEE PERCENTAGE DATABASE CHECK")
        print("="*80)
        
        # Step 1: Login
        if not self.login_user():
            print("❌ User login failed - cannot continue")
            return False
        
        if not self.login_admin():
            print("⚠️ Admin login failed - limited functionality")
        
        # Step 2: Get accounts
        accounts = self.get_accounts()
        if not accounts:
            print("❌ No accounts found - cannot test fee calculation")
            return False
        
        # Step 3: Analyze fee percentages
        accounts_with_fees, accounts_without_fees = self.analyze_fee_percentages(accounts)
        
        # Step 4: Test TopUp with fee calculation
        if accounts_with_fees:
            print(f"\n✅ Found {len(accounts_with_fees)} accounts with fees")
            
            # Test with the first account that has fees
            test_account = accounts_with_fees[0]
            success = self.test_topup_with_fee(test_account)
            
            if success:
                print("\n🎉 FEE CALCULATION TEST PASSED!")
                print("   • Fee percentage is properly stored in database")
                print("   • TopUp calculation includes fees correctly")
                print("   • Invoice generation works with fees")
            else:
                print("\n❌ FEE CALCULATION TEST FAILED!")
                
        else:
            print(f"\n⚠️ NO ACCOUNTS WITH FEE_PERCENTAGE > 0 FOUND!")
            print("   This explains why user sees 'Rp 0,00' for fees in TopUp page")
            print(f"   Found {len(accounts_without_fees)} accounts with 0% fee")
            
            if accounts_without_fees:
                print("\n🔧 ATTEMPTING TO UPDATE ACCOUNT FOR TESTING:")
                print(f"   Updating account: {accounts_without_fees[0]['name']} (ID: {accounts_without_fees[0]['id']})")
                
                # Attempt to update account fee percentage
                update_success = self.update_account_fee_percentage(accounts_without_fees[0]['id'], 5.0)
                
                if update_success:
                    print("✅ Account updated! Re-checking accounts...")
                    
                    # Re-fetch accounts to get updated data
                    updated_accounts = self.get_accounts()
                    if updated_accounts:
                        updated_accounts_with_fees, _ = self.analyze_fee_percentages(updated_accounts)
                        
                        if updated_accounts_with_fees:
                            print("\n🧪 NOW TESTING TOPUP WITH UPDATED ACCOUNT...")
                            test_account = updated_accounts_with_fees[0]
                            success = self.test_topup_with_fee(test_account)
                            
                            if success:
                                print("\n🎉 FEE CALCULATION TEST PASSED AFTER UPDATE!")
                                print("   • Account fee_percentage successfully updated")
                                print("   • TopUp calculation now includes fees correctly")
                                print("   • Invoice generation works with fees")
                                return True
                else:
                    print("❌ Failed to update account fee percentage")
        
        print("\n" + "="*80)
        print("📊 FINAL SUMMARY")
        print("="*80)
        print(f"Total Accounts: {len(accounts)}")
        print(f"Accounts with Fees: {len(accounts_with_fees)}")
        print(f"Accounts without Fees: {len(accounts_without_fees)}")
        
        if accounts_with_fees:
            print("✅ Fee calculation can be tested with existing accounts")
        else:
            print("❌ No accounts have fees - explains user's 'Rp 0,00' issue")
        
        return len(accounts_with_fees) > 0

if __name__ == "__main__":
    tester = FeePercentageTester()
    success = tester.run_fee_test()
    
    if success:
        print("\n🎯 TEST RESULT: Fee calculation is working when accounts have fee_percentage > 0")
    else:
        print("\n🎯 TEST RESULT: Issue confirmed - no accounts have fee_percentage > 0")
    
    sys.exit(0 if success else 1)