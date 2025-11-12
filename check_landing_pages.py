import os
from pymongo import MongoClient

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
db_name = os.environ.get('DB_NAME', 'test_database')

client = MongoClient(mongo_url)
db = client[db_name]

# Get all landing pages
pages = list(db.landing_pages.find())
print(f"Database: {db_name}")
print(f"Total landing pages: {len(pages)}")
print("\nDetail landing pages:")
for p in pages:
    print(f"  - Product: {p.get('product_name')}")
    print(f"    User ID: {p.get('user_id')}")
    print(f"    Username: {p.get('username')}")
    print(f"    Slug: {p.get('slug')}")
    print(f"    Status: {p.get('status')}")
    print(f"    Template: {p.get('template_id')}")
    print(f"    Created: {p.get('created_at')}")
    print()
