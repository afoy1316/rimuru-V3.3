import requests
import json
from datetime import datetime
import random

BASE_URL = "https://admin-proof-fix.preview.emergentagent.com/api"

# Generate unique name
unique_id = random.randint(10000, 99999)
original_name = f"Test B {unique_id}"
new_name = f"WL Test B {unique_id}"

# Step 1: Login as admin
print("Step 1: Admin Login...")
admin_response = requests.post(f"{BASE_URL}/admin/auth/login", json={
    "username": "admin",
    "password": "admin123"
})
admin_token = admin_response.json()['access_token']
print(f"✅ Admin logged in")

# Step 2: Login as client (testuser)
print("\nStep 2: Client Login...")
client_response = requests.post(f"{BASE_URL}/auth/login", json={
    "username": "testuser",
    "password": "testpass123"
})

if client_response.status_code != 200:
    print(f"❌ Could not login as client testuser: {client_response.text}")
    exit(1)

response_data = client_response.json()
client_token = response_data['access_token']
print(f"✅ Client logged in as testuser")

# Step 3: Create account request with original name
print(f"\nStep 3: Creating account request with name '{original_name}'...")
create_request = requests.post(f"{BASE_URL}/accounts/request", 
    headers={"Authorization": f"Bearer {client_token}"},
    json={
        "platform": "facebook",
        "account_name": original_name,
        "gmt": "GMT+7",
        "currency": "IDR",
        "delivery_method": "BM_ID",
        "bm_ids": ["1234567890"],
        "notes": "Test account for name change bug"
    }
)

if create_request.status_code != 200:
    print(f"❌ Failed to create request: {create_request.text}")
    exit(1)

request_id = create_request.json()['request_id']
print(f"✅ Created account request: {request_id}")

# Step 4: Check transaction was created with original name
print(f"\nStep 4: Checking transaction created with '{original_name}'...")
transactions = requests.get(f"{BASE_URL}/transactions",
    headers={"Authorization": f"Bearer {client_token}"}
).json()

test_b_transaction = None
for trans in transactions:
    if trans['type'] == 'account_request' and original_name in trans['description']:
        test_b_transaction = trans
        break

if test_b_transaction:
    print(f"✅ Transaction found:")
    print(f"   ID: {test_b_transaction['id']}")
    print(f"   Description: {test_b_transaction['description']}")
    print(f"   Status: {test_b_transaction['status']}")
else:
    print("❌ Transaction not found")
    exit(1)

# Step 5: Admin approves request and changes name
print(f"\nStep 5: Admin approving request and changing name to '{new_name}'...")
approve_request = requests.put(f"{BASE_URL}/admin/requests/{request_id}/status",
    headers={"Authorization": f"Bearer {admin_token}"},
    json={
        "status": "approved",
        "account_id": f"99988877{unique_id}",
        "account_name": new_name,  # Changed name
        "fee_percentage": 0.5,
        "admin_notes": "Approved with name change"
    }
)

if approve_request.status_code != 200:
    print(f"❌ Failed to approve: {approve_request.text}")
    exit(1)

print(f"✅ Request approved with name change")

# Step 6: Check if transaction description was updated
print("\nStep 6: Checking if transaction description was updated...")
transactions_after = requests.get(f"{BASE_URL}/transactions",
    headers={"Authorization": f"Bearer {client_token}"}
).json()

updated_transaction = None
for trans in transactions_after:
    if trans['id'] == test_b_transaction['id']:
        updated_transaction = trans
        break

if updated_transaction:
    print(f"\n📊 Transaction After Approval:")
    print(f"   ID: {updated_transaction['id']}")
    print(f"   Description: {updated_transaction['description']}")
    print(f"   Status: {updated_transaction['status']}")
    
    # Check if description was updated
    if new_name in updated_transaction['description']:
        print(f"\n✅ SUCCESS: Transaction description was updated to show new name '{new_name}'")
    elif original_name in updated_transaction['description']:
        print(f"\n❌ BUG CONFIRMED: Transaction description still shows old name '{original_name}'")
        print(f"   Expected: 'Request Facebook ads account: {new_name}'")
        print(f"   Actual: '{updated_transaction['description']}'")
    
    # Check if status was updated
    if updated_transaction['status'] == 'approved':
        print(f"✅ SUCCESS: Transaction status was updated to 'approved'")
    else:
        print(f"❌ BUG: Transaction status is '{updated_transaction['status']}', expected 'approved'")
else:
    print("❌ Could not find transaction after approval")

