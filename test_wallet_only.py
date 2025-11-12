#!/usr/bin/env python3

import sys
import os
sys.path.append('/app')

from backend_test import AdManagerAPITester

def main():
    """Run only wallet management tests"""
    print("🚀 Starting Wallet Management Tests Only...")
    
    tester = AdManagerAPITester()
    
    # Test admin login first
    if not tester.test_admin_login():
        print("❌ Admin login failed, cannot proceed")
        return False
    
    # Test user login
    if not tester.test_user_login():
        print("❌ User login failed, cannot proceed")
        return False
    
    # Run wallet management tests
    success = tester.test_wallet_management_fixes()
    
    # Print summary
    print(f"\n📊 Wallet Management Test Summary:")
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if success:
        print("\n✅ WALLET MANAGEMENT TESTS COMPLETED SUCCESSFULLY")
    else:
        print("\n❌ WALLET MANAGEMENT TESTS FAILED")
    
    return success

if __name__ == "__main__":
    main()