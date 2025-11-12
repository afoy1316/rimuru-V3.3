#!/usr/bin/env python3
"""
Session Expiry Handling Test Runner
Test that expired/invalid tokens return 401 and backend handles authentication failures correctly.
"""

import sys
import os
sys.path.append('/app')

from backend_test import AdManagerAPITester

def main():
    """Run session expiry handling tests"""
    print("🔐 SESSION EXPIRY HANDLING TEST RUNNER")
    print("=" * 60)
    print("Testing that expired/invalid tokens return 401 and backend handles authentication failures correctly.")
    print("=" * 60)
    
    # Initialize tester with production URL
    tester = AdManagerAPITester()
    
    # Run session expiry handling tests
    try:
        success = tester.test_session_expiry_handling()
        
        # Print final summary
        print(f"\n{'='*60}")
        print("📊 SESSION EXPIRY TEST SUMMARY")
        print(f"{'='*60}")
        print(f"✅ Tests Passed: {tester.tests_passed}")
        print(f"❌ Tests Failed: {tester.tests_run - tester.tests_passed}")
        print(f"📈 Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
        
        if success:
            print("\n🎉 SESSION EXPIRY HANDLING TESTS COMPLETED SUCCESSFULLY!")
            print("✅ Backend correctly returns 401 for invalid/missing tokens")
            print("✅ Frontend interceptor will catch these 401s and show session expiry message")
            return 0
        else:
            print("\n❌ SESSION EXPIRY HANDLING TESTS FAILED!")
            print("⚠️  Backend may not be properly handling authentication failures")
            return 1
            
    except Exception as e:
        print(f"\n💥 ERROR RUNNING SESSION EXPIRY TESTS: {str(e)}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)