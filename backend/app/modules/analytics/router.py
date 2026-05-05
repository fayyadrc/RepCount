
from fastapi import APIRouter, HTTPException
from .service import AnalyticsService

router = APIRouter()

@router.get("/analytics")
def get_analytics():
    """
    Returns aggregated workout statistics.
    """
    try:
        stats = AnalyticsService.get_dashboard_stats()
        return stats
    except Exception as e:
        print(f"Error generating analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
