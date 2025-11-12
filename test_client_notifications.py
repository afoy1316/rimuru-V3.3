#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_test import AdManagerAPITester

def main():
    """Run only the client notification system test"""
    print("🔔 CLIENT NOTIFICATION SYSTEM TESTING")
    print("=" * 60)
    
    tester = AdManagerAPITester()
    
    # Run only the client notification test
    success = tester.test_client_notification_system_after_status_update()
    
    print("\n" + "=" * 60)
    print("📊 CLIENT NOTIFICATION TEST SUMMARY")
    print("=" * 60)
    
    if success:
        print("✅ CLIENT NOTIFICATION SYSTEM TEST PASSED")
        print("🎉 All notification functionality working correctly!")
    else:
        print("❌ CLIENT NOTIFICATION SYSTEM TEST FAILED")
        print("🚨 Issues found with notification system")
    
    print(f"\n📈 Tests Run: {tester.tests_run}")
    print(f"✅ Tests Passed: {tester.tests_passed}")
    print(f"❌ Tests Failed: {tester.tests_run - tester.tests_passed}")
    
    if tester.tests_run > 0:
        success_rate = (tester.tests_passed / tester.tests_run) * 100
        print(f"📊 Success Rate: {success_rate:.1f}%")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())