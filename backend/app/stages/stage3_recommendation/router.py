from fastapi import APIRouter

router = APIRouter()

@router.get("/recommendations")
def get_coaching_insights():
    # Placeholder for Recommendation Agent output
    return {"message": "Stage 3 Recommendation API is currently in setup."}
