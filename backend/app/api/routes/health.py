from fastapi import APIRouter
from app.db.supabase import supabase

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "supabase_connected": supabase is not None}
