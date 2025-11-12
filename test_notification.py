#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_test import AdManagerAPITester

def main():
    """Run only the admin notification creation test"""
    print("🔔 ADMIN NOTIFICATION CREATION TEST FOR VISUAL BELL SYSTEM")
    print("=" * 80)
    
    tester = AdManagerAPITester()
    
    # Run only the notification test
    success = tester.test_admin_notification_creation()
    
    print("\n" + "=" * 80)
    print("📊 NOTIFICATION TEST SUMMARY:")
    print(f"✅ Tests Passed: {tester.tests_passed}")
    print(f"❌ Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"📈 Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if success:
        print("\n🎉 ADMIN NOTIFICATION CREATION TEST COMPLETED SUCCESSFULLY!")
        print("🔔 Admin notification bell system now has unread notifications for visual testing")
    else:
        print("\n❌ ADMIN NOTIFICATION CREATION TEST FAILED!")
        print("🔔 Unable to create test notifications for visual bell testing")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)