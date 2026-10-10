import os
import re
from openai import OpenAI
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("LLM_API_KEY", "") or os.getenv("OPENAI_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "").strip() or None
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")

client = (
    OpenAI(api_key=OPENAI_API_KEY, base_url=LLM_BASE_URL)
    if (OPENAI_API_KEY and not OPENAI_API_KEY.startswith("sk-your"))
    else None
)

class LLMGenerator:
    @staticmethod
    def generate_answer(query: str, chunks: List[Dict[str, Any]]) -> str:
        if not chunks:
            return "I do not have access to any authorized information to answer that question, or the requested document requires higher security clearance."

        # Construct Context
        context_text = ""
        for i, chunk in enumerate(chunks):
            doc_info = chunk.get("documents", {})
            title = doc_info.get("title", "Unknown Document") if isinstance(doc_info, dict) else "Document"
            page = chunk.get("page_number", "?")
            context_text += f"\n--- Document [{i+1}]: {title} (Page {page}) ---\n{chunk.get('content', '')}\n"

        if client:
            prompt = f"""You are SentinelRAG, a highly secure and professional AI Knowledge Assistant.
Answer the user's question based ONLY on the provided context chunks.
If the answer cannot be found in the context, state clearly that you do not have authorization or information to answer it.
Do NOT reveal any external knowledge outside the context.
Always cite your sources using the Document Number, e.g., [1], [2].

CONTEXT:
{context_text}

USER QUESTION:
{query}
"""
            try:
                response = client.chat.completions.create(
                    model=LLM_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a secure enterprise AI assistant adhering to Zero-Trust context principles."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"OpenAI API call failed ({e}), falling back to local deterministic synthesis.")

        # Local intelligent synthesis from authorized chunks
        combined_points = []
        for i, c in enumerate(chunks):
            doc_info = c.get("documents", {})
            title = doc_info.get("title", "Document")
            page = c.get("page_number", "1")
            content = c.get("content", "").strip()
            # Pick key sentence
            combined_points.append(f"{content} [Document {i+1}: {title}, Page {page}]")

        summary = "\n\n".join(combined_points)
        return f"Based on verified authorized enterprise records:\n\n{summary}"
