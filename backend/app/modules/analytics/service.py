
from typing import Dict, List, Any
from datetime import datetime, timedelta
from collections import defaultdict
from ...db.supabase import supabase
from .muscle_mapping import get_muscle_group

class AnalyticsService:
    @staticmethod
    def get_dashboard_stats() -> Dict[str, Any]:
        if not supabase:
            return {}

        # 1. Fetch all gym logs and strava activities
        try:
            gym_response = supabase.table("gym_logs").select("*").execute()
            gym_data = gym_response.data or []
        except Exception as e:
            print(f"Error fetching gym logs: {e}")
            gym_data = []

        try:
            strava_response = supabase.table("strava_activities").select("*").execute()
            strava_data = strava_response.data or []
        except Exception as e:
            print(f"Error fetching strava activities: {e}")
            strava_data = []

        # 2. Calculate Total Workouts (Unique dates with any activity)
        gym_dates = {log.get("date") for log in gym_data if log.get("date")}
        strava_dates = {activity.get("start_date", "").split("T")[0] for activity in strava_data if activity.get("start_date")}
        
        all_activity_dates = gym_dates | strava_dates
        total_workouts = len(all_activity_dates)

        # 3. Calculate Workouts This Week (Unique dates this week)
        now = datetime.now()
        start_of_week = now - timedelta(days=now.weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        
        week_activity_dates = set()
        for date_str in all_activity_dates:
            try:
                dt = datetime.strptime(date_str, "%Y-%m-%d")
                if dt >= start_of_week:
                    week_activity_dates.add(date_str)
            except:
                continue

        workouts_this_week = len(week_activity_dates)

        # 4. Volume per Muscle Group
        # Formula: weight * sets * reps (assuming set_number is used for individual sets)
        volume_by_muscle = defaultdict(float)
        for log in gym_data:
            exercise = log.get("exercise") or log.get("exercise_name")
            muscle = get_muscle_group(exercise)
            
            weight = float(log.get("weight") or 0)
            reps = int(log.get("reps") or 0)
            # If the database stores one row per set, set_number might just be the index
            # Based on history router, it seems sets are individual rows
            sets = 1 # Each row is a set
            
            volume_by_muscle[muscle] += weight * sets * reps

        # Format volume data for chart
        volume_data = [
            {"muscle": m, "volume": round(v, 1)} 
            for m, v in sorted(volume_by_muscle.items(), key=lambda x: x[1], reverse=True)
        ]

        # 5. Most / Least Trained
        if volume_data:
            most_trained = volume_data[0]["muscle"]
            # Exclude "Other" from least trained if possible
            non_other = [d for d in volume_data if d["muscle"] != "Other"]
            least_trained = non_other[-1]["muscle"] if non_other else volume_data[-1]["muscle"]
        else:
            most_trained = "N/A"
            least_trained = "N/A"

        return {
            "total_workouts": total_workouts,
            "workouts_this_week": workouts_this_week,
            "volume_per_muscle": volume_data,
            "most_trained": most_trained,
            "least_trained": least_trained,
            "gym_session_count": len(gym_dates),
            "strava_activity_count": len(strava_dates)
        }
