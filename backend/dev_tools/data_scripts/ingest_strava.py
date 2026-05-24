import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

def find_json_file():
    """Intelligently find the strava JSON file in multiple locations"""
    
    # Possible locations to search
    search_paths = [
        # Relative to script location
        Path(__file__).parent / "data" / "strava_averages_export.json",
        Path(__file__).parent / "strava_averages_export.json",
        
        # Relative to current working directory
        Path.cwd() / "data" / "strava_averages_export.json",
        Path.cwd() / "strava_averages_export.json",
        
        # Backend root
        Path(__file__).parent.parent / "data" / "strava_averages_export.json",
        Path(__file__).parent.parent / "strava_averages_export.json",
        
        # Project root (one level up from backend)
        Path(__file__).parent.parent.parent / "data" / "strava_averages_export.json",
        Path(__file__).parent.parent.parent / "strava_averages_export.json",
    ]
    
    print("🔍 Searching for strava_averages_export.json...")
    for path in search_paths:
        if path.exists():
            print(f"✅ Found at: {path}")
            return str(path)
    
    print(f"❌ File not found in any of these locations:")
    for i, path in enumerate(search_paths, 1):
        print(f"   {i}. {path}")
    
    return None

def main():
    # Load environment variables
    load_dotenv()
    
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        print("❌ Missing credentials!")
        print("   Set SUPABASE_URL and SUPABASE_KEY in your .env file or environment")
        print("\n   Example .env:")
        print("   SUPABASE_URL=https://xxxxx.supabase.co")
        print("   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIs...")
        return False
    
    print(f"✅ Supabase URL: {url[:30]}...")
    
    # Find the JSON file
    file_path = find_json_file()
    if not file_path:
        print("\n💡 Solution: Place strava_averages_export.json in one of:")
        print("   - Same directory as this script")
        print("   - In a 'data' subdirectory")
        print("   - In the backend root")
        return False
    
    # Load the data
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        return False
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False
    
    print(f"📄 Loaded {len(data)} activities from JSON")
    
    if not data:
        print("⚠️  No data to insert")
        return False
    
    # Show sample data
    print(f"\n📊 Sample activity:")
    sample = data[0]
    print(f"   ID: {sample.get('id')}")
    print(f"   Name: {sample.get('name')}")
    print(f"   Type: {sample.get('type')}")
    print(f"   Date: {sample.get('start_date')}")
    print(f"   Avg HR: {sample.get('avg_heartrate')}")
    
    # Validate required columns
    required_columns = {
        'id', 'name', 'type', 'start_date', 'distance_meters',
        'duration_seconds', 'elevation_gain', 'avg_speed_mps',
        'max_speed_mps', 'avg_heartrate', 'max_heartrate',
        'avg_cadence', 'avg_temp', 'calories'
    }
    missing_columns = required_columns - set(data[0].keys())
    
    if missing_columns:
        print(f"\n❌ Missing columns in JSON: {missing_columns}")
        print("   The table schema expects all these columns")
        return False
    
    print(f"\n✅ All required columns present")
    
    # Initialize Supabase client
    try:
        supabase: Client = create_client(url, key)
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return False
    
    # Insert the data
    try:
        print("\n🚀 Inserting data into Supabase...")
        response = supabase.table("strava_activities").upsert(data).execute()
        
        inserted_count = len(response.data) if hasattr(response, 'data') and response.data else len(data)
        print(f"✅ Successfully inserted {inserted_count} activities!")
        
        # Show verification
        if hasattr(response, 'data') and response.data:
            first_inserted = response.data[0]
            print(f"\n✅ Verified - First inserted activity:")
            print(f"   ID: {first_inserted.get('id')}")
            print(f"   Name: {first_inserted.get('name')}")
        
        return True
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error inserting data:\n   {error_msg}")
        
        # Helpful hints based on error type
        if "Could not find the table" in error_msg:
            print("\n💡 The 'strava_activities' table doesn't exist!")
            print("   Solution: Run fix_strava_table.sql in your Supabase SQL editor")
        
        elif "Could not find the" in error_msg and "column" in error_msg:
            print("\n💡 A column is missing from the table!")
            print("   Solution: Run fix_strava_table.sql to drop and recreate the table")
        
        elif "PGRST" in error_msg:
            print("\n💡 This is a Supabase/PostgREST error")
            print("   Check your credentials and database permissions")
        
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)