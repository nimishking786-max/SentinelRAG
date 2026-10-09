from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="SentinelRAG API",
    description="Secure Multi-Modal AI Knowledge Vault API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "SentinelRAG"}

from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.chat import router as chat_router
from app.api.admin import router as admin_router

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(documents_router, prefix="/api/documents", tags=["documents"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
