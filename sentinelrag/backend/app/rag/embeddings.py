import os
from openai import OpenAI
from typing import List
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("EMBEDDINGS_API_KEY", "")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
EMBEDDINGS_BASE_URL = os.getenv("EMBEDDINGS_BASE_URL", "").strip() or None

client = OpenAI(api_key=OPENAI_API_KEY, base_url=EMBEDDINGS_BASE_URL) if OPENAI_API_KEY else None

class EmbeddingService:
    @staticmethod
    def get_embeddings(texts: List[str]) -> List[List[float]]:
        """
        Fetches embeddings for a list of texts using OpenAI.
        """
        if not client:
            # For hackathon demo without API key, return dummy zero vectors
            return [[0.0] * 1536 for _ in texts]
            
        try:
            response = client.embeddings.create(
                input=texts,
                model=EMBEDDING_MODEL
            )
            return [data.embedding for data in response.data]
        except Exception as e:
            print(f"Error generating embeddings: {e}")
            # Fallback to zero vectors on error for robust demo
            return [[0.0] * 1536 for _ in texts]
