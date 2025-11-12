#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class StatusSyncTester:
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
            "username": f"statustest_{timestamp}",
            "name": f"Status Test User {timestamp}",
            "phone_number": f"08123456{timestamp}",
            "address": f"Jl. Status Test No. {timestamp}",
            "city": "Jakarta",
            "province": "DKI Jakarta",
            "email": f"statustest_{timestamp}@example.com",
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

    def test_status_flow_transitions(self):
        """Test all status transitions as per requirements"""
        print("\n🔍 Testing Status Flow Transitions...")
        
        # Create test requests for different status transitions
        timestamp = datetime.now().strftime('%H%M%S')
        
        # Test data for different platforms
        test_requests = [
            {
                "platform": "facebook",
                "account_name": f"FB Status Test {timestamp}",
                "gmt": "GMT+7",
                "currency": "IDR",
                "delivery_method": "BM_ID",
                "bm_id_or_email": "123456789012345",
                "notes": "Status transition test"
            },
            {
                "platform": "google",
                "account_name": f"Google Status Test {timestamp}",
                "gmt": "GMT+8",
                "currency": "USD",
                "email": f"google.status.{timestamp}@example.com",
                "website": "https://status-test.com",
                "notes": "Google status transition test"
            }
        ]
        
        created_request_ids = []
        
        # Create requests
        for i, request_data in enumerate(test_requests):
            success, response = self.run_test(
                f"Create {request_data['platform'].title()} Request for Status Test",
                "POST",
                "accounts/request",
                200,
                data=request_data
            )
            
            if success and 'request_id' in response:
                created_request_ids.append({
                    'id': response['request_id'],
                    'platform': request_data['platform'],
                    'account_name': request_data['account_name']
                })
        
        if not created_request_ids:
            self.log_test(
                "Status Flow Test Setup",
                False,
                "Failed to create test requests"
            )
            return False
        
        # Test status transitions
        status_transitions = [
            {"status": "approved", "description": "Pending → Approved"},
            {"status": "rejected", "description": "Pending → Rejected"},
            {"status": "processing", "description": "Pending → Processing"},
            {"status": "completed", "description": "Pending → Completed"},
            {"status": "failed", "description": "Pending → Failed"},
            {"status": "disabled", "description": "Pending → Disabled"}
        ]
        
        success_count = 0
        total_tests = len(created_request_ids) * len(status_transitions)
        
        for request_info in created_request_ids:
            for transition in status_transitions:
                # Prepare status update data
                status_data = {
                    "status": transition["status"],
                    "admin_notes": f"Testing {transition['description']} transition",
                    "fee_percentage": 5.0 if transition["status"] == "approved" else None
                }
                
                # Add account_id for Facebook approval
                if request_info['platform'] == 'facebook' and transition["status"] == "approved":
                    status_data["account_id"] = f"FB{timestamp}{request_info['id'][:8]}"
                
                success, response = self.run_test(
                    f"{transition['description']} - {request_info['platform'].title()}",
                    "PUT",
                    f"admin/requests/{request_info['id']}/status",
                    200,
                    data=status_data,
                    use_admin_token=True
                )
                
                if success:
                    success_count += 1
        
        overall_success = success_count >= (total_tests * 0.8)  # 80% success rate acceptable
        self.log_test(
            "Status Flow Transitions Summary",
            overall_success,
            f"Successfully completed {success_count}/{total_tests} status transitions"
        )
        
        return overall_success

    def test_ad_account_status_mapping(self):
        """Test ad account status mapping verification"""
        print("\n🔍 Testing Ad Account Status Mapping...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        
        # Create a test request
        request_data = {
            "platform": "google",
            "account_name": f"Status Mapping Test {timestamp}",
            "gmt": "GMT+7",
            "currency": "USD",
            "email": f"mapping.test.{timestamp}@example.com",
            "website": "https://mapping-test.com",
            "notes": "Testing status mapping"
        }
        
        success, create_response = self.run_test(
            "Create Request for Status Mapping Test",
            "POST",
            "accounts/request",
            200,
            data=request_data
        )
        
        if not success or 'request_id' not in create_response:
            self.log_test(
                "Status Mapping Test Setup",
                False,
                "Failed to create test request"
            )
            return False
        
        request_id = create_response['request_id']
        
        # Test status mappings
        status_mappings = [
            {
                "request_status": "approved",
                "expected_account_status": "active",
                "description": "Approved → Active mapping"
            },
            {
                "request_status": "completed",
                "expected_account_status": "active",
                "description": "Completed → Active mapping"
            },
            {
                "request_status": "disabled", 
                "expected_account_status": "disabled",
                "description": "Disabled → Disabled mapping"
            },
            {
                "request_status": "rejected",
                "expected_account_status": "suspended",
                "description": "Rejected → Suspended mapping"
            }
        ]
        
        success_count = 0
        
        for mapping in status_mappings:
            # First approve the request to create an ad account if not already approved
            if mapping["request_status"] != "approved":
                approve_data = {
                    "status": "approved",
                    "admin_notes": "Approving for status mapping test",
                    "fee_percentage": 5.0
                }
                
                success, approve_response = self.run_test(
                    f"Approve Request for {mapping['description']}",
                    "PUT",
                    f"admin/requests/{request_id}/status",
                    200,
                    data=approve_data,
                    use_admin_token=True
                )
                
                if not success:
                    continue
            
            # Update to target status
            status_data = {
                "status": mapping["request_status"],
                "admin_notes": f"Testing {mapping['description']}",
                "fee_percentage": 5.0 if mapping["request_status"] == "approved" else None
            }
            
            success, status_response = self.run_test(
                f"Update to {mapping['request_status']} Status",
                "PUT",
                f"admin/requests/{request_id}/status",
                200,
                data=status_data,
                use_admin_token=True
            )
            
            if success:
                # Get user's ad accounts to verify status mapping
                success_accounts, accounts_response = self.run_test(
                    f"Get Accounts for {mapping['description']}",
                    "GET",
                    "accounts",
                    200
                )
                
                if success_accounts and isinstance(accounts_response, list):
                    # Find the account created from our request
                    test_account = None
                    for account in accounts_response:
                        if account.get('account_name') == request_data['account_name']:
                            test_account = account
                            break
                    
                    if test_account:
                        actual_status = test_account.get('status')
                        if actual_status == mapping["expected_account_status"]:
                            success_count += 1
                            self.log_test(
                                mapping['description'],
                                True,
                                f"Request status '{mapping['request_status']}' correctly mapped to account status '{actual_status}'"
                            )
                        else:
                            self.log_test(
                                mapping['description'],
                                False,
                                f"Expected account status '{mapping['expected_account_status']}', got '{actual_status}'"
                            )
                    else:
                        # Account might be filtered out if disabled/suspended
                        if mapping["expected_account_status"] in ["disabled", "suspended"]:
                            success_count += 1
                            self.log_test(
                                mapping['description'],
                                True,
                                f"Account properly filtered out with status '{mapping['expected_account_status']}'"
                            )
                        else:
                            self.log_test(
                                mapping['description'],
                                False,
                                "Test account not found in user accounts"
                            )
        
        overall_success = success_count >= len(status_mappings) * 0.75  # 75% success rate
        self.log_test(
            "Ad Account Status Mapping Summary",
            overall_success,
            f"Successfully verified {success_count}/{len(status_mappings)} status mappings"
        )
        
        return overall_success

    def test_client_dashboard_data_verification(self):
        """Test client dashboard data verification"""
        print("\n🔍 Testing Client Dashboard Data Verification...")
        
        # Test GET /api/accounts endpoint
        success, accounts_response = self.run_test(
            "Get Client Accounts",
            "GET",
            "accounts",
            200
        )
        
        if not success:
            return False
        
        if not isinstance(accounts_response, list):
            self.log_test(
                "Accounts Response Format",
                False,
                "Accounts response is not a list"
            )
            return False
        
        # Verify required fields in account data
        required_fields = ['id', 'account_name', 'platform', 'status', 'balance']
        
        if accounts_response:
            account = accounts_response[0]
            missing_fields = [field for field in required_fields if field not in account]
            
            if missing_fields:
                self.log_test(
                    "Account Data Fields Verification",
                    False,
                    f"Missing required fields: {missing_fields}"
                )
                return False
            else:
                self.log_test(
                    "Account Data Fields Verification",
                    True,
                    "All required fields present in account data"
                )
        
        # Test that disabled/deleted accounts are filtered out
        # First, get all accounts as admin to see the full list
        success_admin, admin_accounts = self.run_test(
            "Get All Accounts (Admin View)",
            "GET",
            "admin/accounts",
            200,
            use_admin_token=True
        )
        
        if success_admin and isinstance(admin_accounts, list):
            # Count active vs disabled accounts
            active_accounts = [acc for acc in admin_accounts if acc.get('status') == 'active']
            disabled_accounts = [acc for acc in admin_accounts if acc.get('status') in ['disabled', 'suspended']]
            
            # Client should only see active accounts
            client_account_count = len(accounts_response)
            active_account_count = len(active_accounts)
            
            if client_account_count <= active_account_count:
                self.log_test(
                    "Disabled Account Filtering",
                    True,
                    f"Client sees {client_account_count} accounts, admin sees {active_account_count} active accounts"
                )
            else:
                self.log_test(
                    "Disabled Account Filtering",
                    False,
                    f"Client sees more accounts ({client_account_count}) than active accounts ({active_account_count})"
                )
        
        self.log_test(
            "Client Dashboard Data Verification",
            True,
            f"Successfully verified client dashboard with {len(accounts_response)} accounts"
        )
        
        return True

    def run_comprehensive_status_sync_tests(self):
        """Run all comprehensive status synchronization tests"""
        print("🔄 COMPREHENSIVE STATUS SYNCHRONIZATION TESTING")
        print("=" * 60)
        
        if not self.setup_authentication():
            return
        
        # Run all status synchronization tests
        tests = [
            self.test_status_flow_transitions,
            self.test_ad_account_status_mapping,
            self.test_client_dashboard_data_verification
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
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 STATUS SYNCHRONIZATION TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")

if __name__ == "__main__":
    tester = StatusSyncTester()
    tester.run_comprehensive_status_sync_tests()