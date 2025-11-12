#!/usr/bin/env python3
"""
Notification Cleanup and Fresh Creation Test
Test script for the specific review request to clean up duplicate notifications
and create one fresh test notification.
"""

import requests
import sys
import json
import time
from datetime import datetime

class NotificationCleanupTester:
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
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            return response.status_code, response.json() if response.content else {}
        except Exception as e:
            print(f"API call failed: {str(e)}")
            return 500, {}

    def admin_login(self):
        """Step 1: Admin Authentication"""
        print("\n🔍 Step 1: Admin Authentication...")
        
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

    def get_current_notifications(self):
        """Step 2: Get Current Admin Notifications"""
        print("\n🔍 Step 2: Get Current Admin Notifications...")
        
        status, response = self.run_api_call('GET', 'admin/notifications', use_admin_token=True)
        
        if status == 200:
            notifications = response if isinstance(response, list) else []
            facebook_ads_notifications = [
                n for n in notifications 
                if "Permintaan Facebook Ads Baru" in n.get('title', '') or 
                   "Facebook Ads Baru" in n.get('title', '')
            ]
            
            self.log_test(
                "Get Current Notifications", 
                True, 
                f"Found {len(notifications)} total notifications, {len(facebook_ads_notifications)} Facebook Ads notifications"
            )
            return notifications
        else:
            self.log_test("Get Current Notifications", False, f"Failed with status {status}")
            return []

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

    def cleanup_all_notifications(self, notifications):
        """Step 4: Clean Up ALL Existing Notifications"""
        print("\n🔍 Step 4: Clean Up ALL Existing Notifications...")
        
        deleted_count = 0
        failed_deletions = 0
        
        for notification in notifications:
            notification_id = notification.get('id')
            if notification_id:
                status, response = self.run_api_call('DELETE', f'admin/notifications/{notification_id}', use_admin_token=True)
                
                if status == 200:
                    deleted_count += 1
                else:
                    failed_deletions += 1
        
        success = failed_deletions == 0
        self.log_test(
            "Notification Cleanup", 
            success, 
            f"Deleted {deleted_count} notifications, {failed_deletions} failed deletions"
        )
        
        return success

    def verify_cleanup(self):
        """Step 5: Verify Cleanup - Check Notifications are Deleted"""
        print("\n🔍 Step 5: Verify Cleanup - Check Notifications are Deleted...")
        
        status, response = self.run_api_call('GET', 'admin/notifications', use_admin_token=True)
        
        if status == 200:
            remaining_notifications = response if isinstance(response, list) else []
            remaining_count = len(remaining_notifications)
            
            success = remaining_count == 0
            self.log_test(
                "Cleanup Verification", 
                success, 
                f"Remaining notifications after cleanup: {remaining_count}"
            )
            return success
        else:
            self.log_test("Cleanup Verification", False, f"Failed with status {status}")
            return False

    def client_login(self):
        """Step 7: Client Login for Fresh Notification Creation"""
        print("\n🔍 Step 7: Client Login for Fresh Notification Creation...")
        
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
        """Step 8: Submit New Facebook Ads Account Request"""
        print("\n🔍 Step 8: Submit New Facebook Ads Account Request...")
        
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
        """Step 9: Verify Exactly ONE Notification is Created"""
        print("\n🔍 Step 9: Verify Exactly ONE Notification is Created...")
        
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
                   "Facebook Ads Baru" in n.get('title', '')
            ]
            
            success = fresh_count == 1 and len(fresh_facebook_notifications) == 1
            self.log_test(
                "Fresh Notification Creation Verification", 
                success, 
                f"Found {fresh_count} total notifications, {len(fresh_facebook_notifications)} Facebook Ads notifications"
            )
            
            if fresh_facebook_notifications:
                fresh_notification = fresh_facebook_notifications[0]
                self.log_test(
                    "Fresh Notification Details", 
                    True, 
                    f"Title: '{fresh_notification.get('title')}', Type: '{fresh_notification.get('type')}', Read: {fresh_notification.get('is_read')}"
                )
            
            return success
        else:
            self.log_test("Fresh Notification Creation Verification", False, f"Failed with status {status}")
            return False

    def run_cleanup_and_creation_test(self):
        """Run the complete notification cleanup and fresh creation test"""
        print("🚀 Starting Notification Cleanup and Fresh Creation Test...")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")
        print("=" * 80)
        
        # Step 1: Admin Authentication
        if not self.admin_login():
            return False
        
        # Step 2: Get Current Admin Notifications
        initial_notifications = self.get_current_notifications()
        
        # Step 3: Get Initial Unread Count
        initial_unread_count = self.get_unread_count("Step 3: Get Initial Unread Count")
        
        # Step 4: Clean Up ALL Existing Notifications
        if not self.cleanup_all_notifications(initial_notifications):
            return False
        
        # Step 5: Verify Cleanup - Check Notifications are Deleted
        if not self.verify_cleanup():
            return False
        
        # Step 6: Verify Unread Count is 0
        cleanup_unread_count = self.get_unread_count("Step 6: Verify Unread Count is 0")
        if cleanup_unread_count != 0:
            self.log_test("Cleanup Unread Count Verification", False, f"Expected 0, got {cleanup_unread_count}")
            return False
        
        # Step 7: Client Login for Fresh Notification Creation
        if not self.client_login():
            return False
        
        # Step 8: Submit New Facebook Ads Account Request
        if not self.create_fresh_facebook_request():
            return False
        
        # Step 9: Verify Exactly ONE Notification is Created
        if not self.verify_fresh_notification():
            return False
        
        # Step 10: Confirm Final Unread Count is 1
        final_unread_count = self.get_unread_count("Step 10: Confirm Final Unread Count is 1")
        if final_unread_count != 1:
            self.log_test("Final Unread Count Verification", False, f"Expected 1, got {final_unread_count}")
            return False
        
        # Summary
        print("\n" + "=" * 80)
        print("🎉 NOTIFICATION CLEANUP AND FRESH CREATION TEST COMPLETE")
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}")
        
        if self.tests_passed == self.tests_run:
            print("🎯 ALL TESTS PASSED - Notification cleanup and fresh creation successful!")
            print("📋 Summary:")
            print("   • All duplicate notifications cleaned up")
            print("   • Exactly 1 fresh 'Permintaan Facebook Ads Baru' notification created")
            print("   • Admin unread count is 1 (not 2 or more)")
            return True
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return False

if __name__ == "__main__":
    tester = NotificationCleanupTester()
    success = tester.run_cleanup_and_creation_test()
    sys.exit(0 if success else 1)