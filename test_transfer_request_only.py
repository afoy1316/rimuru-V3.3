#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class TransferRequestTester:
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
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        print("\n🔍 Testing User Login...")
        
        # Try with existing test user
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
            return True
        return False

    def test_transfer_request_notifications(self):
        """Test /api/transfer-request endpoint for notification creation"""
        print("\n🔍 TESTING /api/transfer-request NOTIFICATION CREATION...")
        print("=" * 80)
        
        # Step 1: Get Admin Count
        success, admin_users = self.run_test(
            "GET /api/admin/admins - Count Admin Users",
            "GET",
            "admin/admins",
            200,
            use_admin_token=True
        )
        
        admin_count = len(admin_users) if success and isinstance(admin_users, list) else 0
        self.log_test(
            "Admin Users Count",
            True,
            f"Found {admin_count} admin users in system"
        )
        
        # Step 2: Get Current Notifications
        success, notifications_before = self.run_test(
            "GET /api/admin/notifications - Before Transfer Request",
            "GET",
            "admin/notifications",
            200,
            use_admin_token=True
        )
        
        transfer_notifications_before = []
        if success and isinstance(notifications_before, list):
            for notification in notifications_before:
                if notification.get('type') == 'transfer_request':
                    transfer_notifications_before.append(notification)
        
        self.log_test(
            "Notifications Before Transfer Request",
            True,
            f"Total notifications: {len(notifications_before) if notifications_before else 0}, Transfer notifications: {len(transfer_notifications_before)}"
        )
        
        # Step 3: Get User Accounts
        success, accounts = self.run_test(
            "GET /api/accounts - For Transfer Request Test",
            "GET",
            "accounts",
            200
        )
        
        if not success or not accounts:
            self.log_test(
                "Transfer Request Test Setup Failed",
                False,
                "No accounts available for transfer request test"
            )
            return False
        
        # Find a suitable account
        test_account = None
        for account in accounts:
            if account.get('id') and account.get('platform'):
                test_account = account
                break
        
        if not test_account:
            self.log_test(
                "Transfer Request Test Setup Failed",
                False,
                "No suitable account found for transfer request test"
            )
            return False
        
        self.log_test(
            "Test Account Selected",
            True,
            f"Using account: {test_account.get('account_name', 'Unknown')} (ID: {test_account.get('id')})"
        )
        
        # Step 4: Create Transfer Request via /api/transfer-request
        print("\n🔄 STEP 4: Creating Transfer Request via /api/transfer-request...")
        
        # Create transfer request via POST /api/transfer-request (using query parameters)
        account_id = test_account.get('id')
        amount = 1000  # Use smaller amount to avoid insufficient balance error
        
        success, transfer_request_response = self.run_test(
            "POST /api/transfer-request - Create Transfer Request",
            "POST",
            f"transfer-request?account_id={account_id}&amount={amount}",
            200
        )
        
        if not success:
            self.log_test(
                "Transfer Request Creation Failed",
                False,
                "Failed to create transfer request via /api/transfer-request"
            )
            return False
        
        transfer_request_id = transfer_request_response.get('transfer_id') or transfer_request_response.get('id')
        self.log_test(
            "Transfer Request Created",
            True,
            f"Created transfer request: {transfer_request_id}"
        )
        
        # Step 5: Check Notifications After Transfer Request Creation
        print("\n📬 STEP 5: Checking Notifications After Transfer Request Creation...")
        
        # Wait for notifications to be created
        time.sleep(3)
        
        success, notifications_after = self.run_test(
            "GET /api/admin/notifications - After Transfer Request",
            "GET",
            "admin/notifications",
            200,
            use_admin_token=True
        )
        
        transfer_notifications_after = []
        new_transfer_notifications = []
        
        if success and isinstance(notifications_after, list):
            for notification in notifications_after:
                if notification.get('type') == 'transfer_request':
                    transfer_notifications_after.append(notification)
                    
                    # Check if this is a new notification
                    is_new = True
                    for old_notification in transfer_notifications_before:
                        if old_notification.get('id') == notification.get('id'):
                            is_new = False
                            break
                    
                    if is_new:
                        new_transfer_notifications.append(notification)
        
        self.log_test(
            "Notifications After Transfer Request",
            True,
            f"Total notifications: {len(notifications_after) if notifications_after else 0}, Transfer notifications: {len(transfer_notifications_after)}, New transfer notifications: {len(new_transfer_notifications)}"
        )
        
        # Step 6: Analyze New Transfer Notifications
        print("\n🔍 STEP 6: Analyzing New Transfer Notifications...")
        
        if len(new_transfer_notifications) == 0:
            self.log_test(
                "No New Transfer Notifications",
                False,
                "No new transfer notifications were created - this indicates a problem with /api/transfer-request"
            )
            return False
        
        # Check for duplicates
        duplicate_groups = {}
        for notification in new_transfer_notifications:
            key = f"{notification.get('title', '')}_{notification.get('message', '')}_{notification.get('reference_id', '')}"
            
            if key not in duplicate_groups:
                duplicate_groups[key] = []
            duplicate_groups[key].append(notification)
        
        # Analyze duplicates
        total_duplicates = 0
        for key, notifications in duplicate_groups.items():
            if len(notifications) > 1:
                total_duplicates += len(notifications) - 1
                self.log_test(
                    f"DUPLICATE FOUND - Group: {key[:50]}...",
                    False,
                    f"Found {len(notifications)} identical notifications"
                )
                
                # Log each duplicate
                for i, notification in enumerate(notifications):
                    self.log_test(
                        f"Duplicate {i+1}",
                        True,
                        f"ID: {notification.get('id')}, Title: {notification.get('title')}, Message: {notification.get('message')[:100]}..."
                    )
            else:
                self.log_test(
                    f"Unique Notification - {notifications[0].get('title', 'Unknown')}",
                    True,
                    f"Single notification found (no duplicates)"
                )
        
        # Step 7: Check Notification Count vs Admin Count
        print("\n🎯 STEP 7: Checking Notification Count vs Admin Count...")
        
        expected_notifications = admin_count
        actual_notifications = len(new_transfer_notifications)
        
        if actual_notifications == expected_notifications:
            self.log_test(
                "Notification Count Analysis",
                True,
                f"✅ EXPECTED BEHAVIOR: {actual_notifications} notifications created for {admin_count} admins (1 per admin)"
            )
        elif actual_notifications == expected_notifications * 3:
            self.log_test(
                "Notification Count Analysis - TRIPLE ISSUE",
                False,
                f"❌ TRIPLE NOTIFICATION BUG: {actual_notifications} notifications created for {admin_count} admins (3x expected)"
            )
        else:
            self.log_test(
                "Notification Count Analysis - UNEXPECTED",
                False,
                f"❌ UNEXPECTED BEHAVIOR: {actual_notifications} notifications created for {admin_count} admins (expected {expected_notifications})"
            )
        
        # Step 8: Detailed Analysis of Each Notification
        print("\n📋 STEP 8: Detailed Analysis of Each New Notification...")
        
        for i, notification in enumerate(new_transfer_notifications):
            self.log_test(
                f"Notification {i+1} Details",
                True,
                f"ID: {notification.get('id')}, Type: {notification.get('type')}, Title: {notification.get('title')}, Reference ID: {notification.get('reference_id')}, Created: {notification.get('created_at')}"
            )
        
        # Final Summary
        self.log_test(
            "TRANSFER REQUEST INVESTIGATION SUMMARY",
            True,
            f"""
            /api/transfer-request NOTIFICATION INVESTIGATION RESULTS:
            
            1. ADMIN USERS COUNT: {admin_count} admin users found
            2. EXPECTED NOTIFICATIONS: {admin_count} (1 per admin)
            3. ACTUAL NOTIFICATIONS CREATED: {len(new_transfer_notifications)}
            4. DUPLICATE GROUPS FOUND: {len([g for g in duplicate_groups.values() if len(g) > 1])}
            5. TOTAL DUPLICATES: {total_duplicates}
            
            CONCLUSION:
            - /api/transfer-request endpoint behavior: {'CORRECT' if actual_notifications == admin_count else 'PROBLEMATIC'}
            - Duplicate issue: {'CONFIRMED' if total_duplicates > 0 else 'NOT FOUND'}
            """
        )
        
        return True

    def run_investigation(self):
        """Run the transfer request investigation"""
        print("🚀 Starting /api/transfer-request Notification Investigation...")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")
        print("=" * 80)
        
        # Authentication
        if not self.test_admin_login():
            print("❌ Admin login failed. Cannot proceed.")
            return
        
        if not self.test_user_login():
            print("❌ User login failed. Cannot proceed.")
            return
        
        # Run the investigation
        self.test_transfer_request_notifications()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 INVESTIGATION SUMMARY")
        print("=" * 80)
        print(f"📝 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")

if __name__ == "__main__":
    tester = TransferRequestTester()
    tester.run_investigation()