"""
Qdrant wrapper — docs/02-database-schema.md §4. Every read/write is scoped with an
organizationId payload filter so tenant isolation holds at the vector-store layer too, not
only in MongoDB (same rule as docs/02-database-schema.md §5). All methods fail soft: if
Qdrant isn't reachable, callers get an empty result instead of a crash, since embeddings are
an enhancement layer on top of the keyword-based matching that already works without them
(see backend/src/services/matchingService.js).
"""
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from ..config import settings
from .embedder import VECTOR_DIM

_client = None


def get_client():
    global _client
    if _client is None:
        _client = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key or None)
    return _client


def ensure_collections():
    client = get_client()
    for name in ("candidate_vectors", "job_vectors"):
        try:
            client.get_collection(name)
        except Exception:
            client.create_collection(
                collection_name=name,
                vectors_config=qmodels.VectorParams(size=VECTOR_DIM, distance=qmodels.Distance.COSINE),
            )


def upsert_candidate_vector(organization_id: str, candidate_id: str, vector: list[float], skills: list[str]):
    try:
        ensure_collections()
        get_client().upsert(
            collection_name="candidate_vectors",
            points=[
                qmodels.PointStruct(
                    id=candidate_id,
                    vector=vector,
                    payload={"organizationId": organization_id, "candidateId": candidate_id, "skills": skills},
                )
            ],
        )
        return True
    except Exception:
        return False


def search_candidates(organization_id: str, query_vector: list[float], limit: int = 20):
    try:
        results = get_client().search(
            collection_name="candidate_vectors",
            query_vector=query_vector,
            query_filter=qmodels.Filter(
                must=[qmodels.FieldCondition(key="organizationId", match=qmodels.MatchValue(value=organization_id))]
            ),
            limit=limit,
        )
        return [{"candidateId": r.payload["candidateId"], "score": r.score} for r in results]
    except Exception:
        return []
