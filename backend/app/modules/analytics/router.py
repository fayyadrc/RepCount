
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from .service import AnalyticsService
from .recommendation_service import generate_recommendation, RecommendationResult, classify_exercise, ExerciseCategory
from .muscle_mapping import get_muscle_info, normalize_exercise_name
from ...db.supabase import supabase
from collections import defaultdict, Counter
from dataclasses import asdict

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


# ─── Exercise name lookup table (matches SPLIT_CONFIG in Analytics.tsx) ────────
# Maps the display exercise name → default_weight so we can fall back gracefully
# for exercises the user has never logged.
_SPLIT_DEFAULTS: dict[str, float] = {
    "Bench Press": 40.0,
    "Incline Dumbbell Press": 16.0,
    "Dumbbell Shoulder Press": 14.0,
    "Lateral Raise": 8.0,
    "Tricep Rope Pushdown": 15.0,
    "Pullup": 0.0,
    "Barbell Row": 40.0,
    "Lat Pulldown": 45.0,
    "Bicep Curl": 12.0,
    "Hammer Curl": 12.0,
    "Face Pull": 17.5,
    "Barbell Squat": 60.0,
    "Romanian Deadlift": 50.0,
    "Leg Press": 100.0,
    "Leg Curl": 30.0,
    "Calf Raise": 40.0,
    "Hip Thrust": 80.0,
    "Bulgarian Split Squat": 12.0,
    "Hanging Leg Raise": 0.0,
    "Deadlift": 80.0,
}


