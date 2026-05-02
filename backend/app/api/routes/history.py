from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.workout import WorkoutSession
from app.db.supabase import supabase
from app.services.history_service import HistoryService

router = APIRouter()

@router.get("/history", response_model=List[WorkoutSession])
def get_workout_history():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")

    try:
        gym_response = supabase.table("gym_logs").select("*").execute()
        gym_data = gym_response.data
    except Exception as e:
        print(f"Error fetching gym logs (it may not exist yet): {e}")
        gym_data = []

    try:
        strava_response = supabase.table("strava_activities").select("*").execute()
        strava_data = strava_response.data
    except Exception as e:
        print(f"Error fetching strava activities: {e}")
        strava_data = []

    return HistoryService.process_workout_history(gym_data, strava_data)
