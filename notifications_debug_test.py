import requests
import sys
import json
from datetime import datetime

class NotificationsDebugTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.client_token = None
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

    def run_api_call(self, method, endpoint, expected_status, data=None, use_admin_token=False):
        """Run a single API call"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if use_admin_token and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'
        elif self.client_token:
            headers['Authorization'] = f'Bearer {self.client_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            
            success = response.status_code == expected_status
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                return False, {"status_code": response.status_code, "text": response.text[:200]}

        except Exception as e:
            return False, {"error": str(e)}

    def test_notifications_debug(self):
        """Debug Notifications API - Check if notifications exist"""
        print("\n🔍 DEBUG NOTIFICATIONS API - CHECK IF NOTIFICATIONS EXIST...")
        
        # Step 1: Admin Login
        print("\n🔍 Step 1: Admin Login...")
        admin_login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        success, admin_response = self.run_api_call(
            "POST", "admin/auth/login", 200, data=admin_login_data
        )
        
        if not success or 'access_token' not in admin_response:
            self.log_test("Admin Authentication", False, "Failed to authenticate as admin")
            return False
        
        self.admin_token = admin_response['access_token']
        self.log_test("Admin Authentication", True, "Successfully authenticated as admin")
        
        # Step 2: Check admin notifications
        print("\n🔍 Step 2: GET /api/admin/notifications...")
        success, admin_notifications = self.run_api_call(
            "GET", "admin/notifications", 200, use_admin_token=True
        )
        
        if not success:
            self.log_test("Admin Notifications API", False, f"API call failed: {admin_notifications}")
            return False
        
        if not isinstance(admin_notifications, list):
            self.log_test("Admin Notifications Format", False, f"Expected list, got {type(admin_notifications)}")
            return False
        
        admin_count = len(admin_notifications)
        self.log_test("Admin Notifications Count", True, f"Found {admin_count} admin notifications")
        
        # Step 3: Client Login
        print("\n🔍 Step 3: Client Login...")
        client_login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        success, client_response = self.run_api_call(
            "POST", "auth/login", 200, data=client_login_data
        )
        
        if not success or 'access_token' not in client_response:
            # Try creating test user
            print("🔍 Creating test user...")
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
            
            reg_success, reg_response = self.run_api_call(
                "POST", "auth/register", 200, data=test_user_data
            )
            
            if reg_success:
                success, client_response = self.run_api_call(
                    "POST", "auth/login", 200, data=client_login_data
                )
        
        if not success or 'access_token' not in client_response:
            self.log_test("Client Authentication", False, "Failed to authenticate as client")
            return False
        
        self.client_token = client_response['access_token']
        self.log_test("Client Authentication", True, "Successfully authenticated as client")
        
        # Step 4: Check client notifications
        print("\n🔍 Step 4: GET /api/client/notifications...")
        success, client_notifications = self.run_api_call(
            "GET", "client/notifications", 200
        )
        
        if not success:
            self.log_test("Client Notifications API", False, f"API call failed: {client_notifications}")
            return False
        
        if not isinstance(client_notifications, list):
            self.log_test("Client Notifications Format", False, f"Expected list, got {type(client_notifications)}")
            return False
        
        client_count = len(client_notifications)
        self.log_test("Client Notifications Count", True, f"Found {client_count} client notifications")
        
        # Step 5: Create test notification
        print("\n🔍 Step 5: Create test notification...")
        timestamp = datetime.now().strftime('%H%M%S')
        test_account_data = {
            "platform": "facebook",
            "account_name": f"Debug Test Account {timestamp}",
            "gmt": "GMT+7",
            "currency": "IDR",
            "delivery_method": "BM_ID",
            "bm_id_or_email": "123456789012345",
            "notes": "Test account for notifications debugging"
        }
        
        success, account_response = self.run_api_call(
            "POST", "accounts/request", 200, data=test_account_data
        )
        
        if success:
            self.log_test("Test Account Request", True, f"Created test request: {account_response.get('account_id', 'unknown')}")
            
            # Wait and re-check admin notifications
            import time
            time.sleep(2)
            
            success, updated_notifications = self.run_api_call(
                "GET", "admin/notifications", 200, use_admin_token=True
            )
            
            if success and isinstance(updated_notifications, list):
                updated_count = len(updated_notifications)
                if updated_count > admin_count:
                    self.log_test("Notification System", True, f"Count increased from {admin_count} to {updated_count}")
                else:
                    self.log_test("Notification System", False, f"Count did not increase (still {updated_count})")
            else:
                self.log_test("Notification System Check", False, "Failed to re-check notifications")
        else:
            self.log_test("Test Account Request", False, f"Failed to create test request: {account_response}")
        
        # Step 6: Summary
        print("\n🔍 Step 6: Summary and diagnosis...")
        
        if admin_count == 0 and client_count == 0:
            diagnosis = "ROOT CAUSE: Both admin and client notifications are empty in database"
            recommendation = "Create test notifications by performing actions (account requests, status updates)"
        elif admin_count > 0 or client_count > 0:
            diagnosis = f"NOTIFICATIONS EXIST: {admin_count} admin, {client_count} client notifications found"
            recommendation = "Check frontend API calls and response parsing if frontend shows 0"
        else:
            diagnosis = "MIXED RESULTS: Need further investigation"
            recommendation = "Debug frontend-backend integration"
        
        self.log_test("Diagnosis Complete", True, f"""
        DIAGNOSIS: {diagnosis}
        
        FINDINGS:
        - Admin notifications in database: {admin_count}
        - Client notifications in database: {client_count}
        - Admin API working: Yes
        - Client API working: Yes
        - Authentication working: Yes
        
        RECOMMENDATION: {recommendation}
        """)
        
        return True

if __name__ == "__main__":
    tester = NotificationsDebugTester()
    
    print("🚀 Starting Notifications Debug Test...")
    print(f"🌐 Base URL: {tester.base_url}")
    print(f"🔗 API URL: {tester.api_url}")
    
    try:
        success = tester.test_notifications_debug()
        if success:
            print("\n✅ NOTIFICATIONS DEBUG TEST COMPLETED")
        else:
            print("\n❌ NOTIFICATIONS DEBUG TEST FAILED")
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
    
    print(f"\n📊 Test Summary:")
    print(f"✅ Tests Passed: {tester.tests_passed}")
    print(f"❌ Tests Failed: {tester.tests_run - tester.tests_passed}")
    if tester.tests_run > 0:
        print(f"📈 Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")