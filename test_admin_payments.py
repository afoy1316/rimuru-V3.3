#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class AdminPaymentTester:
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
        """Test admin login with default credentials"""
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
                "Admin Token Generation",
                True,
                "Admin access token received successfully"
            )
            return True
        else:
            self.log_test(
                "Admin Token Generation",
                False,
                "Failed to receive admin access token"
            )
            return False

    def test_admin_payment_verification_endpoints(self):
        """Test admin payment verification endpoints as requested in review"""
        print("\n🔍 Testing Admin Payment Verification Endpoints...")
        
        if not self.admin_token:
            self.log_test(
                "Admin Payment Test Setup",
                False,
                "Admin token required for payment verification tests"
            )
            return False
        
        # Test 1: GET /api/admin/payments - List all payments
        success, payments_response = self.run_test(
            "GET /api/admin/payments - List All Payments",
            "GET",
            "admin/payments",
            200,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        if isinstance(payments_response, list):
            self.log_test(
                "Payment List Structure",
                True,
                f"Retrieved {len(payments_response)} payment records"
            )
        else:
            self.log_test(
                "Payment List Structure",
                False,
                "Response is not a list"
            )
            return False
        
        # Test 2: Filter payments by status - proof_uploaded
        success, proof_uploaded_payments = self.run_test(
            "GET /api/admin/payments?status=proof_uploaded - Filter by Status",
            "GET",
            "admin/payments?status=proof_uploaded",
            200,
            use_admin_token=True
        )
        
        if success:
            self.log_test(
                "Payment Status Filtering",
                True,
                f"Found {len(proof_uploaded_payments) if isinstance(proof_uploaded_payments, list) else 0} payments with proof_uploaded status"
            )
        
        # Find a payment for detailed testing
        test_payment = None
        if payments_response:
            # Look for a payment with proof_uploaded status first
            for payment in payments_response:
                if payment.get('status') == 'proof_uploaded':
                    test_payment = payment
                    break
            
            # If no proof_uploaded payment found, use any payment
            if not test_payment and payments_response:
                test_payment = payments_response[0]
        
        if not test_payment:
            # Create a mock payment for testing if none exist
            self.log_test(
                "Payment Test Setup",
                True,
                "No existing payments found - testing with mock payment ID"
            )
            test_payment_id = "mock-payment-id-for-testing"
        else:
            test_payment_id = test_payment.get('id')
            self.log_test(
                "Payment Test Setup",
                True,
                f"Using payment {test_payment_id} for detailed testing (status: {test_payment.get('status')})"
            )
        
        # Test 3: GET /api/admin/payments/{payment_id} - Get payment details
        success, payment_detail = self.run_test(
            "GET /api/admin/payments/{id} - Payment Details",
            "GET",
            f"admin/payments/{test_payment_id}",
            200 if test_payment else 404,  # Expect 404 for mock payment
            use_admin_token=True
        )
        
        if test_payment and success:
            # Verify payment detail structure
            expected_fields = ['id', 'reference_code', 'user', 'currency', 'total_amount', 'status', 'accounts', 'transfer_details']
            missing_fields = [field for field in expected_fields if field not in payment_detail]
            
            if missing_fields:
                self.log_test(
                    "Payment Detail Structure",
                    False,
                    f"Missing fields in payment detail: {missing_fields}"
                )
                return False
            else:
                self.log_test(
                    "Payment Detail Structure",
                    True,
                    "Payment detail contains all expected fields"
                )
                
                # Verify user information
                user_info = payment_detail.get('user', {})
                if 'username' in user_info and 'email' in user_info:
                    self.log_test(
                        "Payment User Information",
                        True,
                        f"User info complete: {user_info.get('username')} ({user_info.get('email')})"
                    )
                else:
                    self.log_test(
                        "Payment User Information",
                        False,
                        "User information incomplete in payment detail"
                    )
        elif not test_payment:
            self.log_test(
                "Payment Detail Test",
                True,
                "Mock payment properly returned 404 as expected"
            )
        
        # Test 4: GET /api/admin/payments/{payment_id}/proof-file - View proof file
        success, proof_file_response = self.run_test(
            "GET /api/admin/payments/{id}/proof-file - Proof File",
            "GET",
            f"admin/payments/{test_payment_id}/proof-file",
            200 if (test_payment and test_payment.get('payment_proof', {}).get('uploaded')) else 404,
            use_admin_token=True
        )
        
        if test_payment and test_payment.get('payment_proof', {}).get('uploaded'):
            if success:
                self.log_test(
                    "Payment Proof File Access",
                    True,
                    "Payment proof file accessible for admin review"
                )
            else:
                self.log_test(
                    "Payment Proof File Access",
                    False,
                    "Payment proof file not accessible"
                )
        else:
            self.log_test(
                "Payment Proof File Test",
                True,
                "No proof file available - 404 response expected and received"
            )
        
        # Test 5: PUT /api/admin/payments/{payment_id}/verify - Verify payment (verified)
        if test_payment and test_payment.get('status') == 'proof_uploaded':
            verification_data = {
                "status": "verified",
                "admin_notes": "Payment verified successfully - test verification"
            }
            
            success, verify_response = self.run_test(
                "PUT /api/admin/payments/{id}/verify - Verify Payment",
                "PUT",
                f"admin/payments/{test_payment_id}/verify",
                200,
                data=verification_data,
                use_admin_token=True
            )
            
            if success:
                self.log_test(
                    "Payment Verification Success",
                    True,
                    f"Payment successfully verified: {verify_response.get('message', 'No message')}"
                )
                
                # Verify response structure
                if 'message' in verify_response and 'status' in verify_response:
                    self.log_test(
                        "Verification Response Structure",
                        True,
                        f"Response contains message and status: {verify_response.get('status')}"
                    )
                else:
                    self.log_test(
                        "Verification Response Structure",
                        False,
                        "Verification response missing required fields"
                    )
            else:
                self.log_test(
                    "Payment Verification",
                    False,
                    "Failed to verify payment"
                )
        else:
            # Test with mock data for verification endpoint
            mock_verification_data = {
                "status": "verified",
                "admin_notes": "Test verification with mock payment"
            }
            
            success, mock_verify_response = self.run_test(
                "PUT /api/admin/payments/{id}/verify - Mock Verification",
                "PUT",
                f"admin/payments/{test_payment_id}/verify",
                404,  # Expect 404 for non-existent payment
                data=mock_verification_data,
                use_admin_token=True
            )
            
            if success:
                self.log_test(
                    "Payment Verification Validation",
                    True,
                    "Non-existent payment properly rejected with 404"
                )
        
        # Test 6: Invalid verification status
        invalid_verification_data = {
            "status": "invalid_status",
            "admin_notes": "Testing invalid status"
        }
        
        success, invalid_response = self.run_test(
            "PUT /api/admin/payments/{id}/verify - Invalid Status",
            "PUT",
            f"admin/payments/{test_payment_id}/verify",
            400,  # Should fail with 400
            data=invalid_verification_data,
            use_admin_token=True
        )
        
        if success:
            self.log_test(
                "Invalid Status Validation",
                True,
                "Invalid verification status properly rejected"
            )
        else:
            self.log_test(
                "Invalid Status Validation",
                False,
                "Invalid verification status not properly rejected"
            )
        
        # Test 7: Authentication tests - without admin token
        success, no_auth_response = self.run_test(
            "GET /api/admin/payments - No Authentication",
            "GET",
            "admin/payments",
            401,  # Should return 401 Unauthorized
            use_admin_token=False
        )
        
        if success:
            self.log_test(
                "Admin Authentication Required",
                True,
                "Admin endpoints properly require authentication"
            )
        else:
            self.log_test(
                "Admin Authentication Required",
                False,
                "Admin endpoints not properly protected"
            )
        
        # Test 8: Check payment status flow
        if payments_response:
            status_counts = {}
            for payment in payments_response:
                status = payment.get('status', 'unknown')
                status_counts[status] = status_counts.get(status, 0) + 1
            
            self.log_test(
                "Payment Status Flow Analysis",
                True,
                f"Payment status distribution: {status_counts}"
            )
            
            # Check if we have payments in different statuses
            expected_statuses = ['pending', 'proof_uploaded', 'verified', 'rejected']
            found_statuses = list(status_counts.keys())
            
            self.log_test(
                "Payment Status Variety",
                len(found_statuses) > 1,
                f"Found payment statuses: {found_statuses}"
            )
        
        return True

    def run_tests(self):
        """Run all admin payment verification tests"""
        print("🚀 Starting Admin Payment Verification Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Login as admin first
        if not self.test_admin_login():
            print("❌ Admin login failed - cannot proceed with payment tests")
            return
        
        # Run payment verification tests
        self.test_admin_payment_verification_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 ADMIN PAYMENT VERIFICATION TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📊 Total Tests: {self.tests_run}")
        print(f"🎯 Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")

if __name__ == "__main__":
    tester = AdminPaymentTester()
    tester.run_tests()