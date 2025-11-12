import requests
import sys
import json
import jwt
import base64
import io
import time
import os
from datetime import datetime, timezone, timedelta
from PIL import Image

class WalletTopUpProofNotificationTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.client_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test credentials
        self.client_username = "testuser"
        self.client_password = "testpass123"
        self.admin_username = "admin"
        self.admin_password = "admin123"
        
        # Test data
        self.wallet_topup_request_id = None
        self.notification_id = None

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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_token=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {}
        
        # Use specified token
        if use_token:
            test_headers['Authorization'] = f'Bearer {use_token}'
        
        # Only add Content-Type for JSON requests
        if not files and data:
            test_headers['Content-Type'] = 'application/json'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=test_headers, timeout=10)
                else:
                    response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            # Handle both single status code and list of acceptable status codes
            if isinstance(expected_status, list):
                success = response.status_code in expected_status
                details = f"Status: {response.status_code}, Expected: {expected_status}"
            else:
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

    def run_test_form(self, name, method, endpoint, expected_status, data=None, headers=None, use_token=None):
        """Run a single API test with form data"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {}
        
        # Use specified token
        if use_token:
            test_headers['Authorization'] = f'Bearer {use_token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'POST':
                response = requests.post(url, data=data, headers=test_headers, timeout=10)
            else:
                raise ValueError(f"Form data method {method} not supported")

            # Handle both single status code and list of acceptable status codes
            if isinstance(expected_status, list):
                success = response.status_code in expected_status
                details = f"Status: {response.status_code}, Expected: {expected_status}"
            else:
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

    def test_client_authentication(self):
        """Test client authentication"""
        print("\n🔍 Testing Client Authentication...")
        
        client_login_data = {
            "username": self.client_username,
            "password": self.client_password
        }
        
        success, response = self.run_test(
            "Client Login",
            "POST",
            "auth/login",
            200,
            data=client_login_data
        )
        
        if success and 'access_token' in response:
            self.client_token = response['access_token']
            return True
        else:
            return False

    def test_admin_authentication(self):
        """Test admin authentication"""
        print("\n🔍 Testing Admin Authentication...")
        
        admin_login_data = {
            "username": self.admin_username,
            "password": self.admin_password
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
        else:
            return False

    def test_create_wallet_topup_request(self):
        """Create a new wallet top-up request"""
        print("\n🔍 Creating New Wallet Top-Up Request...")
        
        # Calculate total with unique code for IDR
        amount = 50000
        unique_code = 123  # Use a fixed unique code for testing
        total_with_unique_code = amount + unique_code
        
        wallet_topup_data = {
            "wallet_type": "main",
            "currency": "IDR",
            "amount": amount,
            "payment_method": "bank_bca",
            "notes": "Test wallet top-up for notification testing",
            "unique_code": unique_code,
            "total_with_unique_code": total_with_unique_code
        }
        
        # Send as form data instead of JSON
        success, response = self.run_test_form(
            "Create Wallet Top-Up Request",
            "POST",
            "wallet/topup",
            200,
            data=wallet_topup_data,
            use_token=self.client_token
        )
        
        if success and 'id' in response:
            self.wallet_topup_request_id = response['id']
            print(f"    Created wallet top-up request ID: {self.wallet_topup_request_id}")
            return True
        else:
            return False

    def create_test_image(self):
        """Create a test image file for upload"""
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='red')
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        return img_buffer

    def test_upload_payment_proof(self):
        """Upload payment proof for the wallet top-up request"""
        print("\n🔍 Uploading Payment Proof...")
        
        if not self.wallet_topup_request_id:
            self.log_test("Upload Payment Proof", False, "No wallet top-up request ID available")
            return False
        
        # Create test image
        test_image = self.create_test_image()
        
        files = {
            'payment_proof': ('test_payment_proof.png', test_image, 'image/png')
        }
        
        success, response = self.run_test(
            "Upload Payment Proof",
            "POST",
            f"wallet/topup/{self.wallet_topup_request_id}/upload-proof",
            200,
            files=files,
            use_token=self.client_token
        )
        
        if success:
            print(f"    Payment proof uploaded successfully")
            return True
        else:
            return False

    def test_verify_request_status_change(self):
        """Verify that the request status changed to 'proof_uploaded'"""
        print("\n🔍 Verifying Request Status Change...")
        
        if not self.wallet_topup_request_id:
            self.log_test("Verify Request Status", False, "No wallet top-up request ID available")
            return False
        
        # Get wallet top-up requests to check status
        success, response = self.run_test(
            "Get Wallet Top-Up Requests",
            "GET",
            "admin/wallet-topup-requests",
            200,
            use_token=self.admin_token
        )
        
        if success and isinstance(response, list):
            # Find our specific request
            our_request = None
            for request in response:
                if request.get('id') == self.wallet_topup_request_id:
                    our_request = request
                    break
            
            if our_request:
                status = our_request.get('status')
                if status == 'proof_uploaded':
                    self.log_test(
                        "Request Status Changed to 'proof_uploaded'",
                        True,
                        f"Status correctly changed to: {status}"
                    )
                    return True
                else:
                    self.log_test(
                        "Request Status Changed to 'proof_uploaded'",
                        False,
                        f"Expected 'proof_uploaded', got: {status}"
                    )
                    return False
            else:
                self.log_test(
                    "Find Request in Admin List",
                    False,
                    f"Request ID {self.wallet_topup_request_id} not found in admin list"
                )
                return False
        else:
            return False

    def test_verify_notification_created(self):
        """Verify that admin notification was created in notifications collection"""
        print("\n🔍 Verifying Admin Notification Creation...")
        
        # Get admin notifications
        success, response = self.run_test(
            "Get Admin Notifications",
            "GET",
            "admin/notifications",
            200,
            use_token=self.admin_token
        )
        
        if success and isinstance(response, list):
            # Look for wallet top-up proof uploaded notification
            wallet_notifications = []
            for notification in response:
                if notification.get('type') == 'wallet_topup_proof_uploaded':
                    wallet_notifications.append(notification)
            
            if wallet_notifications:
                # Find the most recent one (should be ours)
                latest_notification = max(wallet_notifications, key=lambda x: x.get('created_at', ''))
                
                # Verify notification details
                title = latest_notification.get('title', '')
                message = latest_notification.get('message', '')
                reference_id = latest_notification.get('reference_id', '')
                is_read = latest_notification.get('is_read', True)
                
                self.notification_id = latest_notification.get('id')
                
                # Check title
                if '🔔 Wallet Top-Up Proof Uploaded' in title:
                    self.log_test(
                        "Notification Title Correct",
                        True,
                        f"Title: {title}"
                    )
                else:
                    self.log_test(
                        "Notification Title Correct",
                        False,
                        f"Expected '🔔 Wallet Top-Up Proof Uploaded', got: {title}"
                    )
                
                # Check message contains username and amount
                if 'testuser' in message and '50000' in message:
                    self.log_test(
                        "Notification Message Contains Username and Amount",
                        True,
                        f"Message: {message}"
                    )
                else:
                    self.log_test(
                        "Notification Message Contains Username and Amount",
                        False,
                        f"Message missing username or amount: {message}"
                    )
                
                # Check reference_id matches request_id
                if reference_id == self.wallet_topup_request_id:
                    self.log_test(
                        "Notification Reference ID Matches Request ID",
                        True,
                        f"Reference ID: {reference_id}"
                    )
                else:
                    self.log_test(
                        "Notification Reference ID Matches Request ID",
                        False,
                        f"Expected {self.wallet_topup_request_id}, got: {reference_id}"
                    )
                
                # Check is_read is false
                if not is_read:
                    self.log_test(
                        "Notification is Unread",
                        True,
                        f"is_read: {is_read}"
                    )
                else:
                    self.log_test(
                        "Notification is Unread",
                        False,
                        f"Expected is_read=false, got: {is_read}"
                    )
                
                return True
            else:
                self.log_test(
                    "Wallet Top-Up Proof Notification Found",
                    False,
                    "No wallet_topup_proof_uploaded notifications found"
                )
                return False
        else:
            return False

    def test_verify_unread_count_increased(self):
        """Verify that unread notification count increased"""
        print("\n🔍 Verifying Unread Notification Count...")
        
        success, response = self.run_test(
            "Get Unread Notification Count",
            "GET",
            "admin/notifications/unread-count",
            200,
            use_token=self.admin_token
        )
        
        if success and 'count' in response:
            count = response['count']
            if count > 0:
                self.log_test(
                    "Unread Notification Count Increased",
                    True,
                    f"Unread count: {count}"
                )
                return True
            else:
                self.log_test(
                    "Unread Notification Count Increased",
                    False,
                    f"Expected count > 0, got: {count}"
                )
                return False
        else:
            return False

    def test_verify_email_sent(self):
        """Verify that email was sent to admins by checking backend logs"""
        print("\n🔍 Verifying Email Notification Sent...")
        
        try:
            import subprocess
            result = subprocess.run(['tail', '-n', '100', '/var/log/supervisor/backend.err.log'], 
                                  capture_output=True, text=True, timeout=10)
            
            log_content = result.stdout
            
            # Look for wallet top-up proof email patterns
            email_patterns = [
                "📧 New wallet top-up proof uploaded email sent to",
                "Wallet top-up proof uploaded email sent to",
                "send_admin_wallet_topup_proof_uploaded_email"
            ]
            
            found_emails = []
            for pattern in email_patterns:
                if pattern in log_content:
                    found_emails.append(pattern)
            
            if found_emails:
                self.log_test(
                    "Email Notification Sent to Admins",
                    True,
                    f"Found email patterns: {found_emails}"
                )
                return True
            else:
                self.log_test(
                    "Email Notification Sent to Admins",
                    False,
                    "No email notification patterns found in backend logs"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Email Notification Log Check",
                False,
                f"Error checking logs: {str(e)}"
            )
            return False

    def run_comprehensive_notification_test(self):
        """Run comprehensive test for wallet top-up proof upload notification"""
        print("\n" + "="*80)
        print("🔍 WALLET TOP-UP PROOF UPLOAD NOTIFICATION TESTING")
        print("="*80)
        print("Testing the complete notification flow after collection fix:")
        print("1. Client creates wallet top-up request")
        print("2. Client uploads payment proof")
        print("3. Notification stored in 'notifications' collection (not admin_notifications)")
        print("4. Admin can see unread notification count")
        print("5. Admin can see notification details")
        print("6. Email sent to admins")
        print("="*80)
        
        # Step 1: Client Authentication
        print("\n📋 Step 1: Client Authentication")
        if not self.test_client_authentication():
            print("\n❌ CRITICAL: Client authentication failed!")
            return False
        
        # Step 2: Admin Authentication
        print("\n📋 Step 2: Admin Authentication")
        if not self.test_admin_authentication():
            print("\n❌ CRITICAL: Admin authentication failed!")
            return False
        
        # Step 3: Create Wallet Top-Up Request
        print("\n📋 Step 3: Create Wallet Top-Up Request")
        if not self.test_create_wallet_topup_request():
            print("\n❌ CRITICAL: Failed to create wallet top-up request!")
            return False
        
        # Step 4: Upload Payment Proof
        print("\n📋 Step 4: Upload Payment Proof")
        if not self.test_upload_payment_proof():
            print("\n❌ CRITICAL: Failed to upload payment proof!")
            return False
        
        # Step 5: Verify Request Status Change
        print("\n📋 Step 5: Verify Request Status Change")
        self.test_verify_request_status_change()
        
        # Step 6: Verify Notification Creation
        print("\n📋 Step 6: Verify Notification Creation")
        self.test_verify_notification_created()
        
        # Step 7: Verify Unread Count Increased
        print("\n📋 Step 7: Verify Unread Count Increased")
        self.test_verify_unread_count_increased()
        
        # Step 8: Verify Email Sent
        print("\n📋 Step 8: Verify Email Sent")
        self.test_verify_email_sent()
        
        # Summary
        print(f"\n" + "="*80)
        print(f"📊 WALLET TOP-UP PROOF NOTIFICATION TEST SUMMARY")
        print(f"="*80)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Detailed analysis
        failed_tests = [test for test in self.test_results if not test['success']]
        
        if self.tests_passed == self.tests_run:
            print(f"\n✅ ALL TESTS PASSED - Wallet top-up proof notification is working correctly!")
            print(f"✅ Notification stored in correct 'notifications' collection")
            print(f"✅ Admin can see unread notification count")
            print(f"✅ Admin can see notification details")
            print(f"✅ Email sent to admins")
            print(f"✅ Collection fix (admin_notifications → notifications) working")
        else:
            print(f"\n❌ SOME TESTS FAILED - Notification system needs attention")
            
            if failed_tests:
                print(f"\n🔍 FAILED TESTS:")
                for test in failed_tests:
                    print(f"   ❌ {test['test_name']}: {test['details']}")
                
                # Provide specific recommendations
                print(f"\n💡 RECOMMENDATIONS:")
                print(f"   1. Check if notifications are being stored in 'notifications' collection")
                print(f"   2. Verify admin notification endpoints read from 'notifications' collection")
                print(f"   3. Confirm email service is working for admin notifications")
                print(f"   4. Check if notification creation has proper duplicate protection")
        
        return self.tests_passed == self.tests_run


if __name__ == "__main__":
    # Run the wallet top-up proof notification test
    print("🚀 Starting Wallet Top-Up Proof Upload Notification Testing...")
    
    tester = WalletTopUpProofNotificationTester()
    success = tester.run_comprehensive_notification_test()
    
    if success:
        print("\n🎉 All tests passed! Wallet top-up proof notification functionality is working correctly.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the results above.")
        sys.exit(1)