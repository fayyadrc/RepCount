import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from app.api.routes import health, history, strava
from app.services.strava_service import sync_strava_data

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

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(history.router, prefix="/api", tags=["History"])
app.include_router(strava.router, prefix="/api", tags=["Strava"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
