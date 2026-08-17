"""
OCR fallback for scanned resumes with no text layer — docs/01-technical-architecture.md
§1.3. Requires the `pytesseract` + `Pillow` packages and a system Tesseract install, which
is why it's kept as an optional, separately-invoked path rather than a hard dependency of
file_extraction.py (so the service still runs without a system Tesseract binary present).
"""
import io


def ocr_pdf_bytes(raw: bytes) -> str:
    try:
        import pytesseract
        from pdf2image import convert_from_bytes
    except ImportError:
        return ""  # OCR extras not installed — see requirements.txt comment for how to add them

    try:
        images = convert_from_bytes(raw)
        return "\n".join(pytesseract.image_to_string(image) for image in images)
    except Exception:
        return ""
