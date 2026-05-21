# Technical Blueprint: Multi-Agent Workout Processing Pipeline

This document defines the technical architecture, data flows, and code patterns for implementing the three-stage multi-agent pipeline in the newly refactored GymTracker AI backend.

---

## 1. Pipeline Overview & Flow

```
              [ User Input (Raw Text) ]
                         │
                         ▼
        ┌──────────────────────────────────┐
        │    Stage 1: Ingestion Agent      │
        │  - Groq (llama-3.3-70b-versatile)│
        │  - Fallback: OpenRouter          │
        └──────────────────────────────────┘
                         │
                         ▼
             [ Parsed Workout Entries ]
                         │
                         ▼
        ┌──────────────────────────────────┐
        │    Stage 2: Validation Agent     │
        │  - Checks physiological limits   │
        │  - Runs consistency checks       │
        └──────────────────────────────────┘
             /                        \
    (If Clean)                        (If Flagged)
       /                                    \
      ▼                                      ▼
┌──────────────┐                       ┌──────────────┐
│  gym_logs    │                       │  validation  │
│  (Supabase)  │                       │  _queue      │
└──────────────┘                       └──────────────┘
       │                                      │
       └──────────────────┬───────────────────┘
                          │ (Resolved/Fetched)
                          ▼
        ┌──────────────────────────────────┐
        │  Stage 3: Recommendation Agent   │
        │  - 4-Step reasoning engine       │
        │  - Generates advice & confidence │
        └──────────────────────────────────┘
                          │
                          ▼
            [ Recommendation Output ]
```

---

## 2. Stage 1: Ingestion Agent (`stages/stage1_ingestion/agent.py`)

Converts natural language user text into a structured Pydantic model (`ParsedWorkoutLog`).

### Data Output Schema (`schemas.py`)
```python
from pydantic import BaseModel, Field
from typing import List, Optional

class ParsedWorkoutEntry(BaseModel):
    date: str = Field(description="ISO Date YYYY-MM-DD")
    exercise_name: str = Field(description="Normalized exercise name")
    weight: Optional[float] = Field(None, description="Numeric weight")
    unit: str = Field("kg", description="'kg', 'lbs', or 'Plate'")
    reps: int = Field(description="Number of repetitions completed")
    failure: bool = Field(False, description="True if pushed to failure")
    rir: Optional[int] = Field(None, description="Reps in Reserve, if specified")
    notes: Optional[str] = Field(None, description="Additional context from text")

class ParsedWorkoutLog(BaseModel):
    entries: List[ParsedWorkoutEntry]
```

---

## 3. Stage 2: Validation Agent (`stages/stage2_validation/agent.py`)

Responsible for quality-checking the output of Stage 1. It classifies data into **Clean** (persisted directly) or **Flagged** (requires manual review).

### Validation Rules
1.  **Physiological Bounds**:
    *   `weight`: Check if weight is within sane human levels ($< 500\text{ kg}$ or $< 1100\text{ lbs}$).
    *   `reps`: Check if reps are within reasonable sets ($1 \le \text{reps} \le 100$).
