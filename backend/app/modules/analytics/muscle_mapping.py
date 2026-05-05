
# A comprehensive mapping of common exercises to muscle groups.
# This will be used until the database explicitly stores muscle groups.

MUSCLE_GROUPS = {
    "Chest": [
        "bench press", "chest press", "incline bench", "decline bench", "cable fly", 
        "dumbell fly", "pushup", "pec deck", "dips"
    ],
    "Back": [
        "pullup", "lat pulldown", "seated row", "bent over row", "t-bar row", 
        "deadlift", "back extension", "shrugs", "face pull", "one arm row"
    ],
    "Quads": [
        "squat", "leg press", "leg extension", "hack squat", "lunges", "split squat"
    ],
    "Hamstrings": [
        "leg curl", "rdl", "romanian deadlift", "stiff leg deadlift", "good morning"
    ],
    "Shoulders": [
        "shoulder press", "overhead press", "military press", "lateral raise", 
        "front raise", "rear delt fly", "arnold press", "upright row"
    ],
    "Biceps": [
        "bicep curl", "hammer curl", "preacher curl", "concentration curl", "spider curl"
    ],
    "Triceps": [
        "tricep extension", "skullcrusher", "tricep pushdown", "close grip bench", "overhead tricep"
    ],
    "Abs": [
        "crunch", "leg raise", "plank", "ab wheel", "hanging leg raise", "russian twist"
    ],
    "Calves": [
        "calf raise", "seated calf raise"
    ],
    "Glutes": [
        "hip thrust", "glute bridge", "abduction"
    ]
}

def get_muscle_group(exercise_name: str) -> str:
    if not exercise_name:
        return "Other"
    
    name = exercise_name.lower()
    
    # Try exact matches first
    for group, exercises in MUSCLE_GROUPS.items():
        if any(ex in name for ex in exercises):
            return group
            
    # Fallback/Fuzzy heuristics
    if "chest" in name or "pec" in name: return "Chest"
    if "back" in name or "row" in name or "lat" in name: return "Back"
    if "squat" in name or "leg" in name: return "Quads" # Common overlap
    if "curl" in name: return "Biceps"
    if "press" in name: return "Shoulders" # Generic press often shoulders if not specified
    
    return "Other"
