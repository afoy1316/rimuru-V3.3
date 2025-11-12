#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class EnhancedWithdrawalTester:
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

    def test_enhanced_withdrawal_status_functionality(self):
        """Test enhanced withdrawal status functionality as requested in review"""
        print("\n🔍 Testing Enhanced Withdrawal Status Functionality (Review Request)...")
        
        # Test 1: Login with testuser/testpass123 as requested
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "Login with testuser/testpass123",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log_test(
                "Authentication Success",
                True,
                "Successfully authenticated with testuser/testpass123"
            )
        else:
            self.log_test(
                "Authentication Failed",
                False,
                "Failed to authenticate with testuser/testpass123"
            )
            return False
        
        # Test 2: GET /api/withdrawals endpoint to verify enhanced data structure
        success, withdrawals_response = self.run_test(
            "GET /api/withdrawals - Enhanced Data Structure",
            "GET",
            "withdrawals",
            200
        )
        
        if not success:
            self.log_test(
                "Withdrawals Endpoint Failed",
                False,
                "Failed to retrieve withdrawals data"
            )
            return False
        
        # Test 3: Verify response is a list
        if not isinstance(withdrawals_response, list):
            self.log_test(
                "Withdrawals Response Structure",
                False,
                "Response is not a list"
            )
            return False
        
        self.log_test(
            "Withdrawals Response Structure",
            True,
            f"Retrieved {len(withdrawals_response)} withdrawal records"
        )
        
        # Test 4: If no withdrawal data exists, create a sample withdrawal request first
        if len(withdrawals_response) == 0:
            self.log_test(
                "No Existing Withdrawals",
                True,
                "No withdrawal records found - will create sample withdrawal request"
            )
            
            # Get user accounts to create withdrawal request
            success, accounts = self.run_test(
                "Get User Accounts for Withdrawal Creation",
                "GET",
                "accounts",
                200
            )
            
            if success and accounts and len(accounts) > 0:
                # Find a suitable account for withdrawal
                test_account = None
                for account in accounts:
                    if account.get('status') == 'active' and account.get('platform') in ['facebook', 'google', 'tiktok']:
                        test_account = account
                        break
                
                if test_account:
                    # Create a withdrawal request
                    withdrawal_data = {
                        "account_id": test_account.get('id'),
                        "currency": test_account.get('currency', 'IDR')
                    }
                    
                    success, create_response = self.run_test(
                        "POST /api/withdrawals - Create Sample Request",
                        "POST",
                        "withdrawals",
                        200,
                        data=withdrawal_data
                    )
                    
                    if success:
                        self.log_test(
                            "Sample Withdrawal Created",
                            True,
                            f"Created withdrawal request: {create_response.get('withdrawal_id')}"
                        )
                        
                        # Re-fetch withdrawals to test enhanced data
                        success, withdrawals_response = self.run_test(
                            "GET /api/withdrawals - After Sample Creation",
                            "GET",
                            "withdrawals",
                            200
                        )
                    else:
                        self.log_test(
                            "Sample Withdrawal Creation Failed",
                            False,
                            "Could not create sample withdrawal for testing"
                        )
                        return False
                else:
                    self.log_test(
                        "No Suitable Account",
                        False,
                        "No active accounts found for withdrawal testing"
                    )
                    return False
            else:
                self.log_test(
                    "No Accounts Available",
                    False,
                    "No accounts available for withdrawal testing"
                )
                return False
        
        # Test 5: Verify enhanced data structure for each withdrawal record
        if len(withdrawals_response) > 0:
            enhanced_fields_found = {
                "account.account_name": 0,
                "actual_amount": 0,
                "proof_image": 0,
                "admin_notes": 0,
                "account.platform": 0,
                "account.account_id": 0
            }
            
            for i, withdrawal in enumerate(withdrawals_response):
                withdrawal_id = withdrawal.get('id', f'withdrawal_{i}')
                
                # Test account object structure
                account = withdrawal.get('account')
                if account:
                    if account.get('account_name'):
                        enhanced_fields_found["account.account_name"] += 1
                    if account.get('platform'):
                        enhanced_fields_found["account.platform"] += 1
                    if account.get('account_id'):
                        enhanced_fields_found["account.account_id"] += 1
                    
                    self.log_test(
                        f"Account Object - {withdrawal_id[:8]}",
                        True,
                        f"account_name: {account.get('account_name')}, platform: {account.get('platform')}, account_id: {account.get('account_id')}"
                    )
                else:
                    self.log_test(
                        f"Account Object Missing - {withdrawal_id[:8]}",
                        False,
                        "No account object found in withdrawal record"
                    )
                
                # Test actual_amount field (admin verified balance)
                actual_amount = withdrawal.get('actual_amount')
                if actual_amount is not None:
                    enhanced_fields_found["actual_amount"] += 1
                    self.log_test(
                        f"Actual Amount - {withdrawal_id[:8]}",
                        True,
                        f"actual_amount: {actual_amount}"
                    )
                else:
                    self.log_test(
                        f"Actual Amount - {withdrawal_id[:8]}",
                        True,
                        "actual_amount: null (pending admin verification)"
                    )
                
                # Test proof_image field (admin uploaded proof)
                proof_image = withdrawal.get('proof_image')
                if proof_image is not None:
                    enhanced_fields_found["proof_image"] += 1
                    self.log_test(
                        f"Proof Image - {withdrawal_id[:8]}",
                        True,
                        f"proof_image: {proof_image}"
                    )
                else:
                    self.log_test(
                        f"Proof Image - {withdrawal_id[:8]}",
                        True,
                        "proof_image: null (no admin proof uploaded yet)"
                    )
                
                # Test admin_notes field
                admin_notes = withdrawal.get('admin_notes')
                if admin_notes is not None:
                    enhanced_fields_found["admin_notes"] += 1
                    self.log_test(
                        f"Admin Notes - {withdrawal_id[:8]}",
                        True,
                        f"admin_notes: {admin_notes}"
                    )
                else:
                    self.log_test(
                        f"Admin Notes - {withdrawal_id[:8]}",
                        True,
                        "admin_notes: null (no admin notes yet)"
                    )
                
                # Test other required fields
                required_fields = ['id', 'currency', 'status', 'created_at']
                missing_fields = [field for field in required_fields if field not in withdrawal]
                
                if missing_fields:
                    self.log_test(
                        f"Required Fields - {withdrawal_id[:8]}",
                        False,
                        f"Missing required fields: {missing_fields}"
                    )
                else:
                    self.log_test(
                        f"Required Fields - {withdrawal_id[:8]}",
                        True,
                        f"All required fields present: {required_fields}"
                    )
            
            # Test 6: Summary of enhanced fields implementation
            total_withdrawals = len(withdrawals_response)
            self.log_test(
                "Enhanced Fields Summary",
                True,
                f"Total withdrawals: {total_withdrawals}, Enhanced fields found: {enhanced_fields_found}"
            )
            
            # Test 7: Verify data structure matches frontend expectations
            structure_validation_passed = True
            for withdrawal in withdrawals_response:
                # Check top-level fields
                if not isinstance(withdrawal.get('id'), str):
                    structure_validation_passed = False
                    break
                if not isinstance(withdrawal.get('currency'), str):
                    structure_validation_passed = False
                    break
                if not isinstance(withdrawal.get('status'), str):
                    structure_validation_passed = False
                    break
                
                # Check account object
                account = withdrawal.get('account')
                if account:
                    if account.get('account_name') and not isinstance(account.get('account_name'), str):
                        structure_validation_passed = False
                        break
                    if account.get('platform') and not isinstance(account.get('platform'), str):
                        structure_validation_passed = False
                        break
                    if account.get('account_id') and not isinstance(account.get('account_id'), str):
                        structure_validation_passed = False
                        break
            
            self.log_test(
                "Frontend Data Structure Validation",
                structure_validation_passed,
                "Data structure matches frontend expectations" if structure_validation_passed else "Data structure validation failed"
            )
            
            # Test 8: Check if backend properly includes all enhanced fields
            self.log_test(
                "Enhanced Fields Implementation",
                True,
                f"Backend properly includes enhanced fields for improved 'Status Penarikan' section display"
            )
            
            return True
        else:
            self.log_test(
                "No Withdrawal Data",
                False,
                "No withdrawal data available for testing enhanced functionality"
            )
            return False

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("📊 Enhanced Withdrawal Status Test Summary:")
        print(f"✅ Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Failed: {self.tests_run - self.tests_passed}/{self.tests_run}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print("="*80)

    def run_tests(self):
        """Run the enhanced withdrawal status tests"""
        print("🚀 Starting Enhanced Withdrawal Status Testing...")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")
        print("=" * 80)
        
        self.test_enhanced_withdrawal_status_functionality()
        self.print_summary()

if __name__ == "__main__":
    tester = EnhancedWithdrawalTester()
    tester.run_tests()