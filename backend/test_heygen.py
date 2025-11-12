#!/usr/bin/env python3
"""Test script to fetch available HeyGen avatars and voices"""

import requests
import os
import json

API_KEY = os.getenv('HEYGEN_API_KEY', 'sk_V2_hgu_k0CB7EHiHKZ_VoN9hjPG9YhcyXNZNofaiLxzGyQ6grQg')
BASE_URL = "https://api.heygen.com/v2"

headers = {
    "X-Api-Key": API_KEY,
    "Content-Type": "application/json"
}

print("=" * 60)
print("Testing HeyGen API - Fetching Available Avatars")
print("=" * 60)

# Test 1: List Avatars
print("\n1. Fetching available avatars...")
try:
    response = requests.get(f"{BASE_URL}/avatars", headers=headers, timeout=30)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        avatars = data.get('data', {}).get('avatars', [])
        print(f"✅ Found {len(avatars)} avatars")
        
        # Show first 5 avatars
        print("\nFirst 5 avatars:")
        for i, avatar in enumerate(avatars[:5]):
            print(f"  {i+1}. ID: {avatar.get('avatar_id')}")
            print(f"     Name: {avatar.get('avatar_name')}")
            print(f"     Is Public: {avatar.get('is_public', False)}")
            print()
    else:
        print(f"❌ Error: {response.text}")
except Exception as e:
    print(f"❌ Exception: {str(e)}")

# Test 2: List Voices  
print("\n2. Fetching available voices...")
try:
    response = requests.get(f"{BASE_URL}/voices", headers=headers, timeout=30)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        voices = data.get('data', {}).get('voices', [])
        print(f"✅ Found {len(voices)} voices")
        
        # Show first 5 voices
        print("\nFirst 5 voices:")
        for i, voice in enumerate(voices[:5]):
            print(f"  {i+1}. ID: {voice.get('voice_id')}")
            print(f"     Name: {voice.get('name')}")
            print(f"     Language: {voice.get('language')}")
            print(f"     Gender: {voice.get('gender')}")
            print()
    else:
        print(f"❌ Error: {response.text}")
except Exception as e:
    print(f"❌ Exception: {str(e)}")

print("=" * 60)
print("Test Complete")
print("=" * 60)
