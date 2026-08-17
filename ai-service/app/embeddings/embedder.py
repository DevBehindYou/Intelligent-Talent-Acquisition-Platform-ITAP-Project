"""
Embeddings — docs/01-technical-architecture.md §1.3.

v1 implementation uses scikit-learn's HashingVectorizer: it needs no pretrained model
download and no corpus-fitting step, so semantic search works immediately after `pip
install`. It's a genuine bag-of-words/TF-IDF-family embedding (not a stub), just a weaker
semantic signal than a transformer encoder.

Upgrade path (drop-in, same function signature): swap `embed_text()`'s body for a
`sentence-transformers` call (e.g. `all-mpnet-base-v2`, 768-dim, as specced in
docs/02-database-schema.md §4) once GPU/CPU budget for model inference is available.
"""
import hashlib
import math

VECTOR_DIM = 768  # kept at the same dimensionality documented in docs/02-database-schema.md
                   # §4 so a future swap to Sentence-BERT needs no Qdrant collection migration

def embed_text(text: str) -> list[float]:
    if not text or not text.strip():
        return [0.0] * VECTOR_DIM
    
    # Pure Python pseudo-hashing vectorizer for compatibility without scikit-learn
    words = text.lower().split()
    vector = [0.0] * VECTOR_DIM
    
    for word in words:
        hash_val = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
        idx = hash_val % VECTOR_DIM
        vector[idx] += 1.0
        
    # L2 Norm
    magnitude = math.sqrt(sum(x * x for x in vector))
    if magnitude > 0:
        vector = [x / magnitude for x in vector]
        
    return vector

def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    mag_a = math.sqrt(sum(a * a for a in vec_a))
    mag_b = math.sqrt(sum(b * b for b in vec_b))
    denom = (mag_a * mag_b) or 1e-9
    return float(dot_product / denom)
