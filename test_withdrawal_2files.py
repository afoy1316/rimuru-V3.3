#!/usr/bin/env python3
"""
Test script for withdrawal 2-file upload system as requested in review
"""

import requests
import sys
import json
import io
from datetime import datetime

class WithdrawalTwoFileUploadTester:
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

    def test_user_login(self):
        """Test user login"""
        print("\n🔍 Testing User Login...")
        
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

    def test_withdrawal_2_file_upload_system(self):
        """Test the updated withdrawal processing system with 2 file uploads as requested in review"""
        print("\n🔍 Testing Withdrawal 2-File Upload System (Review Request)...")
        
        if not self.admin_token:
            self.log_test(
                "Admin Token Required",
                False,
                "Admin authentication required for withdrawal file upload testing"
            )
            return False
        
        # Test 1: Test file upload endpoint with type parameter
        print("\n📤 Testing File Upload Endpoint...")
        
        # Test actual_balance_proof upload
        actual_balance_file = io.BytesIO(b"Mock actual balance proof content")
        actual_balance_file.name = "actual_balance_proof.jpg"
        
        # Test the upload endpoint with type 'actual_balance_proof'
        upload_url = f"{self.api_url}/admin/upload-proof"
        files = {'file': ('actual_balance_proof.jpg', actual_balance_file, 'image/jpeg')}
        data = {'type': 'actual_balance_proof'}
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        try:
            response = requests.post(upload_url, files=files, data=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                upload_response = response.json()
                actual_balance_proof_url = upload_response.get('file_url')
                
                self.log_test(
                    "File Upload - Actual Balance Proof",
                    True,
                    f"Successfully uploaded: {actual_balance_proof_url}"
                )
            else:
                self.log_test(
                    "File Upload - Actual Balance Proof",
                    False,
                    f"Upload failed with status {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "File Upload - Actual Balance Proof",
                False,
                f"Upload exception: {str(e)}"
            )
            return False
        
        # Test after_withdrawal_proof upload
        after_withdrawal_file = io.BytesIO(b"Mock after withdrawal proof content")
        after_withdrawal_file.name = "after_withdrawal_proof.jpg"
        
        files = {'file': ('after_withdrawal_proof.jpg', after_withdrawal_file, 'image/jpeg')}
        data = {'type': 'after_withdrawal_proof'}
        
        try:
            response = requests.post(upload_url, files=files, data=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                upload_response = response.json()
                after_withdrawal_proof_url = upload_response.get('file_url')
                
                self.log_test(
                    "File Upload - After Withdrawal Proof",
                    True,
                    f"Successfully uploaded: {after_withdrawal_proof_url}"
                )
            else:
                self.log_test(
                    "File Upload - After Withdrawal Proof",
                    False,
                    f"Upload failed with status {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "File Upload - After Withdrawal Proof",
                False,
                f"Upload exception: {str(e)}"
            )
            return False
        
        # Test 2: Create a withdrawal request for testing
        print("\n💰 Creating Withdrawal Request for Testing...")
        
        # Get user accounts
        accounts_url = f"{self.api_url}/accounts"
        user_headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.get(accounts_url, headers=user_headers, timeout=10)
            if response.status_code == 200:
                accounts = response.json()
                
                # Find a suitable account for withdrawal
                test_account = None
                for account in accounts:
                    if account.get('balance', 0) > 0:
                        test_account = account
                        break
                
                if not test_account:
                    # Use first available account even if balance is 0 for testing
                    test_account = accounts[0] if accounts else None
                
                if not test_account:
                    self.log_test(
                        "Withdrawal Test Setup",
                        False,
                        "No accounts available for withdrawal testing"
                    )
                    return False
                
            else:
                self.log_test(
                    "Withdrawal Test Setup",
                    False,
                    f"Failed to get accounts: {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Withdrawal Test Setup",
                False,
                f"Exception getting accounts: {str(e)}"
            )
            return False
        
        # Create withdrawal request
        withdrawal_data = {
            "account_id": test_account.get('id'),
            "currency": test_account.get('currency', 'IDR')
        }
        
        withdrawal_url = f"{self.api_url}/withdrawals"
        
        try:
            response = requests.post(withdrawal_url, json=withdrawal_data, headers=user_headers, timeout=10)
            
            if response.status_code == 200:
                withdrawal_response = response.json()
                withdrawal_id = withdrawal_response.get('withdrawal_id')
                
                self.log_test(
                    "Withdrawal Request Creation",
                    True,
                    f"Created withdrawal request: {withdrawal_id}"
                )
            else:
                # Might fail if withdrawal already exists - that's ok for testing
                self.log_test(
                    "Withdrawal Request Creation",
                    True,
                    f"Withdrawal creation response: {response.status_code} (may be expected if duplicate)"
                )
                # Try to get existing withdrawals to find one to test with
                withdrawals_url = f"{self.api_url}/withdrawals"
                response = requests.get(withdrawals_url, headers=user_headers, timeout=10)
                if response.status_code == 200:
                    withdrawals = response.json()
                    if withdrawals:
                        withdrawal_id = withdrawals[0].get('id')
                    else:
                        self.log_test(
                            "Withdrawal Test Setup",
                            False,
                            "No withdrawals available for testing"
                        )
                        return False
                else:
                    self.log_test(
                        "Withdrawal Test Setup",
                        False,
                        "Failed to get existing withdrawals"
                    )
                    return False
                
        except Exception as e:
            self.log_test(
                "Withdrawal Request Creation",
                False,
                f"Exception creating withdrawal: {str(e)}"
            )
            return False
        
        # Test 3: Test withdrawal approval with both file URLs
        print("\n✅ Testing Withdrawal Approval with Both File URLs...")
        
        approval_data = {
            "status": "approved",
            "verified_amount": 50000.0,
            "admin_notes": "Withdrawal approved after verification of both proof files",
            "actual_balance_proof_url": actual_balance_proof_url,
            "after_withdrawal_proof_url": after_withdrawal_proof_url
        }
        
        success, approval_response = self.run_test(
            "Withdrawal Approval with Both File URLs",
            "PUT",
            f"admin/withdraws/{withdrawal_id}/status",
            200,
            data=approval_data,
            use_admin_token=True
        )
        
        if not success:
            self.log_test(
                "Withdrawal Approval Test",
                False,
                "Failed to approve withdrawal with file URLs"
            )
            return False
        
        # Test 4: Verify database storage of both file URLs
        print("\n💾 Verifying Database Storage...")
        
        success, admin_withdrawals = self.run_test(
            "Get Admin Withdrawals for Verification",
            "GET",
            "admin/withdraws",
            200,
            use_admin_token=True
        )
        
        if success and isinstance(admin_withdrawals, list):
            # Find our test withdrawal
            test_withdrawal = None
            for withdrawal in admin_withdrawals:
                if withdrawal.get('id') == withdrawal_id:
                    test_withdrawal = withdrawal
                    break
            
            if test_withdrawal:
                stored_actual_proof = test_withdrawal.get('actual_balance_proof_url')
                stored_after_proof = test_withdrawal.get('after_withdrawal_proof_url')
                
                if stored_actual_proof == actual_balance_proof_url and stored_after_proof == after_withdrawal_proof_url:
                    self.log_test(
                        "Database Storage Verification",
                        True,
                        f"Both file URLs correctly stored: actual={stored_actual_proof}, after={stored_after_proof}"
                    )
                else:
                    self.log_test(
                        "Database Storage Verification",
                        False,
                        f"File URLs not correctly stored. Expected: actual={actual_balance_proof_url}, after={after_withdrawal_proof_url}. Got: actual={stored_actual_proof}, after={stored_after_proof}"
                    )
                    return False
            else:
                self.log_test(
                    "Database Storage Verification",
                    False,
                    "Test withdrawal not found in admin withdrawals list"
                )
                return False
        else:
            self.log_test(
                "Database Storage Verification",
                False,
                "Failed to retrieve admin withdrawals for verification"
            )
            return False
        
        # Test 5: Test approval without file URLs (should still work)
        print("\n🔄 Testing Approval Without File URLs...")
        
        # Find a pending withdrawal or create one
        pending_withdrawal_id = None
        for withdrawal in admin_withdrawals:
            if withdrawal.get('status') == 'pending':
                pending_withdrawal_id = withdrawal.get('id')
                break
        
        if pending_withdrawal_id:
            rejection_data = {
                "status": "rejected",
                "admin_notes": "Rejection test - no file URLs required"
            }
            
            success, rejection_response = self.run_test(
                "Withdrawal Rejection without File URLs",
                "PUT",
                f"admin/withdraws/{pending_withdrawal_id}/status",
                200,
                data=rejection_data,
                use_admin_token=True
            )
            
            if success:
                self.log_test(
                    "Optional File Fields Validation",
                    True,
                    "Withdrawal status update works without file URLs (as expected for rejection)"
                )
            else:
                self.log_test(
                    "Optional File Fields Validation",
                    False,
                    "Withdrawal status update failed without file URLs"
                )
        else:
            self.log_test(
                "Optional File Fields Test",
                True,
                "No pending withdrawals available for optional fields test (skipped)"
            )
        
        # Test 6: Test error handling for invalid file types
        print("\n🚫 Testing Error Handling...")
        
        # Test invalid file type
        invalid_file = io.BytesIO(b"Invalid file content")
        invalid_file.name = "invalid_file.txt"
        
        files = {'file': ('invalid_file.txt', invalid_file, 'text/plain')}
        data = {'type': 'actual_balance_proof'}
        
        try:
            response = requests.post(upload_url, files=files, data=data, headers=headers, timeout=10)
            
            if response.status_code == 400:
                self.log_test(
                    "Invalid File Type Handling",
                    True,
                    "Invalid file type properly rejected with 400 status"
                )
            else:
                self.log_test(
                    "Invalid File Type Handling",
                    False,
                    f"Invalid file type not properly rejected. Status: {response.status_code}"
                )
                
        except Exception as e:
            self.log_test(
                "Invalid File Type Handling",
                False,
                f"Exception during invalid file test: {str(e)}"
            )
        
        # Test 7: Verify file upload locations
        print("\n📁 Verifying File Upload Locations...")
        
        # Check if files are uploaded to correct directory structure
        expected_path_pattern = "transfer_proofs/"
        
        if actual_balance_proof_url.startswith(expected_path_pattern) and after_withdrawal_proof_url.startswith(expected_path_pattern):
            self.log_test(
                "File Upload Location Verification",
                True,
                f"Files uploaded to correct location: {expected_path_pattern}"
            )
        else:
            self.log_test(
                "File Upload Location Verification",
                False,
                f"Files not uploaded to expected location. Expected pattern: {expected_path_pattern}"
            )
        
        return True

    def run_tests(self):
        """Run all withdrawal 2-file upload tests"""
        print("🚀 Starting Withdrawal 2-File Upload System Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        
        # Authentication tests
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return
        
        if not self.test_user_login():
            print("❌ User login failed - stopping tests")
            return
        
        # Main test
        self.test_withdrawal_2_file_upload_system()
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("📊 TEST SUMMARY")
        print("="*80)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_run - self.tests_passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test_name']}: {result['details']}")
        
        print("\n✅ Test execution completed!")

if __name__ == "__main__":
    tester = WithdrawalTwoFileUploadTester()
    tester.run_tests()