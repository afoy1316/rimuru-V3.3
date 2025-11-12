#!/usr/bin/env python3
"""
Focused test for duplicate notification investigation
"""
import requests
import sys
import json
from datetime import datetime
import time

class DuplicateNotificationTester:
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

    def investigate_duplicate_notifications(self):
        """Deep investigation of duplicate notification issue"""
        print("\n🔍 DEEP INVESTIGATION: Duplicate Transfer Notification Issue...")
        print("=" * 80)
        
        # Step 1: Admin Login for notification monitoring
        if not self.admin_token:
            if not self.test_admin_login():
                self.log_test(
                    "Admin Login for Investigation",
                    False,
                    "Admin access required for notification investigation"
                )
                return False
        
        # Step 2: Get initial notification count
        success, initial_notifications = self.run_test(
            "GET Initial Admin Notifications Count",
            "GET",
            "admin/notifications",
            200,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        initial_count = len(initial_notifications) if isinstance(initial_notifications, list) else 0
        self.log_test(
            "Initial Notification Count",
            True,
            f"Found {initial_count} existing admin notifications"
        )
        
        # Step 3: Check admin user count
        success, admin_users = self.run_test(
            "GET Admin Users Count",
            "GET",
            "admin/admins",
            200,
            use_admin_token=True
        )
        
        admin_count = len(admin_users) if isinstance(admin_users, list) else 0
        self.log_test(
            "Admin Users Count Verification",
            True,
            f"Found {admin_count} admin users in system"
        )
        
        # Step 4: User login for transfer creation
        if not self.token:
            if not self.test_user_login():
                self.log_test(
                    "User Login for Investigation",
                    False,
                    "User access required for transfer creation"
                )
                return False
        
        # Step 5: Get user accounts for transfer
        success, accounts = self.run_test(
            "GET User Accounts for Transfer",
            "GET",
            "accounts",
            200
        )
        
        if not success or not accounts:
            self.log_test(
                "Transfer Test Setup",
                False,
                "No accounts available for transfer test"
            )
            return False
        
        # Find suitable account
        test_account = None
        for account in accounts:
            if account.get('id') and account.get('platform'):
                test_account = account
                break
        
        if not test_account:
            self.log_test(
                "Transfer Test Setup",
                False,
                "No suitable account found for transfer test"
            )
            return False
        
        self.log_test(
            "Test Account Selected",
            True,
            f"Using account: {test_account.get('account_name')} (ID: {test_account.get('id')})"
        )
        
        # Step 5.5: Check user wallet balance first
        success, user_profile = self.run_test(
            "GET User Profile for Wallet Balance",
            "GET",
            "auth/me",
            200
        )
        
        wallet_balance = 0
        if success:
            wallet_balance = user_profile.get('wallet_balance_idr', 0)
            self.log_test(
                "User Wallet Balance Check",
                True,
                f"User has IDR wallet balance: {wallet_balance}"
            )
        
        # Use a small amount or 5% of wallet balance, whichever is smaller
        transfer_amount = min(500, wallet_balance * 0.05) if wallet_balance > 0 else 500
        
        # Step 6: Create transfer request and monitor notifications
        transfer_data = {
            "from_type": "wallet",
            "to_type": "account",
            "account_id": test_account.get('id'),
            "amount": transfer_amount
        }
        
        # Record exact timestamp before transfer
        before_transfer_time = time.time()
        
        success, transfer_response = self.run_test(
            "POST /api/balance-transfer - Monitor Notifications",
            "POST",
            "balance-transfer",
            200,
            data=transfer_data
        )
        
        after_transfer_time = time.time()
        
        if not success:
            self.log_test(
                "Transfer Creation Failed",
                False,
                "Failed to create transfer for notification testing"
            )
            return False
        
        # Step 7: Wait a moment for notifications to be created
        time.sleep(2)
        
        # Step 8: Check notifications immediately after transfer
        success, post_transfer_notifications = self.run_test(
            "GET Admin Notifications After Transfer",
            "GET",
            "admin/notifications",
            200,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        post_count = len(post_transfer_notifications) if isinstance(post_transfer_notifications, list) else 0
        new_notifications_count = post_count - initial_count
        
        self.log_test(
            "Notification Count After Transfer",
            True,
            f"Total notifications: {post_count}, New notifications: {new_notifications_count}"
        )
        
        # Step 9: Analyze new notifications for transfer-related ones
        transfer_notifications = []
        if isinstance(post_transfer_notifications, list):
            # Get the most recent notifications (likely the new ones)
            recent_notifications = post_transfer_notifications[-new_notifications_count:] if new_notifications_count > 0 else []
            
            for notification in recent_notifications:
                notification_type = notification.get('type', '')
                title = notification.get('title', '')
                message = notification.get('message', '')
                reference_id = notification.get('reference_id', '')
                created_at = notification.get('created_at', '')
                
                # Check if this is a transfer-related notification
                if ('transfer' in notification_type.lower() or 
                    'transfer' in title.lower() or 
                    'transfer' in message.lower()):
                    transfer_notifications.append({
                        'id': notification.get('id'),
                        'type': notification_type,
                        'title': title,
                        'message': message,
                        'reference_id': reference_id,
                        'created_at': created_at
                    })
                    
                    self.log_test(
                        f"Transfer Notification Found",
                        True,
                        f"Type: {notification_type}, Title: {title}, Ref: {reference_id}"
                    )
        
        # Step 10: Check for exact duplicates
        duplicate_groups = {}
        for notification in transfer_notifications:
            # Create a key based on content that should be unique
            key = f"{notification['type']}|{notification['title']}|{notification['reference_id']}"
            if key not in duplicate_groups:
                duplicate_groups[key] = []
            duplicate_groups[key].append(notification)
        
        # Step 11: Report findings
        total_transfer_notifications = len(transfer_notifications)
        duplicate_count = 0
        
        for key, group in duplicate_groups.items():
            if len(group) > 1:
                duplicate_count += len(group) - 1  # Count extras as duplicates
                self.log_test(
                    f"DUPLICATE FOUND - {key}",
                    False,
                    f"Found {len(group)} identical notifications: {[n['id'] for n in group]}"
                )
                
                # Detailed analysis of each duplicate
                for i, notification in enumerate(group):
                    self.log_test(
                        f"Duplicate #{i+1} Details",
                        True,
                        f"ID: {notification['id']}, Created: {notification['created_at']}"
                    )
        
        # Step 12: Summary and root cause analysis
        expected_notifications = admin_count  # Should be 1 notification per admin
        
        if total_transfer_notifications == expected_notifications:
            self.log_test(
                "NOTIFICATION SYSTEM STATUS",
                True,
                f"✅ WORKING CORRECTLY: {total_transfer_notifications} notifications for {admin_count} admins (1 per admin)"
            )
        elif total_transfer_notifications > expected_notifications:
            self.log_test(
                "NOTIFICATION SYSTEM STATUS",
                False,
                f"❌ DUPLICATE ISSUE CONFIRMED: {total_transfer_notifications} notifications for {admin_count} admins (should be {expected_notifications})"
            )
            
            # Analyze the pattern
            if total_transfer_notifications == admin_count * 3:
                self.log_test(
                    "ROOT CAUSE ANALYSIS",
                    False,
                    "❌ TRIPLE NOTIFICATION BUG: Each admin getting 3 notifications instead of 1"
                )
            elif duplicate_count > 0:
                self.log_test(
                    "ROOT CAUSE ANALYSIS",
                    False,
                    f"❌ DUPLICATE CONTENT: {duplicate_count} duplicate notifications with identical content"
                )
        else:
            self.log_test(
                "NOTIFICATION SYSTEM STATUS",
                False,
                f"❌ MISSING NOTIFICATIONS: Only {total_transfer_notifications} notifications for {admin_count} admins"
            )
        
        # Step 13: Check for race conditions by timing
        transfer_duration = after_transfer_time - before_transfer_time
        self.log_test(
            "Race Condition Analysis",
            True,
            f"Transfer API call took {transfer_duration:.3f} seconds"
        )
        
        # Step 14: Check notification timestamps for simultaneity
        if len(transfer_notifications) > 1:
            timestamps = [n['created_at'] for n in transfer_notifications]
            unique_timestamps = set(timestamps)
            
            if len(unique_timestamps) == 1:
                self.log_test(
                    "Timestamp Analysis",
                    False,
                    f"❌ ALL NOTIFICATIONS HAVE IDENTICAL TIMESTAMP: {list(unique_timestamps)[0]} - Indicates simultaneous creation"
                )
            else:
                self.log_test(
                    "Timestamp Analysis",
                    True,
                    f"✅ Different timestamps found: {len(unique_timestamps)} unique timestamps"
                )
        
        # Step 15: Check backend logs for more insights
        self.log_test(
            "Backend Log Analysis Recommendation",
            True,
            "Check backend logs at /var/log/supervisor/backend.*.log for notification creation patterns"
        )
        
        # Step 16: Final investigation summary
        investigation_summary = f"""
        DUPLICATE NOTIFICATION INVESTIGATION RESULTS:
        ============================================
        - Admin users in system: {admin_count}
        - Expected notifications per transfer: {admin_count}
        - Actual notifications created: {total_transfer_notifications}
        - Duplicate notifications found: {duplicate_count}
        - Transfer API response time: {transfer_duration:.3f}s
        
        CONCLUSION: {'ISSUE CONFIRMED' if total_transfer_notifications != expected_notifications else 'WORKING CORRECTLY'}
        
        RECOMMENDATIONS:
        1. Check /api/balance-transfer endpoint for multiple notification creation calls
        2. Verify admin user loop is not running multiple times
        3. Check for database transaction issues causing duplicate inserts
        4. Look for race conditions in notification creation logic
        """
        
        self.log_test(
            "INVESTIGATION SUMMARY",
            total_transfer_notifications == expected_notifications,
            investigation_summary
        )
        
        return total_transfer_notifications == expected_notifications

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 DUPLICATE NOTIFICATION INVESTIGATION SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.tests_run - self.tests_passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test_name']}: {result['details']}")
        
        print("\n✅ Investigation completed!")

if __name__ == "__main__":
    tester = DuplicateNotificationTester()
    tester.investigate_duplicate_notifications()
    tester.print_summary()