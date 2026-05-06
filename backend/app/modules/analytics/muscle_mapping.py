# A comprehensive mapping of exercises to muscle groups.
# Used as the source of truth until the database explicitly stores muscle groups.
# Continuously expanded based on real gym data and exercise science.

from typing import Optional
from difflib import SequenceMatcher

MUSCLE_GROUPS = {
    "Chest": [
        # Barbell
        "bench press", "barbell bench press", "flat bench press",
        "incline bench press", "incline barbell bench press",
        "decline bench press", "decline barbell bench press",
        "close grip bench press", "reverse grip bench press",
        # Dumbbell
        "dumbbell bench press", "dumbbell chest press", "dumbell bench",
        "incline dumbbell press", "decline dumbbell press",
        "dumbbell fly", "dumbell fly", "incline dumbbell fly",
        "decline dumbbell fly",
        # Cable & Machine
        "cable fly", "cable crossover", "machine fly", "pec deck",
        "chest fly", "machine chest press", "smith machine bench",
        # Bodyweight
        "pushup", "push up", "dips", "chest dips", "weighted dips",
        # Isolation
        "resistance band chest fly", "plate loaded chest press",
        # Niche
        "landmine press", "guillotine press", "blast strap fly"
    ],
    
    "Back": [
        # Pull-ups & Chin-ups
        "pullup", "pull up", "pull-up", "weighted pullup", "assisted pullup",
        "chinup", "chin up", "chin-up", "weighted chinup",
        # Rows
        "barbell row", "bent over row", "bent-over row",
        "t-bar row", "t bar row", "landmine row",
        "seated row", "seated cable row", "machine row",
        "dumbbell row", "single arm row", "one arm dumbbell row",
        "chest supported row", "incline row",
        "inverted row", "ring row",
        "cable row", "seal row",
        # Lat Pulldowns
        "lat pulldown", "wide grip lat pulldown", "close grip lat pulldown",
        "reverse grip lat pulldown", "v-bar lat pulldown",
        # Deadlifts
        "deadlift", "conventional deadlift", "sumo deadlift",
        "trap bar deadlift", "hex bar deadlift",
        "romanian deadlift", "rdl", "stiff leg deadlift",
        "deficit deadlift", "rack pull",
        # Back Extensions
        "back extension", "machine back extension", "45 degree back extension",
        "hyperextension", "reverse hyperextension",
        # Pulls & Pulldowns
        "face pull", "rope face pull", "cable face pull",
        "lat pullover", "machine pullover",
        # Shrugs
        "barbell shrug", "dumbbell shrug", "shrugs",
        "cable shrug", "machine shrug", "smith machine shrug",
        # Isolation
        "resistance band pulldown", "assisted back extension",
        # Specialized
        "yates row", "pendulum row", "machine assisted pullup",
        "resistance band row", "doorway row"
    ],
    
    "Quads": [
        # Barbell
        "squat", "barbell squat", "back squat", "front squat",
        "goblet squat", "dumbbell squat",
        "hack squat", "smith machine squat", "belt squat",
        # Leg Press
        "leg press", "machine leg press", "V-squat",
        "pendulum squat",
        # Extensions & Isolation
        "leg extension", "machine leg extension", "quad extension",
        "sissy squat", "split squat", "bulgarian split squat",
        "step up", "weighted step up", "step ups",
        "lunges", "dumbbell lunges", "barbell lunges", "walking lunges",
        "reverse lunges", "curtsy lunge",
        "lateral lunges", "side lunges",
        # Machines
        "leg curl machine", "quad machine", "angled leg press",
        # Bodyweight & Other
        "pistol squat", "jump squat", "resistance band squat",
        "box squat", "landmine squat",
        "tempo squat", "pin squat"
    ],
    
    "Hamstrings": [
        # Curls
        "leg curl", "lying leg curl", "seated leg curl", "machine leg curl",
        "standing leg curl", "nordic hamstring curl",
        # Deadlifts & Pulls
        "romanian deadlift", "rdl", "stiff leg deadlift",
        "deficit deadlift", "rack pull", "trap bar deadlift",
        "good morning", "machine good morning",
        # Specialized
        "glute-ham raise", "glute ham developer", "ghd",
        "lying leg curl", "hamstring curl",
        "resistance band curl", "eccentric hamstring curl",
        "natural glute-ham raise"
    ],
    
    "Shoulders": [
        # Overhead Press
        "shoulder press", "overhead press", "standing overhead press",
        "military press", "barbell shoulder press",
        "dumbbell shoulder press", "dumbbell press",
        "seated shoulder press", "machine shoulder press",
        "arnold press", "rotational arnold press",
        "landmine press", "half-kneeling press",
        # Lateral Raises
        "lateral raise", "side lateral raise", "dumbbell lateral raise",
        "cable lateral raise", "machine lateral raise",
        "plate lateral raise", "banded lateral raise",
        # Front Raises
        "front raise", "dumbbell front raise", "barbell front raise",
        "cable front raise", "plate front raise",
        # Rear Delt Work
        "rear delt fly", "rear delt machine", "reverse pec deck",
        "reverse fly", "band pull apart", "bent over dumbbell raise",
        "machine reverse fly",
        # Rows (Shoulder Component)
        "upright row", "barbell upright row", "dumbbell upright row",
        "cable upright row", "shrugs",
        # Specialized
        "machine lateral raise", "plate loaded shoulder press",
        "lever shoulder press", "pike pushup", "handstand push up",
        "dips (shoulders)", "band shoulder press"
    ],
    
    "Biceps": [
        # Barbell Curls
        "bicep curl", "barbell curl", "ez bar curl", "straight bar curl",
        "olympic bar curl", "reverse curl", "preacher curl",
        # Dumbbell Curls
        "dumbbell curl", "dumbbell bicep curl", "incline dumbbell curl",
        "seated dumbbell curl", "hammer curl", "alternating curl",
        # Cable Curls
        "cable curl", "cable bicep curl", "rope curl", "v-bar curl",
        "straight bar cable curl",
        # Machine Curls
        "machine bicep curl", "leverage curl", "hammer strength curl",
        # Isolation
        "concentration curl", "preacher curl", "spider curl",
        "21s", "incline curl", "seated incline curl",
        "decline curl", "cross body hammer curl",
        # Specialized
        "barbell drag curl", "machine assisted curl",
        "resistance band curl", "landmine curl",
        "banded bicep curl", "ez-bar preacher curl",
        "scott curl"
    ],
    
    "Triceps": [
        # Extensions
        "tricep extension", "overhead tricep extension", "dumbbell tricep extension",
        "seated tricep extension", "standing tricep extension",
        "cable extension", "rope extension", "v-bar extension",
        "lat pulldown tricep", "close grip pulldown",
        # Skull Crushers
        "skullcrusher", "skull crusher", "barbell skullcrusher",
        "dumbbell skullcrusher", "ez bar skull crusher", "hammer strength skull crusher",
        # Dips
        "dips", "tricep dips", "bench dips", "assisted dips",
        "weighted dips", "machine dips", "lever dips",
        # Close Grip Press
        "close grip bench press", "close grip barbell press",
        "close grip dumbbell press",
        # Pushdowns
        "tricep pushdown", "tricep rope pushdown", "tricep bar pushdown",
        "reverse grip pushdown", "v-bar pushdown",
        "machine tricep pushdown",
        # Isolation
        "overhead rope extension", "single arm extension",
        "kickback", "dumbbell kickback", "cable kickback",
        # Specialized
        "jm press", "board press", "narrow push up",
        "decline bench dips", "resistance band extension",
        "machine assisted tricep dip"
    ],
    
    "Abs": [
        # Crunches
        "crunch", "machine crunch", "cable crunch", "rope crunch",
        "weighted crunch", "ab wheel crunch", "decline crunch",
        # Leg Raises
        "leg raise", "hanging leg raise", "machine leg raise",
        "lying leg raise", "seated leg raise", "straight leg raise",
        "bent knee leg raise", "decline leg raise",
        # Planks & Holds
        "plank", "forearm plank", "side plank", "weighted plank",
        "plank hold", "ab plank",
        # Wheel & Tools
        "ab wheel", "ab wheel rollout", "machine ab wheel",
        # Twists & Rotation
        "russian twist", "weighted russian twist", "cable wood chop",
        "landmine rotation", "suitcase carry",
        # Machine
        "ab machine", "cable crunch", "machine ab crunch",
        "hanging ab crunch",
        # Isolation
        "decline sit-up", "sit-up", "weighted sit-up",
        "cable woodchop", "pallof press", "anti-rotation",
        "dead bug", "bird dog", "mountain climber"
    ],
    
    "Calves": [
        # Standing Calf Raises
        "calf raise", "standing calf raise", "barbell calf raise",
        "dumbbell calf raise", "smith machine calf raise",
        "machine calf raise", "leg press calf raise",
        "plate calf raise",
        # Seated Calf Raises
        "seated calf raise", "seated machine calf raise",
        # Jump & Plyometric
        "jump calf raise", "jump rope", "box jump",
        # Specialized
        "donkey calf raise", "lever calf raise", "hack squat calf raise",
        "single leg calf raise", "weighted step up (calves)",
        "toes up stretch"
    ],
    
    "Glutes": [
        # Hip Thrusts
        "hip thrust", "barbell hip thrust", "dumbbell hip thrust",
        "bench hip thrust", "smith machine hip thrust",
        "single leg hip thrust", "weighted hip thrust",
        # Glute Bridges
        "glute bridge", "barbell glute bridge", "single leg glute bridge",
        "banded glute bridge",
        # Abduction
        "abduction", "machine abduction", "hip abduction",
        "cable abduction", "resistance band abduction",
        "side-lying abduction",
        # Kickbacks
        "glute kickback", "cable kickback", "machine kickback",
        "resistance band kickback", "donkey kick",
        # Lunges & Squats (Glute Focus)
        "bulgarian split squat", "walking lunges", "curtsy lunge",
        "deficit squat", "pause squat",
        # Specialized
        "pendulum squat", "belt squat", "hack squat",
        "leg press (glute focused)", "v-squat",
        "smith machine hip thrust", "step-up", "weighted step-up"
    ],
    
    "Forearms": [
        # Wrist Curls
        "wrist curl", "barbell wrist curl", "dumbbell wrist curl",
        "cable wrist curl", "preacher wrist curl",
        "reverse wrist curl", "barbell reverse curl",
        # Gripping
        "farmer carry", "farmer's carry", "suitcase carry",
        "plate pinch", "thick bar curl", "hex dumbbell curl",
        # Specialized
        "wrist pronation", "wrist supination", "wrist roller",
        "leverage rotation", "towel row", "behind the back wrist curl",
        "incline dumbbell curl (forearm)", "radial/ulnar deviation"
    ],
    
    "Traps": [
        # Shrugs
        "shrug", "barbell shrug", "dumbbell shrug", "machine shrug",
        "smith machine shrug", "cable shrug", "trap bar shrug",
        "leverage shrug",
        # Pulls
        "upright row", "barbell upright row", "dumbbell upright row",
        "cable upright row", "wide grip upright row",
        # Rows (Upper Back)
        "bent over row (traps)", "face pull", "high row",
        # Specialized
        "snatch grip deadlift", "rack pull (high)", "shrug pull",
        "trap bar deadlift (high)"
    ],
    
    "Obliques": [
        # Side Bends
        "side bend", "dumbbell side bend", "cable side bend",
        "landmine side bend",
        # Twists
        "cable woodchop", "landmine rotation", "pallof press",
        "russian twist", "weighted russian twist",
        # Machine
        "machine oblique", "cable rotation", "machine rotation",
        # Specialized
        "suitcase carry", "anti-rotation press", "hanging knee raise (oblique)",
        "suitcase deadlift"
    ]
}

