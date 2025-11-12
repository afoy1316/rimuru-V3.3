#!/usr/bin/env python3
"""Update failed videos in database"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'test_db')

async def update_failed_videos():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Video IDs yang failed
    failed_video_ids = [
        "447f6a7e579e426283a1f0f0bfb61aa2",
        "2289c87b76f947358a7ae44926a0dcc2"
    ]
    
    for video_id in failed_video_ids:
        result = await db.generated_videos.update_one(
            {'video_id': video_id},
            {
                '$set': {
                    'status': 'failed',
                    'error_message': 'Resolution not supported. Please use 720p.',
                    'failed_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        print(f"Updated video {video_id}: {result.modified_count} document(s) modified")
    
    client.close()
    print("✅ Done updating failed videos")

if __name__ == "__main__":
    asyncio.run(update_failed_videos())
