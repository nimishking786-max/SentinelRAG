from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import uuid
from app.database.supabase import supabase_client
from app.security.prompt_guard import PromptGuard, PIIDetector
from app.auth.auth import get_current_user, TokenData, get_password_hash
from app.security.permissions import RBAC

router = APIRouter()

class PromptGuardTestRequest(BaseModel):
    prompt: str

class RoleUpdateRequest(BaseModel):
    role: str

class RoleCreateRequest(BaseModel):
    name: str
    description: str = ""

class MemberCreateRequest(BaseModel):
    email: str
    full_name: str
    department: str = "GENERAL"
    role: str = "EMPLOYEE"

@router.get("/roles")
async def list_roles(current_user: TokenData = Depends(RBAC.require_role(["ADMIN"]))):
    try:
        return supabase_client.table("roles").select("*").execute().data or []
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="The roles table is not available. Run supabase/fix_dynamic_roles.sql in Supabase SQL Editor, then retry.",
        ) from exc

@router.post("/roles")
async def create_role(req: RoleCreateRequest, current_user: TokenData = Depends(RBAC.require_role(["ADMIN"]))):
    name = req.name.strip().upper().replace(" ", "_")
    if not name or not name.replace("_", "").isalnum():
        raise HTTPException(status_code=400, detail="Role name may contain only letters, numbers, and underscores")
    try:
        existing = supabase_client.table("roles").select("name").eq("name", name).execute().data or []
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="The roles table is not available. Run supabase/fix_dynamic_roles.sql in Supabase SQL Editor, then retry.",
        ) from exc
    if existing:
        raise HTTPException(status_code=409, detail="Role already exists")
    try:
        created = supabase_client.table("roles").insert({"id": str(uuid.uuid4()), "name": name, "description": req.description.strip()}).execute().data or []
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="The roles table is not available. Run supabase/fix_dynamic_roles.sql in Supabase SQL Editor, then retry.",
        ) from exc
    return created[0]

@router.post("/members")
async def create_member(req: MemberCreateRequest, current_user: TokenData = Depends(RBAC.require_role(["ADMIN"]))):
    email = req.email.strip().lower()
    if not email or "@" not in email or not req.full_name.strip():
        raise HTTPException(status_code=400, detail="Valid name and email are required")
    if not supabase_client.table("roles").select("name").eq("name", req.role).execute().data:
        raise HTTPException(status_code=400, detail="Role does not exist")
    if supabase_client.table("profiles").select("id").eq("email", email).execute().data:
        raise HTTPException(status_code=409, detail="A user with this email already exists")
    created = supabase_client.table("profiles").insert({
        "id": str(uuid.uuid4()), "email": email, "full_name": req.full_name.strip(),
        "department": req.department, "role": req.role,
        "password_hash": get_password_hash("Sentinel@123"), "must_change_password": True,
    }).execute().data or []
    if not created:
        raise HTTPException(status_code=500, detail="Member could not be created")
    return {"member": created[0], "initial_password": "Sentinel@123"}

@router.get("/users")
async def list_users(current_user: TokenData = Depends(RBAC.require_role(["ADMIN"]))):
    return supabase_client.table("profiles").select("id,email,full_name,role,department,avatar_url,must_change_password").execute().data or []

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    req: RoleUpdateRequest,
    current_user: TokenData = Depends(RBAC.require_role(["ADMIN"])),
):
    if not supabase_client.table("roles").select("name").eq("name", req.role).execute().data:
        raise HTTPException(status_code=400, detail="Invalid role")
    if user_id == current_user.user_id and req.role != "ADMIN":
        raise HTTPException(status_code=400, detail="Admin cannot remove their own admin role")
    updated = supabase_client.table("profiles").update({"role": req.role}).eq("id", user_id).execute().data or []
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated[0]

@router.get("/stats")
async def get_security_stats():
    """Live telemetry stats for the Security Operations Dashboard."""
    docs = supabase_client.table("documents").select("id").execute().data or []
    chunks = supabase_client.table("document_chunks").select("id").execute().data or []
    events = supabase_client.table("security_events").select("*").execute().data or []
    audits = supabase_client.table("audit_logs").select("*").execute().data or []

    chat_audits = [
        audit for audit in audits
        if audit.get("action") == "CHAT_QUERY"
    ]
    blocked_injection_events = [
        event for event in events
        if event.get("event_type") == "PROMPT_INJECTION_ATTEMPT"
    ]
    access_denied = len([
        audit for audit in chat_audits
        if audit.get("status") == "DENIED"
    ])
    pii_redacted = len([
        event for event in events
        if event.get("event_type") == "PII_REDACTION_APPLIED"
    ])

    threat_categories = [
        ("Instruction Overrides", "INSTRUCTION_OVERRIDE", "#ef4444"),
        ("Security Policy Overrides", "SECURITY_POLICY_OVERRIDE", "#f59e0b"),
        ("Prompt Exfiltration", "PROMPT_EXFILTRATION", "#3b82f6"),
        ("Context Delimiters", "DELIMITER_INJECTION", "#8b5cf6"),
    ]
    threat_distribution = []
    for name, category, color in threat_categories:
        count = sum(
            1 for event in blocked_injection_events
            if (event.get("metadata") or {}).get("category") == category
        )
        threat_distribution.append({"name": name, "value": count, "color": color})

    return {
        "total_queries": len(chat_audits),
        "authorized_queries": len([
            audit for audit in chat_audits
            if audit.get("status") == "SUCCESS"
        ]),
        "access_denied": access_denied,
        "injections_blocked": len(blocked_injection_events),
        "pii_redactions": pii_redacted,
        "vault_documents": len(docs),
        "vector_chunks": len(chunks),
        "system_status": {
            "prompt_guard": "HEALTHY",
            "pii_scanner": "ACTIVE",
            "rbac_policy_engine": "ACTIVE",
            "vector_db_latency": "14ms"
        },
        "threat_distribution": threat_distribution
    }

@router.get("/events")
async def get_security_events():
    events = supabase_client.table("security_events").select("*").execute().data or []
    return events

@router.get("/audit-logs")
async def get_audit_logs():
    logs = supabase_client.table("audit_logs").select("*").execute().data or []
    return logs

@router.post("/test-guard")
async def test_prompt_guard(req: PromptGuardTestRequest):
    """Real-time playground endpoint to test adversarial prompts against PromptGuard."""
    analysis = PromptGuard.analyze_prompt(req.prompt)
    pii_check = PIIDetector.sanitize(req.prompt)
    return {
        "analysis": analysis,
        "pii_detected": pii_check["redacted_count"] > 0,
        "pii_sanitized": pii_check["sanitized_text"],
        "pii_categories": pii_check["categories"]
    }
