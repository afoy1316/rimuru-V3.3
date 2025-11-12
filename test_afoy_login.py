#!/usr/bin/env python3

from backend_test import AdManagerAPITester
import requests

def test_afoy_login():
    tester = AdManagerAPITester()
    
    # Try to login as afoy with different passwords
    passwords = ['password123', 'testpass123', 'admin123', 'afoy123', '123456', 'afoy', 'test123']
    
    for password in passwords:
        try:
            response = requests.post(f'{tester.api_url}/auth/login', 
                                   json={'username': 'afoy', 'password': password}, 
                                   timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    print(f'✅ SUCCESS: Login as afoy with password: {password}')
                    token = data['access_token']
                    
                    # Get afoy's profile
                    profile_response = requests.get(f'{tester.api_url}/auth/me',
                                                  headers={'Authorization': f'Bearer {token}'},
                                                  timeout=10)
                    if profile_response.status_code == 200:
                        profile = profile_response.json()
                        print(f'Profile: Username={profile.get("username")}, ID={profile.get("id")}, USD_Wallet=${profile.get("wallet_balance_usd", 0)}')
                    
                    # Get afoy's accounts
                    accounts_response = requests.get(f'{tester.api_url}/accounts',
                                                   headers={'Authorization': f'Bearer {token}'},
                                                   timeout=10)
                    if accounts_response.status_code == 200:
                        accounts = accounts_response.json()
                        print(f'Found {len(accounts)} accounts for afoy')
                        
                        # Look for the $20 Google Ads account
                        google_usd_accounts = []
                        for account in accounts:
                            if account.get('platform') == 'google' and account.get('currency') == 'USD':
                                google_usd_accounts.append(account)
                                print(f'Google USD Account: {account.get("account_name")} - Balance: ${account.get("balance")} - can_withdraw: {account.get("can_withdraw")}')
                                
                                if account.get('balance') == 20.0:
                                    print(f'✅ FOUND $20 Google Ads Account:')
                                    print(f'  Name: {account.get("account_name")}')
                                    print(f'  Balance: ${account.get("balance")}')
                                    print(f'  Currency: {account.get("currency")}')
                                    print(f'  can_withdraw: {account.get("can_withdraw")}')
                                    print(f'  last_topup_date: {account.get("last_topup_date")}')
                                    
                                    # Test withdrawal if eligible
                                    if account.get('can_withdraw'):
                                        withdrawal_data = {
                                            'account_id': account.get('id'),
                                            'currency': 'USD'
                                        }
                                        withdrawal_response = requests.post(f'{tester.api_url}/withdrawals',
                                                                          json=withdrawal_data,
                                                                          headers={'Authorization': f'Bearer {token}'},
                                                                          timeout=10)
                                        print(f'Withdrawal test result: {withdrawal_response.status_code}')
                                        if withdrawal_response.status_code == 200:
                                            print(f'✅ WITHDRAWAL SUCCESS: {withdrawal_response.json()}')
                                        else:
                                            print(f'❌ WITHDRAWAL FAILED: {withdrawal_response.text}')
                                    else:
                                        print(f'❌ WITHDRAWAL NOT ELIGIBLE: can_withdraw = {account.get("can_withdraw")}')
                        
                        if not google_usd_accounts:
                            print('❌ No Google USD accounts found for afoy')
                    
                    return True
            else:
                print(f'❌ Failed login with password: {password} (Status: {response.status_code})')
        except Exception as e:
            print(f'❌ Error with password {password}: {str(e)}')
    
    print('❌ Could not login as afoy with any password')
    return False

if __name__ == '__main__':
    test_afoy_login()