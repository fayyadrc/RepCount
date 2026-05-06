import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
    OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

settings = Settings()
