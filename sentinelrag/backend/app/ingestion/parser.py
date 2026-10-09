try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        fitz = None
from typing import List, Dict, Any
import io

class DocumentParser:
    @staticmethod
    def parse_pdf(file_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Parses a PDF and returns a list of pages with their text.
        """
        doc = fitz.open("pdf", file_bytes)
        pages = []
        for i, page in enumerate(doc):
            text = page.get_text("text")
            if text.strip():
                pages.append({
                    "page_number": i + 1,
                    "content": text.strip()
                })
        return pages

    @staticmethod
    def parse_text(file_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Parses a text file. Treats it as a single page for simplicity.
        """
        text = file_bytes.decode('utf-8')
        return [{"page_number": 1, "content": text}]

    @staticmethod
    def chunk_text(pages: List[Dict[str, Any]], chunk_size: int = 1000, overlap: int = 200) -> List[Dict[str, Any]]:
        """
        Splits pages into smaller chunks with overlap.
        """
        chunks = []
        chunk_index = 0
        
        for page in pages:
            content = page["content"]
            page_num = page["page_number"]
            
            # Simple word-based chunking
            words = content.split()
            
            i = 0
            while i < len(words):
                chunk_words = words[i:i + chunk_size]
                chunk_text = " ".join(chunk_words)
                
                chunks.append({
                    "chunk_index": chunk_index,
                    "page_number": page_num,
                    "content": chunk_text
                })
                
                chunk_index += 1
                i += (chunk_size - overlap)
                
        return chunks