# Secondary muscle activation map (exercises that hit multiple muscles)
SECONDARY_MUSCLES = {
    "bench press": ["triceps", "shoulders"],
    "squat": ["glutes", "hamstrings"],
    "deadlift": ["glutes", "back", "hamstrings"],
    "hip thrust": ["hamstrings", "lower back"],
    "shoulder press": ["triceps", "upper chest"],
    "pullup": ["biceps", "shoulders"],
    "dips": ["chest", "shoulders"],
    "rows": ["biceps", "shoulders"],
}

def get_muscle_group(exercise_name: str, strict: bool = False) -> str:
    """
    Determine the primary muscle group for an exercise.
    
    Args:
        exercise_name: The name of the exercise
        strict: If True, only return exact matches; if False, use fuzzy matching
    
    Returns:
        The primary muscle group name, or "Other" if not found
    """
    if not exercise_name:
        return "Other"
    
    name = exercise_name.lower().strip()
    
    # Try exact substring matches first (fastest)
    for group, exercises in MUSCLE_GROUPS.items():
        if any(ex in name for ex in exercises):
            return group
    
    if strict:
        return "Other"
    
    # Fuzzy matching as fallback (slower but catches misspellings)
    best_match = _fuzzy_match_exercise(name)
    if best_match:
        return best_match
    
    # Heuristic rules for common patterns
    return _apply_heuristics(name)


