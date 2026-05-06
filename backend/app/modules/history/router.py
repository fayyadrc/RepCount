from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List
from ...db.supabase import supabase
from .schemas import WorkoutSession, WorkoutEntry
from .service import HistoryService
from ..analytics.muscle_mapping import get_muscle_group

router = APIRouter()

class RawLogRequest(BaseModel):
    raw_text: str

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

@router.post("/log/quick")
async def quick_log_workout(request: Request, log_data: RawLogRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")

    # Log raw body to debug 400 errors as suggested
    raw_body = await request.body()
    print("\n=== RAW REQUEST BODY ===")
    print(raw_body.decode('utf-8'))
    print("========================\n")

    # 1. Parse the text using the LLM Service (Groq/OpenRouter)
    try:
        parsed_data = HistoryService.parse_raw_workout(log_data.raw_text)
    except Exception as e:
        print(f"Parsing error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to parse workout: {str(e)}")

    # 2. Format the parsed data to match your gym_logs table structure
    # Based on your GET endpoint, gym_logs expects: date, exercise, weight, weight_unit, sets, reps, notes
    try:
        records_to_insert = []
        
        for entry in parsed_data.entries:
            records_to_insert.append({
                "date": entry.date,
                "exercise": entry.exercise_name,
                "exercise_name": entry.exercise_name,
                "exercise_group": get_muscle_group(entry.exercise_name),
                "weight": entry.weight,
                "weight_unit": entry.unit,
                "set_number": 1,
                "reps": entry.reps,
                "to_failure": entry.failure,
                "rir": entry.rir,
                "notes": entry.notes or "" 
            })
        
        # 3. Bulk insert into Supabase
        if records_to_insert:
            supabase.table("gym_logs").insert(records_to_insert).execute()

        return {
            "status": "success", 
            "message": f"Successfully logged {len(records_to_insert)} sets.",
            "data": parsed_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insertion error: {str(e)}")

@router.put("/history/log/{log_id}")
def update_workout_log(log_id: str, entry: WorkoutEntry):
    success = HistoryService.update_log(log_id, entry)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update workout log")
    return {"status": "success"}

@router.delete("/history/log/{log_id}")
def delete_workout_log(log_id: str):
    success = HistoryService.delete_log(log_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete workout log")
    return {"status": "success"}