from supabase import create_client, Client
from ..core.config import settings

def get_supabase_client() -> Client | None:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        print("Warning: SUPABASE_URL or SUPABASE_KEY is missing from environment variables.")
        return None
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

supabase = get_supabase_client()
