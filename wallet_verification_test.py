import requests
import sys
import json
import jwt
import base64
from datetime import datetime, timezone
import tempfile
import os

class WalletVerificationTester:
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

            # Handle both single status code and list of acceptable status codes
            if isinstance(expected_status, list):
                success = response.status_code in expected_status
                details = f"Status: {response.status_code}, Expected: {expected_status}"
            else:
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

    def test_wallet_verification_fix_and_migration(self):
        """Test Wallet Verification Fix and Database Migration - Review Request"""
        print("\n🔍 Testing Wallet Verification Fix and Database Migration (Review Request)...")
        
        # Test 1: Admin Authentication
        print("\n🔍 Testing Admin Authentication...")
        admin_login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        success, admin_response = self.run_test(
            "Admin Login for Wallet Verification",
            "POST",
            "admin/auth/login",
            200,
            data=admin_login_data
        )
        
        if not success or 'access_token' not in admin_response:
            self.log_test(
                "Wallet Verification Test Setup",
                False,
                "Failed to obtain admin token for testing"
            )
            return False
        
        self.admin_token = admin_response['access_token']
        
        # Test 2: Client Authentication
        print("\n🔍 Testing Client Authentication...")
        client_login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        success, client_response = self.run_test(
            "Client Login for Wallet Verification",
            "POST",
            "auth/login",
            200,
            data=client_login_data
        )
        
        if not success or 'access_token' not in client_response:
            # Try creating test user if login fails
            print("\n🔍 Creating Test Client User...")
            timestamp = datetime.now().strftime('%H%M%S')
            test_user_data = {
                "username": "testuser",
                "name": "Test User",
                "phone_number": f"08123456{timestamp}",
                "address": "Jl. Test Street No. 123",
                "city": "Jakarta",
                "province": "DKI Jakarta",
                "email": f"testuser_{timestamp}@example.com",
                "password": "testpass123"
            }
            
            reg_success, reg_response = self.run_test(
                "Create Test Client User",
                "POST",
                "auth/register",
                200,
                data=test_user_data
            )
            
            if reg_success:
                success, client_response = self.run_test(
                    "Client Login (after registration)",
                    "POST",
                    "auth/login",
                    200,
                    data=client_login_data
                )
        
        if not success or 'access_token' not in client_response:
            self.log_test(
                "Wallet Verification Test Setup",
                False,
                "Failed to obtain client token for testing"
            )
            return False
        
        self.token = client_response['access_token']
        
        # Test 3: Check User Profile for New Wallet Fields (Database Migration)
        print("\n🔍 Testing Database Migration - New Wallet Fields...")
        success, profile_response = self.run_test(
            "GET /api/auth/me - Check New Wallet Fields",
            "GET",
            "auth/me",
            200
        )
        
        if not success:
            self.log_test(
                "Database Migration Check",
                False,
                "Failed to retrieve user profile for wallet fields check"
            )
            return False
        
        # Check for new wallet fields
        required_new_fields = ['main_wallet_idr', 'main_wallet_usd', 'withdrawal_wallet_idr', 'withdrawal_wallet_usd']
        legacy_fields = ['wallet_balance_idr', 'wallet_balance_usd']
        
        missing_new_fields = [field for field in required_new_fields if field not in profile_response]
        present_legacy_fields = [field for field in legacy_fields if field in profile_response]
        
        if missing_new_fields:
            self.log_test(
                "Database Migration - New Wallet Fields",
                False,
                f"Missing new wallet fields: {missing_new_fields}. Present legacy fields: {present_legacy_fields}"
            )
        else:
            self.log_test(
                "Database Migration - New Wallet Fields",
                True,
                f"All new wallet fields present: {required_new_fields}. Legacy fields also present: {present_legacy_fields}"
            )
        
        # Store initial wallet balances for comparison
        initial_main_wallet_idr = profile_response.get('main_wallet_idr', 0.0)
        initial_main_wallet_usd = profile_response.get('main_wallet_usd', 0.0)
        initial_withdrawal_wallet_idr = profile_response.get('withdrawal_wallet_idr', 0.0)
        initial_withdrawal_wallet_usd = profile_response.get('withdrawal_wallet_usd', 0.0)
        
        self.log_test(
            "Initial Wallet Balances",
            True,
            f"Main IDR: {initial_main_wallet_idr}, Main USD: {initial_main_wallet_usd}, Withdrawal IDR: {initial_withdrawal_wallet_idr}, Withdrawal USD: {initial_withdrawal_wallet_usd}"
        )
        
        # Test 4: Create Wallet Top-Up Request
        print("\n🔍 Creating Wallet Top-Up Request for Testing...")
        
        # Create temporary proof file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp_file:
            temp_file.write("Test payment proof for wallet verification fix testing")
            temp_file_path = temp_file.name
        
        try:
            # Prepare multipart form data for wallet topup
            files = {
                'payment_proof': ('proof.txt', open(temp_file_path, 'rb'), 'text/plain')
            }
            
            form_data = {
                'wallet_type': 'main',
                'currency': 'IDR',
                'amount': 75000,  # Test scenario amount from review request
                'payment_method': 'bank_bri',
                'notes': 'Test wallet verification fix - should increase main_wallet_idr by 75000',
                'unique_code': 456,
                'total_with_unique_code': 75456
            }
            
            # Make request with multipart form data
            url = f"{self.api_url}/wallet/topup"
            headers = {'Authorization': f'Bearer {self.token}'}
            
            response = requests.post(url, data=form_data, files=files, headers=headers, timeout=10)
            
            if response.status_code == 200:
                create_response = response.json()
                wallet_request_id = create_response.get('id')
                
                self.log_test(
                    "Wallet Top-Up Request Creation",
                    True,
                    f"Created wallet request: {wallet_request_id}"
                )
                
                # Test 5: Verify Request Appears in Admin List
                print("\n🔍 Verifying Request in Admin List...")
                success, admin_requests = self.run_test(
                    "GET /api/admin/wallet-topup-requests",
                    "GET",
                    "admin/wallet-topup-requests",
                    200,
                    use_admin_token=True
                )
                
                if success:
                    request_found = False
                    for req in admin_requests:
                        if req.get('id') == wallet_request_id:
                            request_found = True
                            user_info = req.get('user', {})
                            self.log_test(
                                "Request in Admin List",
                                True,
                                f"Request found with user_id: {user_info.get('id')}, amount: {req.get('amount')}, currency: {req.get('currency')}"
                            )
                            break
                    
                    if not request_found:
                        self.log_test(
                            "Request in Admin List",
                            False,
                            "Wallet request not found in admin list"
                        )
                        return False
                
                # Test 6: Admin Verification (Critical Test)
                print("\n🔍 Testing Admin Wallet Verification...")
                verification_data = {
                    "status": "verified",
                    "admin_notes": "Test verification for wallet balance update fix"
                }
                
                success, verify_response = self.run_test(
                    f"PUT /api/admin/wallet-topup-requests/{wallet_request_id}/status",
                    "PUT",
                    f"admin/wallet-topup-requests/{wallet_request_id}/status",
                    200,
                    data=verification_data,
                    use_admin_token=True
                )
                
                if not success:
                    self.log_test(
                        "Admin Wallet Verification",
                        False,
                        "Failed to verify wallet top-up request"
                    )
                    return False
                
                self.log_test(
                    "Admin Wallet Verification",
                    True,
                    "Successfully verified wallet top-up request"
                )
                
                # Test 7: Check Wallet Balance Update (Critical Test)
                print("\n🔍 Checking Wallet Balance Update After Verification...")
                success, updated_profile = self.run_test(
                    "GET /api/auth/me - Check Updated Wallet Balance",
                    "GET",
                    "auth/me",
                    200
                )
                
                if not success:
                    self.log_test(
                        "Wallet Balance Update Check",
                        False,
                        "Failed to retrieve updated user profile"
                    )
                    return False
                
                # Check if wallet balance increased
                updated_main_wallet_idr = updated_profile.get('main_wallet_idr', 0.0)
                updated_main_wallet_usd = updated_profile.get('main_wallet_usd', 0.0)
                updated_withdrawal_wallet_idr = updated_profile.get('withdrawal_wallet_idr', 0.0)
                updated_withdrawal_wallet_usd = updated_profile.get('withdrawal_wallet_usd', 0.0)
                
                expected_increase = 75000.0
                actual_increase = updated_main_wallet_idr - initial_main_wallet_idr
                
                if abs(actual_increase - expected_increase) < 0.01:  # Allow for floating point precision
                    self.log_test(
                        "Wallet Balance Update Verification - CRITICAL SUCCESS",
                        True,
                        f"Wallet balance correctly increased by {actual_increase} IDR (expected: {expected_increase}). New balance: {updated_main_wallet_idr}"
                    )
                else:
                    self.log_test(
                        "Wallet Balance Update Verification - CRITICAL FAILURE",
                        False,
                        f"Wallet balance did NOT increase correctly. Expected increase: {expected_increase}, Actual increase: {actual_increase}. Initial: {initial_main_wallet_idr}, Updated: {updated_main_wallet_idr}"
                    )
                    return False
                
                # Test 8: Check Transaction Creation
                print("\n🔍 Checking Transaction Creation...")
                success, transactions = self.run_test(
                    "GET /api/transactions - Check for Wallet Transaction",
                    "GET",
                    "transactions",
                    200
                )
                
                if success:
                    wallet_transaction_found = False
                    for transaction in transactions:
                        if (transaction.get('reference_id') == wallet_request_id or 
                            (transaction.get('type') == 'wallet_topup' and 
                             abs(transaction.get('amount', 0) - 75000.0) < 0.01)):
                            wallet_transaction_found = True
                            self.log_test(
                                "Transaction Creation Verification",
                                True,
                                f"Wallet transaction created: ID={transaction.get('id')}, Amount={transaction.get('amount')}, Type={transaction.get('type')}"
                            )
                            break
                    
                    if not wallet_transaction_found:
                        self.log_test(
                            "Transaction Creation Verification",
                            False,
                            "No wallet transaction found after verification"
                        )
                
                # Test 9: Test Different Wallet Types and Currencies
                print("\n🔍 Testing Different Wallet Types and Currencies...")
                
                # Test USD wallet
                usd_form_data = {
                    'wallet_type': 'withdrawal',
                    'currency': 'USD',
                    'amount': 50,
                    'payment_method': 'usdt_trc20',
                    'notes': 'Test USD withdrawal wallet verification'
                }
                
                files_usd = {
                    'payment_proof': ('proof_usd.txt', open(temp_file_path, 'rb'), 'text/plain')
                }
                
                response_usd = requests.post(url, data=usd_form_data, files=files_usd, headers=headers, timeout=10)
                
                if response_usd.status_code == 200:
                    usd_response = response_usd.json()
                    usd_request_id = usd_response.get('id')
                    
                    # Verify USD request
                    usd_verification_data = {
                        "status": "verified",
                        "admin_notes": "Test USD withdrawal wallet verification"
                    }
                    
                    success, usd_verify_response = self.run_test(
                        f"PUT /api/admin/wallet-topup-requests/{usd_request_id}/status (USD)",
                        "PUT",
                        f"admin/wallet-topup-requests/{usd_request_id}/status",
                        200,
                        data=usd_verification_data,
                        use_admin_token=True
                    )
                    
                    if success:
                        # Check USD wallet balance update
                        success, final_profile = self.run_test(
                            "GET /api/auth/me - Check USD Wallet Update",
                            "GET",
                            "auth/me",
                            200
                        )
                        
                        if success:
                            final_withdrawal_wallet_usd = final_profile.get('withdrawal_wallet_usd', 0.0)
                            usd_increase = final_withdrawal_wallet_usd - updated_withdrawal_wallet_usd
                            
                            if abs(usd_increase - 50.0) < 0.01:
                                self.log_test(
                                    "USD Withdrawal Wallet Update Verification",
                                    True,
                                    f"USD withdrawal wallet correctly increased by {usd_increase} (expected: 50.0). New balance: {final_withdrawal_wallet_usd}"
                                )
                            else:
                                self.log_test(
                                    "USD Withdrawal Wallet Update Verification",
                                    False,
                                    f"USD withdrawal wallet did NOT increase correctly. Expected: 50.0, Actual: {usd_increase}"
                                )
                
                # Test 10: Dashboard Data Includes New Fields
                print("\n🔍 Testing Dashboard Data Includes New Wallet Fields...")
                success, dashboard_response = self.run_test(
                    "GET /api/dashboard/stats - Check New Wallet Fields",
                    "GET",
                    "dashboard/stats",
                    200
                )
                
                if success:
                    wallet_balance = dashboard_response.get('wallet_balance', {})
                    if isinstance(wallet_balance, dict):
                        has_new_fields = all(field in wallet_balance for field in required_new_fields)
                        self.log_test(
                            "Dashboard New Wallet Fields",
                            has_new_fields,
                            f"Dashboard wallet_balance contains new fields: {has_new_fields}. Fields: {list(wallet_balance.keys())}"
                        )
                    else:
                        self.log_test(
                            "Dashboard New Wallet Fields",
                            False,
                            f"Dashboard wallet_balance is not a dict: {type(wallet_balance)}"
                        )
                
                return True
            
            else:
                self.log_test(
                    "Wallet Top-Up Request Creation",
                    False,
                    f"Failed to create wallet request: {response.status_code} - {response.text[:200]}"
                )
                return False
        
        finally:
            # Clean up temporary file
            try:
                if 'files' in locals():
                    files['payment_proof'][1].close()
                if 'files_usd' in locals():
                    files_usd['payment_proof'][1].close()
                os.unlink(temp_file_path)
            except:
                pass
        
        return True

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Wallet Verification Testing...")
        print("=" * 80)
        
        print("\n🔥 CRITICAL TEST: WALLET VERIFICATION FIX AND DATABASE MIGRATION")
        print("🔥" * 80)
        print("TESTING REQUIREMENTS FROM REVIEW REQUEST:")
        print("1. Database Migration for User Wallet Fields")
        print("2. Test Wallet Verification Fix")
        print("3. Test Profile Endpoints Return New Fields")
        print("4. End-to-End Wallet Verification Flow Test")
        print("=" * 80)
        
        # Run the critical wallet verification fix test
        fix_success = self.test_wallet_verification_fix_and_migration()
        
        if fix_success:
            print("✅ WALLET VERIFICATION FIX AND MIGRATION COMPLETED - SUCCESS")
        else:
            print("❌ WALLET VERIFICATION FIX AND MIGRATION COMPLETED - ISSUES FOUND")
        
        print("=" * 80)
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Show failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        
        print("\n✅ Test completed!")

if __name__ == "__main__":
    tester = WalletVerificationTester()
    tester.run_all_tests()