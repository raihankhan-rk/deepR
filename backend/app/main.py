from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
from datetime import datetime

# Import routers
from app.routers import research, auth, users

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="DeepR - Deep Research Platform",
    description="A platform for conducting deep research and generating comprehensive reports",
    version="0.1.0"
)

# Configure CORS - allow all origins during debugging
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=False,  # Set to False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(research.router, prefix="/api/research", tags=["research"])

@app.get("/")
async def root():
    print("Root endpoint was called!")
    return {"message": "Welcome to DeepR API"}

@app.get("/health")
async def health_check():
    print("Health check endpoint was called!")
    return {"status": "healthy"}

@app.get("/api/test")
async def test_endpoint():
    """Test endpoint that doesn't require authentication"""
    print("Test endpoint was called!")
    return {
        "message": "Test endpoint successful", 
        "success": True,
        "timestamp": str(datetime.now())
    } 