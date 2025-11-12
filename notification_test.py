#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class NotificationDatabaseTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None

    def login_user(self):
        """Login as regular user"""
        # Try with existing test user
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
        admin_login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        try:
            response = requests.post(f"{self.api_url}/admin/auth/login", json=admin_login_data, timeout=10)
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

    def get_client_notifications(self):
        """Get client notifications"""
        if not self.token:
            print("❌ No user token available")
            return []
        
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(f"{self.api_url}/client/notifications", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Retrieved {len(data)} client notifications")
                return data
            else:
                print(f"❌ Failed to get client notifications: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ Client notifications error: {e}")
            return []

    def get_admin_notifications(self):
        """Get admin notifications"""
        if not self.admin_token:
            print("❌ No admin token available")
            return []
        
        headers = {
            'Authorization': f'Bearer {self.admin_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(f"{self.api_url}/admin/notifications", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Retrieved {len(data)} admin notifications")
                return data
            else:
                print(f"❌ Failed to get admin notifications: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ Admin notifications error: {e}")
            return []

    def analyze_notifications(self):
        """Analyze notification types in database"""
        print("🔍 NOTIFICATION DATABASE ANALYSIS")
        print("=" * 80)
        
        # Login
        if not self.login_user():
            print("❌ Cannot proceed without user login")
            return
        
        if not self.login_admin():
            print("❌ Cannot proceed without admin login")
            return
        
        # Get notifications
        client_notifications = self.get_client_notifications()
        admin_notifications = self.get_admin_notifications()
        
        # Analyze client notification types
        print("\n📱 CLIENT NOTIFICATIONS ANALYSIS:")
        print("-" * 50)
        
        client_types = set()
        client_examples = []
        
        for notification in client_notifications:
            if 'type' in notification:
                client_types.add(notification['type'])
                if len(client_examples) < 5:
                    client_examples.append({
                        'id': notification.get('id', 'N/A'),
                        'type': notification.get('type', 'N/A'),
                        'title': notification.get('title', 'N/A'),
                        'message': notification.get('message', 'N/A')[:100] + '...' if len(notification.get('message', '')) > 100 else notification.get('message', 'N/A')
                    })
        
        print(f"Unique client notification types found: {sorted(list(client_types))}")
        print(f"Total client notifications: {len(client_notifications)}")
        
        print("\nClient notification examples:")
        for i, example in enumerate(client_examples):
            print(f"  {i+1}. Type: '{example['type']}', Title: '{example['title']}'")
            print(f"     Message: {example['message']}")
        
        # Analyze admin notification types
        print("\n🔧 ADMIN NOTIFICATIONS ANALYSIS:")
        print("-" * 50)
        
        admin_types = set()
        admin_examples = []
        
        for notification in admin_notifications:
            if 'type' in notification:
                admin_types.add(notification['type'])
                if len(admin_examples) < 5:
                    admin_examples.append({
                        'id': notification.get('id', 'N/A'),
                        'type': notification.get('type', 'N/A'),
                        'title': notification.get('title', 'N/A'),
                        'message': notification.get('message', 'N/A')[:100] + '...' if len(notification.get('message', '')) > 100 else notification.get('message', 'N/A')
                    })
        
        print(f"Unique admin notification types found: {sorted(list(admin_types))}")
        print(f"Total admin notifications: {len(admin_notifications)}")
        
        print("\nAdmin notification examples:")
        for i, example in enumerate(admin_examples):
            print(f"  {i+1}. Type: '{example['type']}', Title: '{example['title']}'")
            print(f"     Message: {example['message']}")
        
        # Backend code analysis
        print("\n💻 BACKEND CODE ANALYSIS:")
        print("-" * 50)
        
        expected_client_types = [
            'approval',  # Account request approved
            'account_completed',  # Account sharing completed
            'withdraw_approved',  # Withdraw approved
            'withdraw_rejected'   # Withdraw rejected
        ]
        
        expected_admin_types = [
            'user_registration',  # New user registration
            'password_reset',     # Password reset
            'new_account_request', # New account request
            'new_topup_request',  # New topup request
            'payment_proof_uploaded', # Payment proof uploaded
            'new_withdraw_request'    # New withdraw request
        ]
        
        print(f"Expected client types from code: {expected_client_types}")
        print(f"Expected admin types from code: {expected_admin_types}")
        
        # Mapping suggestions
        print("\n📋 SUGGESTED NOTIFICATION ROUTING MAPPING:")
        print("-" * 50)
        
        client_mapping = {
            'approval': '/dashboard/kelola-akun',  # Account-related → account management
            'account_completed': '/dashboard/kelola-akun',  # Account-related → account management
            'withdraw_approved': '/dashboard/withdraw',  # Withdrawal-related → withdraw page
            'withdraw_rejected': '/dashboard/withdraw'   # Withdrawal-related → withdraw page
        }
        
        admin_mapping = {
            'user_registration': '/admin/clients',  # User management
            'password_reset': '/admin/clients',     # User management
            'new_account_request': '/admin/requests', # Request management
            'new_topup_request': '/admin/payments',   # Payment verification
            'payment_proof_uploaded': '/admin/payments', # Payment verification
            'new_withdraw_request': '/admin/withdraws'   # Withdraw management
        }
        
        print("Client Notifications:")
        for ntype, route in client_mapping.items():
            print(f"  '{ntype}' → {route}")
        
        print("Admin Notifications:")
        for ntype, route in admin_mapping.items():
            print(f"  '{ntype}' → {route}")
        
        # Comparison analysis
        print("\n🔍 DATABASE vs CODE COMPARISON:")
        print("-" * 50)
        
        client_missing = set(expected_client_types) - client_types
        client_unexpected = client_types - set(expected_client_types)
        admin_missing = set(expected_admin_types) - admin_types
        admin_unexpected = admin_types - set(expected_admin_types)
        
        print(f"Client types in DB: {sorted(list(client_types))}")
        print(f"Client types missing from DB: {sorted(list(client_missing))}")
        print(f"Client types unexpected in DB: {sorted(list(client_unexpected))}")
        
        print(f"Admin types in DB: {sorted(list(admin_types))}")
        print(f"Admin types missing from DB: {sorted(list(admin_missing))}")
        print(f"Admin types unexpected in DB: {sorted(list(admin_unexpected))}")
        
        # Summary
        print("\n📊 SUMMARY:")
        print("-" * 50)
        print(f"✅ Client notification types found: {len(client_types)}")
        print(f"✅ Admin notification types found: {len(admin_types)}")
        print(f"✅ Total client notifications: {len(client_notifications)}")
        print(f"✅ Total admin notifications: {len(admin_notifications)}")
        
        if client_unexpected or admin_unexpected:
            print("\n⚠️  ROUTING FIX NEEDED:")
            if client_unexpected:
                print(f"   Update NotificationNavigationService for client types: {sorted(list(client_unexpected))}")
            if admin_unexpected:
                print(f"   Update NotificationNavigationService for admin types: {sorted(list(admin_unexpected))}")
        else:
            print("\n✅ All notification types match expected patterns")

if __name__ == "__main__":
    tester = NotificationDatabaseTester()
    tester.analyze_notifications()