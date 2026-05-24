import os
import requests
import time
import json
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from backend/.env
# This script is in backend/dev_tools/data_scripts/ so .env is 2 levels up
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# ===== CONFIG =====
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REFRESH_TOKEN = os.getenv("REFRESH_TOKEN")

BASE_URL = "https://www.strava.com/api/v3"

# ===== AUTH =====
def get_access_token():
    auth_data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": REFRESH_TOKEN,
        "grant_type": "refresh_token",
    }
    
    res = requests.post(
        "https://www.strava.com/oauth/token",
        data=auth_data,
    )
    
    res.raise_for_status()
    
    data = res.json()
    
    access_token = data["access_token"]
    refresh_token = data["refresh_token"]
    
    return access_token, refresh_token


# ===== GENERIC SAFE REQUEST =====
def safe_get(url, token, params=None):
    while True:
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        res = requests.get(
            url,
            headers=headers,
            params=params,
        )

        if res.status_code == 429:
            print("⏳ Rate limit hit, sleeping 60s...")
            time.sleep(60)
            continue

        if res.status_code == 401:
            raise Exception("Unauthorized - token likely invalid")

        res.raise_for_status()
        
        return res.json()


# ===== GET ACTIVITY SUMMARIES =====
def get_all_activity_summaries(token):
    all_summaries = []
    page = 1

    while True:
        params = {
            "per_page": 200, 
            "page": page
        }
        
        data = safe_get(
            f"{BASE_URL}/athlete/activities",
            token,
            params=params,
        )

        if not data:
            break
            
        for activity in data:
            # The summary API doesn't return calories for most activities,
            # so we fetch the detailed activity
            activity_id = activity.get("id")
            detailed = safe_get(f"{BASE_URL}/activities/{activity_id}", token)
            
            summary = {
                "id": activity_id,
                "name": activity.get("name"),
                "type": activity.get("type"),
                "start_date": activity.get("start_date"),
                "distance_meters": activity.get("distance"),
                "duration_seconds": activity.get("moving_time"),
                "elevation_gain": activity.get("total_elevation_gain"),
                "avg_speed_mps": activity.get("average_speed"),
                "max_speed_mps": activity.get("max_speed"),
                "avg_heartrate": activity.get("average_heartrate"),
                "max_heartrate": activity.get("max_heartrate"),
                "avg_cadence": activity.get("average_cadence"),
                "avg_temp": activity.get("average_temp"),
                "calories": detailed.get("calories") or activity.get("kilojoules")
            }
            all_summaries.append(summary)
            
            # Sleep slightly to avoid Strava's 100 req / 15 min limit if possible
            # (If you have > 100 activities, you might hit the limit)
            time.sleep(0.2)

        print(f"📄 Page {page}: Processed {len(data)} activities")
        
        page = page + 1
        
        time.sleep(1)

    return all_summaries


# ===== MAIN =====
def main():
    # 1. Get Authentication
    token, new_refresh = get_access_token()
    print("🔑 Access token obtained")

    # 2. Fetch all summaries (this now contains the averages)
    print("🏃 Fetching activity summaries...")
    summaries = get_all_activity_summaries(token)
    
    total_count = len(summaries)
    print(f"✅ Total activities processed: {total_count}")

    # 3. Save to JSON
    file_name = "strava_averages_export.json"
    
    with open(file_name, "w") as f:
        json.dump(summaries, f, indent=2)

    print(f"💾 Done! Data saved to {file_name}")


if __name__ == "__main__":
    main()