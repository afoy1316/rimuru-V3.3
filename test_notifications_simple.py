#!/usr/bin/env python3

import requests
import json
from datetime import datetime

class NotificationTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None

    def login_user(self):
        """Login as regular user"""
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        try:
            response = requests.post(f"{self.api_url}/auth/login", json=login_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access_token')
                print(f"✅ User login successful")
                return True
            else:
                print(f"❌ User login failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ User login error: {e}")
            return False

    def login_admin(self):
        """Login as admin"""
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        try:
            response = requests.post(f"{self.api_url}/admin/auth/login", json=login_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get('access_token')
                print(f"✅ Admin login successful")
                return True
            else:
                print(f"❌ Admin login failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Admin login error: {e}")
            return False

    def test_notification_endpoints(self):
        """Test notification endpoints"""
        print("\n🔍 Testing Notification Endpoints...")
        
        # Test 1: Client notifications
        if self.token:
            try:
                headers = {'Authorization': f'Bearer {self.token}'}
                response = requests.get(f"{self.api_url}/client/notifications?limit=10", headers=headers, timeout=10)
                print(f"📱 Client notifications: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"   Found {len(data)} client notifications")
                    if data:
                        sample = data[0]
                        required_fields = ['id', 'title', 'message', 'type', 'is_read', 'created_at']
                        missing = [f for f in required_fields if f not in sample]
                        if missing:
                            print(f"   ❌ Missing fields: {missing}")
                        else:
                            print(f"   ✅ All required fields present")
                            print(f"   Sample type: {sample.get('type')}")
                else:
                    print(f"   ❌ Error: {response.text}")
            except Exception as e:
                print(f"   ❌ Exception: {e}")
        
        # Test 2: Admin notifications
        if self.admin_token:
            try:
                headers = {'Authorization': f'Bearer {self.admin_token}'}
                response = requests.get(f"{self.api_url}/admin/notifications?limit=10", headers=headers, timeout=10)
                print(f"🔧 Admin notifications: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"   Found {len(data)} admin notifications")
                    if data:
                        sample = data[0]
                        required_fields = ['id', 'title', 'message', 'type', 'is_read', 'created_at']
                        missing = [f for f in required_fields if f not in sample]
                        if missing:
                            print(f"   ❌ Missing fields: {missing}")
                        else:
                            print(f"   ✅ All required fields present")
                            print(f"   Sample type: {sample.get('type')}")
                            
                        # Check for withdraw notification types
                        withdraw_types = [n for n in data if 'withdraw' in n.get('type', '').lower()]
                        if withdraw_types:
                            print(f"   🏦 Found {len(withdraw_types)} withdraw notifications")
                            for w in withdraw_types:
                                print(f"      Type: {w.get('type')}, Title: {w.get('title')}")
                        else:
                            print(f"   ⚠️ No withdraw notifications found")
                        
                        # Check all notification types present
                        all_types = set(n.get('type') for n in data)
                        print(f"   📋 All notification types: {sorted(list(all_types))}")
                else:
                    print(f"   ❌ Error: {response.text}")
            except Exception as e:
                print(f"   ❌ Exception: {e}")

    def test_mark_as_read_endpoints(self):
        """Test mark as read endpoints"""
        print("\n🔍 Testing Mark as Read Endpoints...")
        
        # Test client mark all as read (using PUT method)
        if self.token:
            try:
                headers = {'Authorization': f'Bearer {self.token}'}
                response = requests.put(f"{self.api_url}/client/notifications/mark-all-read", headers=headers, timeout=10)
                print(f"📱 Client mark all as read (PUT): {response.status_code}")
                if response.status_code != 200:
                    print(f"   ❌ Error: {response.text}")
                else:
                    print(f"   ✅ Success")
            except Exception as e:
                print(f"   ❌ Exception: {e}")
        
        # Test admin mark all as read (using PUT method)
        if self.admin_token:
            try:
                headers = {'Authorization': f'Bearer {self.admin_token}'}
                response = requests.put(f"{self.api_url}/admin/notifications/mark-all-read", headers=headers, timeout=10)
                print(f"🔧 Admin mark all as read (PUT): {response.status_code}")
                if response.status_code != 200:
                    print(f"   ❌ Error: {response.text}")
                else:
                    print(f"   ✅ Success")
            except Exception as e:
                print(f"   ❌ Exception: {e}")

    def test_individual_mark_as_read(self):
        """Test individual notification mark as read"""
        print("\n🔍 Testing Individual Mark as Read...")
        
        # Test client individual mark as read
        if self.token:
            try:
                headers = {'Authorization': f'Bearer {self.token}'}
                # Get notifications first
                response = requests.get(f"{self.api_url}/client/notifications?limit=1", headers=headers, timeout=10)
                if response.status_code == 200:
                    notifications = response.json()
                    if notifications:
                        notification_id = notifications[0]['id']
                        # Mark as read using PUT
                        response = requests.put(f"{self.api_url}/client/notifications/{notification_id}/read", headers=headers, timeout=10)
                        print(f"📱 Client individual mark as read (PUT): {response.status_code}")
                        if response.status_code != 200:
                            print(f"   ❌ Error: {response.text}")
                        else:
                            print(f"   ✅ Success - marked notification {notification_id} as read")
                    else:
                        print(f"   ⚠️ No client notifications to mark as read")
                else:
                    print(f"   ❌ Failed to get client notifications: {response.status_code}")
            except Exception as e:
                print(f"   ❌ Exception: {e}")
        
        # Test admin individual mark as read
        if self.admin_token:
            try:
                headers = {'Authorization': f'Bearer {self.admin_token}'}
                # Get notifications first
                response = requests.get(f"{self.api_url}/admin/notifications?limit=1", headers=headers, timeout=10)
                if response.status_code == 200:
                    notifications = response.json()
                    if notifications:
                        notification_id = notifications[0]['id']
                        # Mark as read using PUT
                        response = requests.put(f"{self.api_url}/admin/notifications/{notification_id}/read", headers=headers, timeout=10)
                        print(f"🔧 Admin individual mark as read (PUT): {response.status_code}")
                        if response.status_code != 200:
                            print(f"   ❌ Error: {response.text}")
                        else:
                            print(f"   ✅ Success - marked notification {notification_id} as read")
                    else:
                        print(f"   ⚠️ No admin notifications to mark as read")
                else:
                    print(f"   ❌ Failed to get admin notifications: {response.status_code}")
            except Exception as e:
                print(f"   ❌ Exception: {e}")

    def create_withdrawal_for_notification_test(self):
        """Create a withdrawal to test notification creation"""
        print("\n🔍 Creating Withdrawal for Notification Test...")
        
        if not self.token:
            print("❌ No user token available")
            return False
        
        # First get accounts
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.get(f"{self.api_url}/accounts", headers=headers, timeout=10)
            if response.status_code == 200:
                accounts = response.json()
                print(f"📋 Found {len(accounts)} accounts")
                
                # Check account balances
                accounts_with_balance = []
                for account in accounts:
                    balance = account.get('balance', 0)
                    print(f"   📊 {account.get('account_name')} ({account.get('platform')}): Balance = {balance}")
                    if balance > 0:
                        accounts_with_balance.append(account)
                
                if accounts_with_balance:
                    test_account = accounts_with_balance[0]
                    print(f"🎯 Using account with balance: {test_account.get('account_name')} (Balance: {test_account.get('balance')})")
                    
                    # Create withdrawal request
                    withdrawal_data = {
                        "account_id": test_account.get('id'),
                        "currency": test_account.get('currency', 'IDR')
                    }
                    
                    response = requests.post(f"{self.api_url}/withdrawals", json=withdrawal_data, headers=headers, timeout=10)
                    print(f"🏦 Withdrawal creation: {response.status_code}")
                    
                    if response.status_code == 200:
                        data = response.json()
                        withdrawal_id = data.get('withdrawal_id')
                        print(f"   ✅ Created withdrawal: {withdrawal_id}")
                        return True
                    else:
                        print(f"   ❌ Error: {response.text}")
                        return False
                else:
                    print("⚠️ No accounts with balance > 0 found")
                    return False
            else:
                print(f"❌ Failed to get accounts: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Exception: {e}")
            return False

    def create_transfer_for_notification_test(self):
        """Create a transfer request to test notification creation"""
        print("\n🔍 Creating Transfer Request for Notification Test...")
        
        if not self.token:
            print("❌ No user token available")
            return False
        
        # First get accounts
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.get(f"{self.api_url}/accounts", headers=headers, timeout=10)
            if response.status_code == 200:
                accounts = response.json()
                print(f"📋 Found {len(accounts)} accounts")
                
                # Find a suitable account
                test_account = None
                for account in accounts:
                    if account.get('platform') in ['facebook', 'google', 'tiktok']:
                        test_account = account
                        break
                
                if not test_account:
                    print("❌ No suitable account found")
                    return False
                
                print(f"🎯 Using account: {test_account.get('account_name')} ({test_account.get('platform')})")
                
                # Create transfer request (using query parameters)
                account_id = test_account.get('id')
                amount = 10000
                
                response = requests.post(f"{self.api_url}/transfer-request?account_id={account_id}&amount={amount}", headers=headers, timeout=10)
                print(f"🔄 Transfer creation: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    transfer_id = data.get('transfer_id', data.get('id'))
                    print(f"   ✅ Created transfer: {transfer_id}")
                    return True
                else:
                    print(f"   ❌ Error: {response.text}")
                    return False
            else:
                print(f"❌ Failed to get accounts: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Exception: {e}")
            return False

    def run_tests(self):
        """Run all notification tests"""
        print("🚀 Starting Notification Navigation Tests...")
        print(f"🌐 Base URL: {self.base_url}")
        print("=" * 80)
        
        # Login
        if not self.login_user():
            print("❌ User login failed, stopping tests")
            return
        
        if not self.login_admin():
            print("❌ Admin login failed, some tests will be skipped")
        
        # Run tests
        self.test_notification_endpoints()
        self.test_mark_as_read_endpoints()
        self.test_individual_mark_as_read()
        
        # Try to create withdrawal and transfer requests
        withdrawal_created = self.create_withdrawal_for_notification_test()
        transfer_created = self.create_transfer_for_notification_test()
        
        # Test notifications again after creating requests
        if withdrawal_created or transfer_created:
            print("\n🔍 Re-testing Notifications After Creating Requests...")
            self.test_notification_endpoints()
        else:
            print("\n⚠️ No new requests created, skipping re-test")
        
        print("\n✅ Notification tests completed!")

if __name__ == "__main__":
    tester = NotificationTester()
    tester.run_tests()