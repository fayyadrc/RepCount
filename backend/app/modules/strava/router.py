from fastapi import APIRouter, HTTPException, BackgroundTasks
from .service import sync_strava_data

router = APIRouter()

@router.post("/strava/sync")
async def trigger_strava_sync(background_tasks: BackgroundTasks):
    """
    Manually triggers a Strava data sync.
    Runs as a background task to avoid blocking the request.
    """
    try:
        # We run it in the background so the user doesn't have to wait for the whole sync
        background_tasks.add_task(sync_strava_data)
        return {"status": "success", "message": "Strava sync triggered in background"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
