#!/usr/bin/env python3
"""
Payment System Test Script
Tests the updated Payment System with new bank details and transfer functionality
"""

import requests
import json
import sys
from datetime import datetime

class PaymentSystemTester:
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

    def setup_authentication(self):
        """Setup user and admin authentication"""
        print("🔐 Setting up authentication...")
        
        # Create and login user
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "username": f"paytest_{timestamp}",
            "name": f"Payment Test User {timestamp}",
            "phone_number": f"08123456{timestamp}",
            "address": f"Jl. Payment Test No. {timestamp}",
            "city": "Jakarta",
            "province": "DKI Jakarta",
            "email": f"paytest_{timestamp}@example.com",
            "password": "password123"
        }
        
        # Register user
        success, _ = self.run_test(
            "Register Test User",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if not success:
            print("❌ Failed to register test user")
            return False
        
        # Login user
        success, response = self.run_test(
            "Login Test User",
            "POST",
            "auth/login",
            200,
            data={"username": user_data["username"], "password": user_data["password"]}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
        else:
            print("❌ Failed to login test user")
            return False
        
        # Login admin
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/auth/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
        else:
            print("❌ Failed to login admin")
            return False
        
        print("✅ Authentication setup complete")
        return True

    def create_test_account(self):
        """Create a test ad account for payment testing"""
        print("\n📝 Creating test ad account...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        account_data = {
            "platform": "facebook",
            "account_name": f"Payment Test Account {timestamp}",
            "gmt": "GMT+7",
            "currency": "IDR",
            "delivery_method": "BM_ID",
            "bm_id_or_email": "123456789012345",
            "notes": "Test account for payment system testing"
        }
        
        # Create account request
        success, response = self.run_test(
            "Create Test Account Request",
            "POST",
            "accounts/request",
            200,
            data=account_data
        )
        
        if not success:
            return None
        
        request_id = response.get('request_id')
        if not request_id:
            print("❌ No request ID returned")
            return None
        
        # Approve the request as admin
        approval_data = {
            "status": "approved",
            "admin_notes": "Approved for payment testing",
            "account_id": f"FB{timestamp}123",
            "fee_percentage": 5.0
        }
        
        success, _ = self.run_test(
            "Approve Test Account Request",
            "PUT",
            f"admin/requests/{request_id}/status",
            200,
            data=approval_data,
            use_admin_token=True
        )
        
        if not success:
            return None
        
        # Get the created account
        success, accounts = self.run_test(
            "Get Created Accounts",
            "GET",
            "accounts",
            200
        )
        
        if success and accounts:
            # Find our test account
            for account in accounts:
                if account.get('account_name') == account_data['account_name']:
                    print(f"✅ Test account created: {account['id']}")
                    return account['id']
        
        return None

    def test_idr_topup_request(self, account_id):
        """Test IDR top-up request with updated bank details"""
        print("\n🔍 Testing IDR Top-Up Request with Updated Bank Details...")
        
        # Create IDR top-up request
        idr_topup_data = {
            "currency": "IDR",
            "accounts": [
                {
                    "account_id": account_id,
                    "amount": 100000,
                    "fee_percentage": 5.0,
                    "fee_amount": 5000
                }
            ],
            "total_amount": 100000,
            "total_fee": 5000
        }
        
        success, response = self.run_test(
            "Create IDR Top-Up Request",
            "POST",
            "topup",
            200,
            data=idr_topup_data
        )
        
        if not success:
            return False
        
        # Verify response contains reference code and transfer details
        if 'reference_code' not in response:
            self.log_test(
                "IDR Top-Up Response Validation",
                False,
                "Response missing reference_code"
            )
            return False
        
        if 'transfer_details' not in response:
            self.log_test(
                "IDR Top-Up Response Validation",
                False,
                "Response missing transfer_details"
            )
            return False
        
        transfer_details = response['transfer_details']
        
        # Verify IDR bank transfer details
        expected_bank_details = {
            "type": "bank_transfer",
            "bank_name": "BRI",
            "account_number": "057901002665566",
            "account_holder": "PT RINAIYANTI CAHAYA INTERMA"
        }
        
        validation_errors = []
        for key, expected_value in expected_bank_details.items():
            if key not in transfer_details:
                validation_errors.append(f"Missing {key}")
            elif transfer_details[key] != expected_value:
                validation_errors.append(f"{key}: expected '{expected_value}', got '{transfer_details[key]}'")
        
        if validation_errors:
            self.log_test(
                "IDR Bank Details Validation",
                False,
                f"Bank details validation failed: {', '.join(validation_errors)}"
            )
            return False
        else:
            self.log_test(
                "IDR Bank Details Validation",
                True,
                "All IDR bank details are correct (BRI 057901002665566 - PT RINAIYANTI CAHAYA INTERMA)"
            )
        
        return response['reference_code']

    def test_usd_topup_request(self, account_id):
        """Test USD top-up request with updated crypto wallet details"""
        print("\n🔍 Testing USD Top-Up Request with Updated Crypto Wallet Details...")
        
        # Create USD top-up request
        usd_topup_data = {
            "currency": "USD",
            "accounts": [
                {
                    "account_id": account_id,
                    "amount": 100,
                    "fee_percentage": 3.0,
                    "fee_amount": 3
                }
            ],
            "total_amount": 100,
            "total_fee": 3
        }
        
        success, response = self.run_test(
            "Create USD Top-Up Request",
            "POST",
            "topup",
            200,
            data=usd_topup_data
        )
        
        if not success:
            return False
        
        # Verify response contains reference code and transfer details
        if 'reference_code' not in response:
            self.log_test(
                "USD Top-Up Response Validation",
                False,
                "Response missing reference_code"
            )
            return False
        
        if 'transfer_details' not in response:
            self.log_test(
                "USD Top-Up Response Validation",
                False,
                "Response missing transfer_details"
            )
            return False
        
        transfer_details = response['transfer_details']
        
        # Verify USD crypto wallet details
        expected_wallet_details = {
            "type": "crypto_wallet",
            "wallet_address": "TBCJiUoYGxBYBpqMNb9ZtuwXWJLuCwBPXa",
            "wallet_name": "BINANCE",
            "network": "USDT TRC20"
        }
        
        validation_errors = []
        for key, expected_value in expected_wallet_details.items():
            if key not in transfer_details:
                validation_errors.append(f"Missing {key}")
            elif transfer_details[key] != expected_value:
                validation_errors.append(f"{key}: expected '{expected_value}', got '{transfer_details[key]}'")
        
        if validation_errors:
            self.log_test(
                "USD Crypto Wallet Details Validation",
                False,
                f"Crypto wallet details validation failed: {', '.join(validation_errors)}"
            )
            return False
        else:
            self.log_test(
                "USD Crypto Wallet Details Validation",
                True,
                "All USD crypto wallet details are correct (TBCJiUoYGxBYBpqMNb9ZtuwXWJLuCwBPXa - BINANCE USDT TRC20)"
            )
        
        return response['reference_code']

    def test_admin_payment_detail_endpoint(self):
        """Test admin payment detail endpoint returns updated transfer details"""
        print("\n🔍 Testing Admin Payment Detail Endpoint...")
        
        # Get all payment requests
        success, payments = self.run_test(
            "Get Payment Requests for Admin Detail Test",
            "GET",
            "admin/payments",
            200,
            use_admin_token=True
        )
        
        if not success or not isinstance(payments, list) or len(payments) == 0:
            self.log_test(
                "Admin Payment Detail Test Setup",
                False,
                "No payment requests available for admin detail test"
            )
            return False
        
        # Test both IDR and USD payments if available
        idr_payment = None
        usd_payment = None
        
        for payment in payments:
            if payment.get('currency') == 'IDR' and not idr_payment:
                idr_payment = payment
            elif payment.get('currency') == 'USD' and not usd_payment:
                usd_payment = payment
        
        test_results = []
        
        # Test IDR payment detail
        if idr_payment:
            success, idr_detail = self.run_test(
                "Get IDR Payment Detail",
                "GET",
                f"admin/payments/{idr_payment['id']}",
                200,
                use_admin_token=True
            )
            
            if success and 'transfer_details' in idr_detail:
                transfer_details = idr_detail['transfer_details']
                if (transfer_details.get('type') == 'bank_transfer' and
                    transfer_details.get('bank_name') == 'BRI' and
                    transfer_details.get('account_number') == '057901002665566' and
                    transfer_details.get('account_holder') == 'PT RINAIYANTI CAHAYA INTERMA'):
                    test_results.append(("IDR Payment Detail", True, "IDR transfer details correct"))
                else:
                    test_results.append(("IDR Payment Detail", False, f"IDR transfer details incorrect: {transfer_details}"))
            else:
                test_results.append(("IDR Payment Detail", False, "IDR payment detail missing transfer_details"))
        
        # Test USD payment detail
        if usd_payment:
            success, usd_detail = self.run_test(
                "Get USD Payment Detail",
                "GET",
                f"admin/payments/{usd_payment['id']}",
                200,
                use_admin_token=True
            )
            
            if success and 'transfer_details' in usd_detail:
                transfer_details = usd_detail['transfer_details']
                if (transfer_details.get('type') == 'crypto_wallet' and
                    transfer_details.get('wallet_address') == 'TBCJiUoYGxBYBpqMNb9ZtuwXWJLuCwBPXa' and
                    transfer_details.get('wallet_name') == 'BINANCE' and
                    transfer_details.get('network') == 'USDT TRC20'):
                    test_results.append(("USD Payment Detail", True, "USD transfer details correct"))
                else:
                    test_results.append(("USD Payment Detail", False, f"USD transfer details incorrect: {transfer_details}"))
            else:
                test_results.append(("USD Payment Detail", False, "USD payment detail missing transfer_details"))
        
        # Log all test results
        overall_success = True
        for test_name, success, details in test_results:
            self.log_test(test_name, success, details)
            if not success:
                overall_success = False
        
        if not test_results:
            self.log_test(
                "Admin Payment Detail Test",
                False,
                "No IDR or USD payments found to test"
            )
            return False
        
        return overall_success

    def test_file_serving_endpoint_cors(self):
        """Test file serving endpoint with proper CORS headers"""
        print("\n🔍 Testing File Serving Endpoint CORS Headers...")
        
        # Get a payment request with proof file
        success, payments = self.run_test(
            "Get Payment Requests for File Serving Test",
            "GET",
            "admin/payments",
            200,
            use_admin_token=True
        )
        
        if not success or not isinstance(payments, list):
            self.log_test(
                "File Serving Test Setup",
                False,
                "Failed to get payment requests for file serving test"
            )
            return False
        
        # Find a payment with proof file
        payment_with_proof = None
        for payment in payments:
            if payment.get('payment_proof', {}).get('uploaded'):
                payment_with_proof = payment
                break
        
        if not payment_with_proof:
            self.log_test(
                "File Serving Test Setup",
                True,
                "No payment requests with uploaded proof files found - CORS test skipped (not a failure)"
            )
            # This is not necessarily a failure - just means no files to test
            return True
        
        payment_id = payment_with_proof['id']
        
        # Test file serving endpoint
        url = f"{self.api_url}/admin/payments/{payment_id}/proof-file"
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            # Check if request was successful or if file doesn't exist (both are acceptable)
            if response.status_code in [200, 404]:
                # Check CORS headers
                cors_headers = {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Authorization'
                }
                
                missing_cors_headers = []
                for header, expected_value in cors_headers.items():
                    if header not in response.headers:
                        missing_cors_headers.append(header)
                    elif response.headers[header] != expected_value:
                        missing_cors_headers.append(f"{header} (expected '{expected_value}', got '{response.headers[header]}')")
                
                if missing_cors_headers:
                    self.log_test(
                        "File Serving CORS Headers",
                        False,
                        f"Missing or incorrect CORS headers: {missing_cors_headers}"
                    )
                    return False
                else:
                    self.log_test(
                        "File Serving CORS Headers",
                        True,
                        "All required CORS headers present and correct"
                    )
                    return True
            else:
                self.log_test(
                    "File Serving Endpoint",
                    False,
                    f"Unexpected status code: {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "File Serving Endpoint",
                False,
                f"Exception during file serving test: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all payment system tests"""
        print("🏦 PAYMENT SYSTEM TESTING WITH UPDATED BANK DETAILS")
        print("=" * 80)
        print("Testing IDR: BRI 057901002665566 - PT RINAIYANTI CAHAYA INTERMA")
        print("Testing USD: USDT TRC20 TBCJiUoYGxBYBpqMNb9ZtuwXWJLuCwBPXa - BINANCE")
        print("=" * 80)
        
        # Setup authentication
        if not self.setup_authentication():
            print("❌ Authentication setup failed. Cannot continue.")
            return
        
        # Create test account
        account_id = self.create_test_account()
        if not account_id:
            print("❌ Failed to create test account. Cannot continue.")
            return
        
        # Test IDR top-up request
        idr_reference = self.test_idr_topup_request(account_id)
        
        # Test USD top-up request
        usd_reference = self.test_usd_topup_request(account_id)
        
        # Test admin payment detail endpoint
        self.test_admin_payment_detail_endpoint()
        
        # Test file serving CORS
        self.test_file_serving_endpoint_cors()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 PAYMENT SYSTEM TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if idr_reference:
            print(f"\n✅ IDR Top-Up Reference: {idr_reference}")
        if usd_reference:
            print(f"✅ USD Top-Up Reference: {usd_reference}")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    tester = PaymentSystemTester()
    tester.run_all_tests()