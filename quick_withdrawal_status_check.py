#!/usr/bin/env python3
"""
Quick Withdrawal Status Verification
As requested in review: Test with credentials testuser/testpass123
Call GET /api/withdrawals and check status breakdown
"""

import requests
import json
from collections import Counter

def main():
    print("🚀 QUICK WITHDRAWAL STATUS VERIFICATION")
    print("=" * 60)
    print("Testing with credentials: testuser/testpass123")
    print("Checking GET /api/withdrawals for status breakdown")
    print("=" * 60)
    
    base_url = "https://admin-proof-fix.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # Step 1: Authenticate
    print("\n🔐 Authenticating...")
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(
            f"{api_url}/auth/login",
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Authentication failed: HTTP {response.status_code}")
            return
        
        data = response.json()
        if 'access_token' not in data:
            print("❌ No access token in response")
            return
        
        token = data['access_token']
        print("✅ Authentication successful")
        
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return
    
    # Step 2: Get withdrawals
    print("\n📋 Calling GET /api/withdrawals...")
    
    try:
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            f"{api_url}/withdrawals",
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get withdrawals: HTTP {response.status_code}")
            return
        
        withdrawals = response.json()
        print(f"✅ Successfully retrieved withdrawals")
        
    except Exception as e:
        print(f"❌ Error fetching withdrawals: {e}")
        return
    
    # Step 3: Analyze results
    print(f"\n📊 WITHDRAWAL STATUS ANALYSIS")
    print("=" * 40)
    
    total_count = len(withdrawals)
    print(f"1. How many withdrawals exist: {total_count}")
    
    if total_count == 0:
        print("   No withdrawals found for testuser")
        return
    
    # Count statuses
    statuses = [w.get('status', 'unknown') for w in withdrawals]
    status_counts = Counter(statuses)
    
    print(f"\n2. Status breakdown:")
    for status, count in sorted(status_counts.items()):
        print(f"   • {status}: {count}")
    
    # Check for specific statuses
    completed_count = status_counts.get('completed', 0)
    approved_count = status_counts.get('approved', 0)
    pending_count = status_counts.get('pending', 0)
    processing_count = status_counts.get('processing', 0)
    rejected_count = status_counts.get('rejected', 0)
    
    print(f"\n3. For each status type, show count:")
    print(f"   • pending: {pending_count}")
    print(f"   • approved: {approved_count}")
    print(f"   • completed: {completed_count}")
    print(f"   • processing: {processing_count}")
    print(f"   • rejected: {rejected_count}")
    
    # Show examples
    print(f"\n4. Show 2-3 example withdrawal objects with their status field:")
    
    examples_shown = 0
    for status in ['completed', 'approved', 'processing', 'pending', 'rejected']:
        if status in status_counts and examples_shown < 3:
            # Find examples of this status
            status_examples = [w for w in withdrawals if w.get('status') == status]
            
            for i, example in enumerate(status_examples[:2]):  # Max 2 per status
                if examples_shown >= 3:
                    break
                
                examples_shown += 1
                print(f"\n   Example {examples_shown} ({status} status):")
                print(f"   {{")
                print(f"     \"id\": \"{example.get('id', 'N/A')}\",")
                print(f"     \"status\": \"{example.get('status', 'N/A')}\",")
                print(f"     \"requested_amount\": {example.get('requested_amount', 0)},")
                print(f"     \"currency\": \"{example.get('currency', 'N/A')}\",")
                print(f"     \"platform\": \"{example.get('platform', 'N/A')}\",")
                print(f"     \"account_name\": \"{example.get('account_name', 'N/A')}\",")
                print(f"     \"created_at\": \"{example.get('created_at', 'N/A')}\"")
                print(f"   }}")
                
                if examples_shown >= 3:
                    break
    
    # Frontend compatibility check
    print(f"\n🎯 FRONTEND COMPATIBILITY CHECK:")
    print(f"Frontend code checks: status === 'completed' || status === 'approved'")
    
    frontend_compatible = completed_count + approved_count
    print(f"Withdrawals with 'completed' status: {completed_count}")
    print(f"Withdrawals with 'approved' status: {approved_count}")
    print(f"Total frontend-compatible: {frontend_compatible}/{total_count}")
    
    if completed_count > 0:
        print(f"✅ FOUND {completed_count} withdrawals with status 'completed'")
    else:
        print(f"ℹ️  NO withdrawals with status 'completed' found")
    
    if approved_count > 0:
        print(f"✅ FOUND {approved_count} withdrawals with status 'approved'")
    else:
        print(f"ℹ️  NO withdrawals with status 'approved' found")
    
    print(f"\n✅ Quick withdrawal status verification completed!")

if __name__ == "__main__":
    main()