import os
from pymongo import MongoClient

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')

client = MongoClient(mongo_url)
db = client[db_name]

# List all collections
collections = db.list_collection_names()
topup_collections = [c for c in collections if 'topup' in c.lower() or 'top' in c.lower()]
print("Collections with 'topup':")
for c in topup_collections:
    print(f"  - {c}")

# Check one document
if 'topup_requests' in collections:
    sample = db.topup_requests.find_one({"request_type": "ad_account_topup"})
    if sample:
        print("\nSample topup_requests document:")
        print(f"  Keys: {list(sample.keys())}")
        print(f"  Has unique_code: {'unique_code' in sample}")
        if 'unique_code' in sample:
            print(f"  unique_code: {sample['unique_code']}")
