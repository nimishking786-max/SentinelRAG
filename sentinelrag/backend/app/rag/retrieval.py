import re
import math
from typing import List, Dict, Any, Optional
from app.database.supabase import supabase_client
from app.auth.auth import TokenData
from app.security.permissions import RBAC

class SecureRetriever:
    _STOP_WORDS = {
        "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
        "how", "in", "is", "it", "of", "on", "or", "the", "to", "what",
        "when", "where", "which", "who", "with",
    }
    _QUERY_ALIASES = {
        "applicant": {"resume", "cv", "profile"},
        "candidate": {"resume", "cv", "profile"},
        "curriculum": {"resume", "cv"},
        "profile": {"resume", "cv"},
    }

    @staticmethod
    def _compute_keyword_relevance(query: str, text: str, metadata: str = "") -> float:
        """Computes normalized term overlap score between query and chunk text."""
        if not query or not text:
            return 0.0
        query_words = {
            word for word in re.findall(r'\w+', query.lower())
            if word not in SecureRetriever._STOP_WORDS and len(word) > 2
        }
        if not query_words:
            return 0.0
        expanded_query_words = set(query_words)
        for word in query_words:
            expanded_query_words.update(SecureRetriever._QUERY_ALIASES.get(word, set()))
        text_words = set(re.findall(r'\w+', f"{metadata} {text}".lower()))
        overlap = expanded_query_words.intersection(text_words)
        
        # Boost matches for specific important keywords
        boost = 0.0
        for w in overlap:
            if len(w) > 3:
                boost += 0.1
        base_score = len(overlap) / len(expanded_query_words)
        return min(0.98, round(base_score + boost, 3))

    @staticmethod
    def search(
        query_embedding: List[float], 
        current_user: TokenData, 
        limit: int = 5,
        query_text: str = ""
    ) -> Dict[str, Any]:
        """
        Performs vector similarity search with PRE-RETRIEVAL Role-Based Access Control.
        Only chunks strictly authorized for the user's role can ever be returned.
        """
        # 1. Fetch all documents and permissions
        response = supabase_client.table("documents").select("id, title, department, sensitivity").execute()
        all_docs = response.data or []
        
        perm_response = supabase_client.table("document_permissions").select("document_id, role").execute()
        perms = perm_response.data or []

        authorized_doc_ids = []
        denied_doc_ids = []
        doc_lookup = {str(d["id"]): d for d in all_docs}

        for doc in all_docs:
            doc_id_str = str(doc["id"])
            doc_perms = [p["role"] for p in perms if str(p.get("document_id")) == doc_id_str and p.get("role")]
            
            is_authorized = RBAC.can_access_document(
                user=current_user,
                doc_department=doc.get("department", "GENERAL"),
                doc_sensitivity=doc.get("sensitivity", "INTERNAL"),
                doc_allowed_roles=doc_perms
            )
            
            if is_authorized:
                authorized_doc_ids.append(doc_id_str)
            else:
                denied_doc_ids.append(doc_id_str)

        # 2. Check if query matches any DENIED documents for security awareness
        denied_attempt_matches = []
        if denied_doc_ids and query_text:
            denied_chunks_res = supabase_client.table("document_chunks")\
                .select("*")\
                .in_("document_id", denied_doc_ids)\
                .execute()
            for dc in (denied_chunks_res.data or []):
                parent_doc = doc_lookup.get(str(dc.get("document_id")), {})
                metadata = f"{parent_doc.get('title', '')} {parent_doc.get('file_name', '')}"
                score = SecureRetriever._compute_keyword_relevance(
                    query_text,
                    dc.get("content", ""),
                    metadata,
                )
                if score >= 0.4:
                    denied_attempt_matches.append({
                        "document_title": parent_doc.get("title", "Confidential Document"),
                        "sensitivity": parent_doc.get("sensitivity", "CONFIDENTIAL"),
                        "department": parent_doc.get("department", "INTERNAL")
                    })

        if not authorized_doc_ids:
            return {
                "chunks": [],
                "stats": {
                    "total_documents": len(all_docs),
                    "authorized_documents": 0,
                    "denied_documents": len(denied_doc_ids),
                    "chunks_retrieved": 0,
                    "denied_matches": denied_attempt_matches
                }
            }

        # 3. Vector / Semantic search on strictly authorized documents
        chunks = []
        has_query_embedding = any(abs(value) > 1e-12 for value in query_embedding)
        if has_query_embedding:
            try:
                res = supabase_client.rpc(
                    "search_chunks",
                    {
                        "query_embedding": query_embedding,
                        "match_threshold": 0.3,
                        "match_count": limit,
                        "allowed_doc_ids": authorized_doc_ids
                    }
                ).execute()
                chunks = res.data or []
            except Exception:
                chunks = []

        # Vector search can return no rows when embeddings are unavailable,
        # stale, or below the similarity threshold. Search only authorized
        # chunks by keywords so chat remains useful without weakening RBAC.
        if not chunks:
            res = supabase_client.table("document_chunks")\
                .select("*")\
                .in_("document_id", authorized_doc_ids)\
                .execute()
            authorized_chunks = res.data or []
            chunks = [
                chunk for chunk in authorized_chunks
                if not query_text or SecureRetriever._compute_keyword_relevance(
                    query_text,
                    chunk.get("content", ""),
                    f"{doc_lookup.get(str(chunk.get('document_id')), {}).get('title', '')} "
                    f"{doc_lookup.get(str(chunk.get('document_id')), {}).get('file_name', '')}",
                ) > 0
            ]

        # 4. Rank authorized chunks by semantic relevance
        scored_chunks = []
        for c in chunks:
            c_doc_id = str(c.get("document_id"))
            parent_doc = doc_lookup.get(c_doc_id, {})
            c["documents"] = {
                "title": parent_doc.get("title", "Document"),
                "file_type": parent_doc.get("file_type", "pdf"),
                "sensitivity": parent_doc.get("sensitivity", "INTERNAL")
            }
            
            relevance = SecureRetriever._compute_keyword_relevance(
                query_text,
                c.get("content", ""),
                f"{parent_doc.get('title', '')} {parent_doc.get('file_name', '')}",
            )
            c["similarity"] = max(0.55, relevance) if relevance > 0 else 0.45
            scored_chunks.append((c["similarity"], c))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        # Filter only relevant chunks if query text provided and scored
        top_chunks = [item[1] for item in scored_chunks[:limit]] if scored_chunks else []
        # If query has specific intent and no chunk matched with similarity > 0.48, don't return random irrelevant chunks
        if query_text and top_chunks and all(c.get("similarity", 0) <= 0.45 for c in top_chunks):
            # No relevant authorized chunks found for this query
            top_chunks = []

        return {
            "chunks": top_chunks,
            "stats": {
                "total_documents": len(all_docs),
                "authorized_documents": len(authorized_doc_ids),
                "denied_documents": len(denied_doc_ids),
                "chunks_retrieved": len(top_chunks),
                "denied_matches": denied_attempt_matches
            }
        }
