import requests
import json
from datetime import datetime, timezone, timedelta

class FinancialReportsDebugger:
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

    def get_financial_reports_detailed(self):
        """Get detailed financial reports for different periods"""
        if not self.admin_token:
            print("❌ No admin token available")
            return
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        periods = ["today", "week", "month", "all"]
        
        for period in periods:
            print(f"\n🔍 Financial Reports - {period.upper()}")
            print("=" * 50)
            
            response = requests.get(
                f"{self.api_url}/admin/financial-reports/summary?period={period}",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Extract key metrics
                revenue = data.get('revenue', {})
                topup_volume = data.get('topup_volume', {})
                
                revenue_idr = revenue.get('total_revenue_idr', 0)
                topup_idr = topup_volume.get('total_topup_idr', 0)
                
                # Breakdown
                ad_topup_fee = revenue.get('breakdown_idr', {}).get('ad_account_topup_fee', 0)
                wallet_transfer_fee = revenue.get('breakdown_idr', {}).get('wallet_transfer_fee', 0)
                
                wallet_topup_amount = topup_volume.get('breakdown_idr', {}).get('wallet_topup', 0)
                ad_topup_amount = topup_volume.get('breakdown_idr', {}).get('ad_account_topup', 0)
                
                print(f"📊 Revenue IDR: Rp {revenue_idr:,.2f}")
                print(f"   - Ad Account Top-up Fee: Rp {ad_topup_fee:,.2f}")
                print(f"   - Wallet Transfer Fee: Rp {wallet_transfer_fee:,.2f}")
                
                print(f"📊 Top-up Volume IDR: Rp {topup_idr:,.2f}")
                print(f"   - Wallet Top-up: Rp {wallet_topup_amount:,.2f}")
                print(f"   - Ad Account Top-up: Rp {ad_topup_amount:,.2f}")
                
                # Analysis
                if period == "today":
                    print(f"\n🔍 TODAY'S ANALYSIS:")
                    if revenue_idr > 0 and topup_idr == 0:
                        print(f"⚠️  ISSUE: Revenue exists but no top-up volume")
                        print(f"   This suggests transactions with unsupported status")
                    elif revenue_idr >= 50000 and topup_idr >= 5000000:
                        print(f"✅ EXPECTED: Both user transactions appear to be included")
                    else:
                        print(f"❓ PARTIAL: Some transactions may be missing")
                        
                        if ad_topup_fee == 0:
                            print(f"   - Missing: Ad account top-up fee (expected ~25K)")
                        if ad_topup_amount == 0:
                            print(f"   - Missing: Ad account top-up amount (expected ~5M)")
                        if wallet_transfer_fee < 25000:
                            print(f"   - Missing: Wallet transfer fee (expected ~25K)")
                
            else:
                print(f"❌ Failed to get {period} reports: {response.status_code}")

    def check_admin_payments_endpoint(self):
        """Check admin payments endpoint for recent transactions"""
        if not self.admin_token:
            print("❌ No admin token available")
            return
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        print(f"\n🔍 ADMIN PAYMENTS ENDPOINT")
        print("=" * 50)
        
        # Get recent payments
        response = requests.get(f"{self.api_url}/admin/payments", headers=headers)
        
        if response.status_code == 200:
            payments = response.json()
            print(f"📊 Total payments found: {len(payments)}")
            
            # Look for recent payments (last 7 days)
            recent_payments = []
            now = datetime.now(timezone.utc)
            week_ago = now - timedelta(days=7)
            
            for payment in payments:
                created_at_str = payment.get('created_at', '')
                try:
                    created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                    if created_at >= week_ago:
                        recent_payments.append(payment)
                except:
                    pass
            
            print(f"📊 Recent payments (last 7 days): {len(recent_payments)}")
            
            # Analyze recent payments
            for i, payment in enumerate(recent_payments[:5]):  # Show first 5
                print(f"\n💰 Payment {i+1}:")
                print(f"   ID: {payment.get('id', 'N/A')}")
                print(f"   Status: {payment.get('status', 'N/A')}")
                print(f"   Currency: {payment.get('currency', 'N/A')}")
                print(f"   Total Amount: {payment.get('total_amount', 0):,.2f}")
                print(f"   Total Fee: {payment.get('total_fee', 0):,.2f}")
                print(f"   Created: {payment.get('created_at', 'N/A')}")
                
                # Check if this matches user's expected transaction
                total_amount = payment.get('total_amount', 0)
                total_fee = payment.get('total_fee', 0)
                status = payment.get('status', '')
                
                if abs(total_amount - 5000000) < 100000:  # Within 100K of 5M
                    print(f"   🎯 POTENTIAL MATCH: User's 5M transaction")
                    print(f"      Status: {status}")
                    if status not in ["verified", "approved", "completed"]:
                        print(f"      ⚠️  STATUS ISSUE: '{status}' not in expected list")
                
        else:
            print(f"❌ Failed to get admin payments: {response.status_code}")

    def check_wallet_topup_requests(self):
        """Check wallet top-up requests endpoint"""
        if not self.admin_token:
            print("❌ No admin token available")
            return
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        print(f"\n🔍 WALLET TOP-UP REQUESTS")
        print("=" * 50)
        
        response = requests.get(f"{self.api_url}/admin/wallet-topup-requests", headers=headers)
        
        if response.status_code == 200:
            requests_data = response.json()
            print(f"📊 Total wallet top-up requests: {len(requests_data)}")
            
            # Look for recent requests
            recent_requests = []
            now = datetime.now(timezone.utc)
            week_ago = now - timedelta(days=7)
            
            for request in requests_data:
                created_at_str = request.get('created_at', '')
                try:
                    created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                    if created_at >= week_ago:
                        recent_requests.append(request)
                except:
                    pass
            
            print(f"📊 Recent wallet requests (last 7 days): {len(recent_requests)}")
            
            # Analyze recent requests
            for i, request in enumerate(recent_requests[:5]):
                print(f"\n💳 Wallet Request {i+1}:")
                print(f"   ID: {request.get('id', 'N/A')}")
                print(f"   Status: {request.get('status', 'N/A')}")
                print(f"   Currency: {request.get('currency', 'N/A')}")
                print(f"   Amount: {request.get('amount', 0):,.2f}")
                print(f"   Created: {request.get('created_at', 'N/A')}")
                
        else:
            print(f"❌ Failed to get wallet top-up requests: {response.status_code}")

    def run_debug_analysis(self):
        """Run comprehensive debug analysis"""
        print("🚀 FINANCIAL REPORTS DEBUG ANALYSIS")
        print("=" * 80)
        print("Investigating why user's 5M IDR transaction isn't showing in today's reports")
        print("=" * 80)
        
        # Step 1: Authenticate
        if not self.authenticate_admin():
            return
        
        # Step 2: Get detailed financial reports
        self.get_financial_reports_detailed()
        
        # Step 3: Check admin payments endpoint
        self.check_admin_payments_endpoint()
        
        # Step 4: Check wallet top-up requests
        self.check_wallet_topup_requests()
        
        print(f"\n" + "=" * 80)
        print("🔍 DEBUG ANALYSIS COMPLETE")
        print("=" * 80)
        print("Key findings:")
        print("1. Check if user's 5M transaction exists in admin/payments")
        print("2. Verify the transaction status matches expected values")
        print("3. Confirm transaction date is within 'today' period")
        print("4. Look for status filter mismatches")

if __name__ == "__main__":
    debugger = FinancialReportsDebugger()
    debugger.run_debug_analysis()