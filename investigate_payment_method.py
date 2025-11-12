import requests
import json

class PaymentMethodInvestigator:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None

    def authenticate_admin(self):
        """Authenticate as admin"""
        admin_login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        response = requests.post(f"{self.api_url}/admin/auth/login", json=admin_login_data)
        if response.status_code == 200:
            data = response.json()
            self.admin_token = data.get('access_token')
            print("✅ Admin authentication successful")
            return True
        else:
            print(f"❌ Admin authentication failed: {response.status_code}")
            return False

    def investigate_specific_transaction(self):
        """Investigate the specific 5M transaction"""
        if not self.admin_token:
            print("❌ No admin token available")
            return
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        print(f"\n🔍 INVESTIGATING SPECIFIC 5M TRANSACTION")
        print("=" * 60)
        
        # Get all payments
        response = requests.get(f"{self.api_url}/admin/payments", headers=headers)
        
        if response.status_code == 200:
            payments = response.json()
            
            # Find the 5M transaction
            target_transaction = None
            for payment in payments:
                total_amount = payment.get('total_amount', 0)
                if abs(total_amount - 5025000) < 1000:  # Within 1K of 5.025M
                    target_transaction = payment
                    break
            
            if target_transaction:
                print(f"🎯 FOUND TARGET TRANSACTION:")
                print(f"   ID: {target_transaction.get('id')}")
                print(f"   Status: {target_transaction.get('status')}")
                print(f"   Currency: {target_transaction.get('currency')}")
                print(f"   Total Amount: {target_transaction.get('total_amount', 0):,.2f}")
                print(f"   Total Fee: {target_transaction.get('total_fee', 0):,.2f}")
                print(f"   Payment Method: {target_transaction.get('payment_method', 'N/A')}")
                print(f"   Created: {target_transaction.get('created_at')}")
                print(f"   Verified At: {target_transaction.get('verified_at')}")
                
                # Check payment method
                payment_method = target_transaction.get('payment_method', '')
                print(f"\n🔍 PAYMENT METHOD ANALYSIS:")
                print(f"   Payment Method: '{payment_method}'")
                
                if payment_method.startswith('bank_'):
                    print(f"   ✅ Matches bank filter: ^bank_")
                else:
                    print(f"   ❌ Does NOT match bank filter: ^bank_")
                    print(f"   🚨 THIS IS THE ISSUE! Transaction won't be counted in IDR revenue")
                
                # Check status
                status = target_transaction.get('status', '')
                expected_statuses = ["verified", "approved", "completed"]
                print(f"\n🔍 STATUS ANALYSIS:")
                print(f"   Status: '{status}'")
                if status in expected_statuses:
                    print(f"   ✅ Status is in expected list: {expected_statuses}")
                else:
                    print(f"   ❌ Status NOT in expected list: {expected_statuses}")
                
                # Check date
                created_at = target_transaction.get('created_at', '')
                print(f"\n🔍 DATE ANALYSIS:")
                print(f"   Created At: {created_at}")
                print(f"   This should be within 'today' period")
                
                # Full transaction details
                print(f"\n📋 FULL TRANSACTION DETAILS:")
                print(json.dumps(target_transaction, indent=2))
                
            else:
                print(f"❌ Target 5M transaction not found")
                print(f"   Looking for amount around 5,025,000")
                
                # Show all recent large transactions
                print(f"\n📊 RECENT LARGE TRANSACTIONS (>1M):")
                large_transactions = [p for p in payments if p.get('total_amount', 0) > 1000000]
                for i, payment in enumerate(large_transactions[:5]):
                    print(f"   {i+1}. Amount: {payment.get('total_amount', 0):,.2f}, Status: {payment.get('status')}, Method: {payment.get('payment_method', 'N/A')}")
        
        else:
            print(f"❌ Failed to get admin payments: {response.status_code}")

    def check_payment_methods_in_system(self):
        """Check what payment methods exist in the system"""
        if not self.admin_token:
            print("❌ No admin token available")
            return
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        print(f"\n🔍 PAYMENT METHODS IN SYSTEM")
        print("=" * 60)
        
        response = requests.get(f"{self.api_url}/admin/payments", headers=headers)
        
        if response.status_code == 200:
            payments = response.json()
            
            # Collect all payment methods
            payment_methods = {}
            for payment in payments:
                method = payment.get('payment_method', 'N/A')
                currency = payment.get('currency', 'N/A')
                
                if method not in payment_methods:
                    payment_methods[method] = {'IDR': 0, 'USD': 0, 'total': 0}
                
                payment_methods[method][currency] = payment_methods[method].get(currency, 0) + 1
                payment_methods[method]['total'] += 1
            
            print(f"📊 PAYMENT METHODS FOUND:")
            for method, counts in payment_methods.items():
                print(f"   {method}: {counts['total']} total (IDR: {counts.get('IDR', 0)}, USD: {counts.get('USD', 0)})")
                
                # Check if it matches bank filter
                if method.startswith('bank_'):
                    print(f"      ✅ Matches bank filter")
                else:
                    print(f"      ❌ Does NOT match bank filter")
        
        else:
            print(f"❌ Failed to get admin payments: {response.status_code}")

    def run_investigation(self):
        """Run complete investigation"""
        print("🚀 PAYMENT METHOD INVESTIGATION")
        print("=" * 80)
        print("Investigating why 5M IDR transaction isn't counted in financial reports")
        print("=" * 80)
        
        # Step 1: Authenticate
        if not self.authenticate_admin():
            return
        
        # Step 2: Investigate specific transaction
        self.investigate_specific_transaction()
        
        # Step 3: Check all payment methods
        self.check_payment_methods_in_system()
        
        print(f"\n" + "=" * 80)
        print("🔍 INVESTIGATION COMPLETE")
        print("=" * 80)

if __name__ == "__main__":
    investigator = PaymentMethodInvestigator()
    investigator.run_investigation()