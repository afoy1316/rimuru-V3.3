import os
from pymongo import MongoClient

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(mongo_url)
db = client['rimuru']

# Get any landing pages
pages = list(db.landing_pages.find().limit(5))
print(f"Found {len(pages)} landing pages total:")
for p in pages:
    print(f"  - {p.get('product_name')} | Template: {p.get('template_id')} | Slug: {p.get('slug')} | Status: {p.get('status')}")
