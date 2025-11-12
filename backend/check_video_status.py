#!/usr/bin/env python3
"""Check status of generated videos"""

import requests
import os

API_KEY = os.getenv('HEYGEN_API_KEY', 'sk_V2_hgu_k0CB7EHiHKZ_VoN9hjPG9YhcyXNZNofaiLxzGyQ6grQg')
BASE_URL = "https://api.heygen.com/v2"

headers = {
    "X-Api-Key": API_KEY,
    "Content-Type": "application/json"
}

# Video IDs dari logs
video_ids = [
    "447f6a7e579e426283a1f0f0bfb61aa2",
    "2289c87b76f947358a7ae44926a0dcc2"
]

print("Checking video status...")
for video_id in video_ids:
    print(f"\n{'='*60}")
    print(f"Video ID: {video_id}")
    print(f"{'='*60}")
    
    # Try different endpoint formats
    endpoints = [
        f"{BASE_URL}/video/{video_id}",
        f"{BASE_URL}/video_status.get?video_id={video_id}",
        f"{BASE_URL}/videos/{video_id}"
    ]
    
    for endpoint in endpoints:
        try:
            print(f"\nTrying: {endpoint}")
            response = requests.get(endpoint, headers=headers, timeout=30)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Response: {data}")
                break
            else:
                print(f"❌ Error: {response.text}")
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
