from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from typing import List, Optional, Dict, Any
from app.auth.auth import get_current_user, TokenData
from app.database.supabase import supabase_client
from app.security.permissions import RBAC
from app.security.audit import SecurityAuditLogger
from app.ingestion.parser import DocumentParser
from app.rag.embeddings import EmbeddingService
import re
import uuid

router = APIRouter()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    department: str = Form("GENERAL"),
    sensitivity: str = Form("INTERNAL"),
    allowed_roles: str = Form(""),
    current_user: TokenData = Depends(RBAC.require_role(["ADMIN", "HR_MANAGER", "FINANCE_MANAGER"]))
):
    """
    Uploads a document, parses text/pdf, chunks it, generates vector embeddings, and stores in vault.
    """
    storage_path = None
    try:
        file_bytes = await file.read()
        
        # 1. Parse content based on file type
        file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else "txt"
        if file_ext == "pdf":
            pages = DocumentParser.parse_pdf(file_bytes)
        else:
            pages = DocumentParser.parse_text(file_bytes)

        if not pages:
            pages = [{"page_number": 1, "content": f"Uploaded document: {title}"}]

        role_rows = supabase_client.table("roles").select("name").execute().data or []
        valid_roles = {row["name"] for row in role_rows} | {"ALL"}
        roles = [r.strip().upper() for r in allowed_roles.split(",") if r.strip()] if allowed_roles else []
        invalid_roles = [role for role in roles if role not in valid_roles]
        if invalid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid allowed role(s): {', '.join(invalid_roles)}"
            )

        # 2. Store the original file in the private Supabase Storage bucket.
        safe_filename = re.sub(r"[^A-Za-z0-9._-]", "_", file.filename or "document.txt")
        doc_id = str(uuid.uuid4())
        storage_path = f"{doc_id}/{safe_filename}"
        try:
            supabase_client.upload_file(
                "documents",
                storage_path,
                file_bytes,
                file.content_type or "application/octet-stream",
            )
        except Exception as storage_error:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Document storage unavailable: {storage_error}",
            )

        # 3. Chunk text
        chunks = DocumentParser.chunk_text(pages, chunk_size=200, overlap=40)
        if not chunks:
            chunks = [{"chunk_index": 0, "page_number": 1, "content": f"{title}: Content processed."}]

        # 4. Generate embeddings
        chunk_texts = [c["content"] for c in chunks]
        embeddings = EmbeddingService.get_embeddings(chunk_texts)

        # 5. Insert Document metadata
        doc_insert = supabase_client.table("documents").insert({
            "id": doc_id,
            "title": title,
            "description": description or f"Uploaded by {current_user.role}",
            "file_name": file.filename,
            "file_path": storage_path,
            "file_type": file_ext,
            "department": department,
            "sensitivity": sensitivity,
            "uploaded_by": current_user.user_id
        }).execute()
        
        # 6. Insert Permissions
        if not roles:
            if sensitivity == "PUBLIC":
                roles = ["ALL"]
            elif sensitivity in ["CONFIDENTIAL", "RESTRICTED"]:
                roles = [current_user.role, "ADMIN"]
            else:
                roles = [current_user.role, "EMPLOYEE", "ADMIN"]

        for r in roles:
            supabase_client.table("document_permissions").insert({
                "document_id": doc_id,
                "role": r
            }).execute()
        
        # 7. Insert Chunks
        db_chunks = []
        for i, chunk in enumerate(chunks):
            db_chunks.append({
                "document_id": doc_id,
                "chunk_index": chunk["chunk_index"],
                "content": chunk["content"],
                "embedding": embeddings[i] if i < len(embeddings) else [0.0]*1536,
                "page_number": chunk["page_number"],
                "source_type": file_ext
            })
            
        if db_chunks:
            supabase_client.table("document_chunks").insert(db_chunks).execute()

        # 8. Log Audit
        SecurityAuditLogger.log_audit(
            user_id=current_user.user_id,
            action="DOCUMENT_UPLOAD",
            resource_type="documents",
            resource_id=doc_id,
            status="SUCCESS",
            metadata={"filename": file.filename, "chunks": len(db_chunks)}
        )

        return {
            "status": "success", 
            "document_id": doc_id, 
            "title": title,
            "chunks_processed": len(db_chunks)
        }
        
    except HTTPException:
        if storage_path:
            try:
                supabase_client.delete_file("documents", storage_path)
            except Exception as cleanup_error:
                print(f"Document storage cleanup failed: {cleanup_error}")
        raise
    except Exception as e:
        if storage_path:
            try:
                supabase_client.delete_file("documents", storage_path)
            except Exception as cleanup_error:
                print(f"Document storage cleanup failed: {cleanup_error}")
        SecurityAuditLogger.log_event(
            user_id=current_user.user_id,
            event_type="DOCUMENT_UPLOAD_ERROR",
            severity="MEDIUM",
            description=str(e)
        )
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/")
async def list_authorized_documents(current_user: TokenData = Depends(get_current_user)):
    """Returns only documents that the current user is authorized to read."""
    all_docs = supabase_client.table("documents").select("*").execute().data or []
    perms = supabase_client.table("document_permissions").select("*").execute().data or []
    
    authorized_docs = []
    for doc in all_docs:
        doc_id_str = str(doc["id"])
        doc_perms = [p["role"] for p in perms if str(p.get("document_id")) == doc_id_str and p.get("role")]
        
        if RBAC.can_access_document(
            user=current_user,
            doc_department=doc.get("department", "GENERAL"),
            doc_sensitivity=doc.get("sensitivity", "INTERNAL"),
            doc_allowed_roles=doc_perms
        ):
            doc_copy = dict(doc)
            doc_copy["allowed_roles"] = ", ".join(doc_perms) if doc_perms else "Department Access"
            authorized_docs.append(doc_copy)
            
    return authorized_docs

