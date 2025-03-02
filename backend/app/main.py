from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv

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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(research.router, prefix="/api/research", tags=["Research"])

@app.get("/")
async def root():
    return {"message": "Welcome to DeepR API - Your deep research companion"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 