import requests
import sys
import json
import time
import jwt
from datetime import datetime

class AuthenticationTester:
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

    def test_basic_authentication_endpoints(self):
        """Test basic authentication endpoints with testuser/testpass123 credentials"""
        print("\n🔍 Testing Basic Authentication Endpoints...")
        
        # Test 1: POST /api/auth/login with testuser/testpass123 credentials
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "User Login (testuser/testpass123)",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if not success:
            self.log_test(
                "Basic Authentication Setup",
                False,
                "Failed to login with testuser/testpass123 credentials"
            )
            return False
        
        if 'access_token' not in response:
            self.log_test(
                "Token Generation",
                False,
                "Login response missing access_token"
            )
            return False
        
        self.token = response['access_token']
        
        # Test 2: GET /api/auth/me with returned token to verify token validation
        success, me_response = self.run_test(
            "Token Validation (/api/auth/me)",
            "GET",
            "auth/me",
            200
        )
        
        if not success:
            self.log_test(
                "Token Validation",
                False,
                "Failed to validate token with /api/auth/me"
            )
            return False
        
        # Verify response contains expected user data
        expected_fields = ['id', 'username', 'email', 'wallet_balance_idr', 'wallet_balance_usd']
        for field in expected_fields:
            if field not in me_response:
                self.log_test(
                    f"User Data Field: {field}",
                    False,
                    f"Missing expected field {field} in /api/auth/me response"
                )
                return False
        
        # Test 3: Test token expiration (currently set to 30 minutes)
        try:
            # Decode without verification to check expiration
            decoded = jwt.decode(self.token, options={"verify_signature": False})
            if 'exp' in decoded:
                current_time = time.time()
                token_exp = decoded['exp']
                time_until_exp = token_exp - current_time
                
                self.log_test(
                    "Token Expiration Check",
                    True,
                    f"Token expires in {time_until_exp/60:.1f} minutes"
                )
            else:
                self.log_test(
                    "Token Expiration Check",
                    False,
                    "Token missing expiration field"
                )
        except Exception as e:
            self.log_test(
                "Token Expiration Check",
                False,
                f"Failed to decode token: {str(e)}"
            )
        
        return True

    def test_admin_authentication_endpoints(self):
        """Test admin authentication endpoints"""
        print("\n🔍 Testing Admin Authentication Endpoints...")
        
        # Test 1: POST /api/admin/auth/login with admin/admin123 credentials
        admin_login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login (admin/admin123)",
            "POST",
            "admin/auth/login",
            200,
            data=admin_login_data
        )
        
        if not success:
            self.log_test(
                "Admin Authentication Setup",
                False,
                "Failed to login with admin/admin123 credentials"
            )
            return False
        
        if 'access_token' not in response:
            self.log_test(
                "Admin Token Generation",
                False,
                "Admin login response missing access_token"
            )
            return False
        
        self.admin_token = response['access_token']
        
        # Test 2: GET /api/admin/auth/me with admin token
        success, admin_me_response = self.run_test(
            "Admin Token Validation (/api/admin/auth/me)",
            "GET",
            "admin/auth/me",
            200,
            use_admin_token=True
        )
        
        if not success:
            self.log_test(
                "Admin Token Validation",
                False,
                "Failed to validate admin token with /api/admin/auth/me"
            )
            return False
        
        # Verify admin response contains expected fields
        expected_admin_fields = ['username', 'email', 'full_name', 'is_super_admin', 'created_at']
        for field in expected_admin_fields:
            if field not in admin_me_response:
                self.log_test(
                    f"Admin Data Field: {field}",
                    False,
                    f"Missing expected field {field} in /api/admin/auth/me response"
                )
                return False
        
        return True

    def test_session_management_and_token_persistence(self):
        """Test session management and token persistence issues"""
        print("\n🔍 Testing Session Management and Token Persistence...")
        
        if not self.token:
            self.log_test(
                "Session Management Setup",
                False,
                "No user token available for session testing"
            )
            return False
        
        # Test multiple API calls in sequence to simulate normal usage
        api_calls = [
            ("auth/me", "GET"),
            ("accounts", "GET"),
            ("transactions", "GET"),
            ("dashboard/stats", "GET"),
            ("auth/me", "GET")  # Test again to check persistence
        ]
        
        session_errors = 0
        for i, (endpoint, method) in enumerate(api_calls):
            success, response = self.run_test(
                f"Session Test Call {i+1}: {endpoint}",
                method,
                endpoint,
                200
            )
            
            if not success:
                session_errors += 1
        
        if session_errors > 0:
            self.log_test(
                "Session Management",
                False,
                f"Found {session_errors} session-related errors out of {len(api_calls)} calls"
            )
            return False
        
        # Test admin session management
        if not self.admin_token:
            self.log_test(
                "Admin Session Management Setup",
                False,
                "No admin token available for admin session testing"
            )
            return False
        
        admin_api_calls = [
            ("admin/auth/me", "GET"),
            ("admin/clients", "GET"),
            ("admin/requests", "GET"),
            ("admin/auth/me", "GET")  # Test again
        ]
        
        admin_session_errors = 0
        for i, (endpoint, method) in enumerate(admin_api_calls):
            success, response = self.run_test(
                f"Admin Session Test Call {i+1}: {endpoint}",
                method,
                endpoint,
                200,
                use_admin_token=True
            )
            
            if not success:
                admin_session_errors += 1
        
        if admin_session_errors > 0:
            self.log_test(
                "Admin Session Management",
                False,
                f"Found {admin_session_errors} admin session errors out of {len(admin_api_calls)} calls"
            )
            return False
        
        return True

    def test_multi_step_workflow_authentication(self):
        """Test multi-step workflow authentication persistence"""
        print("\n🔍 Testing Multi-Step Workflow Authentication Persistence...")
        
        if not self.token:
            self.log_test(
                "Multi-Step Workflow Setup",
                False,
                "No user token available for multi-step workflow testing"
            )
            return False
        
        # Simulate a multi-step workflow like "Add to Group" or "Withdrawal"
        workflow_steps = [
            ("accounts", "GET", "Get user accounts"),
            ("account-groups", "GET", "Get account groups"),
            ("auth/me", "GET", "Check user profile"),
            ("transactions", "GET", "Get transactions"),
            ("dashboard/stats", "GET", "Check dashboard stats"),
        ]
        
        workflow_errors = 0
        start_time = time.time()
        
        for i, (endpoint, method, description) in enumerate(workflow_steps):
            # Add small delay between calls to simulate real usage
            if i > 0:
                time.sleep(2)  # 2 second delay between calls
            
            success, response = self.run_test(
                f"Workflow Step {i+1}: {description}",
                method,
                endpoint,
                200
            )
            
            if not success:
                workflow_errors += 1
        
        total_time = time.time() - start_time
        
        if workflow_errors > 0:
            self.log_test(
                "Multi-Step Workflow Authentication",
                False,
                f"Found {workflow_errors} authentication errors during {total_time:.1f}s workflow"
            )
            return False
        
        self.log_test(
            "Multi-Step Workflow Authentication",
            True,
            f"Authentication stayed valid throughout {total_time:.1f}s workflow"
        )
        
        return True

    def test_authentication_error_patterns(self):
        """Look for patterns in error logs that might indicate authentication issues"""
        print("\n🔍 Testing Authentication Error Patterns...")
        
        # Test various authentication failure scenarios
        error_scenarios = [
            {
                "name": "Invalid User Credentials",
                "endpoint": "auth/login",
                "method": "POST",
                "data": {"username": "testuser", "password": "wrongpassword"},
                "expected_status": 401
            },
            {
                "name": "Invalid Admin Credentials", 
                "endpoint": "admin/auth/login",
                "method": "POST",
                "data": {"username": "admin", "password": "wrongpassword"},
                "expected_status": 401
            },
            {
                "name": "Invalid Token Format",
                "endpoint": "auth/me",
                "method": "GET",
                "headers": {"Authorization": "Bearer invalid_token_format"},
                "expected_status": 401
            },
            {
                "name": "Missing Token",
                "endpoint": "auth/me", 
                "method": "GET",
                "expected_status": 401
            }
        ]
        
        error_pattern_success = True
        
        for scenario in error_scenarios:
            headers = scenario.get("headers", {})
            
            # Temporarily clear tokens if testing without auth
            original_token = self.token
            original_admin_token = self.admin_token
            
            if "Missing Token" in scenario["name"]:
                self.token = None
                self.admin_token = None
            
            success, response = self.run_test(
                scenario["name"],
                scenario["method"],
                scenario["endpoint"],
                scenario["expected_status"],
                data=scenario.get("data"),
                headers=headers if headers else None
            )
            
            # Restore tokens
            self.token = original_token
            self.admin_token = original_admin_token
            
            if not success:
                error_pattern_success = False
        
        return error_pattern_success

    def run_all_authentication_tests(self):
        """Run all authentication tests"""
        print("🔐 Starting Comprehensive Authentication System Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 80)
        
        # Test basic authentication endpoints
        auth_tests = [
            self.test_basic_authentication_endpoints,
            self.test_admin_authentication_endpoints,
            self.test_session_management_and_token_persistence,
            self.test_multi_step_workflow_authentication,
            self.test_authentication_error_patterns
        ]
        
        auth_success = True
        for test in auth_tests:
            try:
                if not test():
                    auth_success = False
            except Exception as e:
                self.log_test(
                    test.__name__,
                    False,
                    f"Authentication test execution error: {str(e)}"
                )
                auth_success = False
        
        # Print summary
        print(f"\n📊 AUTHENTICATION SYSTEM TESTS SUMMARY")
        print("=" * 80)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if auth_success:
            print("✅ All authentication system tests passed!")
        else:
            print("❌ Some authentication system tests failed!")
        
        return auth_success

def main():
    """Main function to run authentication system tests"""
    tester = AuthenticationTester()
    return tester.run_all_authentication_tests()

if __name__ == "__main__":
    sys.exit(0 if main() else 1)