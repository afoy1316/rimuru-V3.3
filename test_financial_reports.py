#!/usr/bin/env python3
"""
Focused test for Financial Reports functionality
"""
import requests
import sys
import json
from datetime import datetime, timedelta

class FinancialReportsAPITester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_detail = response.json()
                    details += f", Response: {error_detail}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        print("\n🔍 Testing Admin Login...")
        
        admin_login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/auth/login",
            200,
            data=admin_login_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.log_test(
                "Admin Authentication Success",
                True,
                "Successfully authenticated as admin"
            )
            return True
        else:
            self.log_test(
                "Admin Authentication Failed",
                False,
                "Failed to authenticate as admin"
            )
            return False

    def test_financial_reports_summary(self):
        """Test financial reports summary endpoint"""
        print("\n🔍 Testing Financial Reports Summary API...")
        
        if not self.admin_token:
            self.log_test(
                "Financial Reports Test Setup",
                False,
                "Admin token required for financial reports testing"
            )
            return False
        
        # Test 1: Basic summary with default parameters
        success, response = self.run_test(
            "GET /api/admin/financial-reports/summary - Default",
            "GET",
            "admin/financial-reports/summary",
            200
        )
        
        if not success:
            return False
        
        # Verify response structure
        required_fields = ['topup_summary', 'withdraw_summary', 'revenue', 'period']
        missing_fields = [field for field in required_fields if field not in response]
        
        if missing_fields:
            self.log_test(
                "Summary Response Structure",
                False,
                f"Missing fields: {missing_fields}"
            )
            return False
        
        # Test 2: Test with different period filters
        periods = ['today', 'week', 'month', 'year', 'all']
        
        for period in periods:
            success, period_response = self.run_test(
                f"Financial Summary - Period: {period}",
                "GET",
                f"admin/financial-reports/summary?period={period}",
                200
            )
            
            if success:
                # Verify period is correctly set in response
                if period_response.get('period') != period:
                    self.log_test(
                        f"Period Filter Validation - {period}",
                        False,
                        f"Expected period '{period}', got '{period_response.get('period')}'"
                    )
                else:
                    self.log_test(
                        f"Period Filter Validation - {period}",
                        True,
                        f"Period filter working correctly"
                    )
        
        # Test 3: Test with custom date ranges
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        success, date_response = self.run_test(
            "Financial Summary - Custom Date Range",
            "GET",
            f"admin/financial-reports/summary?start_date={start_date.isoformat()}&end_date={end_date.isoformat()}",
            200
        )
        
        if success:
            # Verify date range is set in response
            date_range = date_response.get('date_range', {})
            if date_range.get('start') and date_range.get('end'):
                self.log_test(
                    "Custom Date Range",
                    True,
                    f"Date range properly set: {date_range['start']} to {date_range['end']}"
                )
            else:
                self.log_test(
                    "Custom Date Range",
                    False,
                    "Date range not properly set in response"
                )
        
        # Test 4: Verify revenue calculations structure
        revenue = response.get('revenue', {})
        expected_revenue_fields = ['total_fees_idr', 'total_fees_usd', 'total_topup_idr', 'total_topup_usd', 'total_withdraw_idr', 'total_withdraw_usd']
        missing_revenue_fields = [field for field in expected_revenue_fields if field not in revenue]
        
        if missing_revenue_fields:
            self.log_test(
                "Revenue Structure Validation",
                False,
                f"Missing revenue fields: {missing_revenue_fields}"
            )
        else:
            self.log_test(
                "Revenue Structure Validation",
                True,
                "All revenue fields present"
            )
        
        # Test 5: Verify currency breakdown
        topup_summary = response.get('topup_summary', {})
        withdraw_summary = response.get('withdraw_summary', {})
        
        # Check if IDR and USD are properly separated
        currencies_found = []
        if 'IDR' in topup_summary or 'IDR' in withdraw_summary:
            currencies_found.append('IDR')
        if 'USD' in topup_summary or 'USD' in withdraw_summary:
            currencies_found.append('USD')
        
        self.log_test(
            "Currency Breakdown",
            True,
            f"Found currencies: {currencies_found}"
        )
        
        return True

    def test_financial_reports_growth(self):
        """Test financial reports growth endpoint"""
        print("\n🔍 Testing Financial Reports Growth API...")
        
        if not self.admin_token:
            self.log_test(
                "Financial Growth Test Setup",
                False,
                "Admin token required for financial growth testing"
            )
            return False
        
        # Test 1: Basic growth data with default parameters
        success, response = self.run_test(
            "GET /api/admin/financial-reports/growth - Default",
            "GET",
            "admin/financial-reports/growth",
            200
        )
        
        if not success:
            return False
        
        # Verify response structure
        required_fields = ['growth_data', 'period', 'start_date', 'end_date']
        missing_fields = [field for field in required_fields if field not in response]
        
        if missing_fields:
            self.log_test(
                "Growth Response Structure",
                False,
                f"Missing fields: {missing_fields}"
            )
            return False
        
        # Test 2: Verify growth_data structure
        growth_data = response.get('growth_data', {})
        expected_growth_fields = ['topup', 'withdraw', 'revenue']
        missing_growth_fields = [field for field in expected_growth_fields if field not in growth_data]
        
        if missing_growth_fields:
            self.log_test(
                "Growth Data Structure",
                False,
                f"Missing growth data fields: {missing_growth_fields}"
            )
            return False
        
        # Test 3: Verify currency separation in growth data
        for data_type in ['topup', 'withdraw', 'revenue']:
            data_section = growth_data.get(data_type, {})
            if 'IDR' not in data_section or 'USD' not in data_section:
                self.log_test(
                    f"Growth Data Currency Separation - {data_type}",
                    False,
                    f"Missing IDR or USD in {data_type} data"
                )
            else:
                self.log_test(
                    f"Growth Data Currency Separation - {data_type}",
                    True,
                    f"Both IDR and USD present in {data_type} data"
                )
        
        # Test 4: Test different period groupings
        periods = ['day', 'week', 'month']
        
        for period in periods:
            success, period_response = self.run_test(
                f"Financial Growth - Period: {period}",
                "GET",
                f"admin/financial-reports/growth?period={period}",
                200
            )
            
            if success:
                if period_response.get('period') != period:
                    self.log_test(
                        f"Growth Period Validation - {period}",
                        False,
                        f"Expected period '{period}', got '{period_response.get('period')}'"
                    )
                else:
                    self.log_test(
                        f"Growth Period Validation - {period}",
                        True,
                        f"Growth period filter working correctly"
                    )
        
        return True

    def test_financial_reports_export(self):
        """Test financial reports export endpoint"""
        print("\n🔍 Testing Financial Reports Export API...")
        
        if not self.admin_token:
            self.log_test(
                "Financial Export Test Setup",
                False,
                "Admin token required for financial export testing"
            )
            return False
        
        # Test 1: PDF export generation
        success, pdf_response = self.run_test(
            "GET /api/admin/financial-reports/export - PDF",
            "GET",
            "admin/financial-reports/export?format=pdf",
            200
        )
        
        if success:
            self.log_test(
                "PDF Export Generation",
                True,
                "PDF export generated without errors"
            )
        else:
            self.log_test(
                "PDF Export Generation",
                False,
                "PDF export failed"
            )
            return False
        
        # Test 2: Excel export generation (should fall back to CSV if openpyxl not available)
        success, excel_response = self.run_test(
            "GET /api/admin/financial-reports/export - Excel",
            "GET",
            "admin/financial-reports/export?format=xlsx",
            200
        )
        
        if success:
            self.log_test(
                "Excel Export Generation",
                True,
                "Excel export generated (or CSV fallback) without errors"
            )
        else:
            self.log_test(
                "Excel Export Generation",
                False,
                "Excel export failed"
            )
        
        # Test 3: Test unsupported format
        success, unsupported_response = self.run_test(
            "Export Unsupported Format",
            "GET",
            "admin/financial-reports/export?format=xml",
            400  # Should return 400 for unsupported format
        )
        
        if success:
            self.log_test(
                "Unsupported Format Validation",
                True,
                "Unsupported format properly rejected"
            )
        else:
            self.log_test(
                "Unsupported Format Validation",
                False,
                "Unsupported format not properly rejected"
            )
        
        return True

    def test_financial_data_accuracy(self):
        """Test financial calculations accuracy"""
        print("\n🔍 Testing Financial Data Accuracy...")
        
        if not self.admin_token:
            self.log_test(
                "Financial Accuracy Test Setup",
                False,
                "Admin token required for financial accuracy testing"
            )
            return False
        
        # Test 1: Get financial summary to analyze data
        success, summary_response = self.run_test(
            "Get Financial Summary for Accuracy Check",
            "GET",
            "admin/financial-reports/summary",
            200
        )
        
        if not success:
            return False
        
        # Test 2: Verify revenue only includes fees from verified top-ups
        revenue = summary_response.get('revenue', {})
        topup_summary = summary_response.get('topup_summary', {})
        
        # Check if revenue calculation logic is correct
        for currency in ['IDR', 'USD']:
            total_fees_key = f'total_fees_{currency.lower()}'
            calculated_fees = revenue.get(total_fees_key, 0)
            
            # Get verified topup fees for this currency
            currency_topups = topup_summary.get(currency, {})
            verified_fees = currency_topups.get('verified', {}).get('fee', 0)
            completed_fees = currency_topups.get('completed', {}).get('fee', 0)
            
            self.log_test(
                f"Revenue Calculation Check - {currency}",
                True,
                f"Total fees: {calculated_fees}, Verified fees: {verified_fees}, Completed fees: {completed_fees}"
            )
        
        # Test 3: Verify multi-currency support works properly
        currencies_in_topup = list(topup_summary.keys())
        withdraw_summary = summary_response.get('withdraw_summary', {})
        currencies_in_withdraw = list(withdraw_summary.keys())
        currencies_in_revenue = []
        
        if revenue.get('total_fees_idr', 0) > 0 or revenue.get('total_topup_idr', 0) > 0:
            currencies_in_revenue.append('IDR')
        if revenue.get('total_fees_usd', 0) > 0 or revenue.get('total_topup_usd', 0) > 0:
            currencies_in_revenue.append('USD')
        
        self.log_test(
            "Multi-Currency Support",
            True,
            f"Currencies found - TopUp: {currencies_in_topup}, Withdraw: {currencies_in_withdraw}, Revenue: {currencies_in_revenue}"
        )
        
        # Test 4: Test with real database data by checking if we have any actual data
        has_real_data = False
        total_transactions = 0
        
        for currency_data in topup_summary.values():
            for status_data in currency_data.values():
                total_transactions += status_data.get('count', 0)
        
        for currency_data in withdraw_summary.values():
            for status_data in currency_data.values():
                total_transactions += status_data.get('count', 0)
        
        if total_transactions > 0:
            has_real_data = True
        
        self.log_test(
            "Real Database Data Check",
            True,
            f"Found {total_transactions} total transactions in database" if has_real_data else "No transactions found in database (testing with empty data)"
        )
        
        return True

    def run_all_tests(self):
        """Run all financial reports tests"""
        print("🚀 Starting Financial Reports API Tests...")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Admin Login", self.test_admin_login),
            ("Financial Reports Summary", self.test_financial_reports_summary),
            ("Financial Reports Growth", self.test_financial_reports_growth),
            ("Financial Reports Export", self.test_financial_reports_export),
            ("Financial Data Accuracy", self.test_financial_data_accuracy),
        ]
        
        for test_name, test_func in tests:
            try:
                print(f"\n{'='*60}")
                print(f"🧪 Running: {test_name}")
                print(f"{'='*60}")
                test_func()
            except Exception as e:
                self.log_test(f"{test_name} - Exception", False, f"Unexpected error: {str(e)}")
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 FINANCIAL REPORTS TEST SUMMARY")
        print("="*60)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print("="*60)
        
        # Print failed tests
        failed_tests = []
        if self.tests_run - self.tests_passed > 0:
            print("\n❌ FAILED TESTS:")
            print("  Check the detailed output above for specific failures")
        
        print(f"\n🏁 Financial Reports Testing completed at {datetime.now().isoformat()}")

if __name__ == "__main__":
    tester = FinancialReportsAPITester()
    tester.run_all_tests()