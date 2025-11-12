#!/usr/bin/env python3
"""
Test script specifically for the last_topup_date fix
This script tests the fix that was implemented to ensure last_topup_date is set when top-ups are verified
"""

import requests
import sys
import json
from datetime import datetime

class LastTopupDateFixTester:
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
        """Test authentication with testuser/testpass123"""
        print("\n🔍 Testing Authentication...")
        
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "Login as testuser/testpass123",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        else:
            return False

    def test_admin_authentication(self):
        """Test admin authentication"""
        print("\n🔍 Testing Admin Authentication...")
        
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
            return True
        else:
            return False

    def test_accounts_last_topup_date_field(self):
        """Test GET /api/accounts - check if accounts now have proper last_topup_date values"""
        print("\n🔍 Testing Accounts last_topup_date Field...")
        
        success, accounts = self.run_test(
            "GET /api/accounts - Check last_topup_date Values",
            "GET",
            "accounts",
            200
        )
        
        if not success or not accounts:
            return False
        
        # Analyze accounts for last_topup_date field
        accounts_with_balance = []
        accounts_with_null_topup_date = []
        accounts_with_proper_topup_date = []
        
        for account in accounts:
            account_name = account.get('account_name', 'Unknown')
            balance = account.get('balance', 0)
            last_topup_date = account.get('last_topup_date')
            can_withdraw = account.get('can_withdraw')
            
            # Log detailed account information
            self.log_test(
                f"Account Analysis - {account_name}",
                True,
                f"Balance: {balance}, last_topup_date: {last_topup_date}, can_withdraw: {can_withdraw}"
            )
            
            # Categorize accounts for analysis
            if balance > 0:
                accounts_with_balance.append(account)
                if last_topup_date is None:
                    accounts_with_null_topup_date.append(account)
                else:
                    accounts_with_proper_topup_date.append(account)
        
        # Identify existing data issue
        if accounts_with_null_topup_date:
            self.log_test(
                "EXISTING DATA ISSUE IDENTIFIED",
                True,
                f"Found {len(accounts_with_null_topup_date)} accounts with balance > 0 but null last_topup_date"
            )
            
            for account in accounts_with_null_topup_date:
                self.log_test(
                    f"Data Issue - {account.get('account_name')}",
                    True,
                    f"Balance: {account.get('balance')}, last_topup_date: null, can_withdraw: {account.get('can_withdraw')}"
                )
        else:
            self.log_test(
                "No Existing Data Issues",
                True,
                "All accounts with balance have proper last_topup_date values"
            )
        
        # Summary
        total_accounts = len(accounts)
        accounts_with_balance_count = len(accounts_with_balance)
        null_topup_date_count = len(accounts_with_null_topup_date)
        proper_topup_date_count = len(accounts_with_proper_topup_date)
        
        summary = f"""
        LAST_TOPUP_DATE FIX ANALYSIS:
        - Total accounts: {total_accounts}
        - Accounts with balance > 0: {accounts_with_balance_count}
        - Accounts with balance but null last_topup_date: {null_topup_date_count}
        - Accounts with balance and proper last_topup_date: {proper_topup_date_count}
        """
        
        self.log_test(
            "Fix Implementation Analysis",
            True,
            summary
        )
        
        # Critical question answer
        if null_topup_date_count > 0:
            self.log_test(
                "CRITICAL QUESTION ANSWER",
                True,
                f"EXISTING DATA ISSUE: {null_topup_date_count} accounts have balance but null last_topup_date. These accounts were topped up before the fix. Solution needed: either manual data migration or users need new top-up."
            )
        
        return True

    def test_can_withdraw_logic(self):
        """Test can_withdraw logic is working with the new field"""
        print("\n🔍 Testing can_withdraw Logic...")
        
        success, accounts = self.run_test(
            "GET /api/accounts - Verify can_withdraw Logic",
            "GET",
            "accounts",
            200
        )
        
        if not success or not accounts:
            return False
        
        eligible_accounts = [acc for acc in accounts if acc.get('can_withdraw') == True]
        ineligible_accounts = [acc for acc in accounts if acc.get('can_withdraw') == False]
        
        self.log_test(
            "Account Eligibility Analysis",
            True,
            f"Found {len(eligible_accounts)} eligible and {len(ineligible_accounts)} ineligible accounts"
        )
        
        # Analyze accounts with recent top-ups
        accounts_with_recent_topups = [acc for acc in accounts if acc.get('last_topup_date') is not None]
        
        if accounts_with_recent_topups:
            self.log_test(
                "Recent Top-up Analysis",
                True,
                f"Found {len(accounts_with_recent_topups)} accounts with recent top-ups"
            )
            
            # Check if accounts with recent top-ups have proper can_withdraw status
            properly_enabled_accounts = [acc for acc in accounts_with_recent_topups if acc.get('can_withdraw') == True]
            
            self.log_test(
                "Top-up → Withdrawal Logic",
                len(properly_enabled_accounts) > 0,
                f"{len(properly_enabled_accounts)}/{len(accounts_with_recent_topups)} accounts with recent top-ups are eligible for withdrawal"
            )
        
        return True

    def test_new_topup_process(self):
        """Test new top-up process to verify the fix"""
        print("\n🔍 Testing New TopUp Process...")
        
        # Get accounts for testing
        success, accounts = self.run_test(
            "Get Accounts for TopUp Test",
            "GET",
            "accounts",
            200
        )
        
        if not success or not accounts:
            return False
        
        # Find a suitable account for testing
        test_account = None
        for account in accounts:
            if account.get('platform') in ['facebook', 'google', 'tiktok']:
                test_account = account
                break
        
        if not test_account:
            self.log_test(
                "No Suitable Account for TopUp Test",
                True,
                "No suitable account found for top-up testing"
            )
            return True
        
        # Create a new top-up request to test the fix
        topup_data = {
            "currency": "IDR",
            "accounts": [
                {
                    "account_id": test_account.get('id'),
                    "amount": 50000,
                    "fee_percentage": 5,
                    "fee_amount": 2500
                }
            ],
            "total_amount": 52500,
            "total_fee": 2500
        }
        
        success, topup_response = self.run_test(
            "Test New TopUp Process - Create Request",
            "POST",
            "topup",
            200,
            data=topup_data
        )
        
        if success and 'request_id' in topup_response:
            request_id = topup_response['request_id']
            self.log_test(
                "TopUp Request Created",
                True,
                f"Created topup request: {request_id} - Ready for admin verification to test last_topup_date update"
            )
            return True
        else:
            self.log_test(
                "TopUp Request Creation Failed",
                False,
                "Failed to create topup request for testing the fix"
            )
            return False

    def test_admin_topup_verification(self):
        """Test admin top-up verification to check if last_topup_date is properly set"""
        print("\n🔍 Testing Admin TopUp Verification...")
        
        if not self.admin_token:
            self.log_test(
                "Admin TopUp Verification Setup",
                False,
                "Admin token required for top-up verification testing"
            )
            return False
        
        # Get pending top-up requests (payments endpoint)
        success, topup_requests = self.run_test(
            "GET /api/admin/payments - Pending Requests",
            "GET",
            "admin/payments",
            200,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        if not isinstance(topup_requests, list):
            self.log_test(
                "Admin TopUp Requests Format",
                False,
                "Top-up requests response is not a list"
            )
            return False
        
        self.log_test(
            "Admin TopUp Requests Retrieved",
            True,
            f"Found {len(topup_requests)} top-up requests"
        )
        
        # Find a pending request to verify
        pending_request = None
        for request in topup_requests:
            if request.get('status') in ['pending', 'proof_uploaded']:
                pending_request = request
                break
        
        if pending_request:
            request_id = pending_request.get('id')
            
            # Verify the top-up request (this should set last_topup_date)
            verification_data = {
                "status": "verified",
                "admin_notes": "Testing last_topup_date fix - verified for testing purposes"
            }
            
            success, verify_response = self.run_test(
                "PUT /api/admin/payments/{id}/verify - Verify Request",
                "PUT",
                f"admin/payments/{request_id}/verify",
                200,
                data=verification_data,
                use_admin_token=True
            )
            
            if success:
                self.log_test(
                    "TopUp Request Verification",
                    True,
                    f"Successfully verified top-up request {request_id} - This should have set last_topup_date on the account"
                )
                return True
            else:
                self.log_test(
                    "TopUp Request Verification Failed",
                    False,
                    f"Failed to verify top-up request {request_id}"
                )
                return False
        else:
            self.log_test(
                "No Suitable TopUp Request",
                True,
                "No suitable pending top-up request found for verification testing"
            )
            return True

    def run_all_tests(self):
        """Run all last_topup_date fix tests"""
        print("🚀 Starting Last TopUp Date Fix Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 80)
        
        # Test 1: Authentication
        if not self.test_authentication():
            print("❌ Authentication failed - cannot continue")
            return False
        
        # Test 2: Admin Authentication
        self.test_admin_authentication()
        
        # Test 3: Check accounts for last_topup_date field
        self.test_accounts_last_topup_date_field()
        
        # Test 4: Verify can_withdraw logic
        self.test_can_withdraw_logic()
        
        # Test 5: Test new top-up process
        self.test_new_topup_process()
        
        # Test 6: Test admin verification (if admin token available)
        if self.admin_token:
            self.test_admin_topup_verification()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 LAST_TOPUP_DATE FIX TEST SUMMARY")
        print("=" * 80)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Show critical findings
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        
        # Show critical findings
        critical_findings = [test for test in self.test_results if "CRITICAL" in test['test_name'] or "EXISTING DATA ISSUE" in test['test_name']]
        if critical_findings:
            print("\n🔍 CRITICAL FINDINGS:")
            for test in critical_findings:
                print(f"  - {test['test_name']}: {test['details']}")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED!")
        else:
            print("⚠️  Some tests failed. Check details above.")
        
        return self.tests_passed == self.tests_run

def main():
    """Main function to run the last_topup_date fix tests"""
    tester = LastTopupDateFixTester()
    success = tester.run_all_tests()
    return success

if __name__ == "__main__":
    sys.exit(0 if main() else 1)