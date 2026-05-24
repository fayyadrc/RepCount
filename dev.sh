#!/bin/bash

# Function to clean up background processes on exit
cleanup() {
  echo ""
  echo "🛑 Stopping GymTracker AI services..."
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  exit 0
}

# Trap SIGINT (Ctrl+C), SIGTERM, and EXIT
trap cleanup SIGINT SIGTERM EXIT

echo "🚀 Starting GymTracker AI..."

# 1. Start the FastAPI backend
echo "🐍 Starting FastAPI backend server..."
if [ -d ".venv" ]; then
  .venv/bin/uvicorn backend.app.main:app --port 8002 &
  BACKEND_PID=$!
else
  echo "❌ Error: Virtual environment .venv not found in root directory."
  echo "Please run: python -m venv .venv && .venv/bin/pip install -r requirements.txt"
  exit 1
fi

# Give backend a moment to boot up
sleep 1.5

# 2. Start the Vite frontend
echo "⚡ Starting Vite frontend dev server..."
if [ -d "frontend" ]; then
  cd frontend
  npm run dev
  cd ..
else
  echo "❌ Error: frontend directory not found."
  exit 1
fi
