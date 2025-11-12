#!/usr/bin/env python3

from backend_test import AdManagerAPITester
import requests
import json

def test_afoy_comprehensive():
    """Comprehensive test of afoy's withdrawal eligibility"""
    tester = AdManagerAPITester()
    
    print("🔍 COMPREHENSIVE AFOY WITHDRAWAL ELIGIBILITY TEST")
    print("=" * 60)
    
    # Step 1: Admin login
    if not tester.test_admin_login():
        print("❌ Admin login failed")
        return False
    
    print("\n✅ Admin authentication successful")
    
    # Step 2: Find afoy via admin
    success, clients = tester.run_test(
        "Get all clients (admin)",
        "GET",
        "admin/clients",
        200,
        use_admin_token=True
    )
    
    if not success:
        print("❌ Failed to get clients")
        return False
    
    # Find afoy
    afoy_client = None
    for client in clients:
        if client.get('username') == 'afoy':
            afoy_client = client
            break
    
    if not afoy_client:
        print("❌ User 'afoy' not found")
        return False
    
    afoy_user_id = afoy_client.get('id')
    print(f"✅ Found afoy: ID={afoy_user_id}, Email={afoy_client.get('email')}, USD_Wallet=${afoy_client.get('wallet_balance_usd', 0)}")
    
    # Step 3: Get afoy's accounts via admin endpoint
    success, all_accounts = tester.run_test(
        "Get all accounts (admin)",
        "GET",
        "admin/accounts",
        200,
        use_admin_token=True
    )
    
    if not success:
        print("❌ Failed to get accounts")
        return False
    
    # Find afoy's accounts
    afoy_accounts = []
    google_usd_account = None
    
    for account in all_accounts:
        if account.get('user_id') == afoy_user_id:
            afoy_accounts.append(account)
            if (account.get('platform') == 'google' and 
                account.get('currency') == 'USD' and 
                account.get('balance') == 20.0):
                google_usd_account = account
    
    print(f"✅ Found {len(afoy_accounts)} accounts for afoy")
    
    if google_usd_account:
        print(f"✅ FOUND $20 Google Ads Account:")
        print(f"  Name: {google_usd_account.get('account_name')}")
        print(f"  ID: {google_usd_account.get('id')}")
        print(f"  Balance: ${google_usd_account.get('balance')}")
        print(f"  Currency: {google_usd_account.get('currency')}")
        print(f"  Status: {google_usd_account.get('status')}")
        print(f"  last_topup_date: {google_usd_account.get('last_topup_date')}")
        print(f"  can_withdraw (admin view): {google_usd_account.get('can_withdraw')}")
    else:
        print("❌ $20 Google Ads account not found")
        return False
    
    # Step 4: Check withdrawal eligibility logic manually
    print(f"\n🔍 MANUAL WITHDRAWAL ELIGIBILITY CHECK")
    
    account_id = google_usd_account.get('id')
    
    # Check for pending/approved withdrawals
    try:
        response = requests.get(
            f"{tester.api_url}/admin/withdraws",
            headers={'Authorization': f'Bearer {tester.admin_token}'},
            timeout=10
        )
        
        if response.status_code == 200:
            withdrawals = response.json()
            pending_withdrawals = []
            
            for withdrawal in withdrawals:
                if (withdrawal.get('account_id') == account_id and 
                    withdrawal.get('status') in ['pending', 'approved']):
                    pending_withdrawals.append(withdrawal)
            
            print(f"✅ Pending/approved withdrawals for this account: {len(pending_withdrawals)}")
            
            if pending_withdrawals:
                print("❌ Account has pending withdrawals - withdrawal blocked")
                for w in pending_withdrawals:
                    print(f"  - Withdrawal {w.get('id')[:8]}: Status={w.get('status')}, Created={w.get('created_at')}")
            else:
                print("✅ No pending withdrawals - account should be eligible")
                
                # Check for completed withdrawals and topup history
                completed_withdrawals = []
                for withdrawal in withdrawals:
                    if (withdrawal.get('account_id') == account_id and 
                        withdrawal.get('status') in ['completed', 'approved']):
                        completed_withdrawals.append(withdrawal)
                
                print(f"✅ Completed withdrawals for this account: {len(completed_withdrawals)}")
                
                if completed_withdrawals:
                    # Find the most recent completed withdrawal
                    latest_withdrawal = max(completed_withdrawals, 
                                          key=lambda x: x.get('processed_at', ''))
                    print(f"  Latest withdrawal processed: {latest_withdrawal.get('processed_at')}")
                    
                    # Compare with last topup date
                    last_topup_date = google_usd_account.get('last_topup_date')
                    print(f"  Last topup date: {last_topup_date}")
                    
                    if last_topup_date and latest_withdrawal.get('processed_at'):
                        if last_topup_date > latest_withdrawal.get('processed_at'):
                            print("✅ Top-up is after last withdrawal - account should be eligible")
                        else:
                            print("❌ Top-up is before last withdrawal - account not eligible")
                    else:
                        print("⚠️ Cannot compare dates - missing data")
                else:
                    print("✅ No completed withdrawals - account should be eligible")
        else:
            print(f"❌ Failed to get withdrawals: {response.status_code}")
    
    except Exception as e:
        print(f"❌ Error checking withdrawals: {e}")
    
    # Step 5: Test withdrawal creation via admin (simulate user request)
    print(f"\n🔍 TESTING WITHDRAWAL CREATION")
    
    # Create a withdrawal request for afoy's account
    withdrawal_data = {
        "account_id": account_id,
        "currency": "USD"
    }
    
    # We can't create withdrawal as afoy directly, but we can check the logic
    # by examining the backend response patterns
    
    print(f"\n📊 SUMMARY:")
    print(f"✅ User 'afoy' found with ID: {afoy_user_id}")
    print(f"✅ Google Ads account with $20 balance found")
    print(f"✅ Account has last_topup_date: {google_usd_account.get('last_topup_date')}")
    print(f"⚠️ Admin endpoint doesn't calculate can_withdraw field")
    print(f"🔍 Need to test via regular /api/accounts endpoint to get withdrawal eligibility")
    
    return True

if __name__ == '__main__':
    test_afoy_comprehensive()