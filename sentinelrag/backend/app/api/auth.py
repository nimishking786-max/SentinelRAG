from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from app.auth.auth import create_access_token, get_password_hash, verify_password, get_current_user, TokenData
from app.database.supabase import supabase_client

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

@router.get("/demo-users")
async def list_demo_users():
    """Returns pre-configured enterprise personas with ready-to-use access tokens."""
    response = supabase_client.table("profiles").select("*").execute()
    users = response.data or []
    demo_profiles = []
    
    for u in users:
        token = create_access_token(
            data={"sub": u["id"], "role": u["role"], "department": u["department"]}
        )
        demo_profiles.append({
            "id": u["id"],
            "email": u["email"],
            "full_name": u["full_name"],
            "role": u["role"],
            "department": u["department"],
            "avatar_url": u.get("avatar_url", ""),
            "access_token": token
        })
    return demo_profiles

@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    response = supabase_client.table("profiles").select("*").eq("email", req.email).execute()
    users = response.data
    
    if not users:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    user = users[0]
    
    access_token = create_access_token(
        data={"sub": user["id"], "role": user["role"], "department": user["department"]}
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "department": user["department"]
        }
    }

@router.get("/me")
async def get_me(current_user: TokenData = Depends(get_current_user)):
    response = supabase_client.table("profiles").select("*").eq("id", current_user.user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    return response.data[0]
