#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class WithdrawalStatusTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None

    def log_test(self, name, success, details=""):
        """Log test result"""
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

    def test_withdrawal_status_sync_issue(self):
        """Test specific withdrawal status sync issue reported by user"""
        print("\n🔍 CRITICAL INVESTIGATION: Withdrawal Status Sync Issue")
        print("=" * 80)
        
        # Test 1: Login as testuser/testpass123 as specifically requested
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "Login as testuser/testpass123",
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
        
        # Test 2: GET /api/withdrawals - Find Google Ads Test withdrawal
        success, withdrawals_response = self.run_test(
            "GET /api/withdrawals - Find Google Ads Test Withdrawal",
            "GET",
            "withdrawals",
            200
        )
        
        if not success:
            self.log_test(
                "Withdrawal History Retrieval Failed",
                False,
                "Failed to retrieve withdrawal history"
            )
            return False
        
        print(f"\n📊 WITHDRAWAL ANALYSIS:")
        print(f"Found {len(withdrawals_response)} withdrawal records")
        
        # Analyze withdrawal records to find Google Ads Test withdrawal
        google_ads_withdrawal = None
        all_withdrawals_info = []
        
        for i, withdrawal in enumerate(withdrawals_response):
            withdrawal_info = {
                'id': withdrawal.get('id'),
                'account_name': withdrawal.get('account', {}).get('account_name', 'Unknown'),
                'platform': withdrawal.get('account', {}).get('platform', 'Unknown'),
                'status': withdrawal.get('status'),
                'amount': withdrawal.get('requested_amount', 0),
                'currency': withdrawal.get('currency', 'Unknown'),
                'created_at': withdrawal.get('created_at')
            }
            all_withdrawals_info.append(withdrawal_info)
            
            print(f"  {i+1}. {withdrawal_info['account_name']} ({withdrawal_info['platform']})")
            print(f"     Status: {withdrawal_info['status']}, Amount: {withdrawal_info['amount']} {withdrawal_info['currency']}")
            
            # Look for Google Ads Test withdrawal
            account_name = withdrawal_info['account_name'].lower()
            if 'google' in account_name and ('ads' in account_name or 'test' in account_name):
                google_ads_withdrawal = withdrawal
                print(f"     ⭐ FOUND GOOGLE ADS TEST WITHDRAWAL!")
        
        # Test 3: GET /api/transactions - Compare with transaction records
        success, transactions_response = self.run_test(
            "GET /api/transactions - Check Transaction Status",
            "GET",
            "transactions",
            200
        )
        
        if not success:
            self.log_test(
                "Transaction History Retrieval Failed",
                False,
                "Failed to retrieve transaction history"
            )
            return False
        
        print(f"\n📊 TRANSACTION ANALYSIS:")
        print(f"Found {len(transactions_response)} transaction records")
        
        # Analyze transaction records for withdrawal-related transactions
        withdrawal_transactions = []
        google_ads_transaction = None
        
        for i, transaction in enumerate(transactions_response):
            if transaction.get('type') in ['withdraw', 'withdraw_request']:
                transaction_info = {
                    'id': transaction.get('id'),
                    'description': transaction.get('description', ''),
                    'status': transaction.get('status'),
                    'amount': transaction.get('amount', 0),
                    'currency': transaction.get('currency', 'Unknown'),
                    'created_at': transaction.get('created_at'),
                    'reference_id': transaction.get('reference_id'),
                    'type': transaction.get('type')
                }
                withdrawal_transactions.append(transaction_info)
                
                print(f"  {len(withdrawal_transactions)}. {transaction_info['description']} ({transaction_info['type']})")
                print(f"     Status: {transaction_info['status']}, Amount: {transaction_info['amount']} {transaction_info['currency']}")
                print(f"     Ref ID: {transaction_info.get('reference_id', 'None')}")
                
                # Look for Google Ads Test transaction
                description = transaction_info['description'].lower()
                if 'google' in description and ('ads' in description or 'test' in description):
                    google_ads_transaction = transaction
                    print(f"     ⭐ FOUND GOOGLE ADS TEST TRANSACTION!")
        
        # Test 4: Critical Analysis - Status Mismatch Detection
        print(f"\n🔍 CRITICAL STATUS COMPARISON:")
        status_mismatch_found = False
        mismatch_details = []
        
        if google_ads_withdrawal and google_ads_transaction:
            withdrawal_status = google_ads_withdrawal.get('status')
            transaction_status = google_ads_transaction.get('status')
            
            print(f"Google Ads Test - Withdrawal Status: '{withdrawal_status}' vs Transaction Status: '{transaction_status}'")
            
            # Check for the specific issue: withdrawal approved but transaction still pending
            if withdrawal_status in ['approved', 'completed'] and transaction_status == 'pending':
                status_mismatch_found = True
                mismatch_details.append({
                    'withdrawal_id': google_ads_withdrawal.get('id'),
                    'transaction_id': google_ads_transaction.get('id'),
                    'withdrawal_status': withdrawal_status,
                    'transaction_status': transaction_status,
                    'account_name': google_ads_withdrawal.get('account', {}).get('account_name')
                })
                
                print(f"❌ CRITICAL ISSUE CONFIRMED: Google Ads Test withdrawal is '{withdrawal_status}' but transaction shows '{transaction_status}'")
            else:
                print(f"✅ Google Ads Test withdrawal and transaction statuses are consistent")
        elif google_ads_withdrawal:
            print(f"⚠️ Found Google Ads withdrawal but no corresponding transaction")
        elif google_ads_transaction:
            print(f"⚠️ Found Google Ads transaction but no corresponding withdrawal")
        else:
            print(f"⚠️ No Google Ads Test records found")
        
        # Test 5: Check for any other status mismatches
        print(f"\n🔍 CHECKING ALL WITHDRAWAL-TRANSACTION PAIRS:")
        
        for withdrawal in withdrawals_response:
            withdrawal_id = withdrawal.get('id')
            withdrawal_status = withdrawal.get('status')
            account_name = withdrawal.get('account', {}).get('account_name', 'Unknown')
            
            # Find corresponding transaction
            corresponding_transaction = None
            for transaction in withdrawal_transactions:
                if transaction.get('reference_id') == withdrawal_id:
                    corresponding_transaction = transaction
                    break
            
            if corresponding_transaction:
                transaction_status = corresponding_transaction.get('status')
                
                print(f"  {account_name}: Withdrawal='{withdrawal_status}' vs Transaction='{transaction_status}'")
                
                # Check for status mismatches
                if ((withdrawal_status in ['approved', 'completed'] and transaction_status == 'pending') or
                    (withdrawal_status == 'completed' and transaction_status != 'completed')):
                    
                    status_mismatch_found = True
                    mismatch_details.append({
                        'withdrawal_id': withdrawal_id,
                        'transaction_id': corresponding_transaction.get('id'),
                        'withdrawal_status': withdrawal_status,
                        'transaction_status': transaction_status,
                        'account_name': account_name
                    })
                    
                    print(f"    ❌ STATUS MISMATCH DETECTED!")
                else:
                    print(f"    ✅ Status sync OK")
            else:
                print(f"  {account_name}: Withdrawal='{withdrawal_status}' vs Transaction=NOT FOUND")
                print(f"    ⚠️ No corresponding transaction found")
        
        # Test 6: Root Cause Analysis and Summary
        print(f"\n📋 INVESTIGATION SUMMARY:")
        print("=" * 50)
        
        if status_mismatch_found:
            print(f"❌ CRITICAL FINDINGS:")
            print(f"   • Found {len(mismatch_details)} status mismatches")
            print(f"   • Issue: Withdrawal approvals are not properly updating corresponding transaction records")
            print(f"   • Expected: When withdrawal status = 'approved'/'completed', transaction status should = 'completed'")
            print(f"   • Actual: Transaction status remains 'pending' even after withdrawal approval")
            
            print(f"\n🔍 DETAILED MISMATCH ANALYSIS:")
            for i, mismatch in enumerate(mismatch_details):
                print(f"   {i+1}. Account: {mismatch['account_name']}")
                print(f"      Withdrawal ID: {mismatch['withdrawal_id']}")
                print(f"      Transaction ID: {mismatch['transaction_id']}")
                print(f"      Withdrawal Status: {mismatch['withdrawal_status']}")
                print(f"      Transaction Status: {mismatch['transaction_status']}")
                print()
            
            print(f"🎯 ROOT CAUSE:")
            print(f"   The backend transaction update logic in withdrawal approval process is not working correctly.")
            print(f"   When admin approves a withdrawal, the corresponding transaction record is not being updated.")
            
            print(f"🔧 RECOMMENDED FIX:")
            print(f"   1. Check withdrawal approval endpoint in backend")
            print(f"   2. Ensure transaction status is updated when withdrawal status changes")
            print(f"   3. Verify reference_id linking between withdrawals and transactions")
            
        else:
            print(f"✅ NO STATUS MISMATCHES FOUND")
            print(f"   All withdrawal and transaction statuses are properly synchronized")
        
        return not status_mismatch_found

def main():
    tester = WithdrawalStatusTester()
    
    print("🚀 Starting Withdrawal Status Sync Investigation...")
    print(f"🌐 Base URL: {tester.base_url}")
    print(f"🔗 API URL: {tester.api_url}")
    
    success = tester.test_withdrawal_status_sync_issue()
    
    if success:
        print(f"\n✅ INVESTIGATION COMPLETE: No critical issues found")
        sys.exit(0)
    else:
        print(f"\n❌ INVESTIGATION COMPLETE: Critical issues identified")
        sys.exit(1)

if __name__ == "__main__":
    main()