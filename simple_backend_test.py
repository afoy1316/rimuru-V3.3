#!/usr/bin/env python3
"""
Simple Backend Test for Client Management Loading Fix
Tests the core functionality without external network dependencies
"""

import requests
import json
import time
import sys
from datetime import datetime

class SimpleClientManagementTest:
    def __init__(self):
        self.base_url = "http://127.0.0.1:8001"
        self.api_url = f"{self.base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        
        # Test credentials
        self.admin_username = "admin"
        self.admin_password = "admin123"

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def test_admin_authentication(self):
        """Test admin authentication"""
        print("\n🔍 Testing Admin Authentication...")
        
        admin_login_data = {
            "username": self.admin_username,
            "password": self.admin_password
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/admin/auth/login",
                json=admin_login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.admin_token = data['access_token']
                    self.log_test("Admin Login", True, f"Status: {response.status_code}")
                    return True
                else:
                    self.log_test("Admin Login", False, "No access_token in response")
                    return False
            else:
                self.log_test("Admin Login", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False

    def test_valid_token_clients_endpoint(self):
        """Test GET /api/admin/clients with valid admin token"""
        print("\n🔍 Testing GET /api/admin/clients with Valid Token...")
        
        if not self.admin_token:
            self.log_test("Valid Token Test", False, "No admin token available")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            start_time = time.time()
            
            response = requests.get(
                f"{self.api_url}/admin/clients",
                headers=headers,
                timeout=10
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response is a list
                if isinstance(data, list):
                    self.log_test(
                        "GET /api/admin/clients with Valid Token",
                        True,
                        f"Status: 200, Response time: {response_time:.3f}s, Clients: {len(data)}"
                    )
                    
                    # Check response time
                    if response_time < 5.0:
                        self.log_test(
                            "Response Time Check",
                            True,
                            f"Response time {response_time:.3f}s < 5 seconds"
                        )
                    else:
                        self.log_test(
                            "Response Time Check",
                            False,
                            f"Response time {response_time:.3f}s >= 5 seconds"
                        )
                    
                    # Check required fields if clients exist
                    if len(data) > 0:
                        client = data[0]
                        required_fields = ['id', 'username', 'email', 'name']
                        missing_fields = [field for field in required_fields if field not in client]
                        
                        if not missing_fields:
                            self.log_test(
                                "Required Fields Present",
                                True,
                                f"All required fields found: {required_fields}"
                            )
                        else:
                            self.log_test(
                                "Required Fields Check",
                                False,
                                f"Missing fields: {missing_fields}"
                            )
                    else:
                        self.log_test(
                            "Empty Database Handling",
                            True,
                            "Empty array returned for database with 0 clients"
                        )
                    
                    return True
                else:
                    self.log_test(
                        "Response Format Check",
                        False,
                        f"Expected list, got {type(data)}"
                    )
                    return False
            else:
                self.log_test(
                    "GET /api/admin/clients with Valid Token",
                    False,
                    f"Status: {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test("Valid Token Test", False, f"Exception: {str(e)}")
            return False

    def test_invalid_token_handling(self):
        """Test authentication error handling with invalid token"""
        print("\n🔍 Testing Authentication Error Handling...")
        
        try:
            headers = {'Authorization': 'Bearer invalid_token_12345'}
            
            response = requests.get(
                f"{self.api_url}/admin/clients",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 401:
                self.log_test(
                    "Invalid Token Returns 401",
                    True,
                    f"Status: {response.status_code}"
                )
                return True
            else:
                self.log_test(
                    "Invalid Token Handling",
                    False,
                    f"Expected 401, got {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test("Invalid Token Test", False, f"Exception: {str(e)}")
            return False

    def test_no_token_handling(self):
        """Test endpoint without Authorization header"""
        print("\n🔍 Testing Endpoint Without Token...")
        
        try:
            response = requests.get(
                f"{self.api_url}/admin/clients",
                timeout=10
            )
            
            if response.status_code in [401, 403]:
                self.log_test(
                    "No Token Returns 401/403",
                    True,
                    f"Status: {response.status_code}"
                )
                return True
            else:
                self.log_test(
                    "No Token Handling",
                    False,
                    f"Expected 401/403, got {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test("No Token Test", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run comprehensive test for Client Management Page Loading Fix"""
        print("\n" + "="*80)
        print("🔍 CLIENT MANAGEMENT PAGE LOADING FIX TESTING")
        print("="*80)
        print("Testing the fix for Client Management page stuck on 'Memuat data...' (Loading data)")
        print("Issue: Invalid/expired admin token causing 401 authentication errors")
        print("Fix: Enhanced error handling, token checks, timeouts, and database indexes")
        print("="*80)
        
        # Step 1: Admin Authentication
        print("\n📋 Step 1: Admin Authentication")
        if not self.test_admin_authentication():
            print("\n❌ CRITICAL: Admin authentication failed!")
            return False
        
        # Step 2: Test GET /api/admin/clients with Valid Token
        print("\n📋 Step 2: Test GET /api/admin/clients with Valid Token")
        self.test_valid_token_clients_endpoint()
        
        # Step 3: Test Authentication Error Handling
        print("\n📋 Step 3: Test Authentication Error Handling")
        self.test_invalid_token_handling()
        
        # Step 4: Test Endpoint Without Token
        print("\n📋 Step 4: Test Endpoint Without Token")
        self.test_no_token_handling()
        
        # Summary
        print(f"\n" + "="*80)
        print(f"📊 CLIENT MANAGEMENT LOADING FIX TEST SUMMARY")
        print(f"="*80)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print(f"\n✅ ALL TESTS PASSED - Client Management loading fix is working correctly!")
            print(f"✅ Valid admin token returns clients list successfully")
            print(f"✅ Invalid tokens properly return 401 authentication errors")
            print(f"✅ Missing tokens properly return 401/403 errors")
            print(f"✅ Response time is reasonable (< 5 seconds)")
            print(f"✅ Client Management page should no longer be stuck on 'Loading data'")
            return True
        else:
            print(f"\n❌ SOME TESTS FAILED - Loading fix needs attention")
            return False

if __name__ == "__main__":
    print("🚀 Starting Simple Client Management Page Loading Fix Testing...")
    
    tester = SimpleClientManagementTest()
    success = tester.run_comprehensive_test()
    
    print(f"\n" + "="*80)
    print(f"🎯 FINAL TEST RESULTS")
    print(f"="*80)
    
    if success:
        print(f"✅ CLIENT MANAGEMENT LOADING FIX: WORKING CORRECTLY")
        print(f"   - Valid admin token returns clients list successfully ✅")
        print(f"   - Invalid tokens properly return 401 authentication errors ✅")
        print(f"   - Missing tokens properly return 401/403 errors ✅")
        print(f"   - Response time is reasonable (< 5 seconds) ✅")
        print(f"   - Client Management page should no longer be stuck on 'Loading data' ✅")
    else:
        print(f"❌ CLIENT MANAGEMENT LOADING FIX: NEEDS ATTENTION")
        print(f"   - Some tests failed - check detailed output above")
    
    print(f"\n🏁 Testing completed!")
    
    if success:
        print("\n🎉 All tests passed! Client Management loading fix is working correctly.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the implementation.")
        sys.exit(1)