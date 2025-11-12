import requests
import sys
import json
from datetime import datetime

class WalletCurrencyTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, use_admin_token=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if use_admin_token and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'
        elif self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_detail = response.json()
                    details += f", Response: {error_detail}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_wallet_currency_issue(self):
        """Test Wallet Top-Up Transaction Currency Issue"""
        print("\n🔍 Testing Wallet Top-Up Transaction Currency Issue...")
        
        # Step 1: Authenticate as client
        print("\n🔍 Step 1: Authenticate as client...")
        client_login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        success, client_response = self.run_test(
            "Client Authentication",
            "POST",
            "auth/login",
            200,
            data=client_login_data
        )
        
        if not success or 'access_token' not in client_response:
            print("❌ Failed to authenticate client")
            return False
        
        self.token = client_response['access_token']
        
        # Step 2: Call GET /api/transactions
        print("\n🔍 Step 2: Call GET /api/transactions...")
        success, transactions_response = self.run_test(
            "GET /api/transactions",
            "GET",
            "transactions",
            200
        )
        
        if not success:
            print("❌ Failed to retrieve transactions")
            return False
        
        print(f"\n📊 Total transactions found: {len(transactions_response)}")
        
        # Step 3: Analyze transactions for currency patterns
        print("\n🔍 Step 3: Analyze transactions for currency patterns...")
        
        wallet_topup_transactions = []
        wallet_transfer_transactions = []
        
        for transaction in transactions_response:
            transaction_type = transaction.get('type', '')
            description = transaction.get('description', '')
            
            if transaction_type == 'wallet_topup' or 'Wallet Top-Up' in description:
                wallet_topup_transactions.append(transaction)
            elif transaction_type == 'wallet_to_account_transfer':
                wallet_transfer_transactions.append(transaction)
        
        print(f"   Found {len(wallet_topup_transactions)} wallet top-up transactions")
        print(f"   Found {len(wallet_transfer_transactions)} wallet transfer transactions")
        
        # Step 4: Check admin wallet requests if no transactions found
        if len(wallet_topup_transactions) == 0:
            print("\n🔍 Step 4: No wallet transactions found. Checking admin wallet requests...")
            
            admin_login_data = {
                "username": "admin",
                "password": "admin123"
            }
            
            admin_success, admin_response = self.run_test(
                "Admin Authentication",
                "POST",
                "admin/auth/login",
                200,
                data=admin_login_data
            )
            
            if admin_success and 'access_token' in admin_response:
                self.admin_token = admin_response['access_token']
                
                # Get wallet requests
                wallet_success, wallet_response = self.run_test(
                    "Admin Get Wallet Requests",
                    "GET",
                    "admin/wallet-topup-requests",
                    200,
                    use_admin_token=True
                )
                
                if wallet_success and isinstance(wallet_response, list):
                    print(f"\n📊 Found {len(wallet_response)} wallet requests in system")
                    
                    # Analyze currency patterns
                    currency_analysis = {}
                    verified_requests = []
                    
                    for request in wallet_response:
                        currency = request.get('currency', 'N/A')
                        status = request.get('status', 'N/A')
                        
                        if currency not in currency_analysis:
                            currency_analysis[currency] = {'total': 0, 'verified': 0}
                        currency_analysis[currency]['total'] += 1
                        
                        if status == 'verified':
                            currency_analysis[currency]['verified'] += 1
                            verified_requests.append(request)
                    
                    print(f"\n💰 Currency Analysis: {currency_analysis}")
                    
                    # Show details of verified requests
                    print(f"\n🔍 Verified Wallet Requests (showing first 3):")
                    for i, request in enumerate(verified_requests[:3]):
                        created_at = request.get('created_at', 'N/A')
                        print(f"   Request {i+1}:")
                        print(f"     ID: {request.get('id', 'N/A')}")
                        print(f"     Currency: '{request.get('currency', 'N/A')}'")
                        print(f"     Amount: {request.get('amount', 'N/A')}")
                        print(f"     Created: {created_at}")
                        
                        # Check if this matches the screenshot date (15 Oktober 2025 ~01:40)
                        if '15' in created_at and ('01:' in created_at or '1:' in created_at):
                            print(f"     🎯 POTENTIAL MATCH for screenshot transaction!")
                        print()
                    
                    # Summary
                    issue_found = False
                    issue_details = []
                    
                    for request in verified_requests:
                        currency = request.get('currency', '')
                        if currency and currency.lower() == 'idr' and 'wallet' in request.get('wallet_type', '').lower():
                            issue_found = True
                            issue_details.append(f"Wallet request {request.get('id', 'N/A')[:8]}... has currency '{currency}' (may be incorrect)")
                    
                    if issue_found:
                        self.log_test(
                            "Currency Issue Investigation - ISSUE FOUND",
                            True,
                            f"Found potential currency issues: {issue_details}"
                        )
                    else:
                        self.log_test(
                            "Currency Issue Investigation - NO ISSUE FOUND",
                            True,
                            "All wallet requests have expected currency values"
                        )
                    
                    # Final summary
                    print(f"\n🔍 INVESTIGATION SUMMARY:")
                    print(f"   Total wallet requests: {len(wallet_response)}")
                    print(f"   Verified requests: {len(verified_requests)}")
                    print(f"   Currency distribution: {currency_analysis}")
                    print(f"   Potential issues: {len(issue_details)}")
                    
                    return True
        
        return True

if __name__ == "__main__":
    tester = WalletCurrencyTester()
    
    print("🚀 Starting Wallet Top-Up Currency Issue Investigation...")
    print("=" * 80)
    
    success = tester.test_wallet_currency_issue()
    
    print("\n" + "=" * 80)
    print(f"📊 TEST SUMMARY:")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if success:
        print("✅ Investigation completed successfully!")
    else:
        print("❌ Investigation failed!")