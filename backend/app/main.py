import os
from typing import List, Dict, Any
from datetime import datetime
from collections import defaultdict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
import uuid

load_dotenv()

app = FastAPI(title="GymTracker API")

# Configure CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"], # Allow frontend dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: SUPABASE_URL or SUPABASE_KEY is missing from environment variables.")
    supabase: Client | None = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── Pydantic Models for Response ───

class WorkoutEntry(BaseModel):
    exercise: str
    weight: float
    weightUnit: str = "kg"
    sets: int
    reps: int
    notes: str = ""

class StravaActivity(BaseModel):
    name: str
    type: str
    durationSeconds: int
    avgHeartrate: float | None = None
    maxHeartrate: float | None = None
    distanceMeters: float = 0.0

class WorkoutSession(BaseModel):
    id: str
    date: str
    entries: List[WorkoutEntry]
    rawInput: str = ""
    totalVolumeKg: float = 0.0
    totalReps: int = 0
    durationMins: float | None = None
    avgHeartRate: float | None = None
    activityNames: List[str] = []
    stravaActivities: List[StravaActivity] = []

@app.get("/api/health")
def health_check():
    return {"status": "ok", "supabase_connected": supabase is not None}

@app.get("/api/history", response_model=List[WorkoutSession])
def get_workout_history():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")

    # Fetch gym logs
    try:
        gym_response = supabase.table("gym_logs").select("*").execute()
        gym_data = gym_response.data
    except Exception as e:
        print(f"Error fetching gym logs (it may not exist yet): {e}")
        gym_data = []

    # Fetch Strava activities
    try:
        strava_response = supabase.table("strava_activities").select("*").execute()
        strava_data = strava_response.data
    except Exception as e:
        print(f"Error fetching strava activities: {e}")
        strava_data = []

    # ─── Group by Date ───
    
    # gym_by_date: { date_str: [list of entries] }
    gym_by_date = defaultdict(list)
    for log in gym_data:
        date_str = str(log.get("date", ""))[:10]
        if date_str:
            gym_by_date[date_str].append(log)

    # strava_by_date: { date_str: [list of activities] }
    strava_by_date = defaultdict(list)
    for activity in strava_data:
        date_str = str(activity.get("start_date", ""))[:10]
        if date_str:
            strava_by_date[date_str].append(activity)

    # All unique dates
    all_dates = sorted(set(gym_by_date.keys()) | set(strava_by_date.keys()), reverse=True)

    sessions: List[WorkoutSession] = []

    for date_str in all_dates:
        logs = gym_by_date.get(date_str, [])
        activities = strava_by_date.get(date_str, [])

        # Process gym entries
        entries = []
        total_volume = 0.0
        total_reps = 0
        for log in logs:
            weight = float(log.get("weight", 0))
            sets = int(log.get("sets", 1))
            reps = int(log.get("reps", 0))
            
            total_volume += weight * sets * reps
            total_reps += sets * reps
            
            entries.append(WorkoutEntry(
                exercise=log.get("exercise", "Unknown"),
                weight=weight,
                weightUnit=log.get("weight_unit", "kg"),
                sets=sets,
                reps=reps,
                notes=log.get("notes") or ""
            ))

        # Process Strava activities
        strava_list = []
        activity_names = []
        total_duration_secs = 0
        weight_hr_sum = 0
        weight_hr_count = 0

        for act in activities:
            name = act.get("name", "Unknown")
            act_type = act.get("type", "Unknown")
            duration = int(act.get("duration_seconds", 0))
            avg_hr = act.get("avg_heartrate")
            max_hr = act.get("max_heartrate")
            distance = float(act.get("distance_meters", 0))

            activity_names.append(name)
            total_duration_secs += duration

            if act_type == "WeightTraining" and avg_hr:
                weight_hr_sum += float(avg_hr)
                weight_hr_count += 1

            strava_list.append(StravaActivity(
                name=name,
                type=act_type,
                durationSeconds=duration,
                avgHeartrate=float(avg_hr) if avg_hr else None,
                maxHeartrate=float(max_hr) if max_hr else None,
                distanceMeters=distance
            ))

        avg_heart_rate = (weight_hr_sum / weight_hr_count) if weight_hr_count > 0 else None
        duration_mins = total_duration_secs / 60.0 if total_duration_secs > 0 else None

        session = WorkoutSession(
            id=f"session-{uuid.uuid4().hex[:8]}",
            date=date_str,
            entries=entries,
            rawInput="Fetched from database",
            totalVolumeKg=round(total_volume, 2),
            totalReps=total_reps,
            durationMins=round(duration_mins, 2) if duration_mins else None,
            avgHeartRate=round(avg_heart_rate, 1) if avg_heart_rate else None,
            activityNames=activity_names,
            stravaActivities=strava_list
        )
        sessions.append(session)

    return sessions

if __name__ == "__main__":
    import uvicorn
    # Optional: run directly for debugging
    uvicorn.run(app, host="0.0.0.0", port=8002)
