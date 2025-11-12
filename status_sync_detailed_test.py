#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class DetailedStatusSyncTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.issues_found = []

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

    def log_issue(self, issue_type, description, severity="HIGH"):
        """Log critical issues found during testing"""
        issue = {
            "type": issue_type,
            "description": description,
            "severity": severity,
            "timestamp": datetime.now().isoformat()
        }
        self.issues_found.append(issue)
        print(f"🚨 {severity} ISSUE: {description}")

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
        """Setup admin and user authentication"""
        print("🔐 Setting up authentication...")
        
        # Admin login
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
        else:
            print("❌ Admin login failed. Cannot continue.")
            return False
        
        # User login - create a test user first
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "username": f"synctest_{timestamp}",
            "name": f"Sync Test User {timestamp}",
            "phone_number": f"08123456{timestamp}",
            "address": f"Jl. Sync Test No. {timestamp}",
            "city": "Jakarta",
            "province": "DKI Jakarta",
            "email": f"synctest_{timestamp}@example.com",
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
            # Login with test user
            login_data = {
                "username": user_data["username"],
                "password": user_data["password"]
            }
            
            success, login_response = self.run_test(
                "User Login",
                "POST",
                "auth/login",
                200,
                data=login_data
            )
            
            if success and 'access_token' in login_response:
                self.token = login_response['access_token']
                return True
        
        print("❌ User authentication failed. Cannot continue.")
        return False

    def test_comprehensive_status_synchronization(self):
        """Test comprehensive status synchronization with detailed analysis"""
        print("\n🔍 Testing Comprehensive Status Synchronization...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        
        # Create a test request
        request_data = {
            "platform": "google",
            "account_name": f"Comprehensive Sync Test {timestamp}",
            "gmt": "GMT+7",
            "currency": "USD",
            "email": f"comprehensive.sync.{timestamp}@example.com",
            "website": "https://comprehensive-sync-test.com",
            "notes": "Testing comprehensive status synchronization"
        }
        
        success, create_response = self.run_test(
            "Create Request for Comprehensive Sync Test",
            "POST",
            "accounts/request",
            200,
            data=request_data
        )
        
        if not success or 'request_id' not in create_response:
            self.log_test(
                "Comprehensive Sync Test Setup",
                False,
                "Failed to create test request"
            )
            return False
        
        request_id = create_response['request_id']
        
        # Test the complete status synchronization flow
        status_flow_tests = [
            {
                "step": 1,
                "request_status": "approved",
                "expected_request_status": "approved",
                "expected_account_status": "active",
                "description": "Step 1: Approve Request → Should create active ad account",
                "fee_percentage": 5.0
            },
            {
                "step": 2,
                "request_status": "completed",
                "expected_request_status": "completed", 
                "expected_account_status": "active",
                "description": "Step 2: Complete Request → Ad account should remain active"
            },
            {
                "step": 3,
                "request_status": "disabled",
                "expected_request_status": "disabled",
                "expected_account_status": "disabled", 
                "description": "Step 3: Disable Request → Ad account should become disabled"
            },
            {
                "step": 4,
                "request_status": "rejected",
                "expected_request_status": "rejected",
                "expected_account_status": "suspended",
                "description": "Step 4: Reject Request → Ad account should become suspended"
            }
        ]
        
        created_account_id = None
        
        for test in status_flow_tests:
            print(f"\n--- {test['description']} ---")
            
            # Update request status
            status_data = {
                "status": test["request_status"],
                "admin_notes": f"Testing {test['description']}",
            }
            
            if "fee_percentage" in test:
                status_data["fee_percentage"] = test["fee_percentage"]
            
            success, status_response = self.run_test(
                f"Update Request to {test['request_status']}",
                "PUT",
                f"admin/requests/{request_id}/status",
                200,
                data=status_data,
                use_admin_token=True
            )
            
            if not success:
                self.log_issue(
                    "REQUEST_STATUS_UPDATE_FAILED",
                    f"Failed to update request to {test['request_status']} status",
                    "HIGH"
                )
                continue
            
            # Verify request status was updated
            success_req, request_check = self.run_test(
                f"Verify Request Status is {test['request_status']}",
                "GET",
                f"admin/requests?status={test['request_status']}",
                200,
                use_admin_token=True
            )
            
            if success_req and isinstance(request_check, list):
                found_request = None
                for req in request_check:
                    if req.get('id') == request_id:
                        found_request = req
                        break
                
                if found_request:
                    actual_request_status = found_request.get('status')
                    if actual_request_status == test["expected_request_status"]:
                        self.log_test(
                            f"Request Status Verification - Step {test['step']}",
                            True,
                            f"Request status correctly updated to '{actual_request_status}'"
                        )
                    else:
                        self.log_test(
                            f"Request Status Verification - Step {test['step']}",
                            False,
                            f"Expected '{test['expected_request_status']}', got '{actual_request_status}'"
                        )
                        self.log_issue(
                            "REQUEST_STATUS_MISMATCH",
                            f"Request status mismatch in step {test['step']}: expected '{test['expected_request_status']}', got '{actual_request_status}'",
                            "MEDIUM"
                        )
                else:
                    self.log_test(
                        f"Request Status Verification - Step {test['step']}",
                        False,
                        f"Request not found in {test['request_status']} filter"
                    )
                    self.log_issue(
                        "REQUEST_NOT_FOUND_IN_FILTER",
                        f"Request not found in {test['request_status']} status filter",
                        "HIGH"
                    )
            
            # Check ad account status
            success_acc, accounts_response = self.run_test(
                f"Get User Accounts - Step {test['step']}",
                "GET",
                "accounts",
                200
            )
            
            if success_acc and isinstance(accounts_response, list):
                test_account = None
                for account in accounts_response:
                    if account.get('account_name') == request_data['account_name']:
                        test_account = account
                        created_account_id = account.get('id')
                        break
                
                if test_account:
                    actual_account_status = test_account.get('status')
                    if actual_account_status == test["expected_account_status"]:
                        self.log_test(
                            f"Ad Account Status Verification - Step {test['step']}",
                            True,
                            f"Ad account status correctly set to '{actual_account_status}'"
                        )
                    else:
                        self.log_test(
                            f"Ad Account Status Verification - Step {test['step']}",
                            False,
                            f"Expected ad account status '{test['expected_account_status']}', got '{actual_account_status}'"
                        )
                        self.log_issue(
                            "AD_ACCOUNT_STATUS_SYNC_FAILURE",
                            f"Ad account status not synchronized with request status in step {test['step']}: request='{test['request_status']}' should map to account='{test['expected_account_status']}' but got '{actual_account_status}'",
                            "CRITICAL"
                        )
                else:
                    # Account might be filtered out if disabled/suspended
                    if test["expected_account_status"] in ["disabled", "suspended"]:
                        # Check admin view to see if account exists but is filtered
                        success_admin, admin_accounts = self.run_test(
                            f"Check Admin Accounts View - Step {test['step']}",
                            "GET",
                            "admin/accounts",
                            200,
                            use_admin_token=True
                        )
                        
                        if success_admin and isinstance(admin_accounts, list):
                            admin_account = None
                            for account in admin_accounts:
                                if account.get('account_name') == request_data['account_name']:
                                    admin_account = account
                                    break
                            
                            if admin_account:
                                admin_account_status = admin_account.get('status')
                                if admin_account_status == test["expected_account_status"]:
                                    self.log_test(
                                        f"Ad Account Status Verification (Admin View) - Step {test['step']}",
                                        True,
                                        f"Account properly has '{admin_account_status}' status and is filtered from client view"
                                    )
                                else:
                                    self.log_test(
                                        f"Ad Account Status Verification (Admin View) - Step {test['step']}",
                                        False,
                                        f"Expected '{test['expected_account_status']}', got '{admin_account_status}' in admin view"
                                    )
                                    self.log_issue(
                                        "AD_ACCOUNT_STATUS_SYNC_FAILURE",
                                        f"Ad account status not synchronized in step {test['step']}: expected '{test['expected_account_status']}', got '{admin_account_status}'",
                                        "CRITICAL"
                                    )
                            else:
                                self.log_test(
                                    f"Ad Account Status Verification - Step {test['step']}",
                                    False,
                                    "Account not found in admin view either"
                                )
                                self.log_issue(
                                    "AD_ACCOUNT_MISSING",
                                    f"Ad account completely missing in step {test['step']}",
                                    "CRITICAL"
                                )
                    else:
                        self.log_test(
                            f"Ad Account Status Verification - Step {test['step']}",
                            False,
                            "Account not found in user accounts"
                        )
                        self.log_issue(
                            "AD_ACCOUNT_MISSING",
                            f"Ad account not found in user accounts in step {test['step']}",
                            "HIGH"
                        )
        
        return True

    def test_delete_functionality_comprehensive(self):
        """Test delete functionality with comprehensive verification"""
        print("\n🔍 Testing Delete Functionality Comprehensive...")
        
        # Get admin accounts to find one to delete
        success, admin_accounts = self.run_test(
            "Get Admin Accounts for Delete Test",
            "GET",
            "admin/accounts",
            200,
            use_admin_token=True
        )
        
        if not success or not isinstance(admin_accounts, list) or not admin_accounts:
            self.log_test(
                "Delete Test Setup",
                False,
                "No accounts available for delete testing"
            )
            return False
        
        # Find an account to delete (preferably one with zero balance)
        test_account = None
        for account in admin_accounts:
            if account.get('balance', 0) == 0:
                test_account = account
                break
        
        if not test_account:
            # Use the first account if no zero-balance account found
            test_account = admin_accounts[0]
        
        account_id = test_account.get('id')
        account_name = test_account.get('account_name')
        user_id = test_account.get('user_id')
        
        if not account_id:
            self.log_test(
                "Delete Test Setup",
                False,
                "Account ID not found"
            )
            return False
        
        print(f"Testing deletion of account: {account_name} (ID: {account_id})")
        
        # Count accounts before deletion
        initial_admin_count = len(admin_accounts)
        
        # Get client accounts before deletion
        success_client_before, client_accounts_before = self.run_test(
            "Get Client Accounts Before Delete",
            "GET",
            "accounts",
            200
        )
        
        initial_client_count = len(client_accounts_before) if success_client_before and isinstance(client_accounts_before, list) else 0
        
        # Delete the account
        success, delete_response = self.run_test(
            "Delete Account",
            "DELETE",
            f"admin/accounts/{account_id}",
            200,
            use_admin_token=True
        )
        
        if not success:
            self.log_test(
                "Account Deletion",
                False,
                "Failed to delete account"
            )
            self.log_issue(
                "DELETE_OPERATION_FAILED",
                f"Failed to delete account {account_name} (ID: {account_id})",
                "HIGH"
            )
            return False
        
        # Verify account is deleted from admin view
        success_admin, admin_accounts_after = self.run_test(
            "Verify Admin Accounts After Delete",
            "GET",
            "admin/accounts",
            200,
            use_admin_token=True
        )
        
        if success_admin and isinstance(admin_accounts_after, list):
            final_admin_count = len(admin_accounts_after)
            deleted_account_found = any(acc.get('id') == account_id for acc in admin_accounts_after)
            
            if not deleted_account_found and final_admin_count < initial_admin_count:
                self.log_test(
                    "Admin Delete Verification",
                    True,
                    f"Account successfully deleted from admin view. Count: {initial_admin_count} → {final_admin_count}"
                )
            else:
                self.log_test(
                    "Admin Delete Verification",
                    False,
                    f"Account still found in admin view or count unchanged: {initial_admin_count} → {final_admin_count}"
                )
                self.log_issue(
                    "DELETE_VERIFICATION_FAILED",
                    f"Account {account_name} still appears in admin view after deletion",
                    "CRITICAL"
                )
                return False
        
        # Verify deleted account doesn't appear in client dashboard
        success_client, client_accounts_after = self.run_test(
            "Verify Client Accounts After Delete",
            "GET",
            "accounts",
            200
        )
        
        if success_client and isinstance(client_accounts_after, list):
            final_client_count = len(client_accounts_after)
            deleted_in_client = any(acc.get('id') == account_id for acc in client_accounts_after)
            
            if not deleted_in_client:
                self.log_test(
                    "Client Delete Verification",
                    True,
                    f"Deleted account properly filtered from client dashboard. Count: {initial_client_count} → {final_client_count}"
                )
            else:
                self.log_test(
                    "Client Delete Verification",
                    False,
                    "Deleted account still appears in client dashboard"
                )
                self.log_issue(
                    "DELETE_CLIENT_FILTER_FAILED",
                    f"Deleted account {account_name} still appears in client dashboard",
                    "CRITICAL"
                )
                return False
        
        self.log_test(
            "Delete Functionality Comprehensive",
            True,
            f"Successfully tested comprehensive deletion of account '{account_name}'"
        )
        
        return True

    def run_comprehensive_tests(self):
        """Run all comprehensive status synchronization tests"""
        print("🔄 COMPREHENSIVE STATUS SYNCHRONIZATION TESTING - DETAILED ANALYSIS")
        print("=" * 80)
        
        if not self.setup_authentication():
            return
        
        # Run comprehensive tests
        tests = [
            self.test_comprehensive_status_synchronization,
            self.test_delete_functionality_comprehensive
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(
                    test.__name__,
                    False,
                    f"Test execution error: {str(e)}"
                )
                self.log_issue(
                    "TEST_EXECUTION_ERROR",
                    f"Test {test.__name__} failed with exception: {str(e)}",
                    "HIGH"
                )
        
        # Print detailed summary
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE STATUS SYNCHRONIZATION TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print critical issues found
        if self.issues_found:
            print(f"\n🚨 CRITICAL ISSUES FOUND: {len(self.issues_found)}")
            print("=" * 80)
            
            critical_issues = [issue for issue in self.issues_found if issue['severity'] == 'CRITICAL']
            high_issues = [issue for issue in self.issues_found if issue['severity'] == 'HIGH']
            medium_issues = [issue for issue in self.issues_found if issue['severity'] == 'MEDIUM']
            
            if critical_issues:
                print(f"\n🔴 CRITICAL ISSUES ({len(critical_issues)}):")
                for i, issue in enumerate(critical_issues, 1):
                    print(f"{i}. {issue['type']}: {issue['description']}")
            
            if high_issues:
                print(f"\n🟠 HIGH PRIORITY ISSUES ({len(high_issues)}):")
                for i, issue in enumerate(high_issues, 1):
                    print(f"{i}. {issue['type']}: {issue['description']}")
            
            if medium_issues:
                print(f"\n🟡 MEDIUM PRIORITY ISSUES ({len(medium_issues)}):")
                for i, issue in enumerate(medium_issues, 1):
                    print(f"{i}. {issue['type']}: {issue['description']}")
        else:
            print("\n✅ NO CRITICAL ISSUES FOUND")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
            "issues_found": self.issues_found,
            "test_results": self.test_results
        }

if __name__ == "__main__":
    tester = DetailedStatusSyncTester()
    results = tester.run_comprehensive_tests()
    
    # Save detailed results to file
    with open('/app/status_sync_detailed_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/status_sync_detailed_results.json")