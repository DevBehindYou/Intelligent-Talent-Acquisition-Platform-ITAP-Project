import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    llm_provider = os.getenv("LLM_PROVIDER", "none")

    ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model = os.getenv("OLLAMA_MODEL", "llama3.1")
    ollama_api_key = os.getenv("OLLAMA_API_KEY")

    openai_compatible_base_url = os.getenv("OPENAI_COMPATIBLE_BASE_URL")
    openai_compatible_api_key = os.getenv("OPENAI_COMPATIBLE_API_KEY")
    openai_compatible_model = os.getenv("OPENAI_COMPATIBLE_MODEL")

    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    anthropic_model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")

    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")

    # Shared secret with the Node API. When set, every non-health request must present it in
    # the X-AI-Service-Token header. Unset (dev) means no enforcement, so the scaffold runs
    # out of the box. Comma-separated CORS origins default to none in prod (server-to-server).
    ai_service_token = os.getenv("AI_SERVICE_TOKEN")
    cors_allow_origins = [
        o.strip() for o in os.getenv("AI_CORS_ALLOW_ORIGINS", "").split(",") if o.strip()
    ]


settings = Settings()
