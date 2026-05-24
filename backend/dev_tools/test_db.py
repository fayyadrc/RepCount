import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

res = supabase.table("strava_activities").select("type, calories").execute()
calories = [r for r in res.data if r.get('calories') is not None]
print(f"Total with calories: {len(calories)} out of {len(res.data)}")
