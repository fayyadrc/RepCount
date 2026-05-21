from fastapi import APIRouter, HTTPException
from typing import List
from ...db.supabase import supabase
from .schemas import WorkoutSession, WorkoutEntry
from .service import AnalyticsReportingService

router = APIRouter()

@router.get("/history", response_model=List[WorkoutSession])
def get_workout_history():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")

    try:
        gym_response = supabase.table("gym_logs").select("*").execute()
        gym_data = gym_response.data or []
    except Exception as e:
        print(f"Error fetching gym logs (it may not exist yet): {e}")
        gym_data = []

    try:
        strava_response = supabase.table("strava_activities").select("*").execute()
        strava_data = strava_response.data or []
    except Exception as e:
        print(f"Error fetching strava activities: {e}")
        strava_data = []

    return AnalyticsReportingService.process_workout_history(gym_data, strava_data)

@router.get("/analytics")
def get_analytics():
    """
    Returns aggregated workout statistics.
    """
    try:
        stats = AnalyticsReportingService.get_dashboard_stats()
        return stats
    except Exception as e:
        print(f"Error generating analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/history/log/{log_id}")
def update_workout_log(log_id: str, entry: WorkoutEntry):
    success = AnalyticsReportingService.update_log(log_id, entry)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update workout log")
    return {"status": "success"}

@router.delete("/history/log/{log_id}")
def delete_workout_log(log_id: str):
    success = AnalyticsReportingService.delete_log(log_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete workout log")
    return {"status": "success"}
