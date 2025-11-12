#!/usr/bin/env python3
"""
Client Auto-Logout Fix Testing Script
Tests the specific fix for client token expiration (7 days vs admin 30 minutes)
"""

import requests
import json
import base64
from datetime import datetime, timezone

class ClientLogoutTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.client_token = None
        self.admin_token = None
        
    def decode_jwt_token(self, token):
        """Decode JWT token without verification to inspect payload"""
        try:
            # Split token and decode payload (middle part)
            parts = token.split('.')
            if len(parts) != 3:
                return None
            
            # Add padding if needed
            payload = parts[1]
            padding = 4 - len(payload) % 4
            if padding != 4:
                payload += '=' * padding
            
            # Decode base64
            decoded_bytes = base64.urlsafe_b64decode(payload)
            decoded_json = json.loads(decoded_bytes.decode('utf-8'))
            
            return decoded_json
        except Exception as e:
            print(f"❌ Error decoding JWT: {e}")
            return None

    def test_client_login(self):
        """Test client login and get token"""
        print("🔍 Testing Client Login...")
        
        client_login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json=client_login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.client_token = data['access_token']
                    print("✅ Client login successful")
                    return True
                else:
                    print("❌ No access token in response")
                    return False
            else:
                print(f"❌ Client login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Client login error: {e}")
            return False

    def test_admin_login(self):
        """Test admin login and get token"""
        print("🔍 Testing Admin Login...")
        
        admin_login_data = {
            "username": "admin",
            "password": "admin123"
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
                    print("✅ Admin login successful")
                    return True
                else:
                    print("❌ No access token in response")
                    return False
            else:
                print(f"❌ Admin login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Admin login error: {e}")
            return False

    def test_client_auth_endpoint(self):
        """Test client authentication endpoint"""
        print("🔍 Testing Client Auth Endpoint...")
        
        if not self.client_token:
            print("❌ No client token available")
            return False
            
        try:
            headers = {'Authorization': f'Bearer {self.client_token}'}
            response = requests.get(
                f"{self.api_url}/auth/me",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'username', 'email', 'wallet_balance_idr', 'wallet_balance_usd']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    print(f"❌ Missing fields in auth response: {missing_fields}")
                    return False
                else:
                    print("✅ Client auth endpoint working correctly")
                    return True
            else:
                print(f"❌ Client auth endpoint failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Client auth endpoint error: {e}")
            return False

    def test_multiple_api_calls(self):
        """Test multiple API calls with same client token"""
        print("🔍 Testing Multiple Client API Calls...")
        
        if not self.client_token:
            print("❌ No client token available")
            return False
            
        endpoints = [
            ("accounts", "GET", "accounts"),
            ("transactions", "GET", "transactions"),
            ("dashboard/stats", "GET", "dashboard/stats"),
            ("auth/me", "GET", "auth/me")
        ]
        
        successful_calls = 0
        headers = {'Authorization': f'Bearer {self.client_token}'}
        
        for name, method, endpoint in endpoints:
            try:
                response = requests.get(
                    f"{self.api_url}/{endpoint}",
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    successful_calls += 1
                    print(f"  ✅ {name}: Success")
                else:
                    print(f"  ❌ {name}: Failed ({response.status_code})")
                    
            except Exception as e:
                print(f"  ❌ {name}: Error - {e}")
        
        if successful_calls == len(endpoints):
            print(f"✅ All {len(endpoints)} API calls succeeded")
            return True
        else:
            print(f"❌ Only {successful_calls}/{len(endpoints)} API calls succeeded")
            return False

    def run_client_auto_logout_fix_test(self):
        """Main test for client auto-logout fix"""
        print("🚀 CLIENT AUTO-LOGOUT FIX TESTING")
        print("=" * 80)
        print("Testing JWT token expiration differences:")
        print("- Client tokens should expire in 7 days (CLIENT_TOKEN_EXPIRE_MINUTES = 10080)")
        print("- Admin tokens should expire in 30 minutes (ACCESS_TOKEN_EXPIRE_MINUTES = 30)")
        print("=" * 80)
        
        # Test 1: Client Login
        if not self.test_client_login():
            print("❌ Cannot proceed without client token")
            return False
            
        # Test 2: Admin Login
        if not self.test_admin_login():
            print("❌ Cannot proceed without admin token")
            return False
        
        # Test 3: Decode and analyze tokens
        print("\n🔍 Analyzing JWT Tokens...")
        
        client_payload = self.decode_jwt_token(self.client_token)
        admin_payload = self.decode_jwt_token(self.admin_token)
        
        if not client_payload or not admin_payload:
            print("❌ Failed to decode tokens")
            return False
        
        current_time = datetime.now(timezone.utc).timestamp()
        
        # Verify client token
        print("\n📋 CLIENT TOKEN ANALYSIS:")
        client_user_type = client_payload.get('user_type')
        client_exp = client_payload.get('exp')
        client_username = client_payload.get('sub')
        
        print(f"  Username: {client_username}")
        print(f"  User Type: {client_user_type}")
        print(f"  Expiration Timestamp: {client_exp}")
        
        if client_exp:
            client_exp_duration = client_exp - current_time
            client_exp_days = client_exp_duration / 86400
            print(f"  Expires in: {client_exp_days:.1f} days ({client_exp_duration/3600:.1f} hours)")
            
            # Check if it's approximately 7 days (allow 1 hour tolerance)
            expected_duration = 7 * 24 * 60 * 60  # 7 days in seconds
            if abs(client_exp_duration - expected_duration) < 3600:
                print("  ✅ Client token expiration is correct (~7 days)")
                client_exp_ok = True
            else:
                print(f"  ❌ Client token expiration is wrong (expected ~7 days, got {client_exp_days:.1f} days)")
                client_exp_ok = False
        else:
            print("  ❌ Client token missing expiration")
            client_exp_ok = False
        
        if client_user_type == 'client':
            print("  ✅ Client token has correct user_type")
            client_type_ok = True
        else:
            print(f"  ❌ Client token has wrong user_type (expected 'client', got '{client_user_type}')")
            client_type_ok = False
        
        # Verify admin token
        print("\n📋 ADMIN TOKEN ANALYSIS:")
        admin_user_type = admin_payload.get('user_type')
        admin_exp = admin_payload.get('exp')
        admin_username = admin_payload.get('sub')
        
        print(f"  Username: {admin_username}")
        print(f"  User Type: {admin_user_type}")
        print(f"  Expiration Timestamp: {admin_exp}")
        
        if admin_exp:
            admin_exp_duration = admin_exp - current_time
            admin_exp_minutes = admin_exp_duration / 60
            print(f"  Expires in: {admin_exp_minutes:.1f} minutes ({admin_exp_duration/3600:.1f} hours)")
            
            # Check if it's approximately 30 minutes (allow 5 minutes tolerance)
            expected_admin_duration = 30 * 60  # 30 minutes in seconds
            if abs(admin_exp_duration - expected_admin_duration) < 300:
                print("  ✅ Admin token expiration is correct (~30 minutes)")
                admin_exp_ok = True
            else:
                print(f"  ❌ Admin token expiration is wrong (expected ~30 minutes, got {admin_exp_minutes:.1f} minutes)")
                admin_exp_ok = False
        else:
            print("  ❌ Admin token missing expiration")
            admin_exp_ok = False
        
        if admin_user_type == 'admin':
            print("  ✅ Admin token has correct user_type")
            admin_type_ok = True
        else:
            print(f"  ❌ Admin token has wrong user_type (expected 'admin', got '{admin_user_type}')")
            admin_type_ok = False
        
        # Compare expiration times
        print("\n📊 TOKEN COMPARISON:")
        if client_exp and admin_exp:
            exp_difference = client_exp - admin_exp
            exp_difference_days = exp_difference / 86400
            print(f"  Client token expires {exp_difference_days:.1f} days later than admin token")
            
            expected_difference = (7 * 24 * 60 * 60) - (30 * 60)  # ~7 days - 30 minutes
            if exp_difference > expected_difference * 0.9:  # Allow 10% tolerance
                print("  ✅ Token expiration difference is correct")
                exp_diff_ok = True
            else:
                print(f"  ❌ Token expiration difference is wrong (expected ~7 days, got {exp_difference_days:.1f} days)")
                exp_diff_ok = False
        else:
            print("  ❌ Cannot compare token expirations")
            exp_diff_ok = False
        
        # Test 4: Client Authentication Endpoint
        print("\n🔍 Testing Client Authentication...")
        auth_ok = self.test_client_auth_endpoint()
        
        # Test 5: Multiple API Calls
        print("\n🔍 Testing Multiple API Calls...")
        api_calls_ok = self.test_multiple_api_calls()
        
        # Final Results
        print("\n" + "=" * 80)
        print("📊 CLIENT AUTO-LOGOUT FIX TEST RESULTS")
        print("=" * 80)
        
        all_tests = [
            ("Client Token Expiration (7 days)", client_exp_ok),
            ("Client Token User Type", client_type_ok),
            ("Admin Token Expiration (30 minutes)", admin_exp_ok),
            ("Admin Token User Type", admin_type_ok),
            ("Token Expiration Difference", exp_diff_ok),
            ("Client Authentication Endpoint", auth_ok),
            ("Multiple API Calls", api_calls_ok)
        ]
        
        passed_tests = sum(1 for _, result in all_tests if result)
        total_tests = len(all_tests)
        
        for test_name, result in all_tests:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {status} - {test_name}")
        
        print(f"\nSUMMARY: {passed_tests}/{total_tests} tests passed ({passed_tests/total_tests*100:.1f}%)")
        
        if passed_tests == total_tests:
            print("\n🎉 CLIENT AUTO-LOGOUT FIX VERIFICATION: SUCCESS")
            print("✅ Client tokens now expire in 7 days instead of 30 minutes")
            print("✅ Admin tokens still expire in 30 minutes as expected")
            print("✅ Client authentication is working properly with extended tokens")
            print("✅ Multiple API calls work without premature logout")
            return True
        else:
            print("\n❌ CLIENT AUTO-LOGOUT FIX VERIFICATION: FAILED")
            print(f"❌ {total_tests - passed_tests} test(s) failed")
            return False

if __name__ == "__main__":
    tester = ClientLogoutTester()
    success = tester.run_client_auto_logout_fix_test()
    
    if success:
        print("\n🎯 CONCLUSION: Client auto-logout fix is working correctly!")
        exit(0)
    else:
        print("\n🚨 CONCLUSION: Client auto-logout fix needs attention!")
        exit(1)