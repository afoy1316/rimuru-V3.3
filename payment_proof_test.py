import requests
import sys
import json
from datetime import datetime

class PaymentProofDownloadTester:
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
        
        # Use admin token if specified
        if use_admin_token and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        
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

    def test_payment_proof_download_functionality(self):
        """Test payment proof download functionality as requested in review"""
        print("\n🔍 Testing Payment Proof Download Functionality (Review Request)...")
        
        if not self.admin_token:
            self.log_test(
                "Payment Proof Download Test Setup",
                False,
                "Admin token required for payment proof download testing"
            )
            return False
        
        # Test 1: GET /api/admin/payments - Get all payments to find ones with proof
        success, payments_response = self.run_test(
            "GET /api/admin/payments - List All Payments",
            "GET",
            "admin/payments",
            200,
            use_admin_token=True
        )
        
        if not success or not isinstance(payments_response, list):
            self.log_test(
                "Payment Proof Test Setup",
                False,
                "Failed to retrieve payments for proof download testing"
            )
            return False
        
        # Test 2: Analyze payment data structure and find payments with proof
        payments_with_proof = []
        sample_payment_fields = set()
        
        for i, payment in enumerate(payments_response):
            # Collect field names from first few payments
            if i < 3:
                sample_payment_fields.update(payment.keys())
            
            # Check for various proof-related fields
            if (payment.get('payment_proof_id') or 
                payment.get('payment_proof') or
                payment.get('proof_id') or 
                payment.get('file_name') or 
                payment.get('file_path') or
                payment.get('status') == 'proof_uploaded'):
                payments_with_proof.append(payment)
        
        self.log_test(
            "Payment Data Structure Analysis",
            True,
            f"Sample payment fields: {sorted(list(sample_payment_fields))}"
        )
        
        self.log_test(
            "Payments with Proof Analysis",
            True,
            f"Found {len(payments_with_proof)} payments with proof indicators out of {len(payments_response)} total payments"
        )
        
        if not payments_with_proof:
            self.log_test(
                "Payment Proof Availability",
                False,
                "No payments with payment proof found for download testing"
            )
            return False
        
        # Test 3: Test payment proof download endpoint for each payment with proof
        successful_downloads = 0
        failed_downloads = 0
        
        for payment in payments_with_proof:
            request_id = payment.get('id')
            payment_proof_id = payment.get('payment_proof_id')
            
            # Test the download endpoint
            success, download_response = self.run_test(
                f"GET /api/admin/payments/{request_id}/proof-file - Download Proof",
                "GET",
                f"admin/payments/{request_id}/proof-file",
                200,
                use_admin_token=True
            )
            
            if success:
                successful_downloads += 1
                self.log_test(
                    f"Proof Download Success - {request_id[:8]}",
                    True,
                    f"Successfully downloaded proof for payment {request_id[:8]}"
                )
            else:
                failed_downloads += 1
                self.log_test(
                    f"Proof Download Failed - {request_id[:8]}",
                    False,
                    f"Failed to download proof for payment {request_id[:8]}"
                )
        
        # Test 4: Test with invalid request_id
        success, invalid_response = self.run_test(
            "GET /api/admin/payments/{invalid}/proof-file - Invalid ID",
            "GET",
            "admin/payments/invalid-request-id/proof-file",
            404,
            use_admin_token=True
        )
        
        if success:
            self.log_test(
                "Invalid Request ID Handling",
                True,
                "Invalid request ID properly rejected with 404"
            )
        else:
            self.log_test(
                "Invalid Request ID Handling",
                False,
                "Invalid request ID not properly handled"
            )
        
        # Test 5: Test without admin authentication
        success, unauth_response = self.run_test(
            "GET /api/admin/payments/{id}/proof-file - No Auth",
            "GET",
            f"admin/payments/{payments_with_proof[0]['id']}/proof-file" if payments_with_proof else "admin/payments/test/proof-file",
            401,  # Should fail with 401 or 403
            use_admin_token=False
        )
        
        # Note: Might return 403 instead of 401, both are acceptable
        if success or (hasattr(self, 'last_response_status') and self.last_response_status == 403):
            self.log_test(
                "Authentication Required",
                True,
                "Unauthenticated access properly rejected"
            )
        else:
            self.log_test(
                "Authentication Required",
                False,
                "Unauthenticated access not properly rejected"
            )
        
        # Test 6: Analyze file paths and existence (informational)
        if payments_with_proof:
            sample_payment = payments_with_proof[0]
            self.log_test(
                "Payment Proof Data Analysis",
                True,
                f"Sample payment: ID={sample_payment.get('id', 'N/A')[:8]}, proof_id={sample_payment.get('payment_proof_id', 'N/A')[:8]}"
            )
        
        # Test 7: Summary of findings
        total_tests = len(payments_with_proof)
        success_rate = (successful_downloads / total_tests * 100) if total_tests > 0 else 0
        
        overall_success = successful_downloads > 0 and failed_downloads == 0
        
        self.log_test(
            "Payment Proof Download Summary",
            overall_success,
            f"Successfully downloaded {successful_downloads}/{total_tests} payment proofs (Success rate: {success_rate:.1f}%)"
        )
        
        # Test 8: Check specific error scenarios mentioned in review
        if failed_downloads > 0:
            self.log_test(
                "CRITICAL ISSUE IDENTIFIED",
                False,
                f"Payment proof download failures detected. Possible causes: (1) Missing files on disk, (2) Incorrect file paths in database, (3) File serving configuration issues, (4) CORS/authentication problems"
            )
        
        return overall_success

if __name__ == "__main__":
    tester = PaymentProofDownloadTester()
    
    print("🚀 STARTING Payment Proof Download Functionality Testing...")
    print(f"🌐 Base URL: {tester.base_url}")
    print(f"🔗 API URL: {tester.api_url}")
    print("=" * 80)
    
    # First authenticate as admin
    if tester.test_admin_login():
        # Then run the payment proof download test
        tester.test_payment_proof_download_functionality()
    else:
        print("ERROR: Failed to authenticate as admin - cannot run payment proof download tests")
    
    # Print final summary
    print(f"\n📊 TEST SUMMARY:")
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "No tests run")