@router.get("/recommendations")
def get_recommendations(
    exercises: Optional[str] = Query(
        default=None,
        description=(
            "Comma-separated list of exercise names to generate recommendations for. "
            "Defaults to all exercises in SPLIT_CONFIG if omitted."
        ),
    )
):
    """
    Returns personalised next-session weight recommendations for each requested
    exercise, grounded in EWMA smoothing, continuous fatigue detection,
    category-aware load increments, confidence scoring, and audit trails.
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unavailable.")

    # 1. Resolve the exercise list
    if exercises:
        exercise_names = [e.strip() for e in exercises.split(",") if e.strip()]
    else:
        exercise_names = list(_SPLIT_DEFAULTS.keys())

    # 2. Fetch all gym_logs once and bucket by normalised exercise name
    try:
        response = supabase.table("gym_logs").select(
            "exercise, weight, reps, date, weight_unit"
        ).execute()
        all_logs: list[dict] = response.data or []
    except Exception as e:
        print(f"[recommendations] Supabase fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch gym logs: {e}")

    # Group logs by lowercased, stripped exercise name
    logs_by_exercise: dict[str, list[dict]] = defaultdict(list)
    for log in all_logs:
        name_raw = (log.get("exercise") or log.get("exercise_name") or "").strip()
        if not name_raw or name_raw.lower() == "unknown":
            continue
        canonical = normalize_exercise_name(name_raw)
        logs_by_exercise[canonical.lower()].append(log)

    # Sort each bucket chronologically
    for key in logs_by_exercise:
        logs_by_exercise[key].sort(key=lambda r: str(r.get("date") or ""))

    # 3. Generate a recommendation for each requested exercise
    results: list[dict] = []
    for ex_name in exercise_names:
        # Fuzzy-find matching logs (allows minor name variations)
        ex_key = ex_name.lower()
        matched_logs: list[dict] = []

        # Exact key first
        if ex_key in logs_by_exercise:
            matched_logs = logs_by_exercise[ex_key]
        else:
            # Partial match fallback: pick the bucket whose key contains or is
            # contained by the requested name
            for bucket_key, bucket_logs in logs_by_exercise.items():
                search = ex_key.replace(" ", "")
                candidate = bucket_key.replace(" ", "")
                if search in candidate or candidate in search:
                    matched_logs = bucket_logs
                    break

        # Filter to kg-unit only (skip plate-weighted entries for e1RM purposes)
        kg_logs = [
            log for log in matched_logs
            if (log.get("weight_unit") or log.get("unit") or "kg").lower()
            not in ("plate", "plates")
        ]

        muscle_group = get_muscle_info(ex_name)["sub_group"]
        default_weight = _SPLIT_DEFAULTS.get(ex_name, 0.0)

        rec: RecommendationResult = generate_recommendation(
            exercise_name=ex_name,
            muscle_group=muscle_group,
            history=kg_logs,
            default_weight=default_weight,
            unit="kg",
        )
        results.append(asdict(rec))

    return results


# ─── Muscle → Split mapping ───────────────────────────────────────────────────
_PUSH_MUSCLES = {"Chest", "Shoulders", "Triceps"}
_PULL_MUSCLES = {"Back", "Biceps", "Traps", "Forearms"}
_LEGS_MUSCLES = {"Quads", "Hamstrings", "Glutes", "Calves", "Abs", "Obliques"}


@router.get("/recommendations/dynamic")
def get_dynamic_recommendations():
    """
    Auto-discovers exercises from gym_logs, groups them into Push/Pull/Legs/Upper/Lower
    splits ranked by occurrence count, and generates recommendations for each.
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unavailable.")

    empty_splits = {"Push": [], "Pull": [], "Legs": [], "Upper": [], "Lower": []}

    try:
        response = supabase.table("gym_logs").select(
            "exercise, weight, reps, date, weight_unit"
        ).execute()
        all_logs: list[dict] = response.data or []
    except Exception as e:
        print(f"[recommendations/dynamic] Supabase fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch gym logs: {e}")

    if not all_logs:
        return {"splits": empty_splits, "recommendations": {}}

    # ── Group logs by normalised exercise name ─────────────────────────────
    logs_by_exercise: dict[str, list[dict]] = defaultdict(list)
    exercise_display_names: dict[str, str] = {}  # key → best display name

    for log in all_logs:
        name_raw = (log.get("exercise") or log.get("exercise_name") or "").strip()
        if not name_raw or name_raw.lower() == "unknown":
            continue
        canonical = normalize_exercise_name(name_raw)
        key = canonical.lower()
        logs_by_exercise[key].append(log)
        if key not in exercise_display_names:
            exercise_display_names[key] = canonical

    # ── Build per-exercise metadata and group into splits ──────────────────
    splits: dict[str, list[dict]] = {"Push": [], "Pull": [], "Legs": []}
    all_recommendations: dict[str, dict] = {}

    for ex_key, logs in logs_by_exercise.items():
        display_name = exercise_display_names[ex_key]
        muscle_group = get_muscle_info(display_name)["sub_group"]

        # Determine which split this exercise belongs to
        if muscle_group in _PUSH_MUSCLES:
            split = "Push"
        elif muscle_group in _PULL_MUSCLES:
            split = "Pull"
        elif muscle_group in _LEGS_MUSCLES:
            split = "Legs"
        else:
            cat = classify_exercise(display_name, muscle_group)
            split = "Legs" if cat == ExerciseCategory.LOWER_BODY_COMPOUND else "Push"

        # Filter to kg-unit logs for recommendation engine
        kg_logs = [
            log for log in logs
            if (log.get("weight_unit") or log.get("unit") or "kg").lower()
            not in ("plate", "plates")
        ]
        kg_logs_sorted = sorted(kg_logs, key=lambda r: str(r.get("date") or ""))

        occurrence_count = len(logs)

        # Most common reps value
        reps_vals = [int(log.get("reps") or 0) for log in logs if int(log.get("reps") or 0) > 0]
        most_common_reps = Counter(reps_vals).most_common(1)[0][0] if reps_vals else 10

        # Most common sets-per-session (rows per unique date)
        sets_by_date: dict[str, int] = defaultdict(int)
        for log in logs:
            d = str(log.get("date") or "").split("T")[0]
            if d:
                sets_by_date[d] += 1
        session_set_counts = list(sets_by_date.values())
        most_common_sets = Counter(session_set_counts).most_common(1)[0][0] if session_set_counts else 3

        # Latest weight as default
        latest_weight = float(kg_logs_sorted[-1].get("weight") or 0) if kg_logs_sorted else 0.0

        # Detect primary unit (kg vs plates)
        plate_count = sum(
            1 for log in logs
            if (log.get("weight_unit") or log.get("unit") or "kg").lower() in ("plate", "plates")
        )
        unit = "plates" if plate_count > len(logs) / 2 else "kg"

        # Exercise type from classifier
        cat = classify_exercise(display_name, muscle_group)
        ex_type = "Compound" if cat != ExerciseCategory.ISOLATION else "Isolation"

        splits[split].append({
            "name": display_name,
            "defaultWeight": latest_weight,
            "unit": unit,
            "reps": most_common_reps,
            "targetSets": most_common_sets,
            "type": ex_type,
            "muscle": muscle_group,
            "occurrence_count": occurrence_count,
        })

        # Generate recommendation
        rec: RecommendationResult = generate_recommendation(
            exercise_name=display_name,
            muscle_group=muscle_group,
            history=kg_logs_sorted,
            default_weight=latest_weight,
            unit="kg",
        )
        all_recommendations[display_name] = asdict(rec)

    # ── Sort each split by occurrence count (most-logged first) ───────────
    for split_name in splits:
        splits[split_name].sort(key=lambda x: x["occurrence_count"], reverse=True)

    # ── Derive Upper (Push + Pull) and Lower (Legs) ──────────────────────
    splits["Upper"] = sorted(
        splits["Push"] + splits["Pull"],
        key=lambda x: x["occurrence_count"], reverse=True,
    )
    splits["Lower"] = splits["Legs"][:]

    return {"splits": splits, "recommendations": all_recommendations}
