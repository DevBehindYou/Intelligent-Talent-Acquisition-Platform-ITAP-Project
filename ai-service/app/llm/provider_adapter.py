"""
LLM provider adapter — Ollama-first, pluggable OpenAI-compatible / Anthropic fallback,
mirroring the pattern already used on the team's SHIP project
(docs/01-technical-architecture.md §1.3). Every public function returns `None` on any
failure or when LLM_PROVIDER=none, so callers (backend/src/services/*.js, via
aiServiceClient) fall back to their own template-based responses — the product works fully
without any LLM configured, just with less fluent copy.
"""
import json
import httpx

from ..config import settings


async def _call_ollama(system: str, prompt: str) -> str | None:
    try:
        headers = {}
        if settings.ollama_api_key:
            headers["Authorization"] = f"Bearer {settings.ollama_api_key}"
            
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{settings.ollama_base_url}/api/chat",
                headers=headers,
                json={
                    "model": settings.ollama_model,
                    "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}],
                    "stream": False,
                },
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"]
    except Exception:
        return None


async def _call_openai_compatible(system: str, prompt: str) -> str | None:
    if not settings.openai_compatible_base_url or not settings.openai_compatible_api_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{settings.openai_compatible_base_url}/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_compatible_api_key}"},
                json={
                    "model": settings.openai_compatible_model,
                    "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}],
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
    except Exception:
        return None


async def _call_anthropic(system: str, prompt: str) -> str | None:
    if not settings.anthropic_api_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": settings.anthropic_model,
                    "max_tokens": 1000,
                    "system": system,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            resp.raise_for_status()
            content = resp.json()["content"]
            return "".join(block.get("text", "") for block in content)
    except Exception:
        return None


async def chat_completion(system: str, prompt: str) -> str | None:
    provider = settings.llm_provider
    if provider == "ollama":
        return await _call_ollama(system, prompt)
    if provider == "openai_compatible":
        return await _call_openai_compatible(system, prompt)
    if provider == "anthropic":
        return await _call_anthropic(system, prompt)
    return None  # LLM_PROVIDER=none — every caller has a template fallback for this


def _safe_json(text: str | None, fallback):
    if not text:
        return fallback
    try:
        start, end = text.find("{"), text.rfind("}")
        if start == -1:
            start, end = text.find("["), text.rfind("]")
        return json.loads(text[start: end + 1])
    except Exception:
        return fallback


async def explain_ranking(candidate: dict, job: dict, scores: dict) -> str | None:
    system = (
        "You explain AI candidate-ranking scores to recruiters in 2-3 plain-language "
        "sentences. Be specific about which skills or experience drove the score. Never "
        "invent facts not present in the candidate/job data given to you."
    )
    prompt = f"Candidate: {json.dumps(candidate)}\nJob: {json.dumps(job)}\nScores: {json.dumps(scores)}"
    return await chat_completion(system, prompt)


async def generate_interview_questions(candidate: dict, job: dict) -> list[dict]:
    system = (
        "Generate 5 interview questions for this candidate and job: 2 technical, 2 "
        "problem-solving, 1 behavioral. Respond ONLY with a JSON array of objects shaped "
        '{"question": string, "category": "technical"|"problem_solving"|"behavioral"}.'
    )
    prompt = f"Candidate: {json.dumps(candidate)}\nJob: {json.dumps(job)}"
    result = await chat_completion(system, prompt)
    return _safe_json(result, [])


async def draft_outreach_message(candidate: dict, job: dict, tone: str) -> dict | None:
    system = (
        f"Draft a short, personalized outreach email to a job candidate in a '{tone}' tone. "
        'Respond ONLY with JSON shaped {"subject": string, "body": string}.'
    )
    prompt = f"Candidate: {json.dumps(candidate)}\nJob: {json.dumps(job)}"
    result = await chat_completion(system, prompt)
    return _safe_json(result, None)


async def parse_search_query(query: str) -> dict | None:
    system = (
        "Extract structured search filters from a recruiter's natural-language talent "
        'search query. Respond ONLY with JSON shaped {"skills": string[], "domain": string[]}.'
    )
    result = await chat_completion(system, query)
    return _safe_json(result, None)


async def answer_copilot_question(context: dict, question: str) -> str | None:
    system = (
        "You are ITAP's recruiting Copilot. Answer the recruiter's question about a "
        "candidate using only the context given, in 2-4 sentences. If you don't have "
        "enough context, say so plainly."
    )
    prompt = f"Context: {json.dumps(context, default=str)}\nQuestion: {question}"
    return await chat_completion(system, prompt)
