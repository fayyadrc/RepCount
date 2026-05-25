from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, Request, Response
from .service import sync_strava_data, fetch_and_save_single_activity, delete_activity_from_db

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

@router.get("/strava/webhook")
async def verify_strava_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    """
    Handles the validation request from Strava when registering the webhook subscription.
    """
    import os
    expected_token = os.environ.get("STRAVA_VERIFY_TOKEN", "GYM_TRACKER_STRAVA_SECRET")
    if hub_verify_token == expected_token:
        return {"hub.challenge": hub_challenge}
    
    return Response(status_code=403, content="Verification token mismatch")

@router.post("/strava/webhook")
async def receive_strava_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Receives real-time updates from Strava push subscriptions.
    Responds with HTTP 200 immediately (within 2 seconds) and triggers background processing.
    """
    try:
        payload = await request.json()
        print(f"📥 Received Strava Webhook: {payload}")
        
        object_type = payload.get("object_type")
        aspect_type = payload.get("aspect_type")
        object_id = payload.get("object_id")
        
        if object_type == "activity" and object_id:
            if aspect_type in ["create", "update"]:
                background_tasks.add_task(fetch_and_save_single_activity, int(object_id))
            elif aspect_type == "delete":
                background_tasks.add_task(delete_activity_from_db, int(object_id))
                
        # Must return 200 OK within 2 seconds
        return Response(status_code=200)
    except Exception as e:
        print(f"❌ Error processing Strava webhook event: {e}")
        return Response(status_code=200)  # Always return 200 to prevent Strava from disabling the webhook

