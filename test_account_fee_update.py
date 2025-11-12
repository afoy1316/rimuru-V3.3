#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class AccountFeeUpdateTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
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
        
        # Use admin token if specified
        if use_admin_token and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        
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

    def test_account_fee_update_feature(self):
        """Test Account Fee Update Feature - Review Request"""
        print("\n🔍 Testing Account Fee Update Feature (Review Request)...")
        
        # Step 1: Admin Authentication
        print("\n🔍 Step 1: Admin Authentication...")
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
        
        if not success or 'access_token' not in admin_response:
            self.log_test(
                "Account Fee Update Test Setup",
                False,
                "Failed to authenticate as admin"
            )
            return False
        
        self.admin_token = admin_response['access_token']
        
        # Verify admin access to accounts endpoint
        success, accounts_access_test = self.run_test(
            "Verify Admin Access to Accounts Endpoint",
            "GET",
            "admin/accounts",
            200,
            use_admin_token=True
        )
        
        if not success:
            self.log_test(
                "Admin Accounts Access",
                False,
                "Admin cannot access accounts endpoint"
            )
            return False
        
        self.log_test(
            "Admin Authentication Success",
            True,
            "Successfully authenticated as admin and verified accounts access"
        )
        
        # Step 2: Get Account List
        print("\n🔍 Step 2: Get Account List...")
        success, accounts_response = self.run_test(
            "GET /api/admin/accounts",
            "GET",
            "admin/accounts",
            200,
            use_admin_token=True
        )
        
        if not success or not isinstance(accounts_response, list):
            self.log_test(
                "Get Account List",
                False,
                "Failed to retrieve account list or invalid response format"
            )
            return False
        
        # Find an account with existing fee_percentage
        target_account = None
        for account in accounts_response:
            if account.get('fee_percentage') is not None:
                target_account = account
                break
        
        # If no account with fee_percentage found, use the first account
        if not target_account and len(accounts_response) > 0:
            target_account = accounts_response[0]
        
        if not target_account:
            self.log_test(
                "Find Target Account",
                False,
                "No accounts found for fee update testing"
            )
            return False
        
        account_id = target_account.get('id')
        current_fee = target_account.get('fee_percentage', 0)
        account_name = target_account.get('account_name', 'Unknown')
        
        self.log_test(
            "Account Selection for Testing",
            True,
            f"Selected account: {account_name} (ID: {account_id}, Current fee: {current_fee}%)"
        )
        
        # Step 3: Update Account Fee
        print("\n🔍 Step 3: Update Account Fee...")
        new_fee_percentage = 7.5
        fee_update_data = {
            "fee_percentage": new_fee_percentage
        }
        
        success, fee_update_response = self.run_test(
            f"PUT /api/admin/accounts/{account_id}/fee",
            "PUT",
            f"admin/accounts/{account_id}/fee",
            200,
            data=fee_update_data,
            use_admin_token=True
        )
        
        if not success:
            self.log_test(
                "Account Fee Update",
                False,
                "Failed to update account fee percentage"
            )
            return False
        
        # Verify response message
        expected_message = f"Account fee percentage updated to {new_fee_percentage}%"
        if fee_update_response.get('message') == expected_message:
            self.log_test(
                "Fee Update Response Verification",
                True,
                f"Received expected response: {expected_message}"
            )
        else:
            self.log_test(
                "Fee Update Response Verification",
                False,
                f"Expected: {expected_message}, Got: {fee_update_response.get('message')}"
            )
            return False
        
        # Step 4: Verify Fee Updated
        print("\n🔍 Step 4: Verify Fee Updated...")
        success, updated_accounts_response = self.run_test(
            "GET /api/admin/accounts (verify update)",
            "GET",
            "admin/accounts",
            200,
            use_admin_token=True
        )
        
        if not success or not isinstance(updated_accounts_response, list):
            self.log_test(
                "Verify Fee Update",
                False,
                "Failed to retrieve updated account list"
            )
            return False
        
        # Find the same account and verify fee was updated
        updated_account = None
        for account in updated_accounts_response:
            if account.get('id') == account_id:
                updated_account = account
                break
        
        if not updated_account:
            self.log_test(
                "Find Updated Account",
                False,
                f"Account {account_id} not found in updated list"
            )
            return False
        
        updated_fee = updated_account.get('fee_percentage')
        if updated_fee == new_fee_percentage:
            self.log_test(
                "Fee Update Verification",
                True,
                f"Account fee successfully updated to {updated_fee}%"
            )
        else:
            self.log_test(
                "Fee Update Verification",
                False,
                f"Fee not updated correctly. Expected: {new_fee_percentage}%, Got: {updated_fee}%"
            )
            return False
        
        # Step 5: Test Validation - Negative Fee
        print("\n🔍 Step 5: Test Validation - Negative Fee...")
        negative_fee_data = {
            "fee_percentage": -5
        }
        
        success, negative_fee_response = self.run_test(
            "PUT /api/admin/accounts/{account_id}/fee (negative fee)",
            "PUT",
            f"admin/accounts/{account_id}/fee",
            400,
            data=negative_fee_data,
            use_admin_token=True
        )
        
        if success:
            self.log_test(
                "Negative Fee Validation",
                True,
                "Negative fee properly rejected with 400 error"
            )
        else:
            self.log_test(
                "Negative Fee Validation",
                False,
                "Negative fee not properly rejected"
            )
            return False
        
        # Step 6: Test Validation - Fee > 100
        print("\n🔍 Step 6: Test Validation - Fee > 100...")
        high_fee_data = {
            "fee_percentage": 150
        }
        
        success, high_fee_response = self.run_test(
            "PUT /api/admin/accounts/{account_id}/fee (fee > 100)",
            "PUT",
            f"admin/accounts/{account_id}/fee",
            400,
            data=high_fee_data,
            use_admin_token=True
        )
        
        if success:
            self.log_test(
                "High Fee Validation",
                True,
                "Fee > 100% properly rejected with 400 error"
            )
        else:
            self.log_test(
                "High Fee Validation",
                False,
                "Fee > 100% not properly rejected"
            )
            return False
        
        # Step 7: Test Edge Cases
        print("\n🔍 Step 7: Test Edge Cases...")
        
        # Test 0% fee
        zero_fee_data = {
            "fee_percentage": 0
        }
        
        success, zero_fee_response = self.run_test(
            "PUT /api/admin/accounts/{account_id}/fee (0% fee)",
            "PUT",
            f"admin/accounts/{account_id}/fee",
            200,
            data=zero_fee_data,
            use_admin_token=True
        )
        
        if success:
            self.log_test(
                "Zero Fee Edge Case",
                True,
                "0% fee accepted successfully"
            )
        else:
            self.log_test(
                "Zero Fee Edge Case",
                False,
                "0% fee not accepted"
            )
            return False
        
        # Test 100% fee
        max_fee_data = {
            "fee_percentage": 100
        }
        
        success, max_fee_response = self.run_test(
            "PUT /api/admin/accounts/{account_id}/fee (100% fee)",
            "PUT",
            f"admin/accounts/{account_id}/fee",
            200,
            data=max_fee_data,
            use_admin_token=True
        )
        
        if success:
            self.log_test(
                "Maximum Fee Edge Case",
                True,
                "100% fee accepted successfully"
            )
        else:
            self.log_test(
                "Maximum Fee Edge Case",
                False,
                "100% fee not accepted"
            )
            return False
        
        # Test decimal fee (5.75%)
        decimal_fee_data = {
            "fee_percentage": 5.75
        }
        
        success, decimal_fee_response = self.run_test(
            "PUT /api/admin/accounts/{account_id}/fee (5.75% decimal fee)",
            "PUT",
            f"admin/accounts/{account_id}/fee",
            200,
            data=decimal_fee_data,
            use_admin_token=True
        )
        
        if success:
            self.log_test(
                "Decimal Fee Edge Case",
                True,
                "5.75% decimal fee accepted successfully"
            )
        else:
            self.log_test(
                "Decimal Fee Edge Case",
                False,
                "5.75% decimal fee not accepted"
            )
            return False
        
        # Step 8: Final Verification
        print("\n🔍 Step 8: Final Verification...")
        success, final_accounts_response = self.run_test(
            "GET /api/admin/accounts (final verification)",
            "GET",
            "admin/accounts",
            200,
            use_admin_token=True
        )
        
        if success and isinstance(final_accounts_response, list):
            final_account = None
            for account in final_accounts_response:
                if account.get('id') == account_id:
                    final_account = account
                    break
            
            if final_account:
                final_fee = final_account.get('fee_percentage')
                self.log_test(
                    "Final Fee Verification",
                    final_fee == 5.75,
                    f"Final fee percentage: {final_fee}% (expected: 5.75%)"
                )
            else:
                self.log_test(
                    "Final Fee Verification",
                    False,
                    "Account not found in final verification"
                )
                return False
        else:
            self.log_test(
                "Final Fee Verification",
                False,
                "Failed to retrieve accounts for final verification"
            )
            return False
        
        # Summary
        print("\n🔍 ACCOUNT FEE UPDATE FEATURE TEST SUMMARY...")
        self.log_test(
            "ACCOUNT FEE UPDATE FEATURE TEST COMPLETE",
            True,
            f"""
            ✅ Admin can successfully update account fee
            ✅ Fee is saved to database correctly
            ✅ Validation prevents invalid fees (< 0 or > 100)
            ✅ Edge cases (0%, 100%, decimals) work correctly
            ✅ Updated fee reflects in account list
            
            FEATURE WORKING: Account fee update functionality works end-to-end.
            """
        )
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("🏁 TESTING COMPLETE")
        print("="*60)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n✅ All tests passed!")
        else:
            print(f"\n❌ {self.tests_run - self.tests_passed} test(s) failed!")
        
        print(f"\n📊 Detailed Test Results:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"  {status} {result['test_name']}")
            if result["details"]:
                print(f"      {result['details']}")
        
        print(f"\n🎯 Testing completed at {datetime.now().isoformat()}")

    def run_tests(self):
        """Run the account fee update tests"""
        print("🚀 Starting Account Fee Update Feature Testing...")
        print(f"Base URL: {self.base_url}")
        print(f"API URL: {self.api_url}")
        print("=" * 60)
        
        try:
            success = self.test_account_fee_update_feature()
            if success:
                print("✅ Account Fee Update Feature - PASSED")
            else:
                print("❌ Account Fee Update Feature - FAILED")
        except Exception as e:
            print(f"💥 Account Fee Update Feature crashed: {str(e)}")
            self.log_test("Account Fee Update Feature - Exception", False, str(e))
        
        # Print summary
        self.print_summary()

if __name__ == "__main__":
    tester = AccountFeeUpdateTester()
    tester.run_tests()