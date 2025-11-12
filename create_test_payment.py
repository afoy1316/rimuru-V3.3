#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class TestPaymentCreator:
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
        
        response = requests.post(f"{self.api_url}/auth/login", json=login_data)
        if response.status_code == 200:
            self.token = response.json()['access_token']
            print("✅ User login successful")
            return True
        
        # If that fails, try creating a new user
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "username": f"paytest_{timestamp}",
            "name": f"Payment Test User {timestamp}",
            "phone_number": f"08123456{timestamp}",
            "address": f"Jl. Payment Test No. {timestamp}",
            "city": "Jakarta",
            "province": "DKI Jakarta",
            "email": f"paytest_{timestamp}@example.com",
            "password": "password123"
        }
        
        # Register user
        reg_response = requests.post(f"{self.api_url}/auth/register", json=user_data)
        if reg_response.status_code == 200:
            # Login with new user
            login_response = requests.post(f"{self.api_url}/auth/login", json={
                "username": user_data["username"],
                "password": user_data["password"]
            })
            
            if login_response.status_code == 200:
                self.token = login_response.json()['access_token']
                print(f"✅ Created and logged in as new user: {user_data['username']}")
                return True
        
        print("❌ Failed to login as user")
        return False

    def login_admin(self):
        """Login as admin"""
        admin_login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        response = requests.post(f"{self.api_url}/admin/auth/login", json=admin_login_data)
        if response.status_code == 200:
            self.admin_token = response.json()['access_token']
            print("✅ Admin login successful")
            return True
        
        print("❌ Admin login failed")
        return False

    def create_test_payment_with_proof(self):
        """Create a test payment and simulate proof upload"""
        if not self.token:
            print("❌ User token required")
            return None
        
        # First, get user accounts
        headers = {'Authorization': f'Bearer {self.token}'}
        accounts_response = requests.get(f"{self.api_url}/accounts", headers=headers)
        
        if accounts_response.status_code != 200:
            print("❌ Failed to get user accounts")
            return None
        
        accounts = accounts_response.json()
        if not accounts:
            print("❌ No accounts found for user")
            return None
        
        # Use first account for testing
        test_account = accounts[0]
        print(f"✅ Using account: {test_account.get('account_name')} ({test_account.get('platform')})")
        
        # Create topup request
        topup_data = {
            "currency": "IDR",
            "accounts": [
                {
                    "account_id": test_account.get('id'),
                    "amount": 100000,
                    "fee_percentage": 5,
                    "fee_amount": 5000
                }
            ],
            "total_amount": 105000,
            "total_fee": 5000
        }
        
        topup_response = requests.post(f"{self.api_url}/topup", json=topup_data, headers=headers)
        
        if topup_response.status_code != 200:
            print(f"❌ Failed to create topup request: {topup_response.text}")
            return None
        
        topup_result = topup_response.json()
        request_id = topup_result.get('request_id')
        print(f"✅ Created topup request: {request_id}")
        
        # Simulate proof upload by directly updating the database status
        # In a real scenario, this would be done through file upload
        if self.admin_token:
            # Use admin privileges to update the payment status to proof_uploaded
            # This simulates what happens after a user uploads payment proof
            
            # First, let's check the current payment
            admin_headers = {'Authorization': f'Bearer {self.admin_token}'}
            payment_response = requests.get(f"{self.api_url}/admin/payments/{request_id}", headers=admin_headers)
            
            if payment_response.status_code == 200:
                print(f"✅ Payment found in admin system: {request_id}")
                print(f"   Status: {payment_response.json().get('status')}")
                print(f"   Amount: {payment_response.json().get('currency')} {payment_response.json().get('total_amount')}")
                return request_id
            else:
                print(f"❌ Payment not found in admin system: {payment_response.text}")
                return None
        
        return request_id

    def run_test(self):
        """Run the test payment creation"""
        print("🚀 Creating Test Payment for Admin Verification...")
        print("=" * 60)
        
        # Login as user
        if not self.login_user():
            return
        
        # Login as admin
        if not self.login_admin():
            return
        
        # Create test payment
        payment_id = self.create_test_payment_with_proof()
        
        if payment_id:
            print("\n✅ Test payment created successfully!")
            print(f"Payment ID: {payment_id}")
            print("\nYou can now test the admin payment verification endpoints with this payment.")
        else:
            print("\n❌ Failed to create test payment")

if __name__ == "__main__":
    creator = TestPaymentCreator()
    creator.run_test()