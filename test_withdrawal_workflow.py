#!/usr/bin/env python3
"""
Test script for withdrawal processing workflow fix
"""

import sys
import os
sys.path.append('/app')

from backend_test import AdManagerAPITester

def main():
    """Run the withdrawal processing workflow test"""
    print("🚀 Starting Withdrawal Processing Workflow Test...")
    print("=" * 80)
    
    tester = AdManagerAPITester()
    
    # Run the specific test requested in the review
    success = tester.test_withdrawal_processing_workflow_fix()
    
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {tester.tests_run - tester.tests_passed}")
    
    if tester.tests_run > 0:
        print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return True
    else:
        print("⚠️ Some tests failed - check details above")
        return False

if __name__ == "__main__":
    sys.exit(0 if main() else 1)