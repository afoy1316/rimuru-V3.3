#!/usr/bin/env python3
"""
Debug Admin Notifications for Transfer Requests
"""

import requests
import json
from datetime import datetime

def debug_admin_notifications():
    base_url = "https://admin-proof-fix.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # Admin login
    admin_login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    response = requests.post(f"{api_url}/admin/auth/login", json=admin_login_data)
    if response.status_code != 200:
        print("❌ Admin login failed")
        return
    
    admin_token = response.json()['access_token']
    headers = {'Authorization': f'Bearer {admin_token}'}
    
    # Get admin notifications
    response = requests.get(f"{api_url}/admin/notifications", headers=headers)
    if response.status_code != 200:
        print("❌ Failed to get admin notifications")
        return
    
    notifications = response.json()
    print(f"📊 Total admin notifications: {len(notifications)}")
    
    # Analyze notification types
    types = {}
    titles = {}
    recent_notifications = []
    
    for notification in notifications:
        notification_type = notification.get('type', 'unknown')
        title = notification.get('title', 'No title')
        created_at = notification.get('created_at', '')
        
        types[notification_type] = types.get(notification_type, 0) + 1
        titles[title] = titles.get(title, 0) + 1
        
        # Check if it's recent (last hour)
        if created_at:
            try:
                # Parse the datetime
                if 'T' in created_at:
                    created_time = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    now = datetime.now(created_time.tzinfo)
                    time_diff = now - created_time
                    
                    if time_diff.total_seconds() < 3600:  # Last hour
                        recent_notifications.append({
                            'type': notification_type,
                            'title': title,
                            'message': notification.get('message', ''),
                            'created_at': created_at,
                            'age_minutes': int(time_diff.total_seconds() / 60)
                        })
            except:
                pass
    
    print("\n📋 Notification Types:")
    for notification_type, count in sorted(types.items()):
        print(f"  {notification_type}: {count}")
    
    print("\n📋 Recent Notifications (last hour):")
    for notification in sorted(recent_notifications, key=lambda x: x['created_at'], reverse=True)[:10]:
        print(f"  🕐 {notification['age_minutes']}min ago - Type: {notification['type']}")
        print(f"     Title: {notification['title']}")
        print(f"     Message: {notification['message'][:100]}...")
        print()
    
    # Look specifically for transfer-related notifications
    transfer_notifications = []
    for notification in notifications:
        title = notification.get('title', '').lower()
        message = notification.get('message', '').lower()
        notification_type = notification.get('type', '').lower()
        
        if ('transfer' in title or 'transfer' in message or 'transfer' in notification_type):
            transfer_notifications.append(notification)
    
    print(f"\n🔍 Transfer-related notifications found: {len(transfer_notifications)}")
    for notification in transfer_notifications[:5]:  # Show first 5
        print(f"  Type: {notification.get('type')}")
        print(f"  Title: {notification.get('title')}")
        print(f"  Message: {notification.get('message', '')[:100]}...")
        print(f"  Created: {notification.get('created_at')}")
        print()
    
    # Check if there are any notifications with the expected admin notification collection
    print("\n🔍 Checking for admin_notifications vs notifications collection...")
    
    # Try to get notifications with different parameters
    response = requests.get(f"{api_url}/admin/notifications?limit=10", headers=headers)
    if response.status_code == 200:
        limited_notifications = response.json()
        print(f"📊 Limited notifications (10): {len(limited_notifications)}")
    
    # Check unread count
    response = requests.get(f"{api_url}/admin/notifications/unread-count", headers=headers)
    if response.status_code == 200:
        unread_count = response.json()
        print(f"📊 Unread admin notifications: {unread_count}")

if __name__ == "__main__":
    debug_admin_notifications()