#!/usr/bin/env python3
"""
Share Account System Testing Script
Tests the newly implemented Share Account System functionality
"""

import requests
import sys
import json
from datetime import datetime

class ShareAccountTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_accounts = []

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

    def setup_test_environment(self):
        """Setup test environment with user and admin tokens"""
        print("🔧 Setting up test environment...")
        
        # Register and login user
        timestamp = datetime.now().strftime('%H%M%S')
        test_user_data = {
            "username": f"sharetest_{timestamp}",
            "name": f"Share Test User {timestamp}",
            "phone_number": f"08123456{timestamp}",
            "address": f"Jl. Share Test No. {timestamp}",
            "city": "Jakarta",
            "province": "DKI Jakarta",
            "email": f"sharetest_{timestamp}@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if not success:
            return False
        
        # Login user
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "username": test_user_data["username"],
                "password": test_user_data["password"]
            }
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
        else:
            return False
        
        # Login admin
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/auth/login",
            200,
            data={
                "username": "admin",
                "password": "admin123"
            }
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
        else:
            return False
        
        return True

    def create_test_accounts(self):
        """Create and approve test accounts for sharing"""
        print("\n🏗️ Creating test accounts for sharing...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        
        # Create Facebook account request
        facebook_request_data = {
            "platform": "facebook",
            "account_name": f"FB Share Test {timestamp}",
            "gmt": "GMT+7",
            "currency": "IDR",
            "delivery_method": "BM_ID",
            "bm_id_or_email": "123456789012345",
            "notes": "Facebook account for share testing"
        }
        
        success, response = self.run_test(
            "Create Facebook Account Request",
            "POST",
            "accounts/request",
            200,
            data=facebook_request_data
        )
        
        if success and 'request_id' in response:
            facebook_request_id = response['request_id']
            
            # Approve the Facebook request
            approval_data = {
                "status": "approved",
                "admin_notes": "Approved for share testing",
                "account_id": f"FB_{timestamp}_TEST"
            }
            
            success, response = self.run_test(
                "Approve Facebook Account Request",
                "PUT",
                f"admin/requests/{facebook_request_id}/status",
                200,
                data=approval_data,
                use_admin_token=True
            )
            
            if success:
                self.created_accounts.append({
                    "platform": "facebook",
                    "account_id": approval_data["account_id"],
                    "request_id": facebook_request_id
                })
        
        # Create Google account request
        google_request_data = {
            "platform": "google",
            "account_name": f"Google Share Test {timestamp}",
            "gmt": "GMT+8",
            "currency": "USD",
            "email": f"google.share.{timestamp}@example.com",
            "website": "https://example-share.com",
            "notes": "Google account for share testing"
        }
        
        success, response = self.run_test(
            "Create Google Account Request",
            "POST",
            "accounts/request",
            200,
            data=google_request_data
        )
        
        if success and 'request_id' in response:
            google_request_id = response['request_id']
            
            # Approve the Google request
            approval_data = {
                "status": "approved",
                "admin_notes": "Approved for share testing",
                "account_id": f"GOOGLE_{timestamp}_TEST"
            }
            
            success, response = self.run_test(
                "Approve Google Account Request",
                "PUT",
                f"admin/requests/{google_request_id}/status",
                200,
                data=approval_data,
                use_admin_token=True
            )
            
            if success:
                self.created_accounts.append({
                    "platform": "google",
                    "account_id": approval_data["account_id"],
                    "request_id": google_request_id
                })
        
        # Create TikTok account request
        tiktok_request_data = {
            "platform": "tiktok",
            "account_name": f"TikTok Share Test {timestamp}",
            "gmt": "GMT+9",
            "currency": "USD",
            "bc_id": f"BC{timestamp}123",
            "website": "https://tiktok-share.com",
            "notes": "TikTok account for share testing"
        }
        
        success, response = self.run_test(
            "Create TikTok Account Request",
            "POST",
            "accounts/request",
            200,
            data=tiktok_request_data
        )
        
        if success and 'request_id' in response:
            tiktok_request_id = response['request_id']
            
            # Approve the TikTok request
            approval_data = {
                "status": "approved",
                "admin_notes": "Approved for share testing",
                "account_id": f"TIKTOK_{timestamp}_TEST"
            }
            
            success, response = self.run_test(
                "Approve TikTok Account Request",
                "PUT",
                f"admin/requests/{tiktok_request_id}/status",
                200,
                data=approval_data,
                use_admin_token=True
            )
            
            if success:
                self.created_accounts.append({
                    "platform": "tiktok",
                    "account_id": approval_data["account_id"],
                    "request_id": tiktok_request_id
                })
        
        print(f"Created {len(self.created_accounts)} test accounts for sharing")
        return len(self.created_accounts) > 0

    def test_get_active_accounts(self):
        """Test getting active accounts available for sharing"""
        print("\n🔍 Testing Get Active Accounts for Sharing...")
        
        success, response = self.run_test(
            "Get Active Accounts",
            "GET",
            "accounts",
            200
        )
        
        if success and isinstance(response, list):
            active_accounts = [acc for acc in response if acc.get('status') == 'active']
            self.log_test(
                "Active Accounts Validation",
                len(active_accounts) > 0,
                f"Found {len(active_accounts)} active accounts available for sharing"
            )
            self.active_accounts = response
            return len(active_accounts) > 0
        
        return False

    def test_create_facebook_share_request(self):
        """Test creating Facebook share request with BM ID/Email"""
        print("\n🔍 Testing Facebook Share Request Creation...")
        
        if not hasattr(self, 'active_accounts') or not self.active_accounts:
            self.log_test(
                "Facebook Share Request",
                False,
                "No active accounts available"
            )
            return False
        
        # Find Facebook account or use first available
        facebook_account = None
        for account in self.active_accounts:
            if account.get('platform') == 'facebook':
                facebook_account = account
                break
        
        if not facebook_account:
            facebook_account = self.active_accounts[0]
        
        timestamp = datetime.now().strftime('%H%M%S')
        share_request_data = {
            "account_id": facebook_account['id'],
            "target_bm_email": f"fb.share.{timestamp}@example.com",
            "notes": "Test Facebook account sharing to BM email"
        }
        
        success, response = self.run_test(
            "Create Facebook Share Request",
            "POST",
            "accounts/share",
            200,
            data=share_request_data
        )
        
        if success and 'request_id' in response:
            self.facebook_share_request_id = response['request_id']
            self.log_test(
                "Facebook Share Request ID Generation",
                True,
                f"Generated share request ID: {response['request_id']}"
            )
        
        return success

    def test_create_google_share_request(self):
        """Test creating Google share request with email"""
        print("\n🔍 Testing Google Share Request Creation...")
        
        if not hasattr(self, 'active_accounts') or not self.active_accounts:
            self.log_test(
                "Google Share Request",
                False,
                "No active accounts available"
            )
            return False
        
        # Find Google account or use first available
        google_account = None
        for account in self.active_accounts:
            if account.get('platform') == 'google':
                google_account = account
                break
        
        if not google_account:
            google_account = self.active_accounts[0]
        
        timestamp = datetime.now().strftime('%H%M%S')
        share_request_data = {
            "account_id": google_account['id'],
            "target_email": f"google.share.{timestamp}@example.com",
            "notes": "Test Google Ads account sharing to email"
        }
        
        success, response = self.run_test(
            "Create Google Share Request",
            "POST",
            "accounts/share",
            200,
            data=share_request_data
        )
        
        if success and 'request_id' in response:
            self.google_share_request_id = response['request_id']
            self.log_test(
                "Google Share Request ID Generation",
                True,
                f"Generated share request ID: {response['request_id']}"
            )
        
        return success

    def test_create_tiktok_share_request(self):
        """Test creating TikTok share request with BC ID"""
        print("\n🔍 Testing TikTok Share Request Creation...")
        
        if not hasattr(self, 'active_accounts') or not self.active_accounts:
            self.log_test(
                "TikTok Share Request",
                False,
                "No active accounts available"
            )
            return False
        
        # Find TikTok account or use first available
        tiktok_account = None
        for account in self.active_accounts:
            if account.get('platform') == 'tiktok':
                tiktok_account = account
                break
        
        if not tiktok_account:
            tiktok_account = self.active_accounts[0]
        
        timestamp = datetime.now().strftime('%H%M%S')
        share_request_data = {
            "account_id": tiktok_account['id'],
            "target_bc_id": f"BC{timestamp}789",
            "notes": "Test TikTok Ads account sharing to BC ID"
        }
        
        success, response = self.run_test(
            "Create TikTok Share Request",
            "POST",
            "accounts/share",
            200,
            data=share_request_data
        )
        
        if success and 'request_id' in response:
            self.tiktok_share_request_id = response['request_id']
            self.log_test(
                "TikTok Share Request ID Generation",
                True,
                f"Generated share request ID: {response['request_id']}"
            )
        
        return success

    def test_get_user_share_requests(self):
        """Test getting user's share requests"""
        print("\n🔍 Testing Get User Share Requests...")
        
        success, response = self.run_test(
            "Get User Share Requests",
            "GET",
            "accounts/share-requests",
            200
        )
        
        if success and isinstance(response, list):
            self.log_test(
                "Share Requests List Validation",
                True,
                f"Retrieved {len(response)} share requests"
            )
            
            # Verify share request data structure
            if response:
                share_request = response[0]
                expected_fields = ['id', 'account_id', 'platform', 'account_name', 'status', 'created_at']
                missing_fields = [field for field in expected_fields if field not in share_request]
                
                if missing_fields:
                    self.log_test(
                        "Share Request Data Structure Validation",
                        False,
                        f"Missing fields in share request data: {missing_fields}"
                    )
                    return False
                else:
                    self.log_test(
                        "Share Request Data Structure Validation",
                        True,
                        "Share request data contains all expected fields"
                    )
                    
                    # Verify platform-specific fields
                    platform = share_request.get('platform')
                    if platform == 'facebook' and 'target_bm_email' in share_request:
                        self.log_test(
                            "Facebook Share Request Fields",
                            True,
                            f"Facebook share request has target_bm_email: {share_request['target_bm_email']}"
                        )
                    elif platform == 'google' and 'target_email' in share_request:
                        self.log_test(
                            "Google Share Request Fields",
                            True,
                            f"Google share request has target_email: {share_request['target_email']}"
                        )
                    elif platform == 'tiktok' and 'target_bc_id' in share_request:
                        self.log_test(
                            "TikTok Share Request Fields",
                            True,
                            f"TikTok share request has target_bc_id: {share_request['target_bc_id']}"
                        )
        elif success:
            self.log_test(
                "Share Requests List Validation",
                False,
                "Response is not a list"
            )
            return False
        
        return success

    def test_platform_validation(self):
        """Test platform-specific validation for share requests"""
        print("\n🔍 Testing Platform-Specific Validation...")
        
        if not hasattr(self, 'active_accounts') or not self.active_accounts:
            self.log_test(
                "Platform Validation Test",
                False,
                "No active accounts available for validation test"
            )
            return False
        
        account = self.active_accounts[0]
        
        # Test Facebook validation - missing target_bm_email
        facebook_invalid_data = {
            "account_id": account['id'],
            "notes": "Test missing BM email validation"
        }
        
        success, response = self.run_test(
            "Facebook Validation - Missing BM Email",
            "POST",
            "accounts/share",
            400,  # Should return 400 Bad Request
            data=facebook_invalid_data
        )
        
        # Test Google validation - missing target_email
        google_invalid_data = {
            "account_id": account['id'],
            "notes": "Test missing email validation"
        }
        
        success2, response2 = self.run_test(
            "Google Validation - Missing Email",
            "POST",
            "accounts/share",
            400,  # Should return 400 Bad Request
            data=google_invalid_data
        )
        
        # Test TikTok validation - missing target_bc_id
        tiktok_invalid_data = {
            "account_id": account['id'],
            "notes": "Test missing BC ID validation"
        }
        
        success3, response3 = self.run_test(
            "TikTok Validation - Missing BC ID",
            "POST",
            "accounts/share",
            400,  # Should return 400 Bad Request
            data=tiktok_invalid_data
        )
        
        return success and success2 and success3

    def test_admin_share_request_management(self):
        """Test admin share request management APIs"""
        print("\n🔍 Testing Admin Share Request Management...")
        
        # Get all share requests
        success, response = self.run_test(
            "Admin Get All Share Requests",
            "GET",
            "admin/share-requests",
            200,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        if isinstance(response, list):
            self.log_test(
                "Admin Share Requests List Validation",
                True,
                f"Retrieved {len(response)} share requests"
            )
            
            self.all_share_requests = response
            
            # Test filtering by status
            success2, pending_response = self.run_test(
                "Filter Share Requests by Pending Status",
                "GET",
                "admin/share-requests?status=pending",
                200,
                use_admin_token=True
            )
            
            if success2 and isinstance(pending_response, list):
                non_pending = [req for req in pending_response if req.get('status') != 'pending']
                self.log_test(
                    "Status Filter Validation",
                    len(non_pending) == 0,
                    f"All {len(pending_response)} requests have pending status"
                )
            
            # Test filtering by platform
            success3, facebook_response = self.run_test(
                "Filter Share Requests by Facebook Platform",
                "GET",
                "admin/share-requests?platform=facebook",
                200,
                use_admin_token=True
            )
            
            if success3 and isinstance(facebook_response, list):
                non_facebook = [req for req in facebook_response if req.get('platform') != 'facebook']
                self.log_test(
                    "Platform Filter Validation",
                    len(non_facebook) == 0,
                    f"All {len(facebook_response)} requests are for facebook platform"
                )
            
            return success2 and success3
        
        return False

    def test_admin_update_share_request_status(self):
        """Test admin updating share request status"""
        print("\n🔍 Testing Admin Update Share Request Status...")
        
        if not hasattr(self, 'all_share_requests') or not self.all_share_requests:
            self.log_test(
                "Share Request Status Update",
                False,
                "No share requests available for status update test"
            )
            return False
        
        # Find a pending request to approve
        pending_request = None
        for request in self.all_share_requests:
            if request.get('status') == 'pending':
                pending_request = request
                break
        
        if not pending_request:
            self.log_test(
                "Share Request Status Update",
                False,
                "No pending share requests found"
            )
            return False
        
        request_id = pending_request['id']
        
        # Approve the share request
        status_update_data = {
            "status": "approved",
            "admin_notes": "Share request approved for testing"
        }
        
        success, response = self.run_test(
            "Admin Approve Share Request",
            "PUT",
            f"admin/share-requests/{request_id}/status",
            200,
            data=status_update_data,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        # Verify the status was updated
        success2, updated_requests = self.run_test(
            "Verify Share Request Status Update",
            "GET",
            "admin/share-requests",
            200,
            use_admin_token=True
        )
        
        if success2:
            updated_request = None
            for request in updated_requests:
                if request.get('id') == request_id:
                    updated_request = request
                    break
            
            if updated_request and updated_request.get('status') == 'approved':
                self.log_test(
                    "Share Request Status Update Verification",
                    True,
                    f"Share request {request_id} successfully updated to approved status"
                )
                return True
            else:
                self.log_test(
                    "Share Request Status Update Verification",
                    False,
                    "Share request status not updated correctly"
                )
        
        return False

    def test_notification_system(self):
        """Test notification system for share requests"""
        print("\n🔍 Testing Share Request Notification System...")
        
        # Get current notification count
        success, notifications_before = self.run_test(
            "Get Admin Notifications Before Share Request",
            "GET",
            "admin/notifications",
            200,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        notifications_count_before = len(notifications_before) if isinstance(notifications_before, list) else 0
        
        # Create a new share request to trigger notification
        if hasattr(self, 'active_accounts') and self.active_accounts:
            account = self.active_accounts[0]
            timestamp = datetime.now().strftime('%H%M%S')
            
            share_request_data = {
                "account_id": account['id'],
                "target_bm_email": f"notification.test.{timestamp}@example.com",
                "notes": "Test share request for admin notification"
            }
            
            success2, response = self.run_test(
                "Create Share Request for Notification Test",
                "POST",
                "accounts/share",
                200,
                data=share_request_data
            )
            
            if success2:
                # Get notifications after share request creation
                success3, notifications_after = self.run_test(
                    "Get Admin Notifications After Share Request",
                    "GET",
                    "admin/notifications",
                    200,
                    use_admin_token=True
                )
                
                if success3:
                    notifications_count_after = len(notifications_after) if isinstance(notifications_after, list) else 0
                    
                    if notifications_count_after > notifications_count_before:
                        self.log_test(
                            "Admin Share Request Notification Creation",
                            True,
                            f"Admin notification created successfully. Count before: {notifications_count_before}, after: {notifications_count_after}"
                        )
                        
                        # Check if the latest notification is about share request
                        if isinstance(notifications_after, list) and len(notifications_after) > 0:
                            latest_notification = notifications_after[0]
                            if "share" in latest_notification.get('title', '').lower() or "share" in latest_notification.get('message', '').lower():
                                self.log_test(
                                    "Share Request Notification Content",
                                    True,
                                    "Latest notification contains share request information"
                                )
                                return True
                        
                        return True
                    else:
                        self.log_test(
                            "Admin Share Request Notification Creation",
                            False,
                            f"No new notification created. Count before: {notifications_count_before}, after: {notifications_count_after}"
                        )
        
        return False

    def run_all_tests(self):
        """Run all Share Account System tests"""
        print("🚀 Starting Share Account System Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Setup test environment
        if not self.setup_test_environment():
            print("❌ Failed to setup test environment")
            return False
        
        # Create test accounts
        if not self.create_test_accounts():
            print("❌ Failed to create test accounts")
            return False
        
        # Test sequence
        tests = [
            self.test_get_active_accounts,
            self.test_create_facebook_share_request,
            self.test_create_google_share_request,
            self.test_create_tiktok_share_request,
            self.test_get_user_share_requests,
            self.test_platform_validation,
            self.test_admin_share_request_management,
            self.test_admin_update_share_request_status,
            self.test_notification_system
        ]
        
        # Run tests
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
        print("📊 SHARE ACCOUNT SYSTEM TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ShareAccountTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())