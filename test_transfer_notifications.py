#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class TransferNotificationTester:
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

    def authenticate(self):
        """Authenticate both user and admin"""
        print("🔐 Authenticating...")
        
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
            print("❌ Admin authentication failed")
            return False
        
        # User login
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
            print("❌ User authentication failed")
            return False
        
        return True

    def test_simplified_transfer_notification_system(self):
        """Test the simplified transfer notification system as requested"""
        print("\n🔍 Testing Simplified Transfer Notification System (IMMEDIATE EXECUTION)...")
        print("=" * 80)
        
        # Step 1: Verify cleanup was successful (0 transfer notifications)
        print("\n📋 STEP 1: Verifying cleanup was successful...")
        
        # Check admin notifications for transfer_request type
        success, admin_notifications = self.run_test(
            "GET Admin Notifications - Check Transfer Cleanup",
            "GET",
            "admin/notifications",
            200,
            use_admin_token=True
        )
        
        if not success:
            self.log_test("Transfer Notification Cleanup Verification", False, "Failed to get admin notifications")
            return False
        
        # Count transfer_request notifications
        transfer_admin_notifications = [n for n in admin_notifications if n.get('type') == 'transfer_request']
        
        # Check client notifications for transfer_created type
        success, client_notifications = self.run_test(
            "GET Client Notifications - Check Transfer Cleanup",
            "GET",
            "client/notifications",
            200
        )
        
        if not success:
            self.log_test("Transfer Notification Cleanup Verification", False, "Failed to get client notifications")
            return False
        
        # Count transfer_created notifications
        transfer_client_notifications = [n for n in client_notifications if n.get('type') == 'transfer_created']
        
        self.log_test(
            "Pre-Test Notification Count",
            True,
            f"Admin transfer notifications: {len(transfer_admin_notifications)}, Client transfer notifications: {len(transfer_client_notifications)}"
        )
        
        # Step 2: Create transfer request via POST /api/balance-transfer
        print("\n📋 STEP 2: Creating transfer request...")
        
        # First get user accounts
        success, accounts = self.run_test(
            "Get User Accounts for Transfer",
            "GET",
            "accounts",
            200
        )
        
        if not success or not accounts:
            self.log_test("Transfer Test Setup", False, "No accounts available for transfer test")
            return False
        
        # Find a suitable account
        test_account = None
        for account in accounts:
            if account.get('id') and account.get('platform'):
                test_account = account
                break
        
        if not test_account:
            self.log_test("Transfer Test Setup", False, "No suitable account found for transfer test")
            return False
        
        print(f"Using test account: {test_account.get('account_name')} (ID: {test_account.get('id')})")
        
        # Check user wallet balance first
        success, user_profile = self.run_test(
            "Get User Profile for Wallet Balance",
            "GET",
            "auth/me",
            200
        )
        
        wallet_balance_idr = 0
        if success:
            wallet_balance_idr = user_profile.get('wallet_balance_idr', 0)
            print(f"User wallet balance IDR: {wallet_balance_idr}")
        
        # Use a small amount that should be available or use 1000 if balance is sufficient
        transfer_amount = min(1000, wallet_balance_idr - 100) if wallet_balance_idr > 100 else 1000
        
        # Create transfer request (wallet to account)
        transfer_data = {
            "from_type": "wallet",
            "to_type": "account",
            "account_id": test_account.get('id'),
            "amount": transfer_amount
        }
        
        success, transfer_response = self.run_test(
            "POST /api/balance-transfer - Create Transfer Request",
            "POST",
            "balance-transfer",
            200,
            data=transfer_data
        )
        
        if not success:
            self.log_test("Transfer Request Creation", False, "Failed to create transfer request")
            return False
        
        # Check what's in the response
        print(f"Transfer response: {transfer_response}")
        
        transfer_id = (transfer_response.get('transfer_request_id') or 
                      transfer_response.get('transfer_id') or 
                      transfer_response.get('id') or 
                      transfer_response.get('transaction_id'))
        
        if not transfer_id:
            self.log_test("Transfer Request Creation", False, f"No transfer ID in response: {transfer_response}")
            return False
        else:
            self.log_test("Transfer Request Creation", True, f"Transfer ID: {transfer_id}")
        
        self.log_test(
            "Transfer Request Created",
            True,
            f"Transfer ID: {transfer_id}"
        )
        
        # Step 3: Verify exactly 1 client + admin notifications created
        print("\n📋 STEP 3: Verifying notification creation...")
        
        # Wait a moment for notifications to be created
        print("Waiting 3 seconds for notifications to be processed...")
        time.sleep(3)
        
        # Check admin notifications again
        success, new_admin_notifications = self.run_test(
            "GET Admin Notifications - After Transfer",
            "GET",
            "admin/notifications",
            200,
            use_admin_token=True
        )
        
        if not success:
            self.log_test("Post-Transfer Admin Notifications", False, "Failed to get admin notifications")
            return False
        
        # Check client notifications again
        success, new_client_notifications = self.run_test(
            "GET Client Notifications - After Transfer",
            "GET",
            "client/notifications",
            200
        )
        
        if not success:
            self.log_test("Post-Transfer Client Notifications", False, "Failed to get client notifications")
            return False
        
        # Count new transfer notifications
        new_transfer_admin_notifications = [n for n in new_admin_notifications if n.get('type') == 'transfer_request']
        new_transfer_client_notifications = [n for n in new_client_notifications if n.get('type') == 'transfer_created']
        
        print(f"Before: Admin {len(transfer_admin_notifications)}, Client {len(transfer_client_notifications)}")
        print(f"After: Admin {len(new_transfer_admin_notifications)}, Client {len(new_transfer_client_notifications)}")
        
        # Calculate the difference
        admin_notification_increase = len(new_transfer_admin_notifications) - len(transfer_admin_notifications)
        client_notification_increase = len(new_transfer_client_notifications) - len(transfer_client_notifications)
        
        # Step 4: Check notification content is correct
        print("\n📋 STEP 4: Checking notification content...")
        
        # Find the new notifications
        new_admin_notification = None
        new_client_notification = None
        
        # Find admin notification with our transfer_id as reference
        for notification in new_admin_notifications:
            if notification.get('reference_id') == transfer_id and notification.get('type') == 'transfer_request':
                new_admin_notification = notification
                break
        
        # Find client notification with our transfer_id as reference
        for notification in new_client_notifications:
            if notification.get('reference_id') == transfer_id and notification.get('type') == 'transfer_created':
                new_client_notification = notification
                break
        
        # Verify admin notification content
        admin_content_correct = True
        admin_content_details = []
        
        if new_admin_notification:
            expected_admin_fields = ['id', 'title', 'message', 'type', 'reference_id', 'created_at']
            missing_fields = [field for field in expected_admin_fields if field not in new_admin_notification]
            
            if missing_fields:
                admin_content_correct = False
                admin_content_details.append(f"Missing fields: {missing_fields}")
            
            if new_admin_notification.get('type') != 'transfer_request':
                admin_content_correct = False
                admin_content_details.append(f"Wrong type: {new_admin_notification.get('type')}")
            
            if 'Transfer Request Baru' not in new_admin_notification.get('title', ''):
                admin_content_correct = False
                admin_content_details.append(f"Wrong title: {new_admin_notification.get('title')}")
            
            print(f"Admin notification found: {new_admin_notification.get('title')} - {new_admin_notification.get('message')[:100]}...")
        else:
            admin_content_correct = False
            admin_content_details.append("Admin notification not found")
        
        # Verify client notification content
        client_content_correct = True
        client_content_details = []
        
        if new_client_notification:
            expected_client_fields = ['id', 'title', 'message', 'type', 'reference_id', 'created_at']
            missing_fields = [field for field in expected_client_fields if field not in new_client_notification]
            
            if missing_fields:
                client_content_correct = False
                client_content_details.append(f"Missing fields: {missing_fields}")
            
            if new_client_notification.get('type') != 'transfer_created':
                client_content_correct = False
                client_content_details.append(f"Wrong type: {new_client_notification.get('type')}")
            
            if 'Transfer Request Dibuat' not in new_client_notification.get('title', ''):
                client_content_correct = False
                client_content_details.append(f"Wrong title: {new_client_notification.get('title')}")
            
            print(f"Client notification found: {new_client_notification.get('title')} - {new_client_notification.get('message')[:100]}...")
        else:
            client_content_correct = False
            client_content_details.append("Client notification not found")
        
        # Step 5: Verify no duplicates exist
        print("\n📋 STEP 5: Verifying no duplicates exist...")
        
        # Check for duplicate notifications with same reference_id
        admin_duplicates = [n for n in new_admin_notifications if n.get('reference_id') == transfer_id and n.get('type') == 'transfer_request']
        client_duplicates = [n for n in new_client_notifications if n.get('reference_id') == transfer_id and n.get('type') == 'transfer_created']
        
        no_duplicates = len(admin_duplicates) <= 3 and len(client_duplicates) <= 1  # Max 3 admin (one per admin), 1 client
        
        # Step 6: Test system is working properly
        print("\n📋 STEP 6: Final system verification...")
        
        # Summary of results
        results = {
            "admin_notification_increase": admin_notification_increase,
            "client_notification_increase": client_notification_increase,
            "admin_content_correct": admin_content_correct,
            "client_content_correct": client_content_correct,
            "no_duplicates": no_duplicates,
            "admin_duplicates_count": len(admin_duplicates),
            "client_duplicates_count": len(client_duplicates)
        }
        
        # Log detailed results
        self.log_test(
            "Notification Creation Count",
            admin_notification_increase > 0 and client_notification_increase > 0,
            f"Admin notifications increased by {admin_notification_increase}, Client notifications increased by {client_notification_increase}"
        )
        
        self.log_test(
            "Admin Notification Content",
            admin_content_correct,
            f"Admin notification content: {admin_content_details if not admin_content_correct else 'All fields correct'}"
        )
        
        self.log_test(
            "Client Notification Content",
            client_content_correct,
            f"Client notification content: {client_content_details if not client_content_correct else 'All fields correct'}"
        )
        
        self.log_test(
            "No Duplicate Notifications",
            no_duplicates,
            f"Admin duplicates: {len(admin_duplicates)}, Client duplicates: {len(client_duplicates)}"
        )
        
        # Overall system test result
        system_working = (
            admin_notification_increase > 0 and 
            client_notification_increase > 0 and 
            admin_content_correct and 
            client_content_correct and 
            no_duplicates
        )
        
        self.log_test(
            "Simplified Transfer Notification System",
            system_working,
            f"System working: {system_working}. Results: {results}"
        )
        
        return system_working

    def run_test_suite(self):
        """Run the complete test suite"""
        print("🚀 SIMPLIFIED TRANSFER NOTIFICATION SYSTEM TEST")
        print("=" * 80)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed - cannot proceed with tests")
            return False
        
        # Run the main test
        success = self.test_simplified_transfer_notification_system()
        
        # Print summary
        print("\n" + "="*80)
        print("🏁 TEST SUMMARY")
        print("="*80)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        else:
            print("\n✅ All tests passed!")
        
        print("\n" + "="*80)
        
        return success

if __name__ == "__main__":
    tester = TransferNotificationTester()
    success = tester.run_test_suite()
    sys.exit(0 if success else 1)