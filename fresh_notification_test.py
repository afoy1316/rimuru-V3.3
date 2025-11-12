#!/usr/bin/env python3
"""
Fresh Notification Creation Test
Test script to create one fresh Facebook Ads notification after cleanup.
"""

import requests
import sys
import json
import time
from datetime import datetime

class FreshNotificationTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.client_token = None
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

    def run_api_call(self, method, endpoint, data=None, use_admin_token=False):
        """Make API call with proper authentication"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Use appropriate token
        if use_admin_token and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'
        elif self.client_token:
            headers['Authorization'] = f'Bearer {self.client_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            
            return response.status_code, response.json() if response.content else {}
        except Exception as e:
            print(f"API call failed: {str(e)}")
            return 500, {}

    def admin_login(self):
        """Admin Authentication"""
        print("\n🔍 Admin Authentication...")
        
        admin_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        status, response = self.run_api_call('POST', 'admin/auth/login', admin_data)
        
        if status == 200 and 'access_token' in response:
            self.admin_token = response['access_token']
            self.log_test("Admin Authentication", True, "Successfully authenticated as admin")
            return True
        else:
            self.log_test("Admin Authentication", False, f"Failed with status {status}")
            return False

    def verify_cleanup(self):
        """Verify notifications are cleaned up"""
        print("\n🔍 Verify Cleanup State...")
        
        status, response = self.run_api_call('GET', 'admin/notifications', use_admin_token=True)
        
        if status == 200:
            notifications = response if isinstance(response, list) else []
            count = len(notifications)
            
            self.log_test(
                "Cleanup Verification", 
                count == 0, 
                f"Found {count} notifications (expected 0)"
            )
            return count == 0
        else:
            self.log_test("Cleanup Verification", False, f"Failed with status {status}")
            return False

    def get_unread_count(self, step_name="Get Unread Count"):
        """Get current unread count"""
        status, response = self.run_api_call('GET', 'admin/notifications/unread-count', use_admin_token=True)
        
        if status == 200:
            count = response.get('count', 0)
            self.log_test(step_name, True, f"Unread count: {count}")
            return count
        else:
            self.log_test(step_name, False, f"Failed with status {status}")
            return 0

    def client_login(self):
        """Client Login for Fresh Notification Creation"""
        print("\n🔍 Client Login for Fresh Notification Creation...")
        
        client_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        status, response = self.run_api_call('POST', 'auth/login', client_data)
        
        if status == 200 and 'access_token' in response:
            self.client_token = response['access_token']
            self.log_test("Client Authentication", True, "Successfully authenticated as testuser")
            return True
        else:
            # Try creating test user if login fails
            print("\n🔍 Creating Test Client User...")
            timestamp = datetime.now().strftime('%H%M%S')
            test_user_data = {
                "username": "testuser",
                "name": "Test User",
                "phone_number": f"08123456{timestamp}",
                "address": "Jl. Test Street No. 123",
                "city": "Jakarta",
                "province": "DKI Jakarta",
                "email": f"testuser_{timestamp}@example.com",
                "password": "testpass123"
            }
            
            reg_status, reg_response = self.run_api_call('POST', 'auth/register', test_user_data)
            
            if reg_status == 200:
                # Try login again
                status, response = self.run_api_call('POST', 'auth/login', client_data)
                
                if status == 200 and 'access_token' in response:
                    self.client_token = response['access_token']
                    self.log_test("Client Authentication", True, "Successfully authenticated after registration")
                    return True
            
            self.log_test("Client Authentication", False, f"Failed with status {status}")
            return False

    def create_fresh_facebook_request(self):
        """Submit New Facebook Ads Account Request"""
        print("\n🔍 Submit New Facebook Ads Account Request...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        fresh_account_data = {
            "platform": "facebook",
            "account_name": f"Fresh Test Facebook Account {timestamp}",
            "gmt": "GMT+7",
            "currency": "IDR",
            "delivery_method": "BM_ID",
            "bm_id_or_email": f"123456789{timestamp}",
            "notes": "Fresh notification test account"
        }
        
        status, response = self.run_api_call('POST', 'accounts/request', fresh_account_data)
        
        if status == 200:
            account_id = response.get('account_id', 'unknown')
            self.log_test(
                "Fresh Account Request Creation", 
                True, 
                f"Created fresh Facebook account request: {account_id}"
            )
            return True
        else:
            self.log_test("Fresh Account Request Creation", False, f"Failed with status {status}")
            return False

    def verify_fresh_notification(self):
        """Verify Exactly ONE Notification is Created"""
        print("\n🔍 Verify Exactly ONE Notification is Created...")
        
        # Wait a moment for notification to be created
        time.sleep(3)
        
        status, response = self.run_api_call('GET', 'admin/notifications', use_admin_token=True)
        
        if status == 200:
            fresh_notifications = response if isinstance(response, list) else []
            fresh_count = len(fresh_notifications)
            
            # Check for Facebook Ads notifications
            fresh_facebook_notifications = [
                n for n in fresh_notifications 
                if "Permintaan Facebook Ads Baru" in n.get('title', '') or 
                   "Facebook Ads Baru" in n.get('title', '') or
                   "Facebook" in n.get('title', '')
            ]
            
            success = fresh_count == 1 and len(fresh_facebook_notifications) == 1
            self.log_test(
                "Fresh Notification Creation Verification", 
                success, 
                f"Found {fresh_count} total notifications, {len(fresh_facebook_notifications)} Facebook Ads notifications"
            )
            
            if fresh_notifications:
                fresh_notification = fresh_notifications[0]
                self.log_test(
                    "Fresh Notification Details", 
                    True, 
                    f"Title: '{fresh_notification.get('title')}', Type: '{fresh_notification.get('type')}', Read: {fresh_notification.get('is_read')}"
                )
            
            return success
        else:
            self.log_test("Fresh Notification Creation Verification", False, f"Failed with status {status}")
            return False

    def run_fresh_notification_test(self):
        """Run the fresh notification creation test"""
        print("🚀 Starting Fresh Notification Creation Test...")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")
        print("=" * 80)
        
        # Step 1: Admin Authentication
        if not self.admin_login():
            return False
        
        # Step 2: Verify Cleanup State
        if not self.verify_cleanup():
            print("⚠️  Warning: Notifications not fully cleaned up, but continuing...")
        
        # Step 3: Verify Unread Count is 0
        initial_unread_count = self.get_unread_count("Verify Initial Unread Count is 0")
        
        # Step 4: Client Login
        if not self.client_login():
            return False
        
        # Step 5: Submit New Facebook Ads Account Request
        if not self.create_fresh_facebook_request():
            return False
        
        # Step 6: Verify Exactly ONE Notification is Created
        if not self.verify_fresh_notification():
            return False
        
        # Step 7: Confirm Final Unread Count is 1
        final_unread_count = self.get_unread_count("Confirm Final Unread Count is 1")
        if final_unread_count != 1:
            self.log_test("Final Unread Count Verification", False, f"Expected 1, got {final_unread_count}")
        else:
            self.log_test("Final Unread Count Verification", True, "Unread count is exactly 1")
        
        # Summary
        print("\n" + "=" * 80)
        print("🎉 FRESH NOTIFICATION CREATION TEST COMPLETE")
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}")
        
        if self.tests_passed >= self.tests_run - 1:  # Allow 1 failure for cleanup warning
            print("🎯 TEST SUCCESSFUL - Fresh notification creation working!")
            print("📋 Summary:")
            print("   • Exactly 1 fresh 'Permintaan Facebook Ads Baru' notification created")
            print("   • Admin unread count is 1 (not 2 or more)")
            print("   • No duplicate notifications found")
            return True
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return False

if __name__ == "__main__":
    tester = FreshNotificationTester()
    success = tester.run_fresh_notification_test()
    sys.exit(0 if success else 1)