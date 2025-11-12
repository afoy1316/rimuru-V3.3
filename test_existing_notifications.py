#!/usr/bin/env python3
"""
Analyze existing notifications to investigate duplicate issue
"""
import requests
import sys
import json
from datetime import datetime
import time

class ExistingNotificationAnalyzer:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin_token=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Use admin token if specified
        if use_admin_token and self.admin_token:
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
            return True
        return False

    def analyze_existing_notifications(self):
        """Analyze existing notifications for duplicate patterns"""
        print("\n🔍 ANALYZING EXISTING NOTIFICATIONS FOR DUPLICATE PATTERNS...")
        print("=" * 80)
        
        # Step 1: Admin Login
        if not self.admin_token:
            if not self.test_admin_login():
                self.log_test(
                    "Admin Login for Analysis",
                    False,
                    "Admin access required for notification analysis"
                )
                return False
        
        # Step 2: Get all admin notifications
        success, all_notifications = self.run_test(
            "GET All Admin Notifications",
            "GET",
            "admin/notifications",
            200,
            use_admin_token=True
        )
        
        if not success:
            return False
        
        total_notifications = len(all_notifications) if isinstance(all_notifications, list) else 0
        self.log_test(
            "Total Notifications Retrieved",
            True,
            f"Found {total_notifications} total admin notifications"
        )
        
        # Step 3: Check admin user count
        success, admin_users = self.run_test(
            "GET Admin Users Count",
            "GET",
            "admin/admins",
            200,
            use_admin_token=True
        )
        
        admin_count = len(admin_users) if isinstance(admin_users, list) else 0
        self.log_test(
            "Admin Users Count",
            True,
            f"Found {admin_count} admin users in system"
        )
        
        # Step 4: Analyze transfer-related notifications
        transfer_notifications = []
        if isinstance(all_notifications, list):
            for notification in all_notifications:
                notification_type = notification.get('type', '')
                title = notification.get('title', '')
                message = notification.get('message', '')
                
                # Check if this is a transfer-related notification
                if ('transfer' in notification_type.lower() or 
                    'transfer' in title.lower() or 
                    'transfer' in message.lower()):
                    transfer_notifications.append({
                        'id': notification.get('id'),
                        'type': notification_type,
                        'title': title,
                        'message': message,
                        'reference_id': notification.get('reference_id', ''),
                        'created_at': notification.get('created_at', ''),
                        'is_read': notification.get('is_read', False)
                    })
        
        self.log_test(
            "Transfer Notifications Found",
            True,
            f"Found {len(transfer_notifications)} transfer-related notifications"
        )
        
        # Step 5: Group notifications by reference_id to find duplicates
        reference_groups = {}
        for notification in transfer_notifications:
            ref_id = notification['reference_id']
            if ref_id:
                if ref_id not in reference_groups:
                    reference_groups[ref_id] = []
                reference_groups[ref_id].append(notification)
        
        # Step 6: Analyze duplicate patterns
        duplicate_references = []
        for ref_id, notifications in reference_groups.items():
            if len(notifications) > admin_count:
                duplicate_references.append({
                    'reference_id': ref_id,
                    'count': len(notifications),
                    'expected': admin_count,
                    'notifications': notifications
                })
                
                self.log_test(
                    f"DUPLICATE PATTERN FOUND - Ref: {ref_id}",
                    False,
                    f"Found {len(notifications)} notifications for reference {ref_id} (expected {admin_count})"
                )
                
                # Analyze the duplicates in detail
                for i, notif in enumerate(notifications):
                    self.log_test(
                        f"Duplicate #{i+1} - {ref_id}",
                        True,
                        f"ID: {notif['id']}, Type: {notif['type']}, Created: {notif['created_at']}"
                    )
        
        # Step 7: Check for identical content duplicates
        content_groups = {}
        for notification in transfer_notifications:
            # Create a key based on content that should be unique per transfer
            content_key = f"{notification['type']}|{notification['title']}|{notification['reference_id']}"
            if content_key not in content_groups:
                content_groups[content_key] = []
            content_groups[content_key].append(notification)
        
        identical_duplicates = []
        for content_key, notifications in content_groups.items():
            if len(notifications) > admin_count:
                identical_duplicates.append({
                    'content_key': content_key,
                    'count': len(notifications),
                    'expected': admin_count,
                    'notifications': notifications
                })
                
                self.log_test(
                    f"IDENTICAL CONTENT DUPLICATES - {content_key}",
                    False,
                    f"Found {len(notifications)} identical notifications (expected {admin_count})"
                )
        
        # Step 8: Analyze timestamps for simultaneity
        if transfer_notifications:
            # Group by creation time (to the second)
            timestamp_groups = {}
            for notification in transfer_notifications:
                created_at = notification['created_at']
                # Extract just the date and time (ignore milliseconds)
                if created_at:
                    timestamp_key = created_at[:19] if len(created_at) > 19 else created_at
                    if timestamp_key not in timestamp_groups:
                        timestamp_groups[timestamp_key] = []
                    timestamp_groups[timestamp_key].append(notification)
            
            # Check for simultaneous creation patterns
            simultaneous_creations = []
            for timestamp, notifications in timestamp_groups.items():
                if len(notifications) > admin_count:
                    simultaneous_creations.append({
                        'timestamp': timestamp,
                        'count': len(notifications),
                        'notifications': notifications
                    })
                    
                    self.log_test(
                        f"SIMULTANEOUS CREATION DETECTED - {timestamp}",
                        False,
                        f"Found {len(notifications)} notifications created at exactly {timestamp}"
                    )
        
        # Step 9: Check for recent transfer requests in admin panel
        success, transfer_requests = self.run_test(
            "GET Admin Transfer Requests",
            "GET",
            "admin/transfer-requests",
            200,
            use_admin_token=True
        )
        
        transfer_request_count = 0
        if success and isinstance(transfer_requests, list):
            transfer_request_count = len(transfer_requests)
            self.log_test(
                "Transfer Requests Found",
                True,
                f"Found {transfer_request_count} transfer requests in admin panel"
            )
            
            # Analyze recent transfer requests
            recent_transfers = []
            for transfer in transfer_requests[-10:]:  # Last 10 transfers
                transfer_id = transfer.get('id')
                created_at = transfer.get('created_at')
                amount = transfer.get('amount')
                status = transfer.get('status')
                
                # Count notifications for this transfer
                matching_notifications = [n for n in transfer_notifications if n['reference_id'] == transfer_id]
                
                recent_transfers.append({
                    'id': transfer_id,
                    'created_at': created_at,
                    'amount': amount,
                    'status': status,
                    'notification_count': len(matching_notifications)
                })
                
                self.log_test(
                    f"Transfer Analysis - {transfer_id[:8]}...",
                    len(matching_notifications) == admin_count,
                    f"Amount: {amount}, Status: {status}, Notifications: {len(matching_notifications)}/{admin_count}"
                )
        
        # Step 10: Final analysis summary
        total_duplicates = len(duplicate_references) + len(identical_duplicates)
        
        analysis_summary = f"""
        EXISTING NOTIFICATION DUPLICATE ANALYSIS:
        ========================================
        - Total admin notifications: {total_notifications}
        - Transfer-related notifications: {len(transfer_notifications)}
        - Admin users in system: {admin_count}
        - Transfer requests found: {transfer_request_count}
        - Duplicate reference patterns: {len(duplicate_references)}
        - Identical content duplicates: {len(identical_duplicates)}
        - Simultaneous creation events: {len(simultaneous_creations)}
        
        CONCLUSION: {'DUPLICATE ISSUE CONFIRMED' if total_duplicates > 0 else 'NO DUPLICATES FOUND'}
        
        ROOT CAUSE INDICATORS:
        - Multiple notifications per reference ID: {'YES' if duplicate_references else 'NO'}
        - Identical content duplicates: {'YES' if identical_duplicates else 'NO'}
        - Simultaneous timestamp creation: {'YES' if simultaneous_creations else 'NO'}
        """
        
        self.log_test(
            "DUPLICATE ANALYSIS SUMMARY",
            total_duplicates == 0,
            analysis_summary
        )
        
        # Step 11: Specific recommendations based on findings
        if duplicate_references:
            self.log_test(
                "RECOMMENDATION - Reference ID Duplicates",
                False,
                "Multiple notifications found for same reference_id. Check notification creation loop in backend."
            )
        
        if identical_duplicates:
            self.log_test(
                "RECOMMENDATION - Content Duplicates",
                False,
                "Identical notification content found. Check for duplicate API calls or database transaction issues."
            )
        
        if simultaneous_creations:
            self.log_test(
                "RECOMMENDATION - Timing Issues",
                False,
                "Simultaneous notification creation detected. Check for race conditions or multiple endpoint calls."
            )
        
        return total_duplicates == 0

    def print_summary(self):
        """Print analysis summary"""
        print("\n" + "=" * 80)
        print("📊 EXISTING NOTIFICATION DUPLICATE ANALYSIS SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.tests_run - self.tests_passed > 0:
            print("\n❌ ISSUES FOUND:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test_name']}: {result['details']}")
        
        print("\n✅ Analysis completed!")

if __name__ == "__main__":
    analyzer = ExistingNotificationAnalyzer()
    analyzer.analyze_existing_notifications()
    analyzer.print_summary()