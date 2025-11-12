#!/usr/bin/env python3

import requests
import json

def main():
    """Debug admin notifications"""
    base_url = "https://admin-proof-fix.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    print("🔍 DEBUGGING ADMIN NOTIFICATIONS")
    print("=" * 50)
    
    # 1. Admin Login
    print("\n1. Admin Login...")
    admin_login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    response = requests.post(f"{api_url}/admin/auth/login", json=admin_login_data)
    print(f"Login Status: {response.status_code}")
    
    if response.status_code != 200:
        print("❌ Admin login failed")
        return
    
    admin_token = response.json()['access_token']
    headers = {'Authorization': f'Bearer {admin_token}'}
    
    # 2. Check unread count
    print("\n2. Check unread count...")
    response = requests.get(f"{api_url}/admin/notifications/unread-count", headers=headers)
    print(f"Unread Count Status: {response.status_code}")
    if response.status_code == 200:
        count_data = response.json()
        print(f"Unread Count: {count_data}")
    else:
        print(f"Error: {response.text}")
    
    # 3. Get all notifications
    print("\n3. Get all notifications...")
    response = requests.get(f"{api_url}/admin/notifications", headers=headers)
    print(f"Notifications Status: {response.status_code}")
    if response.status_code == 200:
        notifications = response.json()
        print(f"Total Notifications: {len(notifications)}")
        
        # Show recent notifications
        for i, notif in enumerate(notifications[:5]):
            print(f"  {i+1}. {notif.get('title', 'No title')} - Read: {notif.get('is_read', 'Unknown')} - Type: {notif.get('type', 'Unknown')}")
    else:
        print(f"Error: {response.text}")
    
    # 4. Create a test account request to generate notification
    print("\n4. Creating test account request...")
    
    # First login as client
    client_login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    response = requests.post(f"{api_url}/auth/login", json=client_login_data)
    if response.status_code == 200:
        client_token = response.json()['access_token']
        client_headers = {'Authorization': f'Bearer {client_token}'}
        
        # Create account request
        from datetime import datetime
        timestamp = datetime.now().strftime('%H%M%S')
        account_request_data = {
            "platform": "facebook",
            "account_name": f"Debug Test Account {timestamp}",
            "gmt": "GMT+7",
            "currency": "IDR",
            "delivery_method": "BM_ID",
            "bm_id_or_email": "123456789012345",
            "notes": "Debug test for notification system"
        }
        
        response = requests.post(f"{api_url}/accounts/request", json=account_request_data, headers=client_headers)
        print(f"Account Request Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Account Request Response: {response.json()}")
        else:
            print(f"Error: {response.text}")
        
        # 5. Check unread count again
        print("\n5. Check unread count after request...")
        response = requests.get(f"{api_url}/admin/notifications/unread-count", headers=headers)
        print(f"New Unread Count Status: {response.status_code}")
        if response.status_code == 200:
            count_data = response.json()
            print(f"New Unread Count: {count_data}")
        
        # 6. Get notifications again
        print("\n6. Get notifications after request...")
        response = requests.get(f"{api_url}/admin/notifications", headers=headers)
        if response.status_code == 200:
            notifications = response.json()
            print(f"Total Notifications After: {len(notifications)}")
            
            # Show recent notifications
            for i, notif in enumerate(notifications[:3]):
                print(f"  {i+1}. {notif.get('title', 'No title')} - Read: {notif.get('is_read', 'Unknown')} - Type: {notif.get('type', 'Unknown')} - Created: {notif.get('created_at', 'Unknown')}")
    else:
        print("❌ Client login failed")

if __name__ == "__main__":
    main()