def _fuzzy_match_exercise(exercise_name: str, threshold: float = 0.65) -> Optional[str]:
    """
    Attempt fuzzy matching against known exercises.
    Uses SequenceMatcher to handle typos and variations.
    """
    best_group = None
    best_ratio = threshold
    
    for group, exercises in MUSCLE_GROUPS.items():
        for exercise in exercises:
            ratio = SequenceMatcher(None, exercise_name, exercise).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_group = group
    
    return best_group


def _apply_heuristics(name: str) -> str:
    """
    Apply pattern-matching heuristics for common exercise naming conventions.
    """
    # Chest patterns
    if any(x in name for x in ["chest", "pec", "bench"]):
        if "fly" in name:
            return "Chest"
        elif "press" in name and "close" not in name and "tricep" not in name:
            return "Chest"
    
    # Back patterns
    if any(x in name for x in ["back", "row", "lat", "pull", "chin"]):
        return "Back"
    
    # Leg patterns
    if any(x in name for x in ["squat", "leg", "lunge", "press", "extension"]):
        if "leg" in name or "squat" in name:
            if "curl" in name or "ham" in name:
                return "Hamstrings"
            elif "extension" in name:
                return "Quads"
            else:
                return "Quads"  # Default leg exercise to quads
    
    # Curl patterns (Biceps > Triceps > Hamstrings)
    if "curl" in name:
        if "tricep" in name or "skull" in name:
            return "Triceps"
        elif "leg" in name or "ham" in name or "nordic" in name:
            return "Hamstrings"
        else:
            return "Biceps"
    
    # Press patterns (context-dependent)
    if "press" in name:
        if "shoulder" in name or "overhead" in name or "military" in name:
            return "Shoulders"
        elif "tricep" in name or "skull" in name or "bench" in name:
            return "Chest"  # Default press to chest if ambiguous
    
    # Dip patterns
    if "dip" in name:
        if "tricep" in name or "bench" in name:
            return "Triceps"
        else:
            return "Chest"  # Bodyweight dips = chest/triceps, default chest
    
    # Raise patterns (shoulders)
    if "raise" in name:
        return "Shoulders"
    
    # Shrug patterns
    if "shrug" in name:
        return "Traps"
    
    # Thrust/Bridge patterns
    if "thrust" in name or "bridge" in name:
        return "Glutes"
    
    # Calf patterns
    if "calf" in name or "toe" in name:
        return "Calves"
    
    # Abs patterns
    if any(x in name for x in ["crunch", "sit-up", "ab ", "plank", "leg raise"]):
        return "Abs"
    
    # Glute patterns
    if "glute" in name or "abduction" in name or "kickback" in name:
        return "Glutes"
    
    # Default fallback
    return "Other"


