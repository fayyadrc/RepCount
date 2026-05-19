import sys
import json
from app.modules.history.service import HistoryService
from app.modules.history.schemas import ParsedWorkoutLog

raw_text = """
18th May
Incline DB Press
- 35kgs for 5( 17.5 each hand)
- 50kgs for 5 (25 each hand)
Pec Dec
- 7 plates for 8 reps
- 8 plates for 8 reps
Smith Machine Press
- 30kgs for 7
- 40kgs for 8
14th May
Lat Pulldown
- 65kgs for 10
- 80 for 6
T bar Row wide
- 35kgs for 8
- 40 for 8
Preacher Curl
- 36kgs for 7
- 32 for 5
"""

try:
    parsed_data = HistoryService.parse_raw_workout(raw_text)
    print(parsed_data.model_dump_json(indent=2))
except Exception as e:
    print(f"Error: {e}")
