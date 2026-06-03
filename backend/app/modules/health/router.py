from fastapi import APIRouter
from ...db.supabase import supabase
from .service import keep_alive_ping

router = APIRouter()

@router.get("/health")
def health_check():
    supabase_ok = False
    try:
        if supabase:
            # Minimal query to verify connectivity
            supabase.table("gym_logs").select("id").limit(1).execute()
            supabase_ok = True
    except Exception as e:
        print(f"Database health check failed: {e}")
        supabase_ok = False

    return {
        "status": "ok" if supabase_ok else "unhealthy",
        "backend_connected": True,
        "database_connected": supabase_ok
    }

@router.get("/health/keep-alive")
def trigger_keep_alive():
    """
    Manually triggers the keep-alive ping to test functionality.
    """
    keep_alive_ping()
    return {"message": "Keep-alive ping triggered successfully"}

