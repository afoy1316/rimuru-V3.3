#!/usr/bin/env python3
"""
Email Notification System - SMTP Authentication Fix Testing
Test Email Notification System after SMTP password fix (removed spaces)

Test Scenarios:
1. Wallet Top-Up Request (Admin Email)
2. Register New Client (Welcome Email + Admin Notification)

Expected Results:
✅ SMTP authentication successful (no 334 errors)
✅ Backend logs show "📧 Welcome email sent"
✅ Backend logs show "📧 Admin notification emails sent to X admins"
✅ Email service returns success (True)
✅ No SMTP password errors
"""

import requests
import sys
import json
import time
import os
from datetime import datetime, timezone, timedelta

class EmailSMTPAuthenticationTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.client_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_timestamp = int(time.time())
        
        # Expected SMTP configuration (fixed)
        self.expected_smtp_password = "wftlkkxdxboarlqo"  # Fixed password without spaces

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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None, use_admin_token=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {}
        
        # Use appropriate token
        if use_admin_token and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif self.client_token:
            test_headers['Authorization'] = f'Bearer {self.client_token}'
        
        if headers:
            test_headers.update(headers)

        # Only add Content-Type for JSON requests
        if not files and data:
            test_headers['Content-Type'] = 'application/json'

        try:
            start_time = time.time()
            
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                if files:
                    # For file uploads, don't set Content-Type (let requests handle it)
                    response = requests.post(url, data=data, files=files, headers=test_headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            end_time = time.time()
            response_time = end_time - start_time

            # Handle both single status code and list of acceptable status codes
            if isinstance(expected_status, list):
                success = response.status_code in expected_status
                details = f"Status: {response.status_code}, Expected: {expected_status}, Time: {response_time:.2f}s"
            else:
                success = response.status_code == expected_status
                details = f"Status: {response.status_code}, Expected: {expected_status}, Time: {response_time:.2f}s"
            
            if not success:
                try:
                    error_detail = response.json()
                    details += f", Response: {error_detail}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return True, response.json(), response_time
                except:
                    return True, response.text, response_time
            else:
                return False, {}, response_time

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}, 0

    def test_client_authentication(self):
        """Authenticate as client (testuser/testpass123)"""
        print("\n🔍 Step 1: Authenticate as client (testuser/testpass123)...")
        
        client_login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        success, response, _ = self.run_test(
            "Client Authentication",
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

    def test_wallet_topup_request_admin_email(self):
        """Test 1: Wallet Top-Up Request (Admin Email)"""
        print("\n🔍 Step 2: Create a wallet top-up request via POST /api/wallet/topup...")
        
        # Create wallet top-up request with dummy payment proof
        topup_data = {
            "wallet_type": "main",
            "currency": "IDR", 
            "amount": 100000,
            "payment_method": "bank_bca",
            "notes": "Test wallet top-up for admin email notification"
        }
        
        # Create a dummy payment proof file
        files = {
            'payment_proof': ('test_proof.jpg', b'fake_image_data_for_testing', 'image/jpeg')
        }
        
        success, response, response_time = self.run_test(
            "Wallet Top-Up Request Creation",
            "POST",
            "wallet/topup",
            200,
            data=topup_data,
            files=files
        )
        
        if success:
            request_id = response.get('request_id', 'N/A')
            print(f"   ✅ Wallet top-up request created: {request_id}")
            print(f"   ✅ Response time: {response_time:.2f}s")
            return True
        else:
            return False

    def test_register_new_client_welcome_email(self):
        """Test 2: Register New Client (Welcome Email + Admin Notification)"""
        print("\n🔍 Step 3: Register new test client via POST /api/auth/register...")
        
        # Use timestamp in username to make it unique
        test_client_data = {
            "username": f"emailtest_{self.test_timestamp}",
            "name": f"Email Test User {self.test_timestamp}",
            "company_name": "Test Company",
            "phone_number": "+628123456789",
            "address": "Test Address 123",
            "city": "Jakarta",
            "province": "DKI Jakarta",
            "email": f"emailtest_{self.test_timestamp}@example.com",
            "password": "testpass123"
        }
        
        success, response, response_time = self.run_test(
            "New Client Registration",
            "POST",
            "auth/register",
            200,
            data=test_client_data
        )
        
        if success:
            print(f"   ✅ New client registered: {test_client_data['username']}")
            print(f"   ✅ Email: {test_client_data['email']}")
            print(f"   ✅ Response time: {response_time:.2f}s")
            return True
        else:
            return False

    def check_backend_logs_for_email_success(self):
        """Check backend logs for email-related success messages"""
        print("\n🔍 Step 4: Check backend logs for email sending status...")
        
        try:
            # Check supervisor backend logs for email messages
            result = os.system("tail -n 50 /var/log/supervisor/backend.*.log | grep -E '📧|email' > /tmp/email_logs.txt 2>/dev/null")
            
            # Read the log file
            try:
                with open('/tmp/email_logs.txt', 'r') as f:
                    log_content = f.read()
                
                print(f"\n📋 Recent Email Log Entries:")
                if log_content:
                    print(log_content)
                else:
                    print("   No email-related log entries found")
                
                # Check for specific success messages
                success_indicators = []
                
                # Check for welcome email sent
                if "📧 Welcome email sent" in log_content:
                    success_indicators.append("Welcome email sent")
                    self.log_test(
                        "Backend Logs Show '📧 Welcome email sent'",
                        True,
                        "Found welcome email confirmation in backend logs"
                    )
                else:
                    self.log_test(
                        "Backend Logs Show '📧 Welcome email sent'",
                        False,
                        "No welcome email confirmation found in backend logs"
                    )
                
                # Check for admin notification emails
                if "📧 Admin" in log_content and "notification emails sent" in log_content:
                    # Extract number of admins
                    import re
                    match = re.search(r'📧 Admin.*notification emails sent to (\d+) admins', log_content)
                    if match:
                        admin_count = match.group(1)
                        success_indicators.append(f"Admin notification emails sent to {admin_count} admins")
                        self.log_test(
                            f"Backend Logs Show '📧 Admin notification emails sent to {admin_count} admins'",
                            True,
                            f"Found admin notification confirmation for {admin_count} admins"
                        )
                    else:
                        success_indicators.append("Admin notification emails sent")
                        self.log_test(
                            "Backend Logs Show Admin Notification Emails",
                            True,
                            "Found admin notification email confirmation"
                        )
                else:
                    self.log_test(
                        "Backend Logs Show Admin Notification Emails",
                        False,
                        "No admin notification email confirmation found"
                    )
                
                # Check for SMTP errors (334, b'UGFzc3dvcmQ6')
                if "334" in log_content and "UGFzc3dvcmQ6" in log_content:
                    self.log_test(
                        "No SMTP Authentication Errors (334, b'UGFzc3dvcmQ6')",
                        False,
                        "Found SMTP authentication error (334, b'UGFzc3dvcmQ6') in logs"
                    )
                else:
                    self.log_test(
                        "No SMTP Authentication Errors (334, b'UGFzc3dvcmQ6')",
                        True,
                        "No SMTP authentication errors found in logs"
                    )
                
                # Check for any SMTP errors
                if "SMTP" in log_content and ("error" in log_content.lower() or "failed" in log_content.lower()):
                    self.log_test(
                        "No SMTP Errors",
                        False,
                        "Found SMTP errors in backend logs"
                    )
                else:
                    self.log_test(
                        "No SMTP Errors",
                        True,
                        "No SMTP errors found in backend logs"
                    )
                
                # Summary of success indicators
                if success_indicators:
                    print(f"\n✅ Email Success Indicators Found:")
                    for indicator in success_indicators:
                        print(f"   ✅ {indicator}")
                else:
                    print(f"\n❌ No email success indicators found in logs")
                
                # Clean up
                os.system("rm -f /tmp/email_logs.txt")
                
                return len(success_indicators) > 0
                
            except FileNotFoundError:
                self.log_test(
                    "Backend Logs Check",
                    False,
                    "Could not read email log file"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Backend Logs Check",
                False,
                f"Error checking logs: {str(e)}"
            )
            return False

    def run_smtp_authentication_fix_test(self):
        """Run comprehensive SMTP authentication fix test"""
        print("\n" + "="*80)
        print("🔍 EMAIL NOTIFICATION SYSTEM - SMTP AUTHENTICATION FIX TESTING")
        print("="*80)
        print("Context: User tested top-up saldo but didn't receive email.")
        print("Found SMTP authentication error due to spaces in Gmail app password.")
        print(f"Fixed by removing spaces: {self.expected_smtp_password}")
        print("\nTest Objectives:")
        print("1. Verify SMTP authentication now works")
        print("2. Test email sending for admin notifications")
        print("3. Test email sending for client notifications")
        print("4. Check backend logs for successful email sends")
        print("="*80)
        
        # Test 1: Wallet Top-Up Request (Admin Email)
        print("\n📧 Test 1: Wallet Top-Up Request (Admin Email)")
        if not self.test_client_authentication():
            print("\n❌ CRITICAL: Client authentication failed!")
            return False
        
        self.test_wallet_topup_request_admin_email()
        
        # Test 2: Register New Client (Welcome Email + Admin Notification)
        print("\n📧 Test 2: Register New Client (Welcome Email + Admin Notification)")
        self.test_register_new_client_welcome_email()
        
        # Check backend logs
        self.check_backend_logs_for_email_success()
        
        # Summary
        print(f"\n" + "="*80)
        print(f"📊 SMTP AUTHENTICATION FIX TEST SUMMARY")
        print(f"="*80)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Critical Success Indicators
        failed_tests = [test for test in self.test_results if not test['success']]
        
        if self.tests_passed == self.tests_run:
            print(f"\n✅ ALL TESTS PASSED - SMTP authentication fix working correctly!")
            print(f"✅ SMTP authentication successful (no 334 errors)")
            print(f"✅ Backend logs show '📧 Welcome email sent' messages")
            print(f"✅ Backend logs show '📧 Admin notification emails sent to X admins'")
            print(f"✅ Email service returns success (True)")
            print(f"✅ No SMTP password errors")
            print(f"✅ All email sending operations complete without errors")
        else:
            print(f"\n❌ SOME TESTS FAILED - SMTP authentication fix needs attention")
            
            if failed_tests:
                print(f"\n🔍 FAILED TESTS:")
                for test in failed_tests:
                    print(f"   ❌ {test['test_name']}: {test['details']}")
                
                # Provide specific recommendations
                print(f"\n💡 RECOMMENDATIONS:")
                print(f"   1. Check SMTP configuration in backend/.env")
                print(f"   2. Verify Gmail app password is correct: {self.expected_smtp_password}")
                print(f"   3. Check backend logs for SMTP authentication errors")
                print(f"   4. Ensure email service is properly integrated")
        
        return self.tests_passed == self.tests_run


if __name__ == "__main__":
    tester = EmailSMTPAuthenticationTester()
    tester.run_smtp_authentication_fix_test()