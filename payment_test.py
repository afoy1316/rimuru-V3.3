#!/usr/bin/env python3

import sys
import os
sys.path.append('/app')

from backend_test import AdManagerAPITester

def main():
    """Run payment verification pagination test"""
    tester = AdManagerAPITester()
    
    print("🚀 Starting Payment Verification Pagination Test...")
    print(f"🌐 Base URL: {tester.base_url}")
    print(f"🔗 API URL: {tester.api_url}")
    print("=" * 80)
    
    # Run the payment verification pagination test
    success = tester.test_payment_verification_pagination()
    
    # Print summary
    print("\n" + "=" * 80)
    print("📊 PAYMENT VERIFICATION TEST SUMMARY")
    print("=" * 80)
    print(f"✅ Tests Passed: {tester.tests_passed}")
    print(f"❌ Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"📈 Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if success:
        print("🎉 Payment verification pagination test completed successfully!")
    else:
        print("⚠️ Payment verification pagination test had some issues.")
    
    return success

if __name__ == "__main__":
    main()