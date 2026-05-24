import os
import csv
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

def clean_val(val, target_type=str):
    if val is None or val.strip() == "":
        return None
    try:
        if target_type == int:
            return int(float(val))
        if target_type == float:
            return float(val)
        if target_type == bool:
            return val.lower() in ("true", "1", "t", "y", "yes")
        return val
    except (ValueError, TypeError):
        return None

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

    # Path to CSV
    csv_path = Path(__file__).parent.parent.parent / "data" / "gym_logs_FINAL.csv"
    
    if not csv_path.exists():
        print(f"❌ Could not find {csv_path}")
        return False
        
    db_records = []
    try:
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                reps = clean_val(row.get("reps"), int)
                reps_left = clean_val(row.get("reps_left"), int)
                reps_right = clean_val(row.get("reps_right"), int)
                
                # If reps is missing, try to use reps_left/right
                if reps is None:
                    reps = max(reps_left or 0, reps_right or 0)

                record = {
                    "id": clean_val(row.get("id")),
                    "user_id": clean_val(row.get("user_id")),
                    "date": clean_val(row.get("date")),
                    "exercise": clean_val(row.get("exercise")),
                    "weight": clean_val(row.get("weight"), float) or 0.0, # Handle missing weight
                    "weight_unit": clean_val(row.get("weight_unit")) or "kg",
                    "reps": reps,
                    "notes": clean_val(row.get("notes")),
                    "created_at": clean_val(row.get("created_at")),
                    "exercise_name": clean_val(row.get("exercise_name")),
                    "exercise_group": clean_val(row.get("exercise_group")),
                    "is_plate": clean_val(row.get("is_plate"), bool),
                    "reps_left": reps_left,
                    "reps_right": reps_right,
                    "set_number": clean_val(row.get("set_number"), int) or 1,
                    "rir": clean_val(row.get("rir"), int),
                    "to_failure": clean_val(row.get("to_failure"), bool)
                }
                # Remove keys with None value if they are optional and might cause issues, 
                # but for this CSV, we want to be explicit. 
                # Supabase handles None as NULL.
                db_records.append(record)
    except Exception as e:
        print(f"❌ Error reading CSV: {e}")
        return False
        
    print(f"📄 Loaded {len(db_records)} records from CSV")
    
    if not db_records:
        print("⚠️ No records to insert.")
        return True

    # Insert in batches
    batch_size = 100
    total_inserted = 0
    
    print(f"🚀 Inserting data into Supabase gym_logs table in batches of {batch_size}...")
    
    for i in range(0, len(db_records), batch_size):
        batch = db_records[i : i + batch_size]
        try:
            response = supabase.table("gym_logs").upsert(batch).execute()
            total_inserted += len(response.data) if hasattr(response, 'data') else len(batch)
            print(f"  Processed {min(i + batch_size, len(db_records))}/{len(db_records)}...")
        except Exception as e:
            print(f"❌ Error inserting batch at index {i}: {e}")
            return False
            
    print(f"✅ Successfully ingested {total_inserted} rows!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
