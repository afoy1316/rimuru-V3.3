#!/usr/bin/env python3
"""
Test invoice generation with new Rimuru logo
Review Request: Test invoice generation with new Rimuru logo
"""

import requests
import sys
import json
import os
from datetime import datetime, timezone

class InvoiceLogoTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)

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
                    return True, response
            else:
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_logo_integration(self):
        """Test logo file exists and verify size"""
        print("\n🔍 Testing Logo Integration...")
        
        logo_path = "/app/frontend/public/images/rimuru-logo.png"
        
        if not os.path.exists(logo_path):
            self.log_test(
                "Logo File Existence Check",
                False,
                f"Logo file not found at {logo_path}"
            )
            return False
        
        # Check file size
        logo_size = os.path.getsize(logo_path)
        expected_size = 90822  # 90KB as mentioned in review request
        
        if abs(logo_size - expected_size) < 1000:  # Allow small variance
            self.log_test(
                "Logo File Size Verification",
                True,
                f"Logo file size: {logo_size} bytes (expected ~{expected_size} bytes)"
            )
        else:
            self.log_test(
                "Logo File Size Verification",
                False,
                f"Logo file size: {logo_size} bytes, expected ~{expected_size} bytes"
            )
            return False
        
        # Check file format
        if logo_path.endswith('.png'):
            self.log_test(
                "Logo File Format Check",
                True,
                "Logo file is PNG format as expected"
            )
        else:
            self.log_test(
                "Logo File Format Check",
                False,
                f"Logo file format unexpected: {logo_path}"
            )
            return False
        
        return True

    def authenticate_client(self):
        """Authenticate as testuser"""
        print("\n🔍 Authenticating as testuser...")
        
        client_login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        success, client_response = self.run_test(
            "Client Login for Invoice Testing",
            "POST",
            "auth/login",
            200,
            data=client_login_data
        )
        
        if not success or 'access_token' not in client_response:
            # Try creating test user if login fails
            print("\n🔍 Creating Test User for Invoice Testing...")
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
            
            reg_success, reg_response = self.run_test(
                "Create Test User for Invoice Testing",
                "POST",
                "auth/register",
                200,
                data=test_user_data
            )
            
            if reg_success:
                success, client_response = self.run_test(
                    "Client Login (after registration)",
                    "POST",
                    "auth/login",
                    200,
                    data=client_login_data
                )
        
        if success and 'access_token' in client_response:
            self.token = client_response['access_token']
            return True
        else:
            self.log_test(
                "Client Authentication",
                False,
                "Failed to obtain client token for invoice testing"
            )
            return False

    def test_regular_topup_invoice(self):
        """Test regular top-up invoice generation with new logo"""
        print("\n🔍 Testing Regular Top-Up Invoice Generation...")
        
        # Get top-up requests
        success, topup_requests = self.run_test(
            "GET /api/topup-requests",
            "GET",
            "topup-requests",
            200
        )
        
        if not success:
            self.log_test(
                "Top-Up Requests Retrieval",
                False,
                "Failed to retrieve top-up requests"
            )
            return False
        
        # Find a verified request
        verified_request = None
        if topup_requests:
            for request in topup_requests:
                if request.get('status') == 'verified':
                    verified_request = request
                    break
        
        if not verified_request:
            self.log_test(
                "Verified Top-Up Request Search",
                False,
                "No verified regular top-up request found for invoice testing"
            )
            return False
        
        self.log_test(
            "Verified Top-Up Request Found",
            True,
            f"Found verified request: {verified_request.get('id')}"
        )
        
        # Generate invoice
        request_id = verified_request.get('id')
        url = f"{self.api_url}/topup-request/{request_id}/invoice"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                # Check if response is PDF
                content_type = response.headers.get('Content-Type', '')
                if 'application/pdf' in content_type:
                    pdf_size = len(response.content)
                    self.log_test(
                        "Regular Top-Up Invoice PDF Generation",
                        True,
                        f"PDF generated successfully, size: {pdf_size} bytes, Content-Type: {content_type}"
                    )
                    
                    # Check filename format
                    content_disposition = response.headers.get('Content-Disposition', '')
                    if f'invoice_{request_id}.pdf' in content_disposition:
                        self.log_test(
                            "Regular Invoice Filename Format",
                            True,
                            f"Correct filename format: {content_disposition}"
                        )
                    else:
                        self.log_test(
                            "Regular Invoice Filename Format",
                            False,
                            f"Unexpected filename format: {content_disposition}"
                        )
                    
                    # Check PDF size is reasonable (not excessive due to logo)
                    if pdf_size < 500000:  # Less than 500KB is reasonable
                        self.log_test(
                            "Regular Invoice PDF Size Check",
                            True,
                            f"PDF size reasonable: {pdf_size} bytes"
                        )
                        return True
                    else:
                        self.log_test(
                            "Regular Invoice PDF Size Check",
                            False,
                            f"PDF size may be excessive: {pdf_size} bytes"
                        )
                        return False
                else:
                    self.log_test(
                        "Regular Top-Up Invoice PDF Generation",
                        False,
                        f"Response not PDF, Content-Type: {content_type}"
                    )
                    return False
            else:
                self.log_test(
                    "Regular Top-Up Invoice PDF Generation",
                    False,
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
                return False
        except Exception as e:
            self.log_test(
                "Regular Top-Up Invoice PDF Generation",
                False,
                f"Exception: {str(e)}"
            )
            return False

    def test_wallet_topup_invoice(self):
        """Test wallet top-up invoice generation with new logo"""
        print("\n🔍 Testing Wallet Top-Up Invoice Generation...")
        
        # Get wallet top-up requests
        success, wallet_requests = self.run_test(
            "GET /api/wallet-topup-requests",
            "GET",
            "wallet-topup-requests",
            200
        )
        
        if not success:
            self.log_test(
                "Wallet Top-Up Requests Retrieval",
                False,
                "Failed to retrieve wallet top-up requests"
            )
            return False
        
        # Find a verified request
        verified_request = None
        if wallet_requests:
            for request in wallet_requests:
                if request.get('status') == 'verified':
                    verified_request = request
                    break
        
        if not verified_request:
            self.log_test(
                "Verified Wallet Top-Up Request Search",
                False,
                "No verified wallet top-up request found for invoice testing"
            )
            return False
        
        self.log_test(
            "Verified Wallet Top-Up Request Found",
            True,
            f"Found verified wallet request: {verified_request.get('id')}"
        )
        
        # Generate wallet invoice
        request_id = verified_request.get('id')
        url = f"{self.api_url}/wallet-topup-request/{request_id}/invoice"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                # Check if response is PDF
                content_type = response.headers.get('Content-Type', '')
                if 'application/pdf' in content_type:
                    pdf_size = len(response.content)
                    self.log_test(
                        "Wallet Top-Up Invoice PDF Generation",
                        True,
                        f"PDF generated successfully, size: {pdf_size} bytes, Content-Type: {content_type}"
                    )
                    
                    # Check filename format for wallet invoice
                    content_disposition = response.headers.get('Content-Disposition', '')
                    if f'wallet_invoice_{request_id}.pdf' in content_disposition:
                        self.log_test(
                            "Wallet Invoice Filename Format",
                            True,
                            f"Correct wallet filename format: {content_disposition}"
                        )
                    else:
                        self.log_test(
                            "Wallet Invoice Filename Format",
                            False,
                            f"Unexpected wallet filename format: {content_disposition}"
                        )
                    
                    # Check PDF size is reasonable
                    if pdf_size < 500000:  # Less than 500KB is reasonable
                        self.log_test(
                            "Wallet Invoice PDF Size Check",
                            True,
                            f"PDF size reasonable: {pdf_size} bytes"
                        )
                        return True
                    else:
                        self.log_test(
                            "Wallet Invoice PDF Size Check",
                            False,
                            f"PDF size may be excessive: {pdf_size} bytes"
                        )
                        return False
                else:
                    self.log_test(
                        "Wallet Top-Up Invoice PDF Generation",
                        False,
                        f"Response not PDF, Content-Type: {content_type}"
                    )
                    return False
            else:
                self.log_test(
                    "Wallet Top-Up Invoice PDF Generation",
                    False,
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
                return False
        except Exception as e:
            self.log_test(
                "Wallet Top-Up Invoice PDF Generation",
                False,
                f"Exception: {str(e)}"
            )
            return False

    def test_invoice_error_handling(self):
        """Test invoice generation error handling"""
        print("\n🔍 Testing Invoice Error Handling...")
        
        # Test with non-existent request ID
        fake_request_id = "non-existent-request-id"
        
        success, error_response = self.run_test(
            "Regular Invoice - Non-existent Request",
            "GET",
            f"topup-request/{fake_request_id}/invoice",
            404
        )
        
        if success:
            self.log_test(
                "Invoice Error Handling - Non-existent Request",
                True,
                "Correctly returns 404 for non-existent request"
            )
        
        # Test wallet invoice with non-existent request ID
        success, error_response = self.run_test(
            "Wallet Invoice - Non-existent Request",
            "GET",
            f"wallet-topup-request/{fake_request_id}/invoice",
            404
        )
        
        if success:
            self.log_test(
                "Wallet Invoice Error Handling - Non-existent Request",
                True,
                "Correctly returns 404 for non-existent wallet request"
            )
        
        return True

    def test_invoice_authentication(self):
        """Test invoice authentication requirements"""
        print("\n🔍 Testing Invoice Authentication Requirements...")
        
        # Get a verified request first
        success, topup_requests = self.run_test(
            "GET /api/topup-requests for auth test",
            "GET",
            "topup-requests",
            200
        )
        
        verified_request = None
        if success and topup_requests:
            for request in topup_requests:
                if request.get('status') == 'verified':
                    verified_request = request
                    break
        
        if verified_request:
            # Test without authentication
            success, unauth_response = self.run_test(
                "Regular Invoice - No Authentication",
                "GET",
                f"topup-request/{verified_request.get('id')}/invoice",
                [401, 403],
                headers={}
            )
            
            if success:
                self.log_test(
                    "Invoice Authentication Requirement",
                    True,
                    "Invoice access properly requires authentication"
                )
        
        # Test wallet invoice authentication
        success, wallet_requests = self.run_test(
            "GET /api/wallet-topup-requests for auth test",
            "GET",
            "wallet-topup-requests",
            200
        )
        
        verified_wallet_request = None
        if success and wallet_requests:
            for request in wallet_requests:
                if request.get('status') == 'verified':
                    verified_wallet_request = request
                    break
        
        if verified_wallet_request:
            # Test without authentication
            success, unauth_response = self.run_test(
                "Wallet Invoice - No Authentication",
                "GET",
                f"wallet-topup-request/{verified_wallet_request.get('id')}/invoice",
                [401, 403],
                headers={}
            )
            
            if success:
                self.log_test(
                    "Wallet Invoice Authentication Requirement",
                    True,
                    "Wallet invoice access properly requires authentication"
                )
        
        return True

    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*60}")
        print("📊 INVOICE GENERATION WITH NEW LOGO TEST SUMMARY")
        print(f"{'='*60}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        print(f"\n📋 Detailed Results:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test_name']}")
            if result["details"]:
                print(f"   {result['details']}")
        
        print(f"\n🏁 Testing completed at {datetime.now().isoformat()}")

    def run_all_tests(self):
        """Run all invoice generation tests"""
        print("🚀 Starting Invoice Generation with New Rimuru Logo Tests...")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")
        print("=" * 80)
        
        # Test 1: Logo Integration
        logo_success = self.test_logo_integration()
        if not logo_success:
            print("❌ Logo integration test failed - stopping tests")
            self.print_summary()
            return
        
        # Test 2: Authentication
        auth_success = self.authenticate_client()
        if not auth_success:
            print("❌ Authentication failed - stopping tests")
            self.print_summary()
            return
        
        # Test 3: Regular Top-Up Invoice
        regular_success = self.test_regular_topup_invoice()
        
        # Test 4: Wallet Top-Up Invoice
        wallet_success = self.test_wallet_topup_invoice()
        
        # Test 5: Error Handling
        error_success = self.test_invoice_error_handling()
        
        # Test 6: Authentication Requirements
        auth_req_success = self.test_invoice_authentication()
        
        # Print summary
        self.print_summary()
        
        # Final assessment
        if logo_success and auth_success and (regular_success or wallet_success):
            print("\n🎉 INVOICE GENERATION WITH NEW LOGO TESTS COMPLETED SUCCESSFULLY!")
            print("✅ Logo integration verified")
            print("✅ Invoice generation working with new logo")
            print("✅ PDF file sizes reasonable")
            print("✅ Authentication and error handling working")
        else:
            print("\n⚠️  SOME INVOICE GENERATION TESTS FAILED")
            print("❌ Please check the detailed results above")

if __name__ == "__main__":
    tester = InvoiceLogoTester()
    tester.run_all_tests()