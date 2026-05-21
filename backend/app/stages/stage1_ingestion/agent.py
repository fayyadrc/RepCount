import os
import httpx
from datetime import date, timedelta
from dotenv import load_dotenv
from .schemas import ParsedWorkoutLog

# Load environment variables
load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

class IngestionAgent:
    @staticmethod
    def parse_raw_workout(raw_text: str) -> ParsedWorkoutLog:
        """
        Takes raw string and uses Groq/OpenRouter to parse them into structured JSON
        """
        current_today = date.today().isoformat()
        current_yesterday = (date.today() - timedelta(days=1)).isoformat()
        system_prompt = f"""
        You are a fitness workout data extraction agent.
        Your task is to convert raw, unstructured workout logs into structured data.

        ## CORE RULES
        1. Extract ALL exercises and their sets.
        2. Each set must be a separate record/row.
        3. Preserve the order of exercises and sets as written.

        ## FIELD EXTRACTION RULES
        ### Exercise Name
        - Normalize exercise names (e.g., "reverse cable rear delt flies" -> "Reverse Cable Rear Delt Fly")

        ### Weight
        - Extract numeric weight value.
        - If weight is explicitly given in "plates" (e.g., "8 plates"), set the weight to that number (e.g., 8) and set unit to "Plate". DO NOT calculate kg.
        - If a numeric weight is provided without an explicit unit:
            - If the weight is <= 10, assume the unit is "Plate".
            - If the weight is > 10, assume the unit is "kg".
        - If no weight mentioned, set weight = null.

        ### Reps
        - Extract number of repetitions (must be an integer).

        ### Effort / Intensity
        - "rir X" -> rir = X
        - "failure" -> failure = true

        ### Date Handling
        - Normalize to ISO format: YYYY-MM-DD.
        - The user will mention dates relative to today.
        - Today's date is: {current_today}
        - Yesterday's date is: {current_yesterday}
        - Use today's date if no date is specified.

        Return structured JSON ONLY in this format:
        {{
            "entries": [
                {{
                    "date": "YYYY-MM-DD",
                    "exercise_name": "...",
                    "weight": number or null,
                    "unit": "kg",
                    "reps": number,
                    "failure": boolean,
                    "rir": number or null,
                    "notes": "..."
                }}
            ]
        }}
        """

        user_prompt = f"Parse this workout log:\n{raw_text}"

        # 1. Try Groq
        if GROQ_API_KEY:
            try:
                print("Attempting to parse with Groq...")
                response = IngestionAgent._call_groq(system_prompt, user_prompt)
                return ParsedWorkoutLog.model_validate_json(response)
            except Exception as e:
                print(f"Groq parsing failed: {e}")

        # 2. Try OpenRouter Fallback
        if OPENROUTER_API_KEY:
            try:
                print("Attempting to parse with OpenRouter...")
                response = IngestionAgent._call_openrouter(system_prompt, user_prompt)
                return ParsedWorkoutLog.model_validate_json(response)
            except Exception as e:
                print(f"OpenRouter parsing failed: {e}")

        raise Exception("Failed to parse workout using available LLM providers.")

    @staticmethod
    def _call_groq(system_prompt: str, user_prompt: str) -> str:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        with httpx.Client() as client:
            resp = client.post(url, headers=headers, json=data, timeout=30.0)
            resp.raise_for_status()
            result = resp.json()
            return result["choices"][0]["message"]["content"]

    @staticmethod
    def _call_openrouter(system_prompt: str, user_prompt: str) -> str:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/fayyadrc/GymTrackerAI", # Required by OpenRouter
            "X-Title": "GymTrackerAI"
        }
        data = {
            "model": "meta-llama/llama-3.3-70b-instruct",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.1
        }
        with httpx.Client() as client:
            resp = client.post(url, headers=headers, json=data, timeout=30.0)
            resp.raise_for_status()
            result = resp.json()
            content = result["choices"][0]["message"]["content"]
            
            # Clean up potential markdown blocks from OpenRouter if it doesn't support json_mode perfectly
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            return content
