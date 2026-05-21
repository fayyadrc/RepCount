from pydantic import BaseModel
from typing import List, Optional

class RawLogRequest(BaseModel):
    raw_text: str

class ParsedWorkoutEntry(BaseModel):
    id: Optional[str] = None
    date: str
    exercise_name: str
    weight: Optional[float] = None
    unit: str = "kg"
    reps: int
    failure: bool = False
    rir: Optional[int] = None
    notes: Optional[str] = None

class ParsedWorkoutLog(BaseModel):
    entries: List[ParsedWorkoutEntry]
