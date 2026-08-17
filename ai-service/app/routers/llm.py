from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any

from ..llm import provider_adapter

router = APIRouter()


class ExplainRequest(BaseModel):
    candidate: dict[str, Any]
    job: dict[str, Any]
    scores: dict[str, Any]


class QuestionsRequest(BaseModel):
    candidate: dict[str, Any]
    job: dict[str, Any]


class DraftMessageRequest(BaseModel):
    candidate: dict[str, Any] | None = None
    job: dict[str, Any] | None = None
    tone: str = "Warm & personal"


class SearchQueryRequest(BaseModel):
    query: str


class CopilotRequest(BaseModel):
    context: dict[str, Any] = {}
    question: str


@router.post("/llm/explain")
async def explain(payload: ExplainRequest):
    result = await provider_adapter.explain_ranking(payload.candidate, payload.job, payload.scores)
    if not result:
        # 503, not 200-with-null: lets Node's aiServiceClient tell "no provider configured"
        # apart from "provider returned nothing useful" while still falling back cleanly.
        raise HTTPException(status_code=503, detail="No LLM provider configured or call failed.")
    return {"explanation": result}


@router.post("/llm/interview-questions")
async def interview_questions(payload: QuestionsRequest):
    questions = await provider_adapter.generate_interview_questions(payload.candidate, payload.job)
    return {"questions": questions}


@router.post("/llm/draft-message")
async def draft_message(payload: DraftMessageRequest):
    result = await provider_adapter.draft_outreach_message(payload.candidate or {}, payload.job or {}, payload.tone)
    if not result:
        raise HTTPException(status_code=503, detail="No LLM provider configured or call failed.")
    return result


@router.post("/llm/parse-search-query")
async def parse_search_query(payload: SearchQueryRequest):
    result = await provider_adapter.parse_search_query(payload.query)
    if not result:
        raise HTTPException(status_code=503, detail="No LLM provider configured or call failed.")
    return result


@router.post("/llm/copilot")
async def copilot(payload: CopilotRequest):
    answer = await provider_adapter.answer_copilot_question(payload.context, payload.question)
    if not answer:
        raise HTTPException(status_code=503, detail="No LLM provider configured or call failed.")
    return {"answer": answer}
