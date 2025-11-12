#!/usr/bin/env python3
"""
Script untuk testing semua template email
Kirim ke: afoy.u2nice@gmail.com
"""

import sys
sys.path.insert(0, '/app/backend')

from email_service import *
import time

TEST_EMAIL = "afoy.u2nice@gmail.com"
TEST_CLIENT_NAME = "Afoy (Test User)"
TEST_ADMIN_NAME = "Admin Rimuru"

def send_all_templates():
    print("=" * 80)
    print("🚀 TESTING SEMUA TEMPLATE EMAIL")
    print("=" * 80)
    print(f"📧 Target Email: {TEST_EMAIL}")
    print(f"⏰ Waktu: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    print()
    
    results = []
    
    # 1. Welcome Client Email
    print("1️⃣  Mengirim: Welcome Client Email...")
    try:
        success = send_welcome_client_email(TEST_EMAIL, TEST_CLIENT_NAME, "afoytest")
        results.append(("✅ Welcome Client", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Welcome Client", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 2. Welcome Admin Email
    print("2️⃣  Mengirim: Welcome Admin Email...")
    try:
        success = send_welcome_admin_email(TEST_EMAIL, TEST_ADMIN_NAME, "testadmin", False)
        results.append(("✅ Welcome Admin", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Welcome Admin", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 3. Admin New Client Email
    print("3️⃣  Mengirim: Admin New Client Email...")
    try:
        success = send_admin_new_client_email([TEST_EMAIL], TEST_CLIENT_NAME, "afoytest", TEST_EMAIL)
        results.append(("✅ Admin New Client", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Admin New Client", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 4. Admin New Top-Up Request
    print("4️⃣  Mengirim: Admin New Top-Up Request Email...")
    try:
        success = send_admin_new_topup_request_email([TEST_EMAIL], TEST_CLIENT_NAME, 5000000, "IDR", "Facebook Ads", "Test Account FB")
        results.append(("✅ Admin New Top-Up", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Admin New Top-Up", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 5. Admin New Withdraw Request
    print("5️⃣  Mengirim: Admin New Withdraw Request Email...")
    try:
        success = send_admin_new_withdraw_request_email([TEST_EMAIL], TEST_CLIENT_NAME, 3000000, "IDR", "Test Account FB")
        results.append(("✅ Admin New Withdraw", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Admin New Withdraw", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 6. Admin Wallet Transfer Request
    print("6️⃣  Mengirim: Admin Wallet Transfer Request Email...")
    try:
        success = send_admin_wallet_transfer_request_email([TEST_EMAIL], TEST_CLIENT_NAME, 2000000, "IDR", "Main Wallet", "Test Account FB")
        results.append(("✅ Admin Wallet Transfer", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Admin Wallet Transfer", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 7. Client Top-Up Approved
    print("7️⃣  Mengirim: Client Top-Up Approved Email...")
    try:
        success = send_client_topup_approved_email(TEST_EMAIL, TEST_CLIENT_NAME, 5000000, "IDR", "Facebook Ads", "Test Account FB")
        results.append(("✅ Client Top-Up Approved", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Client Top-Up Approved", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 8. Client Top-Up Rejected
    print("8️⃣  Mengirim: Client Top-Up Rejected Email...")
    try:
        success = send_client_topup_rejected_email(TEST_EMAIL, TEST_CLIENT_NAME, 5000000, "IDR", "Test Account FB", "Bukti pembayaran tidak jelas")
        results.append(("✅ Client Top-Up Rejected", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Client Top-Up Rejected", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 9. Client Withdraw Approved
    print("9️⃣  Mengirim: Client Withdraw Approved Email...")
    try:
        success = send_client_withdraw_approved_email(TEST_EMAIL, TEST_CLIENT_NAME, 3000000, "IDR", "Test Account FB")
        results.append(("✅ Client Withdraw Approved", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Client Withdraw Approved", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 10. Client Wallet Transfer Approved
    print("🔟 Mengirim: Client Wallet Transfer Approved Email...")
    try:
        success = send_client_wallet_transfer_approved_email(TEST_EMAIL, TEST_CLIENT_NAME, 2000000, "IDR", "Main Wallet", "Test Account FB")
        results.append(("✅ Client Wallet Transfer Approved", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Client Wallet Transfer Approved", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 11. Client Wallet Transfer Rejected
    print("1️⃣1️⃣  Mengirim: Client Wallet Transfer Rejected Email...")
    try:
        success = send_client_wallet_transfer_rejected_email(TEST_EMAIL, TEST_CLIENT_NAME, 2000000, "IDR", "Main Wallet", "Test Account FB", "Saldo wallet tidak mencukupi")
        results.append(("✅ Client Wallet Transfer Rejected", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Client Wallet Transfer Rejected", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 12. Client Account Request Approved
    print("1️⃣2️⃣  Mengirim: Client Account Request Approved Email...")
    try:
        success = send_client_account_request_approved_email(TEST_EMAIL, TEST_CLIENT_NAME, "facebook", "Test Account FB")
        results.append(("✅ Client Account Request Approved", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Client Account Request Approved", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 13. Client Account Request Rejected
    print("1️⃣3️⃣  Mengirim: Client Account Request Rejected Email...")
    try:
        success = send_client_account_request_rejected_email(TEST_EMAIL, TEST_CLIENT_NAME, "facebook", "Test Account FB", "Informasi akun tidak lengkap")
        results.append(("✅ Client Account Request Rejected", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Client Account Request Rejected", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 14. Client Account Request Completed
    print("1️⃣4️⃣  Mengirim: Client Account Request Completed Email...")
    try:
        success = send_client_account_request_completed_email(TEST_EMAIL, TEST_CLIENT_NAME, "facebook", "Test Account FB")
        results.append(("✅ Client Account Request Completed", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Client Account Request Completed", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 15. Admin New Share Request
    print("1️⃣5️⃣  Mengirim: Admin New Share Request Email...")
    try:
        success = send_admin_new_share_request_email([TEST_EMAIL], TEST_CLIENT_NAME, "facebook", "Test Account FB", 3)
        results.append(("✅ Admin New Share Request", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Admin New Share Request", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 16. Client Share Request Approved
    print("1️⃣6️⃣  Mengirim: Client Share Request Approved Email...")
    try:
        success = send_client_share_request_approved_email(TEST_EMAIL, TEST_CLIENT_NAME, "facebook", "Test Account FB")
        results.append(("✅ Client Share Request Approved", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Client Share Request Approved", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # 17. Client Share Request Rejected
    print("1️⃣7️⃣  Mengirim: Client Share Request Rejected Email...")
    try:
        success = send_client_share_request_rejected_email(TEST_EMAIL, TEST_CLIENT_NAME, "facebook", "Test Account FB", "Target share tidak valid")
        results.append(("✅ Client Share Request Rejected", success))
        print(f"   {'✅ Berhasil' if success else '❌ Gagal'}")
    except Exception as e:
        results.append(("❌ Client Share Request Rejected", False))
        print(f"   ❌ Error: {e}")
    time.sleep(2)
    
    # Summary
    print()
    print("=" * 80)
    print("📊 SUMMARY HASIL TESTING")
    print("=" * 80)
    
    success_count = sum(1 for _, success in results if success)
    total_count = len(results)
    
    for template_name, success in results:
        print(f"{template_name}")
    
    print()
    print(f"✅ Berhasil: {success_count}/{total_count}")
    print(f"❌ Gagal: {total_count - success_count}/{total_count}")
    print()
    
    if success_count == total_count:
        print("🎉 SEMUA EMAIL BERHASIL DIKIRIM!")
    else:
        print("⚠️  Ada beberapa email yang gagal dikirim")
    
    print()
    print(f"📧 Silakan cek inbox {TEST_EMAIL}")
    print(f"📁 Jika tidak ada di inbox, cek folder Spam/Junk")
    print("=" * 80)

if __name__ == "__main__":
    send_all_templates()
