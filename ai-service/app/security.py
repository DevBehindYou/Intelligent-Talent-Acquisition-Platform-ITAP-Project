from fastapi import Header, HTTPException

from .config import settings


async def verify_service_token(x_ai_service_token: str | None = Header(default=None)) -> None:
    """Gate every business endpoint behind the shared secret with the Node API.

    Enforced only when AI_SERVICE_TOKEN is configured, so local development without a token
    keeps working. In production the token is set (docker-compose.prod.yml), so a request that
    reaches this service without it — e.g. someone who found the port — is rejected.
    """
    expected = settings.ai_service_token
    if expected and x_ai_service_token != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing service token")
