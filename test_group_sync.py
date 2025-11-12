#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_test import AdManagerAPITester

def main():
    """Run only the Group Sync Fix test"""
    tester = AdManagerAPITester()
    
    print("🔥 STARTING GROUP SYNC FIX - UNIFIED GROUP SYSTEM TESTING...")
    print(f"Base URL: {tester.base_url}")
    print(f"API URL: {tester.api_url}")
    print("=" * 80)
    
    print("\n🎯 RUNNING GROUP SYNC FIX TEST (REVIEW REQUEST)...")
    
    # Run the group sync fix test
    success = tester.test_group_sync_fix_unified_system()
    
    print("\n" + "=" * 80)
    print("GROUP SYNC FIX TEST SUMMARY:")
    print("=" * 80)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    if success:
        print("\n✅ GROUP SYNC FIX VERIFICATION COMPLETE:")
        print("✅ The unified group system is working correctly!")
        print("✅ Both Request Account and Kelola Akun now use /api/account-groups")
        print("✅ Groups created in either place will appear in both places")
        print("✅ POST response format matches GET response format")
        print("✅ Perfect synchronization between pages achieved")
    else:
        print("\n❌ GROUP SYNC FIX VERIFICATION FAILED:")
        print("❌ Issues found with the unified group system")
        print("❌ Review the test results above for details")
    
    return success

if __name__ == "__main__":
    main()