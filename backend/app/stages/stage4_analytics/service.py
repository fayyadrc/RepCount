import os
from typing import Dict, List, Any
from datetime import datetime, timedelta, date
from collections import defaultdict
from ...db.supabase import supabase
from .schemas import WorkoutSession, WorkoutEntry, StravaActivity
from .muscle_mapping import get_muscle_group

class AnalyticsReportingService:
    @staticmethod
    def process_workout_history(gym_data: list, strava_data: list) -> List[WorkoutSession]:
        # group by date
        gym_by_date = defaultdict(list)
        for log in gym_data:
            d = log.get("date")
            if d:
                date_str = str(d).split('T')[0].strip()
                gym_by_date[date_str].append(log)

        strava_by_date = defaultdict(list)
        for activity in strava_data:
            d = activity.get("start_date")
            if d:
                date_str = str(d).split('T')[0].strip()
                strava_by_date[date_str].append(activity)

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
                weight = float(log.get("weight", 0) or 0)
                sets = int(log.get("set_number", 1) or 1)
                reps = int(log.get("reps", 0) or 0)
                
                total_volume += weight * sets * reps
                total_reps += sets * reps
                
                rir_val = log.get("rir")
                failure_val = log.get("to_failure")
                base_notes = log.get("notes") or ""
                
                enhanced_notes = []
                if failure_val: enhanced_notes.append("To failure")
                if rir_val is not None: enhanced_notes.append(f"RIR {rir_val}")
                if base_notes: enhanced_notes.append(base_notes)
                
                entries.append(WorkoutEntry(
                    id=log.get("id"),
                    exercise=log.get("exercise", "Unknown"),
                    weight=weight,
                    weightUnit=log.get("weight_unit", "kg"),
                    sets=sets,
                    reps=reps,
                    notes=". ".join(enhanced_notes)
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
                    distanceMeters=distance,
                    elevationGain=float(act.get("elevation_gain")) if act.get("elevation_gain") is not None else None,
                    avgSpeedMps=float(act.get("avg_speed_mps")) if act.get("avg_speed_mps") is not None else None,
                    maxSpeedMps=float(act.get("max_speed_mps")) if act.get("max_speed_mps") is not None else None,
                    avgCadence=float(act.get("avg_cadence")) if act.get("avg_cadence") is not None else None,
                    avgTemp=float(act.get("avg_temp")) if act.get("avg_temp") is not None else None,
                    calories=float(act.get("calories")) if act.get("calories") is not None else None
                ))

            avg_heart_rate = (weight_hr_sum / weight_hr_count) if weight_hr_count > 0 else None
            duration_mins = total_duration_secs / 60.0 if total_duration_secs > 0 else None

            session = WorkoutSession(
                id=f"session-{date_str}",
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
        volume_by_muscle = defaultdict(float)
        for log in gym_data:
            exercise = log.get("exercise") or log.get("exercise_name")
            muscle = get_muscle_group(exercise)
            
            weight = float(log.get("weight") or 0)
            reps = int(log.get("reps") or 0)
            sets = 1 # Each row in gym_logs represents a single set
            
            volume_by_muscle[muscle] += weight * sets * reps

        # Format volume data for chart
        volume_data = [
            {"muscle": m, "volume": round(v, 1)} 
            for m, v in sorted(volume_by_muscle.items(), key=lambda x: x[1], reverse=True)
        ]

        # 5. Most / Least Trained
        if volume_data:
            most_trained = volume_data[0]["muscle"]
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

    @staticmethod
    def update_log(log_id: str, entry: WorkoutEntry) -> bool:
        if not supabase:
            return False
            
        data = {
            "exercise": entry.exercise,
            "exercise_name": entry.exercise,
            "exercise_group": get_muscle_group(entry.exercise),
            "weight": entry.weight,
            "weight_unit": entry.weightUnit,
            "reps": entry.reps,
            "notes": entry.notes
        }
        
        try:
            supabase.table("gym_logs").update(data).eq("id", log_id).execute()
            return True
        except Exception as e:
            print(f"Error updating log: {e}")
            return False

    @staticmethod
    def delete_log(log_id: str) -> bool:
        if not supabase:
            return False
            
        try:
            supabase.table("gym_logs").delete().eq("id", log_id).execute()
            return True
        except Exception as e:
            print(f"Error deleting log: {e}")
            return False
