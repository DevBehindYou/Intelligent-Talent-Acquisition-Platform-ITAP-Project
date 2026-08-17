"""
Real text extraction for PDF/DOCX/TXT uploads — this is what actually backs
docs/01-technical-architecture.md §1.3's "Resume parsing" row. The Node API sends the raw
file bytes (base64) plus its type here rather than pre-extracting text itself, since this
service owns parsing end-to-end.
"""
import base64
import io

from pypdf import PdfReader
from docx import Document


def extract_text(file_base64: str, file_type: str) -> str:
    raw = base64.b64decode(file_base64)

    if file_type == "pdf":
        return _extract_pdf(raw)
    if file_type == "docx":
        return _extract_docx(raw)
    # txt (or anything else) — decode directly
    return raw.decode("utf-8", errors="ignore")


def _extract_pdf(raw: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(raw))
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
        if text.strip():
            return text
    except Exception:
        pass
    # Falls through to an empty string if the PDF is a scanned image with no text layer —
    # docs/01-technical-architecture.md §1.3 calls out Tesseract OCR as the fallback path
    # for that case; see ocr.py for the hook this would call.
    return ""


def _extract_docx(raw: bytes) -> str:
    try:
        document = Document(io.BytesIO(raw))
        return "\n".join(p.text for p in document.paragraphs)
    except Exception:
        return ""
