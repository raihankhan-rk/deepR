from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import jwt as pyjwt
import requests
import httpx
import json

# Models
from app.models.user import UserCreate, UserResponse, Token, TokenData

# Load environment variables
load_dotenv()

# Initialize supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

router = APIRouter()

# Password hashing settings
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

# JWT settings
SECRET_KEY = os.environ.get("SECRET_KEY", "YOUR_SECRET_KEY_HERE")
ALGORITHM = os.environ.get("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def fetch_jwks(supabase_url: str) -> dict:
    """Fetch the JWKS from Supabase"""
    try:
        # Correct JWKS URL format
        jwks_url = f"{supabase_url}/rest/v1/rpc/jwks"
        
        # Include the anon key in the request headers
        headers = {
            'apikey': os.environ.get('SUPABASE_KEY', ''),
            'Authorization': f'Bearer {os.environ.get("SUPABASE_KEY", "")}'
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url, headers=headers)
            
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to fetch JWKS")
            
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Failed to fetch JWKS: {str(e)}")

async def validate_token(token: str = Depends(oauth2_scheme)) -> dict:
    """Validate the JWT token"""
    
    try:
        # Try to decode the token without verification first to get the claims
        unverified_payload = jwt.get_unverified_claims(token)
        
        # Check if this is a Supabase token
        if 'aud' in unverified_payload and unverified_payload['aud'] == 'authenticated':
            try:
                # Get the user's email from the token claims
                email = unverified_payload.get('email')
                if not email:
                    raise HTTPException(status_code=401, detail="No email in token")
                
                # Try to get existing user
                response = supabase.table("users").select("*").eq("email", email).execute()
                user = response.data[0] if response.data else None
                
                if not user:
                    # Create username from email
                    username = email.split('@')[0]
                    
                    # Create new user
                    new_user = {
                        "email": email,
                        "username": username,
                        "created_at": datetime.utcnow().isoformat()
                    }
                    response = supabase.table("users").insert(new_user).execute()
                    user = response.data[0]
                
                return user
                
            except Exception as e:
                raise HTTPException(
                    status_code=401,
                    detail=str(e)
                )
        else:
            # Fall back to regular JWT validation
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                username: str = payload.get("sub")
                if username is None:
                    raise HTTPException(
                        status_code=401,
                        detail="Could not validate credentials",
                    )
                
                response = supabase.table("users").select("*").eq("email", username).execute()
                user = response.data[0] if response.data else None
                
                if user is None:
                    raise HTTPException(
                        status_code=401,
                        detail="User not found",
                    )
                
                return user
            except Exception as e:
                raise HTTPException(
                    status_code=401,
                    detail="Could not validate credentials",
                )
            
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials",
        )

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get the current user from the token"""
    return await validate_token(token)

# Routes
@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    # Check if user already exists
    response = supabase.table("users").select("*").eq("email", user.email).execute()
    if response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password
    hashed_password = get_password_hash(user.password)
    
    # Create user in Supabase
    new_user = {
        "email": user.email,
        "username": user.username,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow().isoformat()
    }
    
    response = supabase.table("users").insert(new_user).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    created_user = response.data[0]
    return UserResponse(
        id=created_user["id"],
        email=created_user["email"],
        username=created_user["username"],
        created_at=created_user["created_at"]
    )

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # Get user from Supabase
    response = supabase.table("users").select("*").eq("email", form_data.username).execute()
    user = response.data[0] if response.data else None
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    } 