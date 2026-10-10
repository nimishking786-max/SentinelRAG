from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import base64
from pydantic import BaseModel
from typing import Optional, List
import uuid
from app.auth.auth import create_access_token, get_password_hash, verify_password, get_current_user, TokenData
from app.database.supabase import supabase_client

router = APIRouter()

DEMO_PROFILES = [
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "email": "admin@sentinel.com",
        "full_name": "Alex Vance (Chief Security Officer)",
        "role": "ADMIN",
        "department": "ADMIN",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "email": "finance@sentinel.com",
        "full_name": "Marcus Chen (VP of Finance)",
        "role": "FINANCE_MANAGER",
        "department": "FINANCE",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
    {
        "id": "33333333-3333-3333-3333-333333333333",
        "email": "hr@sentinel.com",
        "full_name": "Sarah Jenkins (Head of HR)",
        "role": "HR_MANAGER",
        "department": "HR",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    },
    {
        "id": "44444444-4444-4444-4444-444444444444",
        "email": "employee@sentinel.com",
        "full_name": "Rahul Sharma (Software Engineer)",
        "role": "EMPLOYEE",
        "department": "GENERAL",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    },
]

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    department: str = "GENERAL"

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

def public_user(user: dict, token: str) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "department": user["department"],
        "avatar_url": user.get("avatar_url", ""),
        "access_token": token,
    }

@router.get("/demo-users")
async def list_demo_users():
    """Returns pre-configured enterprise personas with ready-to-use access tokens."""
    response = supabase_client.table("profiles").select("*").execute()
    users = response.data or []
    if not users:
        try:
            seeded = supabase_client.table("profiles").insert(DEMO_PROFILES).execute()
            users = seeded.data or DEMO_PROFILES
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Demo profiles could not be initialized in the database: {exc}",
            )
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
    response = supabase_client.table("profiles").select("*").eq("email", req.email.strip().lower()).execute()
    users = response.data
    
    if not users:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    user = users[0]
    password_hash = user.get("password_hash")
    default_password = "Sentinel@123"
    if password_hash:
        valid_password = verify_password(req.password, password_hash)
    else:
        valid_password = req.password == default_password and any(
            profile["id"] == str(user["id"]) for profile in DEMO_PROFILES
        )
    if not valid_password:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
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
            "department": user["department"],
            "avatar_url": user.get("avatar_url", ""),
            "must_change_password": bool(user.get("must_change_password", False))
        }
    }

@router.post("/register", response_model=LoginResponse)
async def register(req: RegisterRequest):
    email = req.email.strip().lower()
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Enter a valid email address")
    if not req.full_name.strip():
        raise HTTPException(status_code=400, detail="Full name is required")
    if req.department not in {"GENERAL", "HR", "FINANCE", "SALES", "RESEARCH", "ADMIN"}:
        raise HTTPException(status_code=400, detail="Invalid department")

    existing = supabase_client.table("profiles").select("id").eq("email", email).execute().data or []
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "full_name": req.full_name.strip(),
        "password_hash": get_password_hash(req.password),
        "role": "EMPLOYEE",
        "department": req.department,
    }
    try:
        inserted = supabase_client.table("profiles").insert(user).execute().data or []
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Registration failed: {exc}")
    if not inserted:
        raise HTTPException(status_code=500, detail="Registration did not create a profile")

    created_user = inserted[0]
    token = create_access_token(data={
        "sub": created_user["id"],
        "role": created_user["role"],
        "department": created_user["department"],
    })
    return {"access_token": token, "token_type": "bearer", "user": public_user(created_user, token)}

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(req: PasswordChangeRequest, current_user: TokenData = Depends(get_current_user)):
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    profile = supabase_client.table("profiles").select("*").eq("id", current_user.user_id).execute().data or []
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    user = profile[0]
    if user.get("password_hash"):
        if not verify_password(req.current_password, user["password_hash"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
    elif req.current_password != "Sentinel@123":
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    updated = supabase_client.table("profiles").update({
        "password_hash": get_password_hash(req.new_password),
        "must_change_password": False,
    }).eq("id", current_user.user_id).execute().data or []
    if not updated:
        raise HTTPException(status_code=500, detail="Password could not be updated")
    return {"status": "success"}

@router.post("/profile/avatar")
async def update_avatar(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(get_current_user),
):
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, WEBP, or GIF image")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="The selected image is empty")
    if len(file_bytes) > 2 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Profile images must be 2 MB or smaller")

    avatar_url = f"data:{file.content_type};base64,{base64.b64encode(file_bytes).decode('ascii')}"
    updated = supabase_client.table("profiles").update({
        "avatar_url": avatar_url,
    }).eq("id", current_user.user_id).execute().data or []
    if not updated:
        raise HTTPException(status_code=404, detail="User profile could not be updated")

    return {"avatar_url": avatar_url}

@router.get("/me")
async def get_me(current_user: TokenData = Depends(get_current_user)):
    response = supabase_client.table("profiles").select("*").eq("id", current_user.user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    return response.data[0]

@router.get("/roles")
async def list_available_roles(current_user: TokenData = Depends(get_current_user)):
    response = supabase_client.table("roles").select("name,description").execute()
    return response.data or []
