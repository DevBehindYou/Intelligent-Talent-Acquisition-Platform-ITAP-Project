from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import parsing, embeddings, llm
from .security import verify_service_token

app = FastAPI(
    title="ITAP AI Service",
    description="Resume parsing, embeddings, and LLM adapter — docs/01-technical-architecture.md §1.3",
    version="0.1.0",
)

# This service is only ever called server-to-server by the Node API, never by the browser, so
# CORS defaults to closed. Set AI_CORS_ALLOW_ORIGINS (comma-separated) only if you need it.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Every business router is gated by the shared-secret header (enforced when AI_SERVICE_TOKEN
# is set). /health stays open for container/orchestrator probes.
protected = [Depends(verify_service_token)]
app.include_router(parsing.router, tags=["parsing"], dependencies=protected)
app.include_router(embeddings.router, tags=["embeddings"], dependencies=protected)
app.include_router(llm.router, tags=["llm"], dependencies=protected)


@app.get("/health")
async def health():
    return {"status": "ok"}
