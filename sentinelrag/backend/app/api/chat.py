from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.auth.auth import get_current_user, TokenData
from app.database.supabase import supabase_client
from app.security.prompt_guard import PromptGuard, PIIDetector
from app.security.audit import SecurityAuditLogger
from app.rag.embeddings import EmbeddingService
from app.rag.retrieval import SecureRetriever
from app.rag.generator import LLMGenerator

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None

class CitationItem(BaseModel):
    document_id: Optional[str] = None
    title: str
    page_number: Optional[int] = None
    source_type: Optional[str] = "pdf"
    snippet: str

class SecurityTrace(BaseModel):
    user_role: str
    department: str
    permission_status: str
    documents_searched: int
    authorized_documents: int
    denied_documents: int
    chunks_retrieved: int
    prompt_injection_detected: bool
    risk_score: int
    threat_category: Optional[str] = None
    sensitive_data_policy: str
    redacted_items: int = 0
    denied_matches: List[Dict[str, Any]] = []

class ChatResponse(BaseModel):
    answer: str
    citations: List[CitationItem]
    security_trace: SecurityTrace

@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest, current_user: TokenData = Depends(get_current_user)):
    # 1. Prompt Injection & Jailbreak Check
    guard_analysis = PromptGuard.analyze_prompt(req.query)
    
    if not guard_analysis["is_safe"]:
        SecurityAuditLogger.log_event(
            user_id=current_user.user_id,
            event_type="PROMPT_INJECTION_ATTEMPT",
            severity="CRITICAL",
            description=f"Blocked query ({guard_analysis['category']}): {req.query}",
            metadata=guard_analysis
        )
        SecurityAuditLogger.log_audit(
            user_id=current_user.user_id,
            action="CHAT_QUERY",
            resource_type="chat",
            status="BLOCKED",
            reason=f"PromptGuard: {guard_analysis['explanation']}",
            metadata={"query": req.query, "risk_score": guard_analysis["risk_score"]}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "Security Violation: Malicious prompt injection pattern detected and quarantined.",
                "analysis": guard_analysis
            }
        )

    # 2. Embed Query
    query_embedding = EmbeddingService.get_embeddings([req.query])[0]

    # 3. Secure Pre-Retrieval Filtering by RBAC
    retrieval_result = SecureRetriever.search(
        query_embedding=query_embedding, 
        current_user=current_user, 
        limit=3,
        query_text=req.query
    )
    chunks = retrieval_result["chunks"]
    stats = retrieval_result["stats"]

    # If the user queried something matching denied documents
    denied_matches = stats.get("denied_matches", [])
    if not chunks and denied_matches:
        # User specifically tried to query restricted information
        target_doc = denied_matches[0]["document_title"]
        SecurityAuditLogger.log_event(
            user_id=current_user.user_id,
            event_type="UNAUTHORIZED_ACCESS_DENIED",
            severity="MEDIUM",
            description=f"User {current_user.role} attempted unauthorized retrieval on {target_doc}",
            metadata={"denied_document": target_doc}
        )
        SecurityAuditLogger.log_audit(
            user_id=current_user.user_id,
            action="CHAT_QUERY",
            resource_type="chat",
            status="DENIED",
            reason=f"Access denied to {target_doc} for role {current_user.role}",
            metadata={"query": req.query}
        )
        answer = f"🔒 Access Denied: The information you requested is contained within '{target_doc}', which is classified under restricted access controls. Your current role ({current_user.role}) does not possess the requisite clearance. The content was filtered out before reaching AI memory."
    elif not chunks:
        answer = "I could not locate any authorized enterprise records matching your query within your permission level."
    else:
        answer = LLMGenerator.generate_answer(req.query, chunks)

    # 4. Output PII Check & Active Sanitization
    pii_res = PIIDetector.sanitize(answer)
    redacted_count = pii_res["redacted_count"]
    if redacted_count > 0:
        answer = pii_res["sanitized_text"]
        SecurityAuditLogger.log_event(
            user_id=current_user.user_id,
            event_type="PII_REDACTION_APPLIED",
            severity="HIGH",
            description=f"Sanitized {redacted_count} PII identifiers in AI output stream.",
            metadata={"categories": pii_res["categories"]}
        )

    # 5. Format Citations
    citations = []
    for chunk in chunks:
        doc = chunk.get("documents", {})
        citations.append(CitationItem(
            document_id=chunk.get("document_id"),
            title=doc.get("title", "Verified Knowledge Document"),
            page_number=chunk.get("page_number", 1),
            source_type=doc.get("file_type", "pdf"),
            snippet=chunk.get("content", "")[:120] + "..."
        ))

    # 6. Construct High-Fidelity Security Trace
    security_trace = SecurityTrace(
        user_role=current_user.role,
        department=current_user.department,
        permission_status="Authorized" if chunks or not denied_matches else "Access Denied by Policy",
        documents_searched=stats.get("total_documents", 0),
        authorized_documents=stats.get("authorized_documents", 0),
        denied_documents=stats.get("denied_documents", 0),
        chunks_retrieved=len(chunks),
        prompt_injection_detected=False,
        risk_score=guard_analysis.get("risk_score", 5),
        threat_category=None,
        sensitive_data_policy="PII Redacted" if redacted_count > 0 else "Passed",
        redacted_items=redacted_count,
        denied_matches=denied_matches
    )

    # 7. Log Success Audit
    SecurityAuditLogger.log_audit(
        user_id=current_user.user_id,
        action="CHAT_QUERY",
        resource_type="chat",
        status="SUCCESS" if chunks else "NO_CHUNKS",
        metadata={"query": req.query, "chunks_retrieved": len(chunks)}
    )

    return ChatResponse(
        answer=answer,
        citations=citations,
        security_trace=security_trace
    )
