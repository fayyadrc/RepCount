from typing import List
from collections import defaultdict
import uuid
from .schemas import WorkoutSession, WorkoutEntry, StravaActivity

class HistoryService:
    @staticmethod
    def process_workout_history(gym_data: list, strava_data: list) -> List[WorkoutSession]:
        # ─── Group by Date ───
        gym_by_date = defaultdict(list)
        for log in gym_data:
            date_str = str(log.get("date", ""))[:10]
            if date_str:
                gym_by_date[date_str].append(log)

        strava_by_date = defaultdict(list)
        for activity in strava_data:
            date_str = str(activity.get("start_date", ""))[:10]
            if date_str:
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