2.  **Semantic Consistency**:
    *   Checks if the exercise name fuzzy-matches any known exercise (returning an outlier flag if it's entirely unrecognizable, e.g. *"ate a pizza"*).
3.  **Logical Flags**:
    *   If RIR is set and is negative or $> 10$.

### Database Schema for `validation_queue` (Supabase)
```sql
CREATE TABLE validation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    raw_input TEXT NOT NULL,
    parsed_entry JSONB NOT NULL,
    flag_reason TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    user_decision TEXT -- 'approve', 'edit', or 'discard'
);
```

### Validation Blueprint
```python
# stages/stage2_validation/agent.py
from typing import Tuple, List, Optional
from ..stage1_ingestion.schemas import ParsedWorkoutEntry
from ..stage4_analytics.muscle_mapping import get_muscle_group

class ValidationAgent:
    @staticmethod
    def validate_entry(entry: ParsedWorkoutEntry) -> Tuple[bool, Optional[str]]:
        """
        Validates a single parsed workout entry.
        Returns: (is_clean, failure_reason)
        """
        # 1. Check weight bounds
        if entry.weight is not None:
            if entry.weight < 0:
                return False, "Weight cannot be negative"
            if entry.unit in ["kg", "lbs"] and entry.weight > 600:
                return False, f"Physiological weight limit exceeded ({entry.weight} {entry.unit})"
        
        # 2. Check rep bounds
        if entry.reps <= 0:
            return False, "Repetitions must be greater than zero"
        if entry.reps > 100:
            return False, f"Anomalous high repetitions count: {entry.reps}"
            
        # 3. Check RIR bounds
        if entry.rir is not None:
            if entry.rir < 0 or entry.rir > 10:
                return False, f"Invalid Reps in Reserve (RIR) value: {entry.rir}"

        # 4. Check exercise recognizability
        muscle_group = get_muscle_group(entry.exercise_name, strict=True)
        if muscle_group == "Other":
            # Strict mapping fallback: Flag for developer/user review
            return False, f"Unrecognized exercise name: '{entry.exercise_name}'"

        return True, None
```

---

## 4. Stage 3: Recommendation Agent (`stages/stage3_recommendation/agent.py`)

A smart reasoning engine that executes **4 sequential steps** to output workout adjustments and safety feedback.

### The 4-Step Reasoning Engine

1.  **Step 1: Fetch History**
    *   Queries last 4 weeks of `gym_logs` and `strava_activities` from Supabase to construct a user timeline.
2.  **Step 2: Analyze Trends**
    *   Calculates volume trends per muscle group (e.g. *Chest volume increased 5% week-over-week*).
    *   Calculates cardio workload, consistency metrics, and average heart-rate bands.
3.  **Step 3: Detect Signals**
    *   **Imbalance Signal**: A muscle group has 0 volume over the last 14 days.
    *   **Plateau Signal**: Weight or reps on a core compound lift has stayed constant for 4 consecutive sessions.
    *   **Overtraining Signal**: Cardiovascular sleep metrics or high relative heart rates combined with decreasing gym volume.
4.  **Step 4: Generate, Explain & Audit**
    *   **Generate**: Create target lifts, reps, weights, and pacing for the next workout.
    *   **Explain**: Give scientific reasons (e.g. *"Increased bench press weight by 2.5kg because your last set had RIR 3"*).
    *   **Audit**: Verify recommendations against a safety profile (e.g. *never recommend a weight increase of $>15\%$ in a single week for safety*).

### Recommendation Agent Output Schema
```python
from pydantic import BaseModel, Field
from typing import List

class RecommendationAudit(BaseModel):
    is_safe: bool
    safety_flags: List[str]
    adjustment_applied: bool

class MuscleTargetAdvice(BaseModel):
    muscle: str
    action: str = Field(description="e.g., 'Increase Volume', 'Deload', 'Introduce Compound Movement'")
    justification: str

class ExerciseRecommendation(BaseModel):
    exercise_name: str
    target_sets: int
    target_reps: int
    target_weight: float
    unit: str
    reasoning: str

class CoachingResponse(BaseModel):
    coaching_summary: str
    recommendations: List[ExerciseRecommendation]
    muscle_focus: List[MuscleTargetAdvice]
    confidence_score: float = Field(description="Value from 0.0 to 1.0 based on history completeness")
    audit: RecommendationAudit
```

### Recommendation Agent Blueprint
```python
# stages/stage3_recommendation/agent.py
import httpx
import os
from typing import Dict, Any
from .schemas import CoachingResponse

class RecommendationAgent:
    @staticmethod
    def generate_recommendations(history_data: Dict[str, Any]) -> CoachingResponse:
        """
        Performs 4-step reasoning to output structured training recommendations.
        """
        # Step 1 & 2: Local analysis of history_data
        volume_trends = RecommendationAgent._calculate_volume_trends(history_data)
        signals = RecommendationAgent._detect_signals(history_data, volume_trends)
        
        # Step 3 & 4: LLM Generation, Explanation, and Safety Audit
        prompt = f"""
        You are a certified master strength coach. Review this user trend data:
        - Volume Trends: {volume_trends}
        - Detected Signals: {signals}
        
        Generate safe, structured workout adjustments with clear physiological reasoning.
        Apply a strict safety audit: never increase weights by more than 15% WoW.
        """
        
        # Call Groq/OpenRouter with schema validation
        response_json = RecommendationAgent._call_llm(prompt)
        
        # Cast to Pydantic and return
        return CoachingResponse.model_validate_json(response_json)

    @staticmethod
    def _calculate_volume_trends(history: Dict[str, Any]) -> Dict[str, Any]:
        # Implementation logic to calculate WoW progression
        return {}

    @staticmethod
    def _detect_signals(history: Dict[str, Any], trends: Dict[str, Any]) -> List[str]:
        signals = []
        # Check for plateaus, overtraining, or imbalances
        return signals

    @staticmethod
    def _call_llm(prompt: str) -> str:
        # standard HTTP POST request to Groq/OpenRouter
        return "{}"
```

---

## 5. Next Steps for Implementation

1.  **Table Setup**: Create the `validation_queue` table in Supabase.
2.  **Activate Stage 2**: Move validation logic from Stage 1 into the `stage2_validation/agent.py` and hook it into `stages/stage1_ingestion/router.py` to intercept raw entries.
3.  **Activate Stage 3**: Connect `stage3_recommendation` to LLM endpoints, passing historical summaries generated by Stage 4 (`stages/stage4_analytics/service.py`).
