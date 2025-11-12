#!/usr/bin/env python3
"""
Audit script untuk cek semua notifikasi in-app vs email notification
"""

import re

# Read server.py
with open('/app/backend/server.py', 'r') as f:
    content = f.read()
    lines = content.split('\n')

# Find all notification insertions
notifications = []
current_function = None

for i, line in enumerate(lines, 1):
    # Track current function
    if line.strip().startswith('async def ') or line.strip().startswith('def '):
        match = re.search(r'(async )?def (\w+)', line)
        if match:
            current_function = match.group(2)
    
    # Find notification insertions
    if 'client_notifications.insert_one' in line or 'admin_notifications.insert_one' in line:
        notif_type = 'CLIENT' if 'client_notifications' in line else 'ADMIN'
        
        # Look back for notification title
        title = None
        for j in range(max(0, i-20), i):
            if '"title":' in lines[j] or "'title':" in lines[j]:
                title_match = re.search(r'"title":\s*"([^"]+)"|\'title\':\s*\'([^\']+)\'', lines[j])
                if title_match:
                    title = title_match.group(1) or title_match.group(2)
                    break
        
        # Look for email send nearby
        has_email = False
        email_line = None
        for j in range(i, min(len(lines), i+30)):
            if 'send_' in lines[j] and '_email' in lines[j] and 'logger.info' not in lines[j]:
                has_email = True
                email_line = j
                break
        
        notifications.append({
            'line': i,
            'type': notif_type,
            'function': current_function,
            'title': title or 'Unknown',
            'has_email': has_email,
            'email_line': email_line
        })

# Print results
print("=" * 100)
print("🔍 AUDIT NOTIFIKASI IN-APP vs EMAIL NOTIFICATION")
print("=" * 100)
print()

print(f"📊 Total Notifikasi In-App: {len(notifications)}")
print(f"   • Client Notifications: {sum(1 for n in notifications if n['type'] == 'CLIENT')}")
print(f"   • Admin Notifications: {sum(1 for n in notifications if n['type'] == 'ADMIN')}")
print()

# Group by has_email
with_email = [n for n in notifications if n['has_email']]
without_email = [n for n in notifications if not n['has_email']]

print(f"✅ Dengan Email Notification: {len(with_email)}")
print(f"❌ Tanpa Email Notification: {len(without_email)}")
print()

if without_email:
    print("=" * 100)
    print("⚠️  NOTIFIKASI YANG BELUM ADA EMAIL:")
    print("=" * 100)
    print()
    
    for i, notif in enumerate(without_email, 1):
        print(f"{i}. [{notif['type']}] {notif['title']}")
        print(f"   📍 Line: {notif['line']}")
        print(f"   🔧 Function: {notif['function']}")
        print()

if with_email:
    print("=" * 100)
    print("✅ NOTIFIKASI YANG SUDAH ADA EMAIL:")
    print("=" * 100)
    print()
    
    for i, notif in enumerate(with_email, 1):
        print(f"{i}. [{notif['type']}] {notif['title']}")
        print(f"   📍 Line: {notif['line']}")
        print(f"   📧 Email Line: {notif['email_line']}")
        print(f"   🔧 Function: {notif['function']}")
        print()

print("=" * 100)
print("📋 SUMMARY")
print("=" * 100)
coverage = (len(with_email) / len(notifications) * 100) if notifications else 0
print(f"Email Coverage: {coverage:.1f}% ({len(with_email)}/{len(notifications)})")
print()

if coverage == 100:
    print("🎉 SEMUA NOTIFIKASI IN-APP SUDAH MEMILIKI EMAIL NOTIFICATION!")
elif coverage >= 80:
    print("✅ Coverage bagus! Hanya perlu melengkapi beberapa lagi.")
else:
    print("⚠️  Masih banyak notifikasi yang belum memiliki email notification.")
