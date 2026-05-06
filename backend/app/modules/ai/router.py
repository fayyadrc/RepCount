from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from .service import AIService

router = APIRouter(prefix="/ai", tags=["AI Insights"])

@router.get("/insights", response_model=List[Dict[str, Any]])
def get_ai_insights():
    """
    Generate AI insights based on recent gym and strava activity.
    """
    try:
        insights = AIService.generate_insights()
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
