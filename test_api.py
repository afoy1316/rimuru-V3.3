import requests
import json

BASE_URL = "https://admin-proof-fix.preview.emergentagent.com"

# Test beberapa endpoint
endpoints = [
    "/api/admin/topup-requests",
    "/api/admin/wallet-topup-requests", 
    "/api/transactions",
]

print("Testing API Endpoints:")
print("=" * 60)

for endpoint in endpoints:
    try:
        response = requests.get(BASE_URL + endpoint, timeout=5)
        data = response.json()
        
        if isinstance(data, list):
            print(f"\n{endpoint}")
            print(f"  Status: {response.status_code}")
            print(f"  Count: {len(data)} items")
            if len(data) > 0:
                print(f"  ⚠️ MASIH ADA DATA!")
        elif isinstance(data, dict):
            print(f"\n{endpoint}")
            print(f"  Status: {response.status_code}")
            print(f"  Response: {json.dumps(data, indent=2)[:200]}")
    except Exception as e:
        print(f"\n{endpoint}")
        print(f"  Error: {str(e)}")

print("\n" + "=" * 60)
