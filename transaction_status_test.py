import requests
import sys
import json
from datetime import datetime

class TransactionStatusTester:
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

    def setup_authentication(self):
        """Setup user and admin authentication"""
        print("\n🔧 Setting up Authentication...")
        
        # Admin login
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
        else:
            print("❌ Failed to get admin token")
            return False
        
        # User login - try existing user first
        user_login_data = {
            "username": "testuser",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=user_login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        
        # If existing user doesn't work, create a new one
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "username": f"transtest_{timestamp}",
            "name": f"Transaction Test User {timestamp}",
            "phone_number": f"08123456{timestamp}",
            "address": f"Jl. Transaction Test No. {timestamp}",
            "city": "Jakarta",
            "province": "DKI Jakarta",
            "email": f"transtest_{timestamp}@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "Create Test User",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success:
            # Login with new user
            success, response = self.run_test(
                "Login with New User",
                "POST",
                "auth/login",
                200,
                data={
                    "username": user_data["username"],
                    "password": user_data["password"]
                }
            )
            
            if success and 'access_token' in response:
                self.token = response['access_token']
                return True
        
        print("❌ Failed to setup user authentication")
        return False

    def test_create_facebook_account_request_with_transaction(self):
        """Test creating Facebook account request and verify transaction creation"""
        print("\n🔍 Testing Facebook Account Request with Transaction Creation...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        facebook_request_data = {
            "platform": "facebook",
            "account_name": f"FB Transaction Test {timestamp}",
            "gmt": "GMT+7",
            "currency": "IDR",
            "delivery_method": "BM_ID",
            "bm_id_or_email": "123456789012345",
            "notes": "Facebook account for transaction testing"
        }
        
        success, response = self.run_test(
            "Create Facebook Account Request",
            "POST",
            "accounts/request",
            200,
            data=facebook_request_data
        )
        
        if not success:
            return False
        
        if 'request_id' not in response:
            self.log_test(
                "Facebook Request ID Validation",
                False,
                "No request_id in response"
            )
            return False
        
        self.facebook_request_id = response['request_id']
        
        # Verify transaction was created
        success, transactions = self.run_test(
            "Get Transactions After Facebook Request",
            "GET",
            "transactions",
            200
        )
        
        if not success:
            return False
        
        # Find the transaction for this request
        facebook_transaction = None
        # Facebook descriptions include GMT and Currency info
        expected_description_start = f"Request Facebook ads account: {facebook_request_data['account_name']}"
        
        for transaction in transactions:
            if (transaction.get('type') == 'account_request' and 
                transaction.get('description', '').startswith(expected_description_start)):
                facebook_transaction = transaction
                break
        
        if not facebook_transaction:
            self.log_test(
                "Facebook Transaction Creation Verification",
                False,
                f"No transaction found with expected description: {expected_description}"
            )
            return False
        
        # Verify transaction properties
        if facebook_transaction.get('status') != 'pending':
            self.log_test(
                "Facebook Transaction Status Verification",
                False,
                f"Transaction status is {facebook_transaction.get('status')}, expected 'pending'"
            )
            return False
        
        if facebook_transaction.get('type') != 'account_request':
            self.log_test(
                "Facebook Transaction Type Verification",
                False,
                f"Transaction type is {facebook_transaction.get('type')}, expected 'account_request'"
            )
            return False
        
        self.log_test(
            "Facebook Transaction Creation Verification",
            True,
            f"Transaction created with correct description and pending status"
        )
        
        self.facebook_transaction_id = facebook_transaction.get('id')
        return True

    def test_create_google_account_request_with_transaction(self):
        """Test creating Google account request and verify transaction creation"""
        print("\n🔍 Testing Google Account Request with Transaction Creation...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        google_request_data = {
            "platform": "google",
            "account_name": f"Google Transaction Test {timestamp}",
            "gmt": "GMT+8",
            "currency": "USD",
            "email": f"google.trans.{timestamp}@example.com",
            "website": "https://google-transaction-test.com",
            "notes": "Google account for transaction testing"
        }
        
        success, response = self.run_test(
            "Create Google Account Request",
            "POST",
            "accounts/request",
            200,
            data=google_request_data
        )
        
        if not success:
            return False
        
        if 'request_id' not in response:
            self.log_test(
                "Google Request ID Validation",
                False,
                "No request_id in response"
            )
            return False
        
        self.google_request_id = response['request_id']
        
        # Verify transaction was created
        success, transactions = self.run_test(
            "Get Transactions After Google Request",
            "GET",
            "transactions",
            200
        )
        
        if not success:
            return False
        
        # Find the transaction for this request
        google_transaction = None
        expected_description = f"Request google ads account: {google_request_data['account_name']}"
        
        for transaction in transactions:
            if (transaction.get('type') == 'account_request' and 
                transaction.get('description') == expected_description):
                google_transaction = transaction
                break
        
        if not google_transaction:
            self.log_test(
                "Google Transaction Creation Verification",
                False,
                f"No transaction found with expected description: {expected_description}"
            )
            return False
        
        # Verify transaction properties
        if google_transaction.get('status') != 'pending':
            self.log_test(
                "Google Transaction Status Verification",
                False,
                f"Transaction status is {google_transaction.get('status')}, expected 'pending'"
            )
            return False
        
        self.log_test(
            "Google Transaction Creation Verification",
            True,
            f"Transaction created with correct description and pending status"
        )
        
        self.google_transaction_id = google_transaction.get('id')
        return True

    def test_create_tiktok_account_request_with_transaction(self):
        """Test creating TikTok account request and verify transaction creation"""
        print("\n🔍 Testing TikTok Account Request with Transaction Creation...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        tiktok_request_data = {
            "platform": "tiktok",
            "account_name": f"TikTok Transaction Test {timestamp}",
            "gmt": "GMT+9",
            "currency": "USD",
            "bc_id": f"BC{timestamp}123",
            "website": "https://tiktok-transaction-test.com",
            "notes": "TikTok account for transaction testing"
        }
        
        success, response = self.run_test(
            "Create TikTok Account Request",
            "POST",
            "accounts/request",
            200,
            data=tiktok_request_data
        )
        
        if not success:
            return False
        
        if 'request_id' not in response:
            self.log_test(
                "TikTok Request ID Validation",
                False,
                "No request_id in response"
            )
            return False
        
        self.tiktok_request_id = response['request_id']
        
        # Verify transaction was created
        success, transactions = self.run_test(
            "Get Transactions After TikTok Request",
            "GET",
            "transactions",
            200
        )
        
        if not success:
            return False
        
        # Find the transaction for this request
        tiktok_transaction = None
        expected_description = f"Request tiktok ads account: {tiktok_request_data['account_name']}"
        
        for transaction in transactions:
            if (transaction.get('type') == 'account_request' and 
                transaction.get('description') == expected_description):
                tiktok_transaction = transaction
                break
        
        if not tiktok_transaction:
            self.log_test(
                "TikTok Transaction Creation Verification",
                False,
                f"No transaction found with expected description: {expected_description}"
            )
            return False
        
        # Verify transaction properties
        if tiktok_transaction.get('status') != 'pending':
            self.log_test(
                "TikTok Transaction Status Verification",
                False,
                f"Transaction status is {tiktok_transaction.get('status')}, expected 'pending'"
            )
            return False
        
        self.log_test(
            "TikTok Transaction Creation Verification",
            True,
            f"Transaction created with correct description and pending status"
        )
        
        self.tiktok_transaction_id = tiktok_transaction.get('id')
        return True

    def test_approve_facebook_request_transaction_update(self):
        """Test approving Facebook request and verify transaction status update to completed"""
        print("\n🔍 Testing Facebook Request Approval Transaction Update...")
        
        if not hasattr(self, 'facebook_request_id'):
            self.log_test(
                "Facebook Approval Test Setup",
                False,
                "Facebook request must be created first"
            )
            return False
        
        # Approve the Facebook request
        approval_data = {
            "status": "approved",
            "account_id": f"FB{datetime.now().strftime('%H%M%S')}123456",
            "fee_percentage": 5.0,
            "admin_notes": "Approved for transaction testing"
        }
        
        success, response = self.run_test(
            "Approve Facebook Request",
            "PUT",
            f"admin/requests/{self.facebook_request_id}/status",
            200,
            data=approval_data,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        # Verify transaction status was updated to completed
        success, transactions = self.run_test(
            "Get Transactions After Facebook Approval",
            "GET",
            "transactions",
            200
        )
        
        if not success:
            return False
        
        # Find the Facebook transaction
        facebook_transaction = None
        for transaction in transactions:
            if (transaction.get('id') == getattr(self, 'facebook_transaction_id', None) or
                (transaction.get('type') == 'account_request' and 
                 'Facebook' in transaction.get('description', ''))):
                facebook_transaction = transaction
                break
        
        if not facebook_transaction:
            self.log_test(
                "Facebook Transaction Status Update Verification",
                False,
                "Facebook transaction not found after approval"
            )
            return False
        
        if facebook_transaction.get('status') != 'completed':
            self.log_test(
                "Facebook Transaction Status Update Verification",
                False,
                f"Transaction status is {facebook_transaction.get('status')}, expected 'completed'"
            )
            return False
        
        self.log_test(
            "Facebook Transaction Status Update Verification",
            True,
            "Transaction status successfully updated to 'completed' after approval"
        )
        
        return True

    def test_approve_google_request_transaction_update(self):
        """Test approving Google request and verify transaction status update to completed"""
        print("\n🔍 Testing Google Request Approval Transaction Update...")
        
        if not hasattr(self, 'google_request_id'):
            self.log_test(
                "Google Approval Test Setup",
                False,
                "Google request must be created first"
            )
            return False
        
        # Approve the Google request
        approval_data = {
            "status": "approved",
            "fee_percentage": 7.5,
            "admin_notes": "Approved for transaction testing"
        }
        
        success, response = self.run_test(
            "Approve Google Request",
            "PUT",
            f"admin/requests/{self.google_request_id}/status",
            200,
            data=approval_data,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        # Verify transaction status was updated to completed
        success, transactions = self.run_test(
            "Get Transactions After Google Approval",
            "GET",
            "transactions",
            200
        )
        
        if not success:
            return False
        
        # Find the Google transaction
        google_transaction = None
        for transaction in transactions:
            if (transaction.get('id') == getattr(self, 'google_transaction_id', None) or
                (transaction.get('type') == 'account_request' and 
                 'google' in transaction.get('description', '').lower())):
                google_transaction = transaction
                break
        
        if not google_transaction:
            self.log_test(
                "Google Transaction Status Update Verification",
                False,
                "Google transaction not found after approval"
            )
            return False
        
        if google_transaction.get('status') != 'completed':
            self.log_test(
                "Google Transaction Status Update Verification",
                False,
                f"Transaction status is {google_transaction.get('status')}, expected 'completed'"
            )
            return False
        
        self.log_test(
            "Google Transaction Status Update Verification",
            True,
            "Transaction status successfully updated to 'completed' after approval"
        )
        
        return True

    def test_reject_tiktok_request_transaction_update(self):
        """Test rejecting TikTok request and verify transaction status update to failed"""
        print("\n🔍 Testing TikTok Request Rejection Transaction Update...")
        
        if not hasattr(self, 'tiktok_request_id'):
            self.log_test(
                "TikTok Rejection Test Setup",
                False,
                "TikTok request must be created first"
            )
            return False
        
        # Reject the TikTok request
        rejection_data = {
            "status": "rejected",
            "admin_notes": "Rejected for transaction testing purposes"
        }
        
        success, response = self.run_test(
            "Reject TikTok Request",
            "PUT",
            f"admin/requests/{self.tiktok_request_id}/status",
            200,
            data=rejection_data,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        # Verify transaction status was updated to failed
        success, transactions = self.run_test(
            "Get Transactions After TikTok Rejection",
            "GET",
            "transactions",
            200
        )
        
        if not success:
            return False
        
        # Find the TikTok transaction
        tiktok_transaction = None
        for transaction in transactions:
            if (transaction.get('id') == getattr(self, 'tiktok_transaction_id', None) or
                (transaction.get('type') == 'account_request' and 
                 'tiktok' in transaction.get('description', '').lower())):
                tiktok_transaction = transaction
                break
        
        if not tiktok_transaction:
            self.log_test(
                "TikTok Transaction Status Update Verification",
                False,
                "TikTok transaction not found after rejection"
            )
            return False
        
        if tiktok_transaction.get('status') != 'failed':
            self.log_test(
                "TikTok Transaction Status Update Verification",
                False,
                f"Transaction status is {tiktok_transaction.get('status')}, expected 'failed'"
            )
            return False
        
        self.log_test(
            "TikTok Transaction Status Update Verification",
            True,
            "Transaction status successfully updated to 'failed' after rejection"
        )
        
        return True

    def test_bulk_update_transaction_status(self):
        """Test bulk update functionality and verify transaction status updates"""
        print("\n🔍 Testing Bulk Update Transaction Status...")
        
        # Create multiple requests for bulk testing
        timestamp = datetime.now().strftime('%H%M%S')
        
        # Create Google requests for bulk approval
        google_requests = []
        for i in range(2):
            google_request_data = {
                "platform": "google",
                "account_name": f"Bulk Google Test {timestamp}_{i}",
                "gmt": "GMT+8",
                "currency": "USD",
                "email": f"bulk.google.{timestamp}.{i}@example.com",
                "website": f"https://bulk-google-test-{i}.com",
                "notes": f"Bulk Google test request {i}"
            }
            
            success, response = self.run_test(
                f"Create Bulk Google Request {i+1}",
                "POST",
                "accounts/request",
                200,
                data=google_request_data
            )
            
            if success and 'request_id' in response:
                google_requests.append(response['request_id'])
        
        if len(google_requests) < 2:
            self.log_test(
                "Bulk Test Setup",
                False,
                "Failed to create enough requests for bulk testing"
            )
            return False
        
        # Create TikTok requests for bulk rejection
        tiktok_requests = []
        for i in range(2):
            tiktok_request_data = {
                "platform": "tiktok",
                "account_name": f"Bulk TikTok Test {timestamp}_{i}",
                "gmt": "GMT+9",
                "currency": "USD",
                "bc_id": f"BC{timestamp}{i}123",
                "website": f"https://bulk-tiktok-test-{i}.com",
                "notes": f"Bulk TikTok test request {i}"
            }
            
            success, response = self.run_test(
                f"Create Bulk TikTok Request {i+1}",
                "POST",
                "accounts/request",
                200,
                data=tiktok_request_data
            )
            
            if success and 'request_id' in response:
                tiktok_requests.append(response['request_id'])
        
        if len(tiktok_requests) < 2:
            self.log_test(
                "Bulk Test Setup",
                False,
                "Failed to create enough TikTok requests for bulk testing"
            )
            return False
        
        # Bulk approve Google requests
        bulk_approval_data = {
            "request_ids": google_requests,
            "status": "approved",
            "fee_percentage": 6.0,
            "admin_notes": "Bulk approved for transaction testing"
        }
        
        success, response = self.run_test(
            "Bulk Approve Google Requests",
            "PUT",
            "admin/requests/bulk-update",
            200,
            data=bulk_approval_data,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        # Bulk reject TikTok requests
        bulk_rejection_data = {
            "request_ids": tiktok_requests,
            "status": "rejected",
            "admin_notes": "Bulk rejected for transaction testing"
        }
        
        success, response = self.run_test(
            "Bulk Reject TikTok Requests",
            "PUT",
            "admin/requests/bulk-update",
            200,
            data=bulk_rejection_data,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        # Verify transaction status updates
        success, transactions = self.run_test(
            "Get Transactions After Bulk Updates",
            "GET",
            "transactions",
            200
        )
        
        if not success:
            return False
        
        # Check Google transactions are completed
        google_completed_count = 0
        tiktok_failed_count = 0
        
        for transaction in transactions:
            if transaction.get('type') == 'account_request':
                description = transaction.get('description', '')
                if f'Bulk Google Test {timestamp}' in description:
                    if transaction.get('status') == 'completed':
                        google_completed_count += 1
                elif f'Bulk TikTok Test {timestamp}' in description:
                    if transaction.get('status') == 'failed':
                        tiktok_failed_count += 1
        
        if google_completed_count != 2:
            self.log_test(
                "Bulk Approval Transaction Update Verification",
                False,
                f"Expected 2 Google transactions to be completed, found {google_completed_count}"
            )
            return False
        
        if tiktok_failed_count != 2:
            self.log_test(
                "Bulk Rejection Transaction Update Verification",
                False,
                f"Expected 2 TikTok transactions to be failed, found {tiktok_failed_count}"
            )
            return False
        
        self.log_test(
            "Bulk Update Transaction Status Verification",
            True,
            f"All bulk updates correctly updated transaction statuses: {google_completed_count} completed, {tiktok_failed_count} failed"
        )
        
        return True

    def test_transaction_description_patterns(self):
        """Test that transaction descriptions follow the correct patterns"""
        print("\n🔍 Testing Transaction Description Patterns...")
        
        # Get all transactions
        success, transactions = self.run_test(
            "Get All Transactions for Pattern Testing",
            "GET",
            "transactions",
            200
        )
        
        if not success:
            return False
        
        facebook_pattern_correct = 0
        other_pattern_correct = 0
        pattern_errors = []
        
        for transaction in transactions:
            if transaction.get('type') == 'account_request':
                description = transaction.get('description', '')
                
                # Check Facebook pattern: "Request Facebook ads account: {account_name}"
                if 'Facebook' in description:
                    if description.startswith('Request Facebook ads account: '):
                        facebook_pattern_correct += 1
                    else:
                        pattern_errors.append(f"Facebook pattern error: {description}")
                
                # Check other platforms pattern: "Request {platform} ads account: {account_name}"
                elif 'google' in description.lower() or 'tiktok' in description.lower():
                    if (description.startswith('Request google ads account: ') or 
                        description.startswith('Request tiktok ads account: ')):
                        other_pattern_correct += 1
                    else:
                        pattern_errors.append(f"Other platform pattern error: {description}")
        
        if pattern_errors:
            self.log_test(
                "Transaction Description Pattern Verification",
                False,
                f"Pattern errors found: {pattern_errors}"
            )
            return False
        
        self.log_test(
            "Transaction Description Pattern Verification",
            True,
            f"All patterns correct: {facebook_pattern_correct} Facebook, {other_pattern_correct} other platforms"
        )
        
        return True

    def run_all_tests(self):
        """Run all transaction status update tests"""
        print("🚀 Starting Transaction Status Update Tests...")
        print("=" * 60)
        
        # Setup authentication
        if not self.setup_authentication():
            print("❌ Authentication setup failed. Aborting tests.")
            return False
        
        # Test sequence
        tests = [
            self.test_create_facebook_account_request_with_transaction,
            self.test_create_google_account_request_with_transaction,
            self.test_create_tiktok_account_request_with_transaction,
            self.test_approve_facebook_request_transaction_update,
            self.test_approve_google_request_transaction_update,
            self.test_reject_tiktok_request_transaction_update,
            self.test_bulk_update_transaction_status,
            self.test_transaction_description_patterns
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, f"Exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TRANSACTION STATUS UPDATE TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TRANSACTION STATUS UPDATE TESTS PASSED!")
        else:
            print("⚠️  Some tests failed. Check details above.")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = TransactionStatusTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)