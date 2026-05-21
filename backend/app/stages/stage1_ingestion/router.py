from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from ...db.supabase import supabase
from .schemas import RawLogRequest
from .agent import IngestionAgent
from .service import sync_strava_data
from ..stage4_analytics.muscle_mapping import get_muscle_group

router = APIRouter()

@router.post("/log/quick")
async def quick_log_workout(request: Request, log_data: RawLogRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")

    # Log raw body to debug 400 errors
    raw_body = await request.body()
    print("\n=== RAW REQUEST BODY ===")
    print(raw_body.decode('utf-8'))
    print("========================\n")

    # 1. Parse the text using the Ingestion Agent (Groq/OpenRouter)
    try:
        parsed_data = IngestionAgent.parse_raw_workout(log_data.raw_text)
    except Exception as e:
        print(f"Parsing error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to parse workout: {str(e)}")

    # 2. Format the parsed data to match your gym_logs table structure
    try:
        records_to_insert = []
        
        for entry in parsed_data.entries:
            records_to_insert.append({
                "date": entry.date,
                "exercise": entry.exercise_name,
                "exercise_name": entry.exercise_name,
                "exercise_group": get_muscle_group(entry.exercise_name),
                "weight": entry.weight if entry.weight is not None else 0.0,
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

@router.post("/strava/sync")
async def trigger_strava_sync(background_tasks: BackgroundTasks):
    """
    Manually triggers a Strava data sync.
    Runs as a background task to avoid blocking the request.
    """
    try:
        background_tasks.add_task(sync_strava_data)
        return {"status": "success", "message": "Strava sync triggered in background"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