def get_secondary_muscles(exercise_name: str) -> list[str]:
    """
    Get secondary muscle groups activated by an exercise.
    Useful for understanding compound movement effects.
    """
    name = exercise_name.lower().strip()
    
    for exercise, muscles in SECONDARY_MUSCLES.items():
        if exercise in name:
            return muscles
    
    return []


def categorize_workout(exercises: list[str]) -> dict[str, int]:
    """
    Categorize a list of exercises and return counts by muscle group.
    Useful for analyzing workout balance.
    """
    categorized = {}
    
    for exercise in exercises:
        group = get_muscle_group(exercise)
        categorized[group] = categorized.get(group, 0) + 1
    
    return categorized


# Example usage
if __name__ == "__main__":
    # Test basic functionality
    test_exercises = [
        "barbell bench press",
        "bent over row",
        "leg press",
        "bicep curl",
        "tricep rope pushdown",
        "lateral raise",
        "leg curl",
        "hip thrust",
        "ab wheel",
        "calf raise",
        "weird exercise 123"
    ]
    
    print("Exercise Classification:")
    for exercise in test_exercises:
        group = get_muscle_group(exercise)
        secondary = get_secondary_muscles(exercise)
        print(f"  {exercise:30} -> {group:15} (Secondary: {', '.join(secondary) or 'None'})")
    
    print("\nWorkout Composition:")
    composition = categorize_workout(test_exercises)
    for group, count in sorted(composition.items(), key=lambda x: x[1], reverse=True):
        print(f"  {group:15}: {count} exercise(s)")
