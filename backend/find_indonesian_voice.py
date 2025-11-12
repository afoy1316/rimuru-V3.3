#!/usr/bin/env python3
"""Find Indonesian voices from HeyGen"""

import requests
import os

API_KEY = os.getenv('HEYGEN_API_KEY', 'sk_V2_hgu_k0CB7EHiHKZ_VoN9hjPG9YhcyXNZNofaiLxzGyQ6grQg')
BASE_URL = "https://api.heygen.com/v2"

headers = {
    "X-Api-Key": API_KEY,
    "Content-Type": "application/json"
}

print("Mencari voice Bahasa Indonesia...")
response = requests.get(f"{BASE_URL}/voices", headers=headers, timeout=30)

if response.status_code == 200:
    data = response.json()
    voices = data.get('data', {}).get('voices', [])
    
    # Filter Indonesian voices
    indonesian_voices = [v for v in voices if 'indonesian' in v.get('language', '').lower() or 'indonesia' in v.get('language', '').lower()]
    
    print(f"\n✅ Ditemukan {len(indonesian_voices)} voice Bahasa Indonesia:\n")
    
    for i, voice in enumerate(indonesian_voices[:10]):  # Show first 10
        print(f"{i+1}. Voice ID: {voice.get('voice_id')}")
        print(f"   Name: {voice.get('name', 'N/A')}")
        print(f"   Language: {voice.get('language')}")
        print(f"   Gender: {voice.get('gender')}")
        print(f"   Preview URL: {voice.get('preview_audio', 'N/A')}")
        print()
else:
    print(f"Error: {response.text}")
