from config import Settings
from services import llm_service


def test_groq_client_uses_typed_provider_settings(monkeypatch):
    captured = {}
    fake_client = object()

    def create_client(**kwargs):
        captured.update(kwargs)
        return fake_client

    settings = Settings(
        _env_file=None,
        groq_api_key="groq-secret",
        groq_base_url="https://api.groq.com/openai/v1",
    )
    monkeypatch.setattr(llm_service, "_client", None)
    monkeypatch.setattr(llm_service, "get_settings", lambda: settings)
    monkeypatch.setattr(llm_service, "AsyncOpenAI", create_client)

    assert llm_service.get_client() is fake_client
    assert captured["api_key"] == "groq-secret"
    assert captured["base_url"] == "https://api.groq.com/openai/v1"
