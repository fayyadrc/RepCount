import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from .modules.health.router import router as health_router
from .modules.history.router import router as history_router
from .modules.strava.router import router as strava_router
from .modules.strava.service import sync_strava_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("⏳ Starting background scheduler...")
    scheduler = BackgroundScheduler()
    # Run every 12 hours
    scheduler.add_job(sync_strava_data, 'interval', hours=12)
    scheduler.start()
    
    # Optionally trigger an immediate run on startup
    # sync_strava_data()
    
    yield
    
    print("🛑 Shutting down background scheduler...")
    scheduler.shutdown()

app = FastAPI(title="GymTracker API", lifespan=lifespan)

# Configure CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files from the frontend/dist directory
# Get the absolute path to the frontend/dist directory
# This assumes the file is in backend/app/main.py and we want to reach frontend/dist
current_dir = os.path.dirname(os.path.abspath(__file__))
# current_dir is backend/app/
root_dir = os.path.abspath(os.path.join(current_dir, "../../"))
frontend_dist_path = os.path.join(root_dir, "frontend", "dist")

print(f"📂 Serving frontend from: {frontend_dist_path}")
print(f"🏠 Root directory: {root_dir}")

# Include routers
app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(history_router, prefix="/api", tags=["History"])
app.include_router(strava_router, prefix="/api", tags=["Strava"])

# Serve frontend static assets
if os.path.exists(os.path.join(frontend_dist_path, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")

# Catch-all route to serve the frontend (SPA routing)
@app.get("/{rest_of_path:path}")
async def serve_frontend(rest_of_path: str):
    # If the path looks like an API call but wasn't caught by the routers above, return 404
    if rest_of_path.startswith("api/"):
        return {"detail": "Not Found"}, 404
    
    # Check if the built frontend exists
    index_path = os.path.join(frontend_dist_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    # Fallback message if frontend isn't built yet
    return {
        "message": "GymTracker AI API is running, but the frontend has not been built yet.",
        "health_check": "/api/health",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
