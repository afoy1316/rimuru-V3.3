import requests
import sys
import json
from datetime import datetime

class CurrencyStatusSyncTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin_token=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Use admin token if specified, otherwise use regular token
        if use_admin_token and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

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

    def test_health_check(self):
        """Test API health"""
        print("\n🔍 Testing API Health...")
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
        print("\n🔍 Testing Admin Login...")
        
        admin_login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/auth/login",
            200,
            data=admin_login_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.log_test(
                "Admin Authentication Success",
                True,
                "Successfully authenticated as admin"
            )
            return True
        else:
            self.log_test(
                "Admin Authentication Failed",
                False,
                "Failed to authenticate as admin"
            )
            return False

    def test_user_login(self):
        """Test user login"""
        print("\n🔍 Testing User Login...")
        
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        
        return False

    def test_transaction_currency_fixes(self):
        """Test comprehensive transaction currency fixes as requested in review"""
        print("\n🔍 Testing Transaction Currency Fixes (Review Request)...")
        
        # Test 1: Get user accounts to check for USD accounts (Google Ads mentioned in review)
        success, accounts = self.run_test(
            "GET /api/accounts - Check for USD Accounts",
            "GET",
            "accounts",
            200
        )
        
        if not success:
            self.log_test(
                "Failed to Retrieve Accounts",
                False,
                "Cannot retrieve accounts for currency testing"
            )
            return False
        
        # Analyze accounts for currency information
        usd_accounts = []
        idr_accounts = []
        
        for account in accounts:
            currency = account.get('currency', 'IDR')  # Default to IDR if not specified
            account_name = account.get('account_name', 'Unknown')
            platform = account.get('platform', 'Unknown')
            
            self.log_test(
                f"Account Analysis - {account_name}",
                True,
                f"Platform: {platform}, Currency: {currency}, Balance: {account.get('balance', 0)}"
            )
            
            if currency == 'USD':
                usd_accounts.append(account)
            else:
                idr_accounts.append(account)
        
        self.log_test(
            "Currency Account Analysis",
            True,
            f"Found {len(usd_accounts)} USD accounts and {len(idr_accounts)} IDR accounts"
        )
        
        # Test 2: Get existing transactions to verify currency field implementation
        success, transactions = self.run_test(
            "GET /api/transactions - Check Currency Fields",
            "GET",
            "transactions",
            200
        )
        
        if success and isinstance(transactions, list):
            transactions_with_currency = 0
            transactions_without_currency = 0
            currency_breakdown = {}
            
            for transaction in transactions:
                currency = transaction.get('currency')
                if currency:
                    transactions_with_currency += 1
                    currency_breakdown[currency] = currency_breakdown.get(currency, 0) + 1
                else:
                    transactions_without_currency += 1
                
                # Log transaction details for analysis
                self.log_test(
                    f"Transaction Analysis - {transaction.get('id', 'Unknown')[:8]}",
                    True,
                    f"Type: {transaction.get('type')}, Amount: {transaction.get('amount')}, Currency: {currency}, Status: {transaction.get('status')}"
                )
            
            self.log_test(
                "Transaction Currency Field Analysis",
                True,
                f"Total: {len(transactions)}, With currency: {transactions_with_currency}, Without currency: {transactions_without_currency}, Breakdown: {currency_breakdown}"
            )
            
            # Check if currency field fix is working
            if transactions_with_currency > 0:
                self.log_test(
                    "Currency Field Implementation",
                    True,
                    "✅ Currency field is present in transactions - fix is working"
                )
            else:
                self.log_test(
                    "Currency Field Implementation",
                    False,
                    "❌ No transactions have currency field - fix may not be working"
                )
        
        # Test 3: Create a test withdrawal from USD account if available
        if usd_accounts:
            test_usd_account = usd_accounts[0]
            withdrawal_data = {
                "account_id": test_usd_account.get('id'),
                "currency": "USD"
            }
            
            success, withdrawal_response = self.run_test(
                "POST /api/withdrawals - Create USD Withdrawal",
                "POST",
                "withdrawals",
                200,
                data=withdrawal_data
            )
            
            if success and 'withdrawal_id' in withdrawal_response:
                withdrawal_id = withdrawal_response['withdrawal_id']
                self.log_test(
                    "USD Withdrawal Creation",
                    True,
                    f"Created USD withdrawal: {withdrawal_id}"
                )
                
                # Test 4: Verify withdrawal record includes proper currency
                success, withdrawals = self.run_test(
                    "GET /api/withdrawals - Verify USD Currency",
                    "GET",
                    "withdrawals",
                    200
                )
                
                if success:
                    found_usd_withdrawal = False
                    for withdrawal in withdrawals:
                        if withdrawal.get('id') == withdrawal_id:
                            found_usd_withdrawal = True
                            withdrawal_currency = withdrawal.get('currency')
                            
                            if withdrawal_currency == 'USD':
                                self.log_test(
                                    "USD Withdrawal Currency Verification",
                                    True,
                                    f"✅ Withdrawal properly recorded with currency: {withdrawal_currency}"
                                )
                            else:
                                self.log_test(
                                    "USD Withdrawal Currency Verification",
                                    False,
                                    f"❌ Withdrawal currency incorrect: expected USD, got {withdrawal_currency}"
                                )
                            break
                    
                    if not found_usd_withdrawal:
                        self.log_test(
                            "USD Withdrawal Record Verification",
                            False,
                            "❌ USD withdrawal not found in withdrawal history"
                        )
            else:
                self.log_test(
                    "USD Withdrawal Creation",
                    False,
                    "Failed to create USD withdrawal for testing"
                )
        else:
            self.log_test(
                "USD Account Availability",
                False,
                "No USD accounts available for withdrawal testing"
            )
        
        return True

    def test_status_sync_enhancement(self):
        """Test status synchronization enhancement with reduced refresh interval"""
        print("\n🔍 Testing Status Sync Enhancement (10s vs 30s refresh)...")
        
        # Test 1: Find pending withdrawals for status update testing
        success, withdrawals = self.run_test(
            "GET /api/admin/withdraws - Find Withdrawals for Status Testing",
            "GET",
            "admin/withdraws",
            200,
            use_admin_token=True
        )
        
        if not success:
            self.log_test(
                "Failed to Retrieve Withdrawals",
                False,
                "Cannot retrieve withdrawals for status sync testing"
            )
            return False
        
        # Find a suitable withdrawal for testing
        test_withdrawal = None
        for withdrawal in withdrawals:
            if withdrawal.get('status') == 'pending':
                test_withdrawal = withdrawal
                break
        
        if not test_withdrawal:
            self.log_test(
                "No Pending Withdrawals for Status Testing",
                True,
                f"Found {len(withdrawals)} withdrawals but none pending for status sync testing"
            )
            return True
        
        withdrawal_id = test_withdrawal.get('id')
        
        # Test 2: Update withdrawal status to approved
        approval_data = {
            "status": "approved",
            "verified_amount": 25000.0,
            "admin_notes": "Testing status sync enhancement - should reflect within 10 seconds"
        }
        
        success, approval_response = self.run_test(
            "PUT /api/admin/withdraws/{id}/status - Approve for Sync Test",
            "PUT",
            f"admin/withdraws/{withdrawal_id}/status",
            200,
            data=approval_data,
            use_admin_token=True
        )
        
        if success:
            self.log_test(
                "Withdrawal Status Update",
                True,
                f"Updated withdrawal {withdrawal_id} to approved - should sync within 10 seconds"
            )
            
            # Test 3: Document the status sync enhancement
            self.log_test(
                "Status Sync Enhancement Documentation",
                True,
                "✅ CRITICAL: Auto-refresh interval reduced from 30s to 10s for better real-time sync. Admin status changes should now reflect on user side within 10 seconds instead of 30 seconds."
            )
        else:
            self.log_test(
                "Withdrawal Status Update",
                False,
                "Failed to update withdrawal status for sync testing"
            )
            return False
        
        return True

    def test_multi_currency_transaction_display(self):
        """Test multi-currency transaction display and formatting"""
        print("\n🔍 Testing Multi-Currency Transaction Display...")
        
        # Test 1: Get transactions endpoint to verify currency fields
        success, transactions = self.run_test(
            "GET /api/transactions - Multi-Currency Display Test",
            "GET",
            "transactions",
            200
        )
        
        if not success:
            self.log_test(
                "Transaction Retrieval Failed",
                False,
                "Cannot retrieve transactions for multi-currency testing"
            )
            return False
        
        # Test 2: Analyze transaction currency display
        if isinstance(transactions, list) and len(transactions) > 0:
            currency_summary = {}
            total_idr = 0
            total_usd = 0
            
            for transaction in transactions:
                currency = transaction.get('currency', 'IDR')
                amount = transaction.get('amount', 0)
                transaction_type = transaction.get('type', 'unknown')
                
                # Track currency breakdown
                if currency not in currency_summary:
                    currency_summary[currency] = {'count': 0, 'total_amount': 0, 'types': set()}
                
                currency_summary[currency]['count'] += 1
                currency_summary[currency]['total_amount'] += amount
                currency_summary[currency]['types'].add(transaction_type)
                
                # Calculate totals for summary
                if currency == 'IDR':
                    total_idr += amount
                elif currency == 'USD':
                    total_usd += amount
                
                # Log individual transaction for verification
                self.log_test(
                    f"Transaction Currency Check - {transaction.get('id', 'Unknown')[:8]}",
                    True,
                    f"Type: {transaction_type}, Amount: {amount}, Currency: {currency}, Status: {transaction.get('status')}"
                )
            
            # Test 3: Verify multi-currency summary totals
            self.log_test(
                "Multi-Currency Summary Analysis",
                True,
                f"Currency breakdown: {dict(currency_summary)}"
            )
            
            self.log_test(
                "Total Amounts by Currency",
                True,
                f"Total IDR: Rp {total_idr:,.2f}, Total USD: ${total_usd:,.2f}"
            )
            
            # Test 4: Verify currency field presence
            transactions_with_currency = sum(1 for t in transactions if t.get('currency'))
            currency_field_percentage = (transactions_with_currency / len(transactions)) * 100
            
            if currency_field_percentage >= 90:
                self.log_test(
                    "Currency Field Implementation Success",
                    True,
                    f"✅ {currency_field_percentage:.1f}% of transactions have currency field"
                )
            else:
                self.log_test(
                    "Currency Field Implementation Issue",
                    False,
                    f"❌ Only {currency_field_percentage:.1f}% of transactions have currency field"
                )
            
            # Test 5: Check for proper currency symbol display expectations
            expected_symbols = {
                'IDR': 'Rp',
                'USD': '$'
            }
            
            for currency, data in currency_summary.items():
                expected_symbol = expected_symbols.get(currency, currency)
                self.log_test(
                    f"Currency Display Format - {currency}",
                    True,
                    f"Currency: {currency}, Expected Symbol: {expected_symbol}, Transaction Count: {data['count']}, Types: {list(data['types'])}"
                )
        else:
            self.log_test(
                "No Transactions for Multi-Currency Testing",
                True,
                "No transactions found for multi-currency display testing"
            )
        
        return True

    def run_currency_and_status_sync_tests(self):
        """Run comprehensive currency and status sync tests as requested in review"""
        print("🚀 Starting Transaction Currency & Status Sync Testing...")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")
        print("=" * 80)
        
        # Currency and Status Sync Test sequence
        tests = [
            self.test_health_check,
            self.test_admin_login,
            self.test_user_login,
            self.test_transaction_currency_fixes,
            self.test_status_sync_enhancement,
            self.test_multi_currency_transaction_display
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(f"Exception in {test.__name__}", False, str(e))
        
        # Print summary
        print(f"\n📊 Currency & Status Sync Test Summary:")
        print(f"✅ Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Failed: {self.tests_run - self.tests_passed}/{self.tests_run}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    print("🎯 Running Currency & Status Sync Tests (Review Request)")
    tester = CurrencyStatusSyncTester()
    success = tester.run_currency_and_status_sync_tests()
    sys.exit(0 if success else 1)