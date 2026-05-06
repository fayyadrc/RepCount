import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from openai import OpenAI
from ...db.supabase import supabase
from ...core.config import settings

class AIService:
    @staticmethod
    def generate_insights() -> List[Dict[str, Any]]:
        if not settings.OPENROUTER_API_KEY:
            return [{"type": "Error", "icon": "AlertTriangle", "color": "red", "text": "AI configuration missing."}]

        # 1. Fetch recent data (last 30 days to limit tokens)
        thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
        
        try:
            gym_response = supabase.table("gym_logs").select("*").gte("date", thirty_days_ago.split("T")[0]).execute()
            gym_data = gym_response.data or []
        except Exception:
            gym_data = []

        try:
            strava_response = supabase.table("strava_activities").select("*").gte("start_date", thirty_days_ago).execute()
            strava_data = strava_response.data or []
        except Exception:
            strava_data = []

        # 2. Prepare context for the LLM
        # We'll map down the data to just what's necessary to save tokens
        gym_summary = [
            {"date": log.get("date"), "exercise": log.get("exercise_name") or log.get("exercise"), "weight": log.get("weight"), "reps": log.get("reps")}
            for log in gym_data
        ]
        
        strava_summary = [
            {"date": act.get("start_date", "").split("T")[0], "type": act.get("type"), "distance": act.get("distance"), "moving_time": act.get("moving_time")}
            for act in strava_data
        ]

        context = f"""
        Recent Gym Logs:
        {json.dumps(gym_summary)}
        
        Recent Strava Activities:
        {json.dumps(strava_summary)}
        """

        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
        )

        system_prompt = """
        You are an elite fitness AI coach. Analyze the user's recent gym and strava data.
        Provide exactly 3 insights in strict JSON array format. Do not use markdown blocks, just return the raw JSON.
        
        Insight Types:
        1. "Recovery Status" (Icon: "Zap", color: "yellow")
        2. "Progressive Overload" (Icon: "Brain", color: "black")
        3. "Muscle Imbalance" (Icon: "AlertTriangle", color: "red")
        
        JSON schema:
        [
          {
            "type": "Insight Type",
            "icon": "Zap|Brain|AlertTriangle",
            "color": "yellow|black|red",
            "text": "Your actionable insight text here (keep it under 3 sentences)."
          }
        ]
        """

        try:
            response = client.chat.completions.create(
                model="meta-llama/llama-3.1-8b-instruct:free", # Using a fast, free openrouter model, or can use anything
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analyze this data and return the JSON array:\n{context}"}
                ],
                response_format={"type": "json_object"} # Not all openrouter models support json_object, but Llama might, or we just rely on prompt.
            )
            
            content = response.choices[0].message.content
            
            # Clean up potential markdown formatting if the model ignored instructions
            content = content.replace("```json", "").replace("```", "").strip()
            
            insights = json.loads(content)
            
            # Ensure we wrap it in a dict if model returns an object with a list inside
            if isinstance(insights, dict) and "insights" in insights:
                insights = insights["insights"]
            elif isinstance(insights, dict):
                 # just grab the first list value
                 for v in insights.values():
                     if isinstance(v, list):
                         insights = v
                         break

            if not isinstance(insights, list):
                raise ValueError("Model did not return a list")
                
            return insights

        except Exception as e:
            print(f"Error generating insights: {e}")
            return [
                {
                    "type": "Recovery Status",
                    "icon": "Zap",
                    "color": "yellow",
                    "text": "High cardiovascular strain detected from recent runs. Consider an active recovery day."
                },
                {
                    "type": "Progressive Overload",
                    "icon": "Brain",
                    "color": "black",
                    "text": "You've hit consistent weights lately. Try aiming for a slight increase next session."
                },
                {
                    "type": "Muscle Imbalance",
                    "icon": "AlertTriangle",
                    "color": "red",
                    "text": "Ensure your pulling volume matches your pushing volume to prevent posture issues."
                }
            ]
