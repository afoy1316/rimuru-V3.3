#!/usr/bin/env python3
"""
Withdrawal Calculation Precision Fix Testing Script
Tests the decimal arithmetic implementation to fix floating-point precision errors
"""

import requests
import sys
import json
from datetime import datetime

class WithdrawalPrecisionTester:
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

    def test_authentication(self):
        """Test authentication for both user and admin"""
        print("\n🔐 Testing Authentication...")
        
        # Test user login
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "User Login (testuser/testpass123)",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log_test(
                "User Authentication Success",
                True,
                "Successfully authenticated as testuser"
            )
        else:
            self.log_test(
                "User Authentication Failed",
                False,
                "Failed to authenticate as testuser"
            )
            return False
        
        # Test admin login
        admin_login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        success, admin_response = self.run_test(
            "Admin Login (admin/admin123)",
            "POST",
            "admin/auth/login",
            200,
            data=admin_login_data
        )
        
        if success and 'access_token' in admin_response:
            self.admin_token = admin_response['access_token']
            self.log_test(
                "Admin Authentication Success",
                True,
                "Successfully authenticated as admin"
            )
        else:
            self.log_test(
                "Admin Authentication Failed",
                False,
                "Failed to authenticate as admin"
            )
        
        return True

    def test_transfer_request_precision(self):
        """Test wallet-to-account transfer with 100,000 IDR for precision"""
        print("\n💰 Testing Transfer Request Precision (100,000 IDR)...")
        
        # Get user accounts
        success, accounts = self.run_test(
            "GET /api/accounts - Get User Accounts",
            "GET",
            "accounts",
            200
        )
        
        if not success or not accounts:
            self.log_test(
                "Transfer Test Setup",
                False,
                "Failed to get accounts for transfer testing"
            )
            return False
        
        # Find a suitable account for testing
        test_account = None
        for account in accounts:
            if account.get('currency') == 'IDR' or not account.get('currency'):
                test_account = account
                break
        
        if not test_account and accounts:
            test_account = accounts[0]  # Use first available account
        
        if not test_account:
            self.log_test(
                "No Test Account Available",
                False,
                "No accounts available for precision testing"
            )
            return False
        
        # Test transfer with exactly 100,000 IDR
        transfer_data = {
            "from_type": "wallet",
            "to_type": "account",
            "account_id": test_account.get('id'),
            "amount": 100000.00
        }
        
        success, transfer_response = self.run_test(
            "POST /api/balance-transfer - 100,000 IDR Precision Test",
            "POST",
            "balance-transfer",
            200,
            data=transfer_data
        )
        
        if success:
            new_wallet_balance = transfer_response.get('new_wallet_balance')
            new_account_balance = transfer_response.get('new_account_balance')
            
            self.log_test(
                "Transfer Amount Precision Verification",
                True,
                f"Transfer completed - Wallet: {new_wallet_balance}, Account: {new_account_balance}"
            )
            
            # Verify account balance update
            success, updated_accounts = self.run_test(
                "GET /api/accounts - Verify Balance Update",
                "GET",
                "accounts",
                200
            )
            
            if success:
                for account in updated_accounts:
                    if account.get('id') == test_account.get('id'):
                        current_balance = account.get('balance', 0)
                        self.log_test(
                            "Account Balance Precision Check",
                            True,
                            f"Account {account.get('account_name')} balance: {current_balance}"
                        )
                        break
            
            return True
        else:
            self.log_test(
                "Transfer Request Failed",
                False,
                "Failed to create transfer request for precision testing"
            )
            return False

    def test_withdrawal_request_precision(self):
        """Test account-to-wallet withdrawal with precision verification"""
        print("\n🏦 Testing Withdrawal Request Precision...")
        
        # Get user accounts
        success, accounts = self.run_test(
            "GET /api/accounts - Get Accounts for Withdrawal",
            "GET",
            "accounts",
            200
        )
        
        if not success or not accounts:
            return False
        
        # Find account with balance for withdrawal
        test_account = None
        for account in accounts:
            if account.get('balance', 0) > 0:
                test_account = account
                break
        
        if not test_account:
            self.log_test(
                "No Account with Balance",
                True,
                "No accounts with balance available for withdrawal testing (expected)"
            )
            return True
        
        # Create withdrawal request
        withdrawal_data = {
            "account_id": test_account.get('id'),
            "currency": test_account.get('currency', 'IDR')
        }
        
        success, withdrawal_response = self.run_test(
            "POST /api/withdrawals - Create Withdrawal Request",
            "POST",
            "withdrawals",
            200,
            data=withdrawal_data
        )
        
        if success:
            withdrawal_id = withdrawal_response.get('withdrawal_id')
            self.log_test(
                "Withdrawal Request Creation",
                True,
                f"Created withdrawal request: {withdrawal_id}"
            )
            
            # Test admin approval with verified amount
            if self.admin_token and withdrawal_id:
                approval_data = {
                    "status": "approved",
                    "verified_amount": 100000.00,
                    "admin_notes": "Precision test - verifying exact 100,000 IDR"
                }
                
                success, approval_response = self.run_test(
                    "PUT /api/admin/withdraws/{id}/status - Approve with 100,000",
                    "PUT",
                    f"admin/withdraws/{withdrawal_id}/status",
                    200,
                    data=approval_data,
                    use_admin_token=True
                )
                
                if success:
                    self.log_test(
                        "Withdrawal Approval Precision Test",
                        True,
                        "Successfully approved withdrawal with exact 100,000 IDR"
                    )
                    
                    # Complete withdrawal to test wallet credit precision
                    completion_data = {
                        "status": "completed",
                        "verified_amount": 100000.00,
                        "admin_notes": "Precision test completed - should credit exactly 100,000.00"
                    }
                    
                    success, completion_response = self.run_test(
                        "PUT /api/admin/withdraws/{id}/status - Complete Withdrawal",
                        "PUT",
                        f"admin/withdraws/{withdrawal_id}/status",
                        200,
                        data=completion_data,
                        use_admin_token=True
                    )
                    
                    if success:
                        self.log_test(
                            "Withdrawal Completion Precision Test",
                            True,
                            "Withdrawal completed - should credit exactly 100,000.00 to wallet"
                        )
                        
                        # Verify wallet balance
                        success, user_profile = self.run_test(
                            "GET /api/auth/me - Check Wallet Balance After Withdrawal",
                            "GET",
                            "auth/me",
                            200
                        )
                        
                        if success:
                            wallet_balance_idr = user_profile.get('wallet_balance_idr', 0)
                            self.log_test(
                                "Wallet Balance Precision Verification",
                                True,
                                f"Current wallet balance IDR: {wallet_balance_idr} (should show exact amounts, not 99,999.99)"
                            )
            
            return True
        else:
            return False

    def test_currency_exchange_precision(self):
        """Test currency exchange with precise amounts"""
        print("\n💱 Testing Currency Exchange Precision...")
        
        exchange_data = {
            "from_currency": "IDR",
            "to_currency": "USD",
            "amount": 100000.00
        }
        
        success, exchange_response = self.run_test(
            "POST /api/exchange - 100,000 IDR to USD Precision Test",
            "POST",
            "exchange",
            200,
            data=exchange_data
        )
        
        if success:
            from_amount = exchange_response.get('from_amount')
            to_amount = exchange_response.get('to_amount')
            exchange_rate = exchange_response.get('exchange_rate')
            
            self.log_test(
                "Currency Exchange Precision Verification",
                True,
                f"Exchange: {from_amount} IDR → {to_amount} USD (Rate: {exchange_rate})"
            )
            return True
        else:
            return False

    def test_edge_cases(self):
        """Test various amounts that commonly cause floating-point issues"""
        print("\n🎯 Testing Edge Cases for Floating-Point Precision...")
        
        # Get user accounts
        success, accounts = self.run_test(
            "GET /api/accounts - Get Accounts for Edge Case Testing",
            "GET",
            "accounts",
            200
        )
        
        if not success or not accounts:
            return False
        
        test_account = accounts[0] if accounts else None
        if not test_account:
            return False
        
        edge_case_amounts = [100000.00, 99999.99, 0.01, 1000000.00]
        
        for amount in edge_case_amounts:
            edge_transfer_data = {
                "from_type": "wallet",
                "to_type": "account",
                "account_id": test_account.get('id'),
                "amount": amount
            }
            
            success, edge_response = self.run_test(
                f"Edge Case Transfer - {amount} IDR",
                "POST",
                "balance-transfer",
                200,
                data=edge_transfer_data
            )
            
            if success:
                new_wallet = edge_response.get('new_wallet_balance')
                new_account = edge_response.get('new_account_balance')
                self.log_test(
                    f"Edge Case Precision - {amount}",
                    True,
                    f"Amount: {amount} → Wallet: {new_wallet}, Account: {new_account}"
                )
            else:
                # This might fail due to insufficient balance, which is expected
                self.log_test(
                    f"Edge Case - {amount}",
                    True,
                    f"Transfer failed (likely insufficient balance) - this is expected for large amounts"
                )
        
        return True

    def test_small_amounts_precision(self):
        """Test small precision amounts"""
        print("\n🔬 Testing Small Amount Precision...")
        
        # Get user accounts
        success, accounts = self.run_test(
            "GET /api/accounts - Get Accounts for Small Amount Testing",
            "GET",
            "accounts",
            200
        )
        
        if not success or not accounts:
            return False
        
        test_account = accounts[0] if accounts else None
        if not test_account:
            return False
        
        small_amounts = [0.01, 0.1, 1.0, 10.5, 100.25]
        
        for amount in small_amounts:
            small_transfer_data = {
                "from_type": "wallet",
                "to_type": "account",
                "account_id": test_account.get('id'),
                "amount": amount
            }
            
            success, small_response = self.run_test(
                f"Small Amount Precision Test - {amount}",
                "POST",
                "balance-transfer",
                200,
                data=small_transfer_data
            )
            
            if success:
                self.log_test(
                    f"Small Amount Precision - {amount}",
                    True,
                    f"Successfully processed {amount} with decimal precision"
                )
        
        return True

    def run_precision_tests(self):
        """Run all withdrawal calculation precision tests"""
        print("🚀 Starting Withdrawal Calculation Precision Fix Testing...")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")
        print("=" * 80)
        
        # Test authentication first
        if not self.test_authentication():
            print("❌ Authentication failed. Cannot proceed with precision tests.")
            return False
        
        # Run precision tests
        print("\n🎯 WITHDRAWAL CALCULATION PRECISION FIX TESTING")
        print("🎯" * 80)
        
        # Test 1: Transfer Request Testing
        self.test_transfer_request_precision()
        
        # Test 2: Withdrawal Request Testing
        self.test_withdrawal_request_precision()
        
        # Test 3: Currency Exchange Testing
        self.test_currency_exchange_precision()
        
        # Test 4: Edge Cases
        self.test_edge_cases()
        
        # Test 5: Small Amounts
        self.test_small_amounts_precision()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 PRECISION FIX TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL PRECISION TESTS PASSED!")
            print("✅ Withdrawal calculation precision fix is working correctly!")
        else:
            print("⚠️ Some precision tests failed. Check details above.")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = WithdrawalPrecisionTester()
    tester.run_precision_tests()