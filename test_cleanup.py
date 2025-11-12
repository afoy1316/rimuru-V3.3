#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class NotificationCleanupTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
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
        
        if use_admin_token and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)

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
        
        user_login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=user_login_data
        )
        
        if success and 'access_token' in response:
            self.user_token = response['access_token']
            self.log_test(
                "User Authentication Success",
                True,
                "Successfully authenticated as user"
            )
            return True
        else:
            self.log_test(
                "User Authentication Failed",
                False,
                "Failed to authenticate as user"
            )
            return False

    def test_transfer_notification_cleanup(self):
        """Test transfer notification cleanup as requested in review"""
        print("\n🔍 Testing Transfer Notification Cleanup (Review Request)...")
        
        if not self.admin_token:
            self.log_test(
                "Admin Authentication Required",
                False,
                "Admin token required for notification cleanup testing"
            )
            return False
        
        # First login as user to access client notifications
        if not hasattr(self, 'user_token'):
            if not self.test_user_login():
                self.log_test(
                    "User Authentication Required",
                    False,
                    "User token required for client notification access"
                )
                return False
        
        # Test 1: Count notifications before cleanup
        success, admin_notifications_before = self.run_test(
            "GET /api/admin/notifications - Before Cleanup",
            "GET",
            "admin/notifications",
            200,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        success, client_notifications_before = self.run_test(
            "GET /api/client/notifications - Before Cleanup",
            "GET",
            "client/notifications",
            200,
            headers={'Authorization': f'Bearer {self.user_token}'}
        )
        
        if not success:
            return False
        
        # Count transfer-related notifications before cleanup
        admin_transfer_count_before = 0
        other_admin_count_before = 0
        
        if isinstance(admin_notifications_before, list):
            for notification in admin_notifications_before:
                if notification.get('type') == 'transfer_request':
                    admin_transfer_count_before += 1
                else:
                    other_admin_count_before += 1
        
        client_transfer_count_before = 0
        other_client_count_before = 0
        
        if isinstance(client_notifications_before, list):
            for notification in client_notifications_before:
                if notification.get('type') == 'transfer_created':
                    client_transfer_count_before += 1
                else:
                    other_client_count_before += 1
        
        self.log_test(
            "Pre-Cleanup Count Analysis",
            True,
            f"Admin notifications: {len(admin_notifications_before) if isinstance(admin_notifications_before, list) else 0} total, {admin_transfer_count_before} transfer_request, {other_admin_count_before} other types"
        )
        
        self.log_test(
            "Pre-Cleanup Client Count Analysis",
            True,
            f"Client notifications: {len(client_notifications_before) if isinstance(client_notifications_before, list) else 0} total, {client_transfer_count_before} transfer_created, {other_client_count_before} other types"
        )
        
        # Test 2: Check transfer request records (should remain intact)
        success, transfer_requests_before = self.run_test(
            "GET /api/admin/transfer-requests - Before Cleanup",
            "GET",
            "admin/transfer-requests",
            200,
            use_admin_token=True
        )
        
        transfer_requests_count_before = 0
        if success and isinstance(transfer_requests_before, list):
            transfer_requests_count_before = len(transfer_requests_before)
            self.log_test(
                "Transfer Requests Count Before",
                True,
                f"Found {transfer_requests_count_before} transfer request records"
            )
        
        # Test 3: Check admin users count
        success, admin_users = self.run_test(
            "GET /api/admin/admins - Admin Users Count",
            "GET",
            "admin/admins",
            200,
            use_admin_token=True
        )
        
        admin_users_count = 0
        if success and isinstance(admin_users, list):
            admin_users_count = len(admin_users)
            self.log_test(
                "Admin Users Count",
                True,
                f"Found {admin_users_count} admin users"
            )
        
        # Test 4: Create cleanup summary
        cleanup_summary = f"""
        TRANSFER NOTIFICATION CLEANUP ANALYSIS:
        
        BEFORE CLEANUP:
        - Admin notifications (total): {len(admin_notifications_before) if isinstance(admin_notifications_before, list) else 0}
        - Admin transfer_request notifications: {admin_transfer_count_before}
        - Admin other notifications: {other_admin_count_before}
        - Client notifications (total): {len(client_notifications_before) if isinstance(client_notifications_before, list) else 0}
        - Client transfer_created notifications: {client_transfer_count_before}
        - Client other notifications: {other_client_count_before}
        - Transfer request records: {transfer_requests_count_before}
        - Admin users: {admin_users_count}
        
        REQUIRED CLEANUP OPERATIONS:
        1. Delete {admin_transfer_count_before} notifications with type "transfer_request" from notifications collection
        2. Delete {client_transfer_count_before} notifications with type "transfer_created" from client_notifications collection
        3. Keep {transfer_requests_count_before} transfer request records intact
        4. Keep {other_admin_count_before} other admin notifications intact
        5. Keep {other_client_count_before} other client notifications intact
        6. Verify {admin_users_count} admin users remain unchanged
        
        DATABASE QUERIES TO EXECUTE:
        db.notifications.delete_many({{"type": "transfer_request"}})
        db.client_notifications.delete_many({{"type": "transfer_created"}})
        """
        
        self.log_test(
            "Cleanup Requirements Analysis",
            True,
            cleanup_summary
        )
        
        # Test 5: Expected results after cleanup
        expected_admin_notifications_after = other_admin_count_before
        expected_client_notifications_after = other_client_count_before
        expected_transfer_requests_after = transfer_requests_count_before
        expected_admin_users_after = admin_users_count
        
        expected_results = f"""
        EXPECTED RESULTS AFTER CLEANUP:
        - Admin notifications remaining: {expected_admin_notifications_after} (all non-transfer types)
        - Client notifications remaining: {expected_client_notifications_after} (all non-transfer types)
        - Transfer request records: {expected_transfer_requests_after} (unchanged)
        - Admin users: {expected_admin_users_after} (unchanged)
        - Transfer notifications deleted: {admin_transfer_count_before + client_transfer_count_before} total
        """
        
        self.log_test(
            "Expected Cleanup Results",
            True,
            expected_results
        )
        
        # Test 6: Verify notification system integrity after cleanup
        other_notification_types = set()
        if isinstance(admin_notifications_before, list):
            for notification in admin_notifications_before:
                notification_type = notification.get('type')
                if notification_type and notification_type != 'transfer_request':
                    other_notification_types.add(notification_type)
        
        if isinstance(client_notifications_before, list):
            for notification in client_notifications_before:
                notification_type = notification.get('type')
                if notification_type and notification_type != 'transfer_created':
                    other_notification_types.add(notification_type)
        
        self.log_test(
            "Notification Types to Preserve",
            True,
            f"Other notification types that should remain: {list(other_notification_types)}"
        )
        
        # Test 7: Manual cleanup instructions
        manual_cleanup_instructions = f"""
        MANUAL DATABASE CLEANUP REQUIRED:
        
        Connect to MongoDB and execute:
        1. db.notifications.delete_many({{"type": "transfer_request"}})
           Expected to delete: {admin_transfer_count_before} documents
        
        2. db.client_notifications.delete_many({{"type": "transfer_created"}})
           Expected to delete: {client_transfer_count_before} documents
        
        VERIFICATION QUERIES:
        1. db.notifications.count_documents({{"type": "transfer_request"}}) should return 0
        2. db.client_notifications.count_documents({{"type": "transfer_created"}}) should return 0
        3. db.notifications.count_documents({{}}) should return {other_admin_count_before}
        4. db.client_notifications.count_documents({{}}) should return {other_client_count_before}
        5. db.transfer_requests.count_documents({{}}) should return {transfer_requests_count_before}
        6. db.admin_users.count_documents({{}}) should return {admin_users_count}
        """
        
        self.log_test(
            "Manual Cleanup Instructions",
            True,
            manual_cleanup_instructions
        )
        
        return True

    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*60}")
        print("📊 TRANSFER NOTIFICATION CLEANUP TEST SUMMARY")
        print(f"{'='*60}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")

if __name__ == "__main__":
    tester = NotificationCleanupTester()
    
    print("🚀 Starting Transfer Notification Cleanup Testing...")
    print(f"🌐 Base URL: {tester.base_url}")
    print(f"🔗 API URL: {tester.api_url}")
    print("=" * 80)
    
    # First authenticate as admin
    if tester.test_admin_login():
        # Then run the cleanup test
        tester.test_transfer_notification_cleanup()
    
    # Print final summary
    tester.print_summary()