@router.get("/all")
async def list_all_documents_with_clearance(current_user: TokenData = Depends(get_current_user)):
    """Returns all documents in the vault, annotated with whether the current user has clearance."""
    all_docs = supabase_client.table("documents").select("*").execute().data or []
    perms = supabase_client.table("document_permissions").select("*").execute().data or []
    chunks = supabase_client.table("document_chunks").select("id, document_id").execute().data or []

    chunk_counts = {}
    for c in chunks:
        d_id = str(c.get("document_id"))
        chunk_counts[d_id] = chunk_counts.get(d_id, 0) + 1

    result = []
    for doc in all_docs:
        doc_id_str = str(doc["id"])
        doc_perms = [p["role"] for p in perms if str(p.get("document_id")) == doc_id_str and p.get("role")]
        
        can_access = RBAC.can_access_document(
            user=current_user,
            doc_department=doc.get("department", "GENERAL"),
            doc_sensitivity=doc.get("sensitivity", "INTERNAL"),
            doc_allowed_roles=doc_perms
        )

        doc_item = dict(doc)
        doc_item["allowed_roles"] = ", ".join(doc_perms) if doc_perms else doc.get("department", "GENERAL")
        doc_item["is_accessible"] = can_access
        doc_item["can_delete"] = (
            current_user.role == "ADMIN"
            or str(doc.get("uploaded_by")) == str(current_user.user_id)
        )
        doc_item["chunk_count"] = chunk_counts.get(doc_id_str, 2)
        result.append(doc_item)

    return result

@router.get("/{doc_id}/chunks")
async def get_document_chunks(doc_id: str, current_user: TokenData = Depends(get_current_user)):
    """Inspects chunks of a document if user is authorized."""
    docs = supabase_client.table("documents").select("*").eq("id", doc_id).execute().data or []
    if not docs:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = docs[0]
    perms = supabase_client.table("document_permissions").select("*").eq("document_id", doc_id).execute().data or []
    doc_perms = [p["role"] for p in perms if p.get("role")]

    if not RBAC.can_access_document(current_user, doc.get("department"), doc.get("sensitivity"), doc_perms):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"Access Denied: Your role ({current_user.role}) is not authorized to inspect chunks for {doc.get('title')}"
        )

    chunks = supabase_client.table("document_chunks").select("*").eq("document_id", doc_id).execute().data or []
    return {
        "document": doc,
        "total_chunks": len(chunks),
        "chunks": chunks
    }

@router.delete("/{doc_id}")
async def delete_document(doc_id: str, current_user: TokenData = Depends(get_current_user)):
    documents = supabase_client.table("documents").select("file_path, uploaded_by, title").eq("id", doc_id).execute().data or []
    if not documents:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    document = documents[0]
    is_owner = str(document.get("uploaded_by")) == str(current_user.user_id)
    if current_user.role != "ADMIN" and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the uploader or an administrator can delete this document.",
        )

    if document.get("file_path"):
        try:
            supabase_client.delete_file("documents", document["file_path"])
        except Exception as storage_error:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Could not remove the stored file: {storage_error}",
            )
    supabase_client.table("documents").eq("id", doc_id).delete().execute()
    supabase_client.table("document_chunks").delete().eq("document_id", doc_id).execute()
    supabase_client.table("document_permissions").delete().eq("document_id", doc_id).execute()
    SecurityAuditLogger.log_audit(
        user_id=current_user.user_id,
        action="DOCUMENT_DELETE",
        resource_type="documents",
        resource_id=doc_id,
        status="SUCCESS",
        metadata={"title": document.get("title"), "is_owner": is_owner},
    )
    return {"status": "deleted", "document_id": doc_id}
