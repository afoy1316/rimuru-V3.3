#!/usr/bin/env python3
"""
Financial Reports Debugging Script
Specifically designed to debug why financial reports data is empty
"""

import requests
import json
from datetime import datetime

class FinancialReportsDebugger:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")
    
    def admin_login(self):
        """Login as admin"""
        self.log("Attempting admin login...")
        
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/admin/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get('access_token')
                self.log("✅ Admin login successful", "SUCCESS")
                return True
            else:
                self.log(f"❌ Admin login failed: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin login exception: {str(e)}", "ERROR")
            return False
    
    def make_admin_request(self, endpoint, method="GET", params=None):
        """Make authenticated admin request"""
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return None, None
            
        headers = {
            'Authorization': f'Bearer {self.admin_token}',
            'Content-Type': 'application/json'
        }
        
        url = f"{self.api_url}/{endpoint}"
        if params:
            url += f"?{params}"
            
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            else:
                response = requests.post(url, headers=headers, timeout=10)
                
            return response.status_code, response.json() if response.status_code == 200 else response.text
            
        except Exception as e:
            self.log(f"❌ Request exception: {str(e)}", "ERROR")
            return None, None
    
    def debug_database_collections(self):
        """Step 1: Check actual data in database collections"""
        self.log("=" * 60)
        self.log("STEP 1: DATABASE DATA VERIFICATION")
        self.log("=" * 60)
        
        # Check topup_requests collection
        self.log("Checking topup_requests collection...")
        status, topup_data = self.make_admin_request("topup-requests")
        
        if status == 200 and isinstance(topup_data, list):
            topup_count = len(topup_data)
            verified_topups = [req for req in topup_data if req.get('status') in ['verified', 'completed']]
            verified_count = len(verified_topups)
            
            self.log(f"📊 TopUp Requests: {topup_count} total, {verified_count} verified/completed")
            
            # Show sample data
            for i, req in enumerate(topup_data[:5]):
                status_val = req.get('status', 'Unknown')
                amount = req.get('total_amount', 0)
                currency = req.get('currency', 'Unknown')
                created_at = req.get('created_at', 'Unknown')
                
                self.log(f"   Sample {i+1}: Status={status_val}, Amount={currency} {amount}, Date={created_at}")
        else:
            self.log(f"❌ Failed to get topup requests: {status}")
        
        # Check withdraw_requests collection
        self.log("Checking withdraw_requests collection...")
        status, withdraw_data = self.make_admin_request("admin/withdraws")
        
        if status == 200 and isinstance(withdraw_data, list):
            withdraw_count = len(withdraw_data)
            verified_withdraws = [req for req in withdraw_data if req.get('status') in ['verified', 'completed']]
            verified_withdraw_count = len(verified_withdraws)
            
            self.log(f"📊 Withdraw Requests: {withdraw_count} total, {verified_withdraw_count} verified/completed")
            
            # Show sample data
            for i, req in enumerate(withdraw_data[:5]):
                status_val = req.get('status', 'Unknown')
                amount = req.get('requested_amount', 0)
                currency = req.get('currency', 'Unknown')
                created_at = req.get('created_at', 'Unknown')
                
                self.log(f"   Sample {i+1}: Status={status_val}, Amount={currency} {amount}, Date={created_at}")
        else:
            self.log(f"❌ Failed to get withdraw requests: {status}")
            
        return topup_data if status == 200 else [], withdraw_data if status == 200 else []
    
    def debug_financial_api(self):
        """Step 2: Test financial summary API directly"""
        self.log("=" * 60)
        self.log("STEP 2: API RESPONSE ANALYSIS")
        self.log("=" * 60)
        
        # Test with period=all
        self.log("Testing financial summary API with period=all...")
        status, summary_data = self.make_admin_request("admin/financial-reports/summary", params="period=all")
        
        if status == 200:
            topup_summary = summary_data.get('topup_summary', {})
            withdraw_summary = summary_data.get('withdraw_summary', {})
            revenue = summary_data.get('revenue', {})
            
            self.log(f"📊 API Response Analysis:")
            self.log(f"   TopUp Summary: {topup_summary}")
            self.log(f"   Withdraw Summary: {withdraw_summary}")
            self.log(f"   Revenue: {revenue}")
            
            # Check if summaries are empty
            if not topup_summary or topup_summary == {}:
                self.log("❌ CRITICAL ISSUE: TopUp summary is empty object", "ERROR")
            
            if not withdraw_summary or withdraw_summary == {}:
                self.log("❌ CRITICAL ISSUE: Withdraw summary is empty object", "ERROR")
            
            # Check revenue calculations
            total_revenue = revenue.get('total_revenue_idr', 0) + revenue.get('total_revenue_usd', 0)
            if total_revenue == 0:
                self.log("❌ CRITICAL ISSUE: Revenue calculations show 0 values", "ERROR")
                
            return summary_data
        else:
            self.log(f"❌ Failed to get financial summary: {status}", "ERROR")
            return None
    
    def debug_period_filters(self):
        """Step 3: Test all period filters"""
        self.log("=" * 60)
        self.log("STEP 3: PERIOD FILTER TESTING")
        self.log("=" * 60)
        
        periods = [
            "today", "yesterday", "this_week", "last_week",
            "this_month", "last_month", "this_year", "last_year"
        ]
        
        for period in periods:
            self.log(f"Testing period: {period}")
            status, period_data = self.make_admin_request("admin/financial-reports/summary", params=f"period={period}")
            
            if status == 200:
                topup_summary = period_data.get('topup_summary', {})
                withdraw_summary = period_data.get('withdraw_summary', {})
                revenue = period_data.get('revenue', {})
                
                has_data = bool(topup_summary) or bool(withdraw_summary) or any(revenue.values() if revenue else [])
                self.log(f"   {period}: Has Data = {has_data}")
            else:
                self.log(f"   {period}: Failed ({status})")
    
    def debug_custom_date_range(self):
        """Step 4: Test with very wide custom date range"""
        self.log("=" * 60)
        self.log("STEP 4: CUSTOM DATE RANGE TESTING")
        self.log("=" * 60)
        
        # Test with very wide range to capture all possible data
        params = "start_date=2020-01-01&end_date=2030-12-31"
        self.log("Testing with wide date range (2020-2030)...")
        
        status, custom_data = self.make_admin_request("admin/financial-reports/summary", params=params)
        
        if status == 200:
            topup_summary = custom_data.get('topup_summary', {})
            withdraw_summary = custom_data.get('withdraw_summary', {})
            revenue = custom_data.get('revenue', {})
            
            self.log(f"📊 Wide Date Range Results:")
            self.log(f"   TopUp Summary: {topup_summary}")
            self.log(f"   Withdraw Summary: {withdraw_summary}")
            self.log(f"   Revenue: {revenue}")
            
            # This should capture ALL data if any exists
            if not topup_summary and not withdraw_summary and not any(revenue.values() if revenue else []):
                self.log("❌ CRITICAL FINDING: Even with 2020-2030 date range, no financial data found", "ERROR")
                self.log("   This indicates either database is empty or aggregation pipeline is broken", "ERROR")
        else:
            self.log(f"❌ Failed to test custom date range: {status}", "ERROR")
    
    def debug_aggregation_pipeline(self):
        """Step 5: Test aggregation pipeline issues"""
        self.log("=" * 60)
        self.log("STEP 5: AGGREGATION PIPELINE ANALYSIS")
        self.log("=" * 60)
        
        # Test growth data endpoint to see if it has similar issues
        self.log("Testing growth data endpoint...")
        status, growth_data = self.make_admin_request("admin/financial-reports/growth", params="period=all")
        
        if status == 200:
            growth_points = growth_data.get('growth_data', [])
            self.log(f"📊 Growth Data: {len(growth_points) if isinstance(growth_points, list) else 'Not a list'} points")
            
            if isinstance(growth_points, list) and growth_points:
                for i, point in enumerate(growth_points[:3]):
                    self.log(f"   Growth Point {i+1}: {point}")
        else:
            self.log(f"❌ Failed to get growth data: {status}", "ERROR")
    
    def analyze_currency_fields(self, topup_data, withdraw_data):
        """Step 6: Analyze currency field distribution"""
        self.log("=" * 60)
        self.log("STEP 6: CURRENCY FIELD ANALYSIS")
        self.log("=" * 60)
        
        # Analyze topup currencies
        if topup_data and isinstance(topup_data, list):
            currency_dist = {}
            for req in topup_data:
                if isinstance(req, dict):
                    currency = req.get('currency', 'Unknown')
                    currency_dist[currency] = currency_dist.get(currency, 0) + 1
            
            self.log(f"📊 TopUp Currency Distribution: {currency_dist}")
        
        # Analyze withdraw currencies
        if withdraw_data and isinstance(withdraw_data, list):
            currency_dist = {}
            for req in withdraw_data:
                if isinstance(req, dict):
                    currency = req.get('currency', 'Unknown')
                    currency_dist[currency] = currency_dist.get(currency, 0) + 1
            
            self.log(f"📊 Withdraw Currency Distribution: {currency_dist}")
    
    def identify_root_cause(self, topup_data, withdraw_data, summary_data):
        """Step 7: Identify root cause based on findings"""
        self.log("=" * 60)
        self.log("STEP 7: ROOT CAUSE ANALYSIS")
        self.log("=" * 60)
        
        total_records = (len(topup_data) if isinstance(topup_data, list) else 0) + (len(withdraw_data) if isinstance(withdraw_data, list) else 0)
        
        if total_records == 0:
            self.log("🔍 ROOT CAUSE IDENTIFIED: DATABASE IS EMPTY", "CRITICAL")
            self.log("   No topup or withdraw requests found in database", "CRITICAL")
            return "DATABASE_EMPTY"
        
        elif summary_data and not summary_data.get('topup_summary') and not summary_data.get('withdraw_summary'):
            self.log("🔍 ROOT CAUSE IDENTIFIED: AGGREGATION PIPELINE ISSUE", "CRITICAL")
            self.log(f"   Database has {total_records} records but aggregation returns empty objects", "CRITICAL")
            return "AGGREGATION_BROKEN"
        
        elif summary_data:
            self.log("🔍 PARTIAL SUCCESS: Some data is working", "WARNING")
            self.log(f"   Database has {total_records} records and some aggregation is working", "WARNING")
            return "PARTIAL_SUCCESS"
        
        else:
            self.log("🔍 UNKNOWN ISSUE: API calls failed", "ERROR")
            return "API_FAILED"
    
    def run_full_debug(self):
        """Run complete financial reports debugging"""
        self.log("🔍 FINANCIAL REPORTS DEBUGGING - COMPREHENSIVE INVESTIGATION")
        self.log("=" * 80)
        
        # Step 1: Login as admin
        if not self.admin_login():
            self.log("❌ Cannot proceed without admin access", "CRITICAL")
            return
        
        # Step 2: Check database collections
        topup_data, withdraw_data = self.debug_database_collections()
        
        # Step 3: Test financial API
        summary_data = self.debug_financial_api()
        
        # Step 4: Test period filters
        self.debug_period_filters()
        
        # Step 5: Test custom date range
        self.debug_custom_date_range()
        
        # Step 6: Test aggregation pipeline
        self.debug_aggregation_pipeline()
        
        # Step 7: Analyze currency fields
        self.analyze_currency_fields(topup_data, withdraw_data)
        
        # Step 8: Identify root cause
        root_cause = self.identify_root_cause(topup_data, withdraw_data, summary_data)
        
        # Final summary
        self.log("=" * 80)
        self.log("FINANCIAL REPORTS DEBUG SUMMARY")
        self.log("=" * 80)
        self.log(f"🔍 Root Cause: {root_cause}")
        self.log(f"📊 Total Financial Records: {(len(topup_data) if isinstance(topup_data, list) else 0) + (len(withdraw_data) if isinstance(withdraw_data, list) else 0)}")
        self.log(f"💰 TopUp Records: {len(topup_data) if isinstance(topup_data, list) else 0}")
        self.log(f"🏦 Withdraw Records: {len(withdraw_data) if isinstance(withdraw_data, list) else 0}")
        
        if root_cause == "DATABASE_EMPTY":
            self.log("💡 SOLUTION: Database needs sample financial data to test aggregation", "SOLUTION")
        elif root_cause == "AGGREGATION_BROKEN":
            self.log("💡 SOLUTION: Fix MongoDB aggregation pipeline in financial reports endpoints", "SOLUTION")
        elif root_cause == "PARTIAL_SUCCESS":
            self.log("💡 SOLUTION: Investigate specific period filters or data matching issues", "SOLUTION")

if __name__ == "__main__":
    debugger = FinancialReportsDebugger()
    debugger.run_full_debug()