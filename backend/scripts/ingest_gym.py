import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

def main():
    # Load environment variables
    load_dotenv()
    
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        print("❌ Missing credentials! Set SUPABASE_URL and SUPABASE_KEY in .env")
        return False
    
    # Initialize Supabase client
    try:
        supabase: Client = create_client(url, key)
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return False

    file_path = Path(__file__).parent / "data" / "gym_data_processed.json"
    
    if not file_path.exists():
        print(f"❌ Could not find {file_path}")
        return False
        
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False
        
    print(f"📄 Loaded {len(data)} sets from JSON")
    
    # Map to DB schema
    db_records = []
    for item in data:
        record = {
            "date": item.get("date"),
            "exercise": item.get("exercise"),
            "weight": item.get("weight", 0),
            "weight_unit": "kg",
            "sets": 1, # Each row in this JSON represents a single set
            "reps": item.get("total_reps", 0),
            "notes": item.get("notes") or ""
        }
        db_records.append(record)
        
    # Insert in batches if it's large, but Supabase can handle a few hundred records easily
    try:
        print("🚀 Inserting data into Supabase gym_logs table...")
        response = supabase.table("gym_logs").insert(db_records).execute()
        
        inserted_count = len(response.data) if hasattr(response, 'data') and response.data else len(db_records)
        print(f"✅ Successfully inserted {inserted_count} rows!")
        return True
    except Exception as e:
        print(f"❌ Error inserting data: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
