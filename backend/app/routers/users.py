from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Local imports
from app.models.user import UserResponse
from app.routers.auth import get_current_user

# Load environment variables
load_dotenv()

# Initialize supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get the current user's profile"""
    print("Fetching user profile for:", current_user.get("email"))
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        username=current_user["username"],
        created_at=current_user["created_at"]
    )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: int, current_user: dict = Depends(get_current_user)):
    """Get a user by ID (requires authentication)"""
    response = supabase.table("users").select("*").eq("id", user_id).execute()
    user = response.data[0] if response.data else None
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        username=user["username"],
        created_at=user["created_at"]
    ) 