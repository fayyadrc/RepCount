# A comprehensive mapping of exercises to muscle groups.
# Used as the source of truth until the database explicitly stores muscle groups.
# Continuously expanded based on real gym data and exercise science.

from typing import Optional, Dict, Any, List
from difflib import SequenceMatcher

# The detailed breakdown of specific muscles (Sub Groups)
SUB_MUSCLE_GROUPS = {
    "Chest": [
        "bench press", "barbell bench press", "flat bench press", "incline bench press", 
        "incline barbell bench press", "decline bench press", "decline barbell bench press", 
        "close grip bench press", "reverse grip bench press", "dumbbell bench press", 
        "dumbbell chest press", "dumbell bench", "incline dumbbell press", "decline dumbbell press",
        "dumbbell fly", "dumbell fly", "incline dumbbell fly", "decline dumbbell fly",
        "cable fly", "cable crossover", "machine fly", "pec deck", "chest fly", 
        "machine chest press", "smith machine bench", "pushup", "push up", "dips", 
        "chest dips", "weighted dips", "resistance band chest fly", "plate loaded chest press",
        "landmine press", "guillotine press", "blast strap fly"
    ],
    "Back": [
        "pullup", "pull up", "pull-up", "weighted pullup", "assisted pullup", "chinup", 
        "chin up", "chin-up", "weighted chinup", "barbell row", "bent over row", "bent-over row",
        "t-bar row", "t bar row", "landmine row", "seated row", "seated cable row", "machine row",
        "dumbbell row", "single arm row", "one arm dumbbell row", "chest supported row", 
        "incline row", "inverted row", "ring row", "cable row", "seal row", "lat pulldown", 
        "wide grip lat pulldown", "close grip lat pulldown", "reverse grip lat pulldown", 
        "v-bar lat pulldown", "deadlift", "conventional deadlift", "sumo deadlift", 
        "trap bar deadlift", "hex bar deadlift", "back extension", "machine back extension", 
        "45 degree back extension", "hyperextension", "reverse hyperextension", "face pull", 
        "rope face pull", "cable face pull", "lat pullover", "machine pullover", 
        "resistance band pulldown", "assisted back extension", "yates row", "pendulum row", 
        "machine assisted pullup", "resistance band row", "doorway row"
    ],
    "Quads": [
        "squat", "barbell squat", "back squat", "front squat", "goblet squat", "dumbbell squat",
        "hack squat", "smith machine squat", "belt squat", "leg press", "machine leg press", 
        "V-squat", "pendulum squat", "leg extension", "machine leg extension", "quad extension",
        "sissy squat", "split squat", "bulgarian split squat", "step up", "weighted step up", 
        "step ups", "lunges", "dumbbell lunges", "barbell lunges", "walking lunges", 
        "reverse lunges", "curtsy lunge", "lateral lunges", "side lunges", "quad machine", 
        "angled leg press", "pistol squat", "jump squat", "resistance band squat", "box squat", 
        "landmine squat", "tempo squat", "pin squat"
    ],
    "Hamstrings": [
        "leg curl", "lying leg curl", "seated leg curl", "machine leg curl", "standing leg curl", 
        "nordic hamstring curl", "romanian deadlift", "rdl", "stiff leg deadlift", "deficit deadlift", 
        "rack pull", "trap bar deadlift", "good morning", "machine good morning", "glute-ham raise", 
        "glute ham developer", "ghd", "hamstring curl", "resistance band curl", 
        "eccentric hamstring curl", "natural glute-ham raise"
    ],
    "Shoulders": [
        "shoulder press", "overhead press", "standing overhead press", "military press", 
        "barbell shoulder press", "dumbbell shoulder press", "dumbbell press", 
        "seated shoulder press", "machine shoulder press", "arnold press", "rotational arnold press",
        "landmine press", "half-kneeling press", "lateral raise", "side lateral raise", 
        "dumbbell lateral raise", "cable lateral raise", "machine lateral raise", "plate lateral raise", 
        "banded lateral raise", "front raise", "dumbbell front raise", "barbell front raise", 
        "cable front raise", "plate front raise", "rear delt fly", "rear delt machine", 
        "reverse pec deck", "reverse fly", "band pull apart", "bent over dumbbell raise", 
        "machine reverse fly", "upright row", "barbell upright row", "dumbbell upright row", 
        "cable upright row", "shrugs", "plate loaded shoulder press", "lever shoulder press", 
        "pike pushup", "handstand push up", "dips (shoulders)", "band shoulder press"
    ],
    "Biceps": [
        "bicep curl", "barbell curl", "ez bar curl", "straight bar curl", "olympic bar curl", 
        "reverse curl", "preacher curl", "dumbbell curl", "dumbbell bicep curl", "incline dumbbell curl",
        "seated dumbbell curl", "hammer curl", "alternating curl", "cable curl", "cable bicep curl", 
        "rope curl", "v-bar curl", "straight bar cable curl", "machine bicep curl", "leverage curl", 
        "hammer strength curl", "concentration curl", "spider curl", "21s", "incline curl", 
        "seated incline curl", "decline curl", "cross body hammer curl", "barbell drag curl", 
        "machine assisted curl", "resistance band curl", "landmine curl", "banded bicep curl", 
        "ez-bar preacher curl", "scott curl"
    ],
    "Triceps": [
        "tricep extension", "overhead tricep extension", "dumbbell tricep extension", 
        "seated tricep extension", "standing tricep extension", "cable extension", "rope extension", 
        "v-bar extension", "lat pulldown tricep", "close grip pulldown", "skullcrusher", "skull crusher", 
        "barbell skullcrusher", "dumbbell skullcrusher", "ez bar skull crusher", 
        "hammer strength skull crusher", "dips", "tricep dips", "bench dips", "assisted dips", 
        "weighted dips", "machine dips", "lever dips", "close grip bench press", 
        "close grip barbell press", "close grip dumbbell press", "tricep pushdown", 
        "tricep rope pushdown", "tricep bar pushdown", "reverse grip pushdown", "v-bar pushdown",
        "machine tricep pushdown", "overhead rope extension", "single arm extension", "kickback", 
        "dumbbell kickback", "cable kickback", "jm press", "board press", "narrow push up", 
        "decline bench dips", "resistance band extension", "machine assisted tricep dip"
    ],
    "Abs": [
        "crunch", "machine crunch", "cable crunch", "rope crunch", "weighted crunch", 
        "ab wheel crunch", "decline crunch", "leg raise", "hanging leg raise", "machine leg raise", 
        "lying leg raise", "seated leg raise", "straight leg raise", "bent knee leg raise", 
        "decline leg raise", "plank", "forearm plank", "side plank", "weighted plank", "plank hold", 
        "ab plank", "ab wheel", "ab wheel rollout", "machine ab wheel", "russian twist", 
        "weighted russian twist", "cable wood chop", "landmine rotation", "suitcase carry", 
        "ab machine", "machine ab crunch", "hanging ab crunch", "decline sit-up", "sit-up", 
        "weighted sit-up", "cable woodchop", "pallof press", "anti-rotation", "dead bug", 
        "bird dog", "mountain climber"
    ],
    "Calves": [
        "calf raise", "standing calf raise", "barbell calf raise", "dumbbell calf raise", 
        "smith machine calf raise", "machine calf raise", "leg press calf raise", "plate calf raise",
        "seated calf raise", "seated machine calf raise", "jump calf raise", "jump rope", "box jump",
        "donkey calf raise", "lever calf raise", "hack squat calf raise", "single leg calf raise", 
        "weighted step up (calves)", "toes up stretch"
    ],
    "Glutes": [
        "hip thrust", "barbell hip thrust", "dumbbell hip thrust", "bench hip thrust", 
        "smith machine hip thrust", "single leg hip thrust", "weighted hip thrust", "glute bridge", 
        "barbell glute bridge", "single leg glute bridge", "banded glute bridge", "abduction", 
        "machine abduction", "hip abduction", "cable abduction", "resistance band abduction", 
        "side-lying abduction", "glute kickback", "cable kickback", "machine kickback", 
        "resistance band kickback", "donkey kick", "bulgarian split squat", "walking lunges", 
        "curtsy lunge", "deficit squat", "pause squat", "pendulum squat", "belt squat", 
        "hack squat", "leg press (glute focused)", "v-squat", "step-up", "weighted step-up"
    ],
    "Forearms": [
        "wrist curl", "barbell wrist curl", "dumbbell wrist curl", "cable wrist curl", 
        "preacher wrist curl", "reverse wrist curl", "barbell reverse curl", "farmer carry", 
        "farmer's carry", "suitcase carry", "plate pinch", "thick bar curl", "hex dumbbell curl",
        "wrist pronation", "wrist supination", "wrist roller", "leverage rotation", "towel row", 
        "behind the back wrist curl", "incline dumbbell curl (forearm)", "radial/ulnar deviation"
    ],
    "Traps": [
        "shrug", "barbell shrug", "dumbbell shrug", "machine shrug", "smith machine shrug", 
        "cable shrug", "trap bar shrug", "leverage shrug", "upright row", "barbell upright row", 
        "dumbbell upright row", "cable upright row", "wide grip upright row", "bent over row (traps)", 
        "face pull", "high row", "snatch grip deadlift", "rack pull (high)", "shrug pull", 
        "trap bar deadlift (high)"
    ],
    "Obliques": [
        "side bend", "dumbbell side bend", "cable side bend", "landmine side bend", "cable woodchop", 
        "landmine rotation", "pallof press", "russian twist", "weighted russian twist", 
        "machine oblique", "cable rotation", "machine rotation", "suitcase carry", 
        "anti-rotation press", "hanging knee raise (oblique)", "suitcase deadlift"
    ]
}

# The parent mapping grouping sub-muscles into high-level categories
MAIN_GROUP_MAPPING = {
    "Chest": "Chest",
    "Back": "Back",
    "Traps": "Back",
    "Shoulders": "Shoulders",
    "Biceps": "Arms",
    "Triceps": "Arms",
    "Forearms": "Arms",
    "Quads": "Legs",
    "Hamstrings": "Legs",
    "Glutes": "Legs",
    "Calves": "Legs",
    "Abs": "Core",
    "Obliques": "Core",
    "Other": "Other"
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

def get_muscle_info(exercise_name: str, strict: bool = False) -> Dict[str, str]:
    """
    Determine the main and sub muscle group for an exercise.
    
    Returns:
        Dict with keys: 'main_group' and 'sub_group'
    """
    if not exercise_name:
        return {"main_group": "Other", "sub_group": "Other"}
    
    name = exercise_name.lower().strip()
    sub_group = "Other"
    
    # 1. First Pass: Exact matching
    for group, exercises in SUB_MUSCLE_GROUPS.items():
        if name in exercises:
            sub_group = group
            break
            
    # 2. Second Pass: Substring matching
    if sub_group == "Other":
        all_phrases = []
        for group, exercises in SUB_MUSCLE_GROUPS.items():
            for ex in exercises:
                all_phrases.append((ex, group))
                
        all_phrases.sort(key=lambda item: len(item[0]), reverse=True)
        for ex, group in all_phrases:
            if ex in name:
                sub_group = group
                break
                
    # 3. Third Pass: Fuzzy & Heuristics
    if sub_group == "Other" and not strict:
        best_match = _fuzzy_match_exercise(name)
        if best_match:
            sub_group = best_match
        else:
            sub_group = _apply_heuristics(name)

    # Resolve Main Group
    main_group = MAIN_GROUP_MAPPING.get(sub_group, "Other")
    
    return {
        "main_group": main_group,
        "sub_group": sub_group
    }


def _fuzzy_match_exercise(exercise_name: str, threshold: float = 0.65) -> Optional[str]:
    best_group = None
    best_ratio = threshold
    for group, exercises in SUB_MUSCLE_GROUPS.items():
        for exercise in exercises:
            ratio = SequenceMatcher(None, exercise_name, exercise).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_group = group
    return best_group

def _apply_heuristics(name: str) -> str:
    if any(x in name for x in ["chest", "pec", "bench"]):
        if "fly" in name: return "Chest"
        elif "press" in name and "close" not in name and "tricep" not in name: return "Chest"
    if any(x in name for x in ["back", "row", "lat", "pull", "chin"]): return "Back"
    if any(x in name for x in ["squat", "leg", "lunge", "press", "extension"]):
        if "leg" in name or "squat" in name:
            if "curl" in name or "ham" in name: return "Hamstrings"
            elif "extension" in name: return "Quads"
            else: return "Quads"
    if "curl" in name:
        if "tricep" in name or "skull" in name: return "Triceps"
        elif "leg" in name or "ham" in name or "nordic" in name: return "Hamstrings"
        else: return "Biceps"
    if "press" in name:
        if "shoulder" in name or "overhead" in name or "military" in name: return "Shoulders"
        elif "tricep" in name or "skull" in name or "bench" in name: return "Chest"
    if "dip" in name:
        if "tricep" in name or "bench" in name: return "Triceps"
        else: return "Chest"
    if "raise" in name: return "Shoulders"
    if "shrug" in name: return "Traps"
    if "thrust" in name or "bridge" in name: return "Glutes"
    if "calf" in name or "toe" in name: return "Calves"
    if any(x in name for x in ["crunch", "sit-up", "ab ", "plank", "leg raise"]): return "Abs"
    if "glute" in name or "abduction" in name or "kickback" in name: return "Glutes"
    
    return "Other"

def get_secondary_muscles(exercise_name: str) -> list[str]:
    name = exercise_name.lower().strip()
    for exercise, muscles in SECONDARY_MUSCLES.items():
        if exercise in name:
            return muscles
    return []

def categorize_workout(exercises: list[str]) -> dict[str, dict[str, int]]:
    """
    Categorize a list of exercises and return counts by main and sub muscle group.
    Returns: { "Legs": {"total": 3, "Quads": 2, "Calves": 1}, ... }
    """
    categorized = {}
    
    for exercise in exercises:
        info = get_muscle_info(exercise)
        main = info["main_group"]
        sub = info["sub_group"]
        
        if main not in categorized:
            categorized[main] = {"total": 0}
            
        categorized[main]["total"] += 1
        categorized[main][sub] = categorized[main].get(sub, 0) + 1
    
    return categorized

# Example usage
if __name__ == "__main__":
    test_exercises = [
        "barbell bench press",
        "leg press",
        "bicep curl",
        "calf raise",
        "squat",
        "romanian deadlift"
    ]
    
    print("Exercise Classification:")
    for exercise in test_exercises:
        info = get_muscle_info(exercise)
        secondary = get_secondary_muscles(exercise)
        print(f"  {exercise:25} -> Main: {info['main_group']:10} | Sub: {info['sub_group']:15} | (Sec: {', '.join(secondary) or 'None'})")
