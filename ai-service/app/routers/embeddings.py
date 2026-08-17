from fastapi import APIRouter
from pydantic import BaseModel

from ..embeddings.embedder import embed_text

router = APIRouter()


class EmbedRequest(BaseModel):
    text: str


@router.post("/embed")
async def embed(payload: EmbedRequest):
    vector = embed_text(payload.text)
    return {"vector": vector}
