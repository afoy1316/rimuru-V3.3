#!/usr/bin/env python3

import sys
import os
sys.path.append('/app')

from backend_test import AdManagerAPITester

def main():
    """Run payment upload system tests"""
    print("🚀 Starting Payment Upload System Tests...")
    
    tester = AdManagerAPITester()
    
    # Basic setup
    if not tester.test_health_check():
        print("❌ Health check failed, stopping tests")
        return False
    
    # User authentication
    if not tester.test_user_login():
        print("❌ User login failed, stopping tests")
        return False
    
    # Admin authentication
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return False
    
    # Run payment system tests
    success = tester.run_payment_upload_system_tests()
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)