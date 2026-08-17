from fastapi import APIRouter
from pydantic import BaseModel

from ..parsing.file_extraction import extract_text
from ..parsing.resume_parser import parse_resume_text

router = APIRouter()


class ParseRequest(BaseModel):
    fileBase64: str | None = None
    fileType: str | None = None
    text: str | None = None  # accepted directly for callers that already have plain text


@router.post("/parse")
async def parse(payload: ParseRequest):
    if payload.text is not None:
        raw_text = payload.text
    elif payload.fileBase64 and payload.fileType:
        raw_text = extract_text(payload.fileBase64, payload.fileType)
    else:
        raw_text = ""

    parsed = parse_resume_text(raw_text)
    return {**parsed, "rawTextLength": len(raw_text)}
