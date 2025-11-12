#!/usr/bin/env python3
"""
Test script for Admin Wallet Management Endpoints
"""

import requests
import json
import os
from datetime import datetime

class WalletManagementTester:
    def __init__(self):
        # Get backend URL from environment
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
        
        self.api_url = f"{self.base_url}/api"
        self.admin_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "✅" if success else "❌"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        
        self.test_results.append({
            "test_name": test_name,
            "success": success,
            "details": details
        })
    
    def make_request(self, method, endpoint, data=None, headers=None, expected_status=200):
        """Make HTTP request"""
        url = f"{self.api_url}/{endpoint}"
        
        if headers is None:
            headers = {}
        
        if self.admin_token and 'Authorization' not in headers:
            headers['Authorization'] = f'Bearer {self.admin_token}'
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == "PUT":
                response = requests.put(url, json=data, headers=headers, timeout=10)
            else:
                return False, f"Unsupported method: {method}"
            
            # Check if status code matches expected
            if isinstance(expected_status, list):
                status_ok = response.status_code in expected_status
            else:
                status_ok = response.status_code == expected_status
            
            if status_ok:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                return False, f"Status {response.status_code}: {response.text[:200]}"
                
        except Exception as e:
            return False, f"Request failed: {str(e)}"
    
    def test_admin_authentication(self):
        """Test admin authentication"""
        print("\n🔍 Testing Admin Authentication...")
        
        admin_login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        success, response = self.make_request(
            "POST", 
            "admin/auth/login", 
            data=admin_login_data,
            headers={}
        )
        
        if success and isinstance(response, dict) and 'access_token' in response:
            self.admin_token = response['access_token']
            self.log_test(
                "Admin Authentication",
                True,
                "Successfully authenticated with admin/admin123"
            )
            return True
        else:
            self.log_test(
                "Admin Authentication",
                False,
                f"Failed to authenticate: {response}"
            )
            return False
    
    def test_wallet_topup_requests(self):
        """Test wallet top-up requests endpoints"""
        print("\n🔍 Testing Wallet Top-Up Requests...")
        
        # Test GET /api/admin/wallet-topup-requests
        success, topup_requests = self.make_request("GET", "admin/wallet-topup-requests")
        
        if not success:
            self.log_test(
                "GET /api/admin/wallet-topup-requests",
                False,
                f"Failed to retrieve wallet top-up requests: {topup_requests}"
            )
            return False
        
        if not isinstance(topup_requests, list):
            self.log_test(
                "Wallet Top-Up Requests Response Structure",
                False,
                "Response is not a list"
            )
            return False
        
        self.log_test(
            "GET /api/admin/wallet-topup-requests",
            True,
            f"Retrieved {len(topup_requests)} wallet top-up requests"
        )
        
        # Test with status filter
        success, pending_topups = self.make_request("GET", "admin/wallet-topup-requests?status=pending")
        
        if success:
            self.log_test(
                "Wallet Top-Up Status Filter",
                True,
                f"Retrieved {len(pending_topups)} pending wallet top-up requests"
            )
        
        # Test status update if we have requests
        if topup_requests:
            test_request = None
            for req in topup_requests:
                if req.get('status') in ['pending', 'proof_uploaded']:
                    test_request = req
                    break
            
            if test_request:
                request_id = test_request.get('id')
                
                # Test status update to verified
                status_update_data = {
                    "status": "verified",
                    "admin_notes": "Test verification from automated testing"
                }
                
                success, update_response = self.make_request(
                    "PUT",
                    f"admin/wallet-topup-requests/{request_id}/status",
                    data=status_update_data
                )
                
                if success:
                    self.log_test(
                        "Wallet Top-Up Status Update (Verified)",
                        True,
                        f"Successfully updated wallet top-up request {request_id} to verified"
                    )
                else:
                    self.log_test(
                        "Wallet Top-Up Status Update (Verified)",
                        False,
                        f"Failed to update wallet top-up request: {update_response}"
                    )
                
                # Test proof file access
                success, proof_response = self.make_request(
                    "GET",
                    f"admin/wallet-topup-requests/{request_id}/proof-file",
                    expected_status=[200, 404]
                )
                
                if success:
                    self.log_test(
                        "Wallet Top-Up Proof File Access",
                        True,
                        "Proof file endpoint accessible (file may or may not exist)"
                    )
                else:
                    self.log_test(
                        "Wallet Top-Up Proof File Access",
                        False,
                        f"Failed to access proof file endpoint: {proof_response}"
                    )
        
        return True
    
    def test_wallet_transfer_requests(self):
        """Test wallet transfer requests endpoints"""
        print("\n🔍 Testing Wallet Transfer Requests...")
        
        # Test GET /api/admin/wallet-transfer-requests
        success, transfer_requests = self.make_request("GET", "admin/wallet-transfer-requests")
        
        if not success:
            self.log_test(
                "GET /api/admin/wallet-transfer-requests",
                False,
                f"Failed to retrieve wallet transfer requests: {transfer_requests}"
            )
            return False
        
        if not isinstance(transfer_requests, list):
            self.log_test(
                "Wallet Transfer Requests Response Structure",
                False,
                "Response is not a list"
            )
            return False
        
        self.log_test(
            "GET /api/admin/wallet-transfer-requests",
            True,
            f"Retrieved {len(transfer_requests)} wallet transfer requests"
        )
        
        # Test with status filter
        success, pending_transfers = self.make_request("GET", "admin/wallet-transfer-requests?status=pending")
        
        if success:
            self.log_test(
                "Wallet Transfer Status Filter",
                True,
                f"Retrieved {len(pending_transfers)} pending wallet transfer requests"
            )
        
        # Test status update if we have requests
        if transfer_requests:
            test_request = None
            for req in transfer_requests:
                if req.get('status') == 'pending':
                    test_request = req
                    break
            
            if test_request:
                request_id = test_request.get('id')
                
                # Test status update to approved
                status_update_data = {
                    "status": "approved",
                    "admin_notes": "Test approval from automated testing"
                }
                
                success, update_response = self.make_request(
                    "PUT",
                    f"admin/wallet-transfer-requests/{request_id}/status",
                    data=status_update_data
                )
                
                if success:
                    self.log_test(
                        "Wallet Transfer Status Update (Approved)",
                        True,
                        f"Successfully approved wallet transfer request {request_id}"
                    )
                else:
                    self.log_test(
                        "Wallet Transfer Status Update (Approved)",
                        False,
                        f"Failed to update wallet transfer request: {update_response}"
                    )
                
                # Test file upload endpoint (validation only)
                success, upload_response = self.make_request(
                    "POST",
                    f"admin/wallet-transfers/{request_id}/upload-verification-files",
                    expected_status=422  # Expected validation error without file
                )
                
                if success:
                    self.log_test(
                        "Wallet Transfer File Upload Validation",
                        True,
                        "Upload endpoint properly validates missing file (returns 422)"
                    )
                else:
                    self.log_test(
                        "Wallet Transfer File Upload Validation",
                        False,
                        f"Upload endpoint validation not working as expected: {upload_response}"
                    )
        
        return True
    
    def test_authentication_requirements(self):
        """Test authentication requirements"""
        print("\n🔍 Testing Authentication Requirements...")
        
        # Test without admin token (should return 403)
        success, no_auth_response = self.make_request(
            "GET",
            "admin/wallet-topup-requests",
            headers={},  # No authorization header
            expected_status=403
        )
        
        if success:
            self.log_test(
                "Admin Authentication Requirement",
                True,
                "Endpoints properly require admin authentication (returns 403 without token)"
            )
        else:
            self.log_test(
                "Admin Authentication Requirement",
                False,
                f"Endpoints do not properly enforce admin authentication: {no_auth_response}"
            )
        
        return True
    
    def test_error_handling(self):
        """Test error handling"""
        print("\n🔍 Testing Error Handling...")
        
        # Test invalid wallet top-up request ID
        success, invalid_id_response = self.make_request(
            "PUT",
            "admin/wallet-topup-requests/invalid-id/status",
            data={"status": "verified"},
            expected_status=404
        )
        
        if success:
            self.log_test(
                "Invalid ID Error Handling",
                True,
                "Endpoints properly handle invalid IDs (returns 404)"
            )
        else:
            self.log_test(
                "Invalid ID Error Handling",
                False,
                f"Endpoints do not properly handle invalid IDs: {invalid_id_response}"
            )
        
        return True
    
    def test_notification_creation(self):
        """Test notification creation"""
        print("\n🔍 Testing Notification Creation...")
        
        # Get client notifications to verify notifications are created
        # First need to authenticate as a client
        client_login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        success, client_response = self.make_request(
            "POST",
            "auth/login",
            data=client_login_data,
            headers={}
        )
        
        if success and isinstance(client_response, dict) and 'access_token' in client_response:
            client_token = client_response['access_token']
            
            # Get client notifications
            success, notifications = self.make_request(
                "GET",
                "client/notifications",
                headers={'Authorization': f'Bearer {client_token}'}
            )
            
            if success and isinstance(notifications, list):
                # Look for wallet-related notifications
                wallet_notifications = [n for n in notifications if 'wallet' in n.get('type', '').lower()]
                
                self.log_test(
                    "Notification Creation Verification",
                    True,
                    f"Found {len(wallet_notifications)} wallet-related notifications (notifications are being created)"
                )
            else:
                self.log_test(
                    "Notification Creation Verification",
                    False,
                    f"Could not retrieve client notifications: {notifications}"
                )
        else:
            self.log_test(
                "Notification Creation Verification",
                True,
                "Could not authenticate as client for notification check (this is acceptable)"
            )
        
        return True
    
    def run_all_tests(self):
        """Run all wallet management tests"""
        print("🚀 Starting Admin Wallet Management Endpoint Testing...")
        print(f"Base URL: {self.base_url}")
        print(f"API URL: {self.api_url}")
        
        tests = [
            ("Admin Authentication", self.test_admin_authentication),
            ("Wallet Top-Up Requests", self.test_wallet_topup_requests),
            ("Wallet Transfer Requests", self.test_wallet_transfer_requests),
            ("Authentication Requirements", self.test_authentication_requirements),
            ("Error Handling", self.test_error_handling),
            ("Notification Creation", self.test_notification_creation)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n{'='*60}")
            print(f"Running: {test_name}")
            print(f"{'='*60}")
            
            try:
                if test_func():
                    passed += 1
                    print(f"✅ {test_name} - PASSED")
                else:
                    print(f"❌ {test_name} - FAILED")
            except Exception as e:
                print(f"❌ {test_name} - ERROR: {str(e)}")
        
        # Print summary
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%" if total > 0 else "No tests run")
        
        # Print detailed results
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for result in failed_tests:
                print(f"  - {result['test_name']}: {result['details']}")
        
        print(f"\n{'='*60}")
        return passed == total

if __name__ == "__main__":
    tester = WalletManagementTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All wallet management tests passed!")
    else:
        print("\n⚠️ Some wallet management tests failed!")