#!/usr/bin/env python3
"""
Focused test script for new withdrawal backend endpoints
"""

import requests
import sys
import json
from datetime import datetime

class WithdrawalEndpointTester:
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

    def setup_authentication(self):
        """Setup user and admin authentication"""
        print("🔐 Setting up authentication...")
        
        # Try to login with existing test user
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
        else:
            # Create a test user if login fails
            timestamp = datetime.now().strftime('%H%M%S')
            user_data = {
                "username": f"withdrawtest_{timestamp}",
                "name": f"Withdraw Test User {timestamp}",
                "phone_number": f"08123456{timestamp}",
                "address": f"Jl. Withdraw Test No. {timestamp}",
                "city": "Jakarta",
                "province": "DKI Jakarta",
                "email": f"withdrawtest_{timestamp}@example.com",
                "password": "password123"
            }
            
            success, reg_response = self.run_test(
                "Create Test User",
                "POST",
                "auth/register",
                200,
                data=user_data
            )
            
            if success:
                success, login_response = self.run_test(
                    "Login New User",
                    "POST",
                    "auth/login",
                    200,
                    data={
                        "username": user_data["username"],
                        "password": user_data["password"]
                    }
                )
                
                if success and 'access_token' in login_response:
                    self.token = login_response['access_token']
        
        # Admin login
        admin_login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        success, admin_response = self.run_test(
            "Admin Login",
            "POST",
            "admin/auth/login",
            200,
            data=admin_login_data
        )
        
        if success and 'access_token' in admin_response:
            self.admin_token = admin_response['access_token']
        
        return self.token is not None and self.admin_token is not None

    def create_test_account(self):
        """Create a test account for withdrawal testing"""
        print("\n📝 Creating test account for withdrawal...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        account_data = {
            "platform": "facebook",
            "account_name": f"Withdraw Test Account {timestamp}",
            "gmt": "GMT+7",
            "currency": "IDR",
            "delivery_method": "BM_ID",
            "bm_id_or_email": f"123456789{timestamp}",
            "notes": "Test account for withdrawal testing"
        }
        
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
            return None
        
        # Approve the request to create actual account
        approval_data = {
            "status": "approved",
            "account_id": f"FB_WITHDRAW_TEST_{timestamp}",
            "fee_percentage": 5.0,
            "admin_notes": "Approved for withdrawal testing"
        }
        
        success, approval_response = self.run_test(
            "Approve Test Account Request",
            "PUT",
            f"admin/requests/{request_id}/status",
            200,
            data=approval_data,
            use_admin_token=True
        )
        
        if success:
            # Get the created account
            success, accounts = self.run_test(
                "Get Created Account",
                "GET",
                "accounts",
                200
            )
            
            if success and accounts:
                for account in accounts:
                    if account.get('account_name') == account_data['account_name']:
                        return account
        
        return None

    def test_withdrawal_endpoints(self):
        """Test the new withdrawal endpoints"""
        print("\n🏦 Testing New Withdrawal Endpoints...")
        
        # Test 1: GET /api/withdrawals - Get user withdrawal history (should be empty initially)
        success, withdrawals_response = self.run_test(
            "GET /api/withdrawals - Empty History",
            "GET",
            "withdrawals",
            200
        )
        
        if not success:
            return False
        
        if isinstance(withdrawals_response, list):
            self.log_test(
                "Withdrawal History Structure",
                True,
                f"Retrieved {len(withdrawals_response)} withdrawal records (expected empty)"
            )
        else:
            self.log_test(
                "Withdrawal History Structure",
                False,
                "Response is not a list"
            )
            return False
        
        # Create a test account for withdrawal
        test_account = self.create_test_account()
        if not test_account:
            self.log_test(
                "Test Account Creation",
                False,
                "Failed to create test account for withdrawal testing"
            )
            return False
        
        self.log_test(
            "Test Account Creation",
            True,
            f"Created account: {test_account.get('account_name')} (ID: {test_account.get('id')})"
        )
        
        # Test 2: POST /api/withdrawals - Create new withdrawal request
        withdrawal_data = {
            "account_id": test_account.get('id'),
            "currency": test_account.get('currency', 'IDR')
        }
        
        success, create_response = self.run_test(
            "POST /api/withdrawals - Create Request",
            "POST",
            "withdrawals",
            200,
            data=withdrawal_data
        )
        
        if not success:
            return False
        
        # Verify response structure
        required_fields = ['message', 'withdrawal_id', 'status']
        missing_fields = [field for field in required_fields if field not in create_response]
        
        if missing_fields:
            self.log_test(
                "Withdrawal Creation Response",
                False,
                f"Missing fields: {missing_fields}"
            )
            return False
        
        withdrawal_id = create_response.get('withdrawal_id')
        self.log_test(
            "Withdrawal Creation Success",
            True,
            f"Created withdrawal request: {withdrawal_id}"
        )
        
        # Test 3: Verify withdrawal appears in history
        success, updated_withdrawals = self.run_test(
            "GET /api/withdrawals - After Creation",
            "GET",
            "withdrawals",
            200
        )
        
        if success and isinstance(updated_withdrawals, list):
            found_withdrawal = False
            for withdrawal in updated_withdrawals:
                if withdrawal.get('id') == withdrawal_id:
                    found_withdrawal = True
                    # Verify withdrawal structure
                    expected_fields = ['id', 'account', 'currency', 'status', 'created_at']
                    missing_fields = [field for field in expected_fields if field not in withdrawal]
                    
                    if missing_fields:
                        self.log_test(
                            "Withdrawal Record Structure",
                            False,
                            f"Missing fields in withdrawal record: {missing_fields}"
                        )
                        return False
                    
                    # Verify status is pending
                    if withdrawal.get('status') != 'pending':
                        self.log_test(
                            "Withdrawal Initial Status",
                            False,
                            f"Expected status 'pending', got '{withdrawal.get('status')}'"
                        )
                        return False
                    
                    break
            
            if found_withdrawal:
                self.log_test(
                    "Withdrawal History Update",
                    True,
                    "New withdrawal appears in history with correct structure"
                )
            else:
                self.log_test(
                    "Withdrawal History Update",
                    False,
                    "New withdrawal not found in history"
                )
                return False
        
        # Test 4: Business Rule - Multiple pending withdrawals allowed (rule applies after processing)
        duplicate_withdrawal_data = {
            "account_id": test_account.get('id'),
            "currency": test_account.get('currency', 'IDR')
        }
        
        success, duplicate_response = self.run_test(
            "POST /api/withdrawals - Multiple Pending Allowed",
            "POST",
            "withdrawals",
            200,  # Should succeed - rule applies after processing
            data=duplicate_withdrawal_data
        )
        
        if success:
            self.log_test(
                "Business Rule Validation",
                True,
                "Multiple pending withdrawals allowed (rule applies after processing)"
            )
            # Store the second withdrawal ID for cleanup
            self.second_withdrawal_id = duplicate_response.get('withdrawal_id')
        else:
            self.log_test(
                "Business Rule Validation",
                False,
                "Multiple pending withdrawals not allowed (unexpected)"
            )
        
        # Test 5: Invalid account ID
        invalid_withdrawal_data = {
            "account_id": "invalid-account-id",
            "currency": "IDR"
        }
        
        success, invalid_response = self.run_test(
            "POST /api/withdrawals - Invalid Account",
            "POST",
            "withdrawals",
            404,  # Should fail with 404
            data=invalid_withdrawal_data
        )
        
        if success:
            self.log_test(
                "Account Ownership Validation",
                True,
                "Invalid account properly rejected"
            )
        else:
            self.log_test(
                "Account Ownership Validation",
                False,
                "Invalid account not properly rejected"
            )
        
        # Store test account for admin tests
        self.test_account = test_account
        return withdrawal_id

    def test_admin_withdrawal_management(self, withdrawal_id):
        """Test admin withdrawal management endpoints"""
        print("\n👨‍💼 Testing Admin Withdrawal Management...")
        
        # Test 1: GET /api/admin/withdraws - Get all withdrawal requests
        success, admin_withdrawals = self.run_test(
            "GET /api/admin/withdraws - All Requests",
            "GET",
            "admin/withdraws",
            200,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        if isinstance(admin_withdrawals, list):
            self.log_test(
                "Admin Withdrawal List",
                True,
                f"Retrieved {len(admin_withdrawals)} withdrawal requests"
            )
        else:
            self.log_test(
                "Admin Withdrawal List",
                False,
                "Response is not a list"
            )
            return False
        
        # Find our test withdrawal
        test_withdrawal = None
        for withdrawal in admin_withdrawals:
            if withdrawal.get('id') == withdrawal_id:
                test_withdrawal = withdrawal
                break
        
        if not test_withdrawal:
            self.log_test(
                "Find Test Withdrawal",
                False,
                f"Test withdrawal {withdrawal_id} not found in admin list"
            )
            return False
        
        self.log_test(
            "Find Test Withdrawal",
            True,
            f"Found test withdrawal with status: {test_withdrawal.get('status')}"
        )
        
        # Test 2: PUT /api/admin/withdraws/{id}/status - Update to processing
        processing_data = {
            "status": "processing",
            "admin_notes": "Starting withdrawal verification process"
        }
        
        success, processing_response = self.run_test(
            "PUT /api/admin/withdraws/{id}/status - Processing",
            "PUT",
            f"admin/withdraws/{withdrawal_id}/status",
            200,
            data=processing_data,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        self.log_test(
            "Status Update to Processing",
            True,
            "Successfully updated withdrawal to processing"
        )
        
        # Test 3: PUT /api/admin/withdraws/{id}/status - Complete withdrawal
        completion_data = {
            "status": "completed",
            "verified_amount": 50000.0,
            "admin_notes": "Withdrawal verified and processed successfully"
        }
        
        success, completion_response = self.run_test(
            "PUT /api/admin/withdraws/{id}/status - Complete",
            "PUT",
            f"admin/withdraws/{withdrawal_id}/status",
            200,
            data=completion_data,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        self.log_test(
            "Withdrawal Completion",
            True,
            "Successfully completed withdrawal with wallet transfer"
        )
        
        # Test 3.5: Business Rule - After completion, no more withdrawals allowed
        if hasattr(self, 'test_account'):
            post_completion_data = {
                "account_id": self.test_account.get('id'),
                "currency": self.test_account.get('currency', 'IDR')
            }
            
            success, post_completion_response = self.run_test(
                "POST /api/withdrawals - After Completion",
                "POST",
                "withdrawals",
                400,  # Should fail with 400 after completion
                data=post_completion_data
            )
            
            if success:
                self.log_test(
                    "Post-Completion Business Rule",
                    True,
                    "Withdrawal properly prevented after completion (business rule working)"
                )
            else:
                self.log_test(
                    "Post-Completion Business Rule",
                    False,
                    "Withdrawal not prevented after completion (business rule may not be working)"
                )
        
        # Test 4: Invalid status transitions
        invalid_transition_data = {
            "status": "pending",
            "admin_notes": "Trying invalid transition"
        }
        
        success, invalid_response = self.run_test(
            "PUT /api/admin/withdraws/{id}/status - Invalid Transition",
            "PUT",
            f"admin/withdraws/{withdrawal_id}/status",
            400,  # Should fail with 400
            data=invalid_transition_data,
            use_admin_token=True
        )
        
        if success:
            self.log_test(
                "Invalid Status Transition",
                True,
                "Invalid status transition properly rejected"
            )
        else:
            self.log_test(
                "Invalid Status Transition",
                False,
                "Invalid status transition not properly rejected"
            )
        
        return True

    def run_all_tests(self):
        """Run all withdrawal endpoint tests"""
        print("🚀 Starting Withdrawal Backend Endpoint Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Setup authentication
        if not self.setup_authentication():
            print("❌ Authentication setup failed, stopping tests")
            return False
        
        print("✅ Authentication setup successful")
        
        # Test withdrawal endpoints
        withdrawal_id = self.test_withdrawal_endpoints()
        if not withdrawal_id:
            print("❌ Withdrawal endpoint tests failed")
            return False
        
        # Test admin withdrawal management
        if not self.test_admin_withdrawal_management(withdrawal_id):
            print("❌ Admin withdrawal management tests failed")
            return False
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 WITHDRAWAL ENDPOINT TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = WithdrawalEndpointTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All withdrawal endpoint tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some withdrawal endpoint